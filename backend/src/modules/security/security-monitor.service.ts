import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SecurityService } from './security.service';
import { AlertNotificationService } from './alert-notification.service';

@Injectable()
export class SecurityMonitorService {
  private readonly logger = new Logger(SecurityMonitorService.name);
  private lastAlertCheck: Date;

  constructor(
    private readonly securityService: SecurityService,
    private readonly alertNotificationService: AlertNotificationService,
  ) {
    this.lastAlertCheck = new Date();
  }

  /**
   * Check for security alerts every 5 minutes
   * Runs at 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55 minutes past each hour
   */
  @Cron('*/5 * * * *', {
    name: 'security-alert-check',
    timeZone: 'America/New_York', // Adjust to your timezone
  })
  async checkSecurityAlerts() {
    try {
      this.logger.log('Running scheduled security alert check...');
      
      const alerts = await this.securityService.checkForSecurityAlerts();
      
      if (alerts && alerts.length > 0) {
        this.logger.warn(`Found ${alerts.length} security alerts`);
        
        // Send notifications for all alerts
        await this.alertNotificationService.sendBatchAlerts(alerts);
        
        this.lastAlertCheck = new Date();
      } else {
        this.logger.log('No security alerts detected');
      }
    } catch (error) {
      this.logger.error('Error during security alert check:', error);
    }
  }

  /**
   * Daily system health report (runs at 8am)
   */
  @Cron('0 8 * * *', {
    name: 'daily-security-report',
    timeZone: 'America/New_York',
  })
  async sendDailySecurityReport() {
    try {
      this.logger.log('Generating daily security report...');
      
      const metrics = await this.securityService.getSecurityMetrics();
      const status = await this.securityService.getSystemStatus();
      
      // Send summary alert
      const summary = {
        type: 'Daily Security Report',
        message: `System Status: ${status.status}\n` +
                 `Uptime: ${this.formatUptime(status.uptime)}\n` +
                 `Failed Logins (24h): ${metrics.failedLogins24h}\n` +
                 `Active Users: ${metrics.activeUsers}\n` +
                 `Data Exports (7d): ${metrics.dataExports7d}`,
        severity: 'low' as const,
        timestamp: new Date(),
      };
      
      await this.alertNotificationService.sendAlert(summary);
      
      this.logger.log('Daily security report sent');
    } catch (error) {
      this.logger.error('Error generating daily report:', error);
    }
  }

  /**
   * Log system uptime every hour
   */
  @Cron(CronExpression.EVERY_HOUR, {
    name: 'hourly-uptime-log',
  })
  async logSystemUptime() {
    try {
      const status = await this.securityService.getSystemStatus();
      this.logger.log(`System uptime: ${this.formatUptime(status.uptime)} | Status: ${status.status}`);
    } catch (error) {
      this.logger.error('Error logging uptime:', error);
    }
  }

  /**
   * Format uptime in human-readable format
   */
  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);

    return parts.length > 0 ? parts.join(' ') : '< 1m';
  }

  /**
   * Get monitoring service status
   */
  getMonitoringStatus() {
    return {
      lastAlertCheck: this.lastAlertCheck,
      scheduledTasks: [
        { name: 'security-alert-check', schedule: 'Every 5 minutes' },
        { name: 'daily-security-report', schedule: 'Daily at 8:00 AM' },
        { name: 'hourly-uptime-log', schedule: 'Every hour' },
      ],
    };
  }
}
