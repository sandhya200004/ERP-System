import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

export interface SecurityMetrics {
  failedLogins24h: number;
  failedLoginsByIp: Array<{ ip: string; count: number }>;
  activeUsers: number;
  dataExports7d: number;
  largeExports7d: number;
  recentSecurityEvents: Array<{
    action: string;
    user_id: string | null;
    ip_address: string;
    created_at: Date;
  }>;
  systemUptime: number;
  uptimePercentage: number;
}

export interface SystemStatus {
  status: 'operational' | 'degraded' | 'down';
  database: boolean;
  uptime: number;
  uptimePercentage: number;
  lastIncident: Date | null;
  services: {
    api: boolean;
    database: boolean;
    authentication: boolean;
  };
}

@Injectable()
export class SecurityService {
  private startTime: Date;

  constructor(private prisma: PrismaService) {
    this.startTime = new Date();
  }

  async getSecurityMetrics(): Promise<SecurityMetrics> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Count failed logins in last 24 hours
    const failedLogins24h = await this.prisma.audit_logs.count({
      where: {
        action: 'login_failed',
        created_at: {
          gte: twentyFourHoursAgo,
        },
      },
    });

    // Failed logins by IP (top 10)
    const failedLoginsByIpRaw = await this.prisma.$queryRaw<
      Array<{ ip_address: string; count: bigint }>
    >`
      SELECT ip_address, COUNT(*) as count
      FROM audit_logs
      WHERE action = 'login_failed'
        AND created_at >= ${twentyFourHoursAgo}
        AND ip_address IS NOT NULL
      GROUP BY ip_address
      ORDER BY count DESC
      LIMIT 10
    `;

    const failedLoginsByIp = failedLoginsByIpRaw.map((item) => ({
      ip: item.ip_address,
      count: Number(item.count),
    }));

    // Count active sessions (users logged in)
    // Note: Assuming sessions are tracked; adjust based on your auth implementation
    const activeUsers = await this.prisma.users.count({
      where: {
        last_login_at: {
          gte: new Date(Date.now() - 30 * 60 * 1000), // Active in last 30 minutes
        },
      },
    });

    // Data exports in last 7 days
    const dataExports7d = await this.prisma.audit_logs.count({
      where: {
        action: 'data_export',
        created_at: {
          gte: sevenDaysAgo,
        },
      },
    });

    // Large exports (>100 records) in last 7 days
    const largeExports7d = await this.prisma.audit_logs.count({
      where: {
        action: 'data_export',
        created_at: {
          gte: sevenDaysAgo,
        },
        // Note: Without details field, this counts all exports
        // Consider adding metadata to old_values/new_values for tracking export size
      },
    });

    // Recent security events (last 50)
    const recentSecurityEvents = await this.prisma.audit_logs.findMany({
      where: {
        action: {
          in: [
            'login_failed',
            'unauthorized_access',
            'permission_denied',
            'data_export',
            'password_change',
            'role_change',
          ],
        },
        created_at: {
          gte: sevenDaysAgo,
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      take: 50,
      select: {
        action: true,
        user_id: true,
        ip_address: true,
        created_at: true,
      },
    });

    // System uptime
    const systemUptime = Math.floor(
      (Date.now() - this.startTime.getTime()) / 1000,
    );

    // Calculate uptime percentage (simplified - in production, use actual downtime tracking)
    const uptimePercentage = 99.92; // TODO: Calculate from incident logs

    return {
      failedLogins24h,
      failedLoginsByIp,
      activeUsers,
      dataExports7d,
      largeExports7d,
      recentSecurityEvents: recentSecurityEvents.map((event) => ({
        action: event.action,
        user_id: event.user_id,
        ip_address: event.ip_address || 'Unknown',
        created_at: event.created_at,
      })),
      systemUptime,
      uptimePercentage,
    };
  }

  async getSystemStatus(): Promise<SystemStatus> {
    let databaseStatus = true;
    let apiStatus = true;
    let authStatus = true;

    // Test database connection
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      databaseStatus = false;
    }

    // Test authentication (check if users table accessible)
    try {
      await this.prisma.users.count();
    } catch (error) {
      authStatus = false;
    }

    // Determine overall status
    let status: 'operational' | 'degraded' | 'down' = 'operational';
    if (!databaseStatus) {
      status = 'down';
    } else if (!authStatus) {
      status = 'degraded';
    }

    // System uptime
    const uptime = Math.floor((Date.now() - this.startTime.getTime()) / 1000);

    // Uptime percentage (simplified)
    const uptimePercentage = databaseStatus ? 99.92 : 0;

    // Get last incident (if any)
    const lastIncident = await this.prisma.audit_logs.findFirst({
      where: {
        action: 'system_down',
      },
      orderBy: {
        created_at: 'desc',
      },
      select: {
        created_at: true,
      },
    });

    return {
      status,
      database: databaseStatus,
      uptime,
      uptimePercentage,
      lastIncident: lastIncident?.created_at || null,
      services: {
        api: apiStatus,
        database: databaseStatus,
        authentication: authStatus,
      },
    };
  }

  async checkForSecurityAlerts(): Promise<Array<{ type: string; message: string; severity: 'low' | 'medium' | 'high' | 'critical' }>> {
    const alerts: Array<{ type: string; message: string; severity: 'low' | 'medium' | 'high' | 'critical' }> = [];
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    // Check for brute force attempts (10+ failed logins from same IP in 5 minutes)
    const bruteForceAttempts = await this.prisma.$queryRaw<
      Array<{ ip_address: string; count: bigint }>
    >`
      SELECT ip_address, COUNT(*) as count
      FROM audit_logs
      WHERE action = 'login_failed'
        AND created_at >= ${fiveMinutesAgo}
        AND ip_address IS NOT NULL
      GROUP BY ip_address
      HAVING COUNT(*) >= 10
    `;

    for (const attempt of bruteForceAttempts) {
      alerts.push({
        type: 'BRUTE_FORCE',
        message: `Brute force attack detected from IP ${attempt.ip_address} (${attempt.count} failed attempts in 5 minutes)`,
        severity: 'critical',
      });
    }

    // Check for large data exports (>1000 records in last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const exportCount = await this.prisma.audit_logs.count({
      where: {
        action: 'data_export',
        created_at: {
          gte: oneHourAgo,
        },
      },
    });

    // Alert if more than 10 exports in an hour (adjust threshold as needed)
    if (exportCount > 10) {
      alerts.push({
        type: 'LARGE_DATA_EXPORT',
        message: `${exportCount} data export(s) detected in last hour (threshold: 10)`,
        severity: 'high',
      });
    }

    // Check for unusual activity (multiple permission denied in short time)
    const permissionDenied = await this.prisma.audit_logs.count({
      where: {
        action: 'permission_denied',
        created_at: {
          gte: fiveMinutesAgo,
        },
      },
    });

    if (permissionDenied > 20) {
      alerts.push({
        type: 'UNAUTHORIZED_ACCESS_SPIKE',
        message: `Unusual number of permission denied events (${permissionDenied} in 5 minutes)`,
        severity: 'medium',
      });
    }

    // ==========================================
    // ANOMALY DETECTION (Catches Real Breaches)
    // ==========================================

    // 1. Compromised Account: New IP/Location + Quick Data Export
    // This catches: attacker logs in from new location, immediately steals data
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const suspiciousUsers = await this.prisma.$queryRaw<
      Array<{
        user_id: string;
        login_ip: string;
        export_count: bigint;
        first_seen: Date;
      }>
    >`
      WITH recent_logins AS (
        SELECT DISTINCT ON (user_id) 
          user_id, 
          ip_address as login_ip,
          created_at as login_time
        FROM audit_logs
        WHERE action = 'login'
          AND created_at >= ${tenMinutesAgo}
          AND user_id IS NOT NULL
        ORDER BY user_id, created_at DESC
      ),
      user_history AS (
        SELECT 
          user_id,
          ip_address,
          MIN(created_at) as first_seen
        FROM audit_logs
        WHERE action = 'login'
          AND created_at < ${tenMinutesAgo}
          AND created_at >= ${thirtyDaysAgo}
          AND user_id IS NOT NULL
        GROUP BY user_id, ip_address
      ),
      recent_exports AS (
        SELECT 
          user_id,
          COUNT(*) as export_count
        FROM audit_logs
        WHERE action = 'data_export'
          AND created_at >= ${tenMinutesAgo}
          AND user_id IS NOT NULL
        GROUP BY user_id
      )
      SELECT 
        rl.user_id,
        rl.login_ip,
        COALESCE(re.export_count, 0) as export_count,
        uh.first_seen
      FROM recent_logins rl
      LEFT JOIN user_history uh 
        ON rl.user_id = uh.user_id 
        AND rl.login_ip = uh.ip_address
      LEFT JOIN recent_exports re 
        ON rl.user_id = re.user_id
      WHERE uh.first_seen IS NULL  -- IP never seen before for this user
        AND re.export_count > 0     -- User exported data after login
    `;

    for (const suspicious of suspiciousUsers) {
      alerts.push({
        type: 'COMPROMISED_ACCOUNT_SUSPECTED',
        message: `🚨 CRITICAL: User ${suspicious.user_id} logged in from NEW IP ${suspicious.login_ip} and immediately exported ${suspicious.export_count} dataset(s). Possible account compromise!`,
        severity: 'critical',
      });
    }

    // 2. Off-Hours Activity Pattern
    // Detect logins + sensitive actions during unusual hours (e.g., 2-6 AM)
    const currentHour = new Date().getHours();
    if (currentHour >= 2 && currentHour < 6) {
      const offHoursActivity = await this.prisma.audit_logs.count({
        where: {
          action: {
            in: ['data_export', 'password_change', 'role_change'],
          },
          created_at: {
            gte: fiveMinutesAgo,
          },
        },
      });

      if (offHoursActivity > 0) {
        alerts.push({
          type: 'OFF_HOURS_SENSITIVE_ACTIVITY',
          message: `⚠️ ${offHoursActivity} sensitive operation(s) detected during off-hours (${currentHour}:00). Unusual for this time.`,
          severity: 'high',
        });
      }
    }

    // 3. Unusual Data Volume for Specific User
    // Detect when a user exports WAY more data than their historical average
    const unusualVolumeUsers = await this.prisma.$queryRaw<
      Array<{
        user_id: string;
        recent_exports: bigint;
        avg_exports: string;
      }>
    >`
      WITH user_export_history AS (
        SELECT 
          user_id,
          DATE_TRUNC('day', created_at) as export_date,
          COUNT(*) as daily_exports
        FROM audit_logs
        WHERE action = 'data_export'
          AND created_at >= ${thirtyDaysAgo}
          AND created_at < ${oneHourAgo}
          AND user_id IS NOT NULL
        GROUP BY user_id, DATE_TRUNC('day', created_at)
      ),
      user_averages AS (
        SELECT 
          user_id,
          AVG(daily_exports) as avg_daily_exports
        FROM user_export_history
        GROUP BY user_id
        HAVING AVG(daily_exports) > 0
      ),
      recent_activity AS (
        SELECT 
          user_id,
          COUNT(*) as recent_exports
        FROM audit_logs
        WHERE action = 'data_export'
          AND created_at >= ${oneHourAgo}
          AND user_id IS NOT NULL
        GROUP BY user_id
      )
      SELECT 
        ra.user_id,
        ra.recent_exports,
        ua.avg_daily_exports as avg_exports
      FROM recent_activity ra
      JOIN user_averages ua ON ra.user_id = ua.user_id
      WHERE ra.recent_exports > (ua.avg_daily_exports * 5)  -- 5x their normal rate
    `;

    for (const unusual of unusualVolumeUsers) {
      alerts.push({
        type: 'ANOMALOUS_DATA_VOLUME',
        message: `⚠️ User ${unusual.user_id} exported ${unusual.recent_exports} datasets in last hour (5x their average of ${parseFloat(unusual.avg_exports).toFixed(1)}). Possible data theft.`,
        severity: 'high',
      });
    }

    // 4. Geographic Impossibility Detection
    // Login from Country A, then Country B within 1 hour (physically impossible)
    const impossibleTravel = await this.prisma.$queryRaw<
      Array<{
        user_id: string;
        first_ip: string;
        second_ip: string;
        time_diff_minutes: number;
      }>
    >`
      WITH ordered_logins AS (
        SELECT 
          user_id,
          ip_address,
          created_at,
          LAG(ip_address) OVER (PARTITION BY user_id ORDER BY created_at) as prev_ip,
          LAG(created_at) OVER (PARTITION BY user_id ORDER BY created_at) as prev_time
        FROM audit_logs
        WHERE action = 'login'
          AND created_at >= ${oneHourAgo}
          AND user_id IS NOT NULL
          AND ip_address IS NOT NULL
      )
      SELECT 
        user_id,
        prev_ip as first_ip,
        ip_address as second_ip,
        EXTRACT(EPOCH FROM (created_at - prev_time)) / 60 as time_diff_minutes
      FROM ordered_logins
      WHERE prev_ip IS NOT NULL
        AND prev_ip != ip_address
        AND EXTRACT(EPOCH FROM (created_at - prev_time)) / 60 < 60
        -- Different IP within 1 hour suggests VPN/proxy or compromise
    `;

    for (const travel of impossibleTravel) {
      const timeDiff = Math.round(Number(travel.time_diff_minutes));
      if (timeDiff < 5) {
        // Very fast IP change = likely VPN/proxy switch or session hijacking
        alerts.push({
          type: 'IMPOSSIBLE_TRAVEL',
          message: `🚨 User ${travel.user_id} logged in from IP ${travel.first_ip}, then ${travel.second_ip} within ${timeDiff} minutes. Possible session hijacking or VPN abuse.`,
          severity: 'critical',
        });
      } else {
        alerts.push({
          type: 'SUSPICIOUS_LOGIN_PATTERN',
          message: `⚠️ User ${travel.user_id} logged in from different IPs (${travel.first_ip} → ${travel.second_ip}) within ${timeDiff} minutes. Monitor for unusual activity.`,
          severity: 'medium',
        });
      }
    }

    // 5. Failed Login Followed by Successful Login (Credential Stuffing Success)
    const stuffingSuccess = await this.prisma.$queryRaw<
      Array<{
        user_id: string;
        ip_address: string;
        failed_attempts: bigint;
      }>
    >`
      WITH failed_logins AS (
        SELECT 
          ip_address,
          COUNT(*) as failed_attempts
        FROM audit_logs
        WHERE action = 'login_failed'
          AND created_at >= ${fiveMinutesAgo}
          AND ip_address IS NOT NULL
        GROUP BY ip_address
        HAVING COUNT(*) >= 3
      ),
      successful_logins AS (
        SELECT DISTINCT
          user_id,
          ip_address
        FROM audit_logs
        WHERE action = 'login'
          AND created_at >= ${fiveMinutesAgo}
          AND user_id IS NOT NULL
          AND ip_address IS NOT NULL
      )
      SELECT 
        sl.user_id,
        sl.ip_address,
        fl.failed_attempts
      FROM successful_logins sl
      JOIN failed_logins fl ON sl.ip_address = fl.ip_address
    `;

    for (const success of stuffingSuccess) {
      alerts.push({
        type: 'CREDENTIAL_STUFFING_SUCCESS',
        message: `🚨 CRITICAL: IP ${success.ip_address} had ${success.failed_attempts} failed login attempts, then successfully logged in as user ${success.user_id}. Possible credential stuffing attack succeeded!`,
        severity: 'critical',
      });
    }

    return alerts;
  }

  formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }
}
