import {
  Injectable,
  NestMiddleware,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../prisma/prisma.service';

// Extend Express Request to include tenant
declare global {
  namespace Express {
    interface Request {
      tenant?: {
        id: string;
        name: string;
        subdomain: string;
        plan: string;
        status: string;
        max_users: number;
        max_branches: number;
        settings: any;
      };
      isPlatformAdmin?: boolean;
    }
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const host = req.hostname || req.get('host') || '';
      
      // Extract subdomain from hostname
      // Example: abc.myerp.com -> subdomain = 'abc'
      // Example: admin.myerp.com -> subdomain = 'admin' (platform admin)
      const parts = host.split('.');
      
      // Skip tenant detection for localhost development
      if (host.includes('localhost') || host.includes('127.0.0.1')) {
        // For local development, check for X-Tenant-Subdomain header
        const tenantHeader = req.get('X-Tenant-Subdomain');
        
        if (tenantHeader && tenantHeader !== 'admin') {
          const company = await this.findCompanyBySubdomain(tenantHeader);
          if (company) {
            req.tenant = this.mapCompanyToTenant(company);
          }
        } else if (tenantHeader === 'admin') {
          req.isPlatformAdmin = true;
        }
        
        return next();
      }

      // Check if this is platform admin subdomain
      if (parts.length >= 2 && parts[0] === 'admin') {
        req.isPlatformAdmin = true;
        return next();
      }

      // Extract subdomain (first part before main domain)
      const subdomain = parts.length >= 3 ? parts[0] : null;

      if (!subdomain) {
        throw new NotFoundException('No tenant subdomain found');
      }

      // Find company by subdomain
      const company = await this.findCompanyBySubdomain(subdomain);

      if (!company) {
        throw new NotFoundException(
          `Company not found for subdomain: ${subdomain}`,
        );
      }

      // Check if company is active
      if (company.status === 'suspended') {
        throw new ForbiddenException(
          'This account has been suspended. Please contact support.',
        );
      }

      if (company.status === 'cancelled') {
        throw new ForbiddenException(
          'This account has been cancelled.',
        );
      }

      if (company.status === 'inactive') {
        throw new ForbiddenException(
          'This account is inactive.',
        );
      }

      // Attach tenant to request
      req.tenant = this.mapCompanyToTenant(company);

      next();
    } catch (error) {
      next(error);
    }
  }

  private async findCompanyBySubdomain(subdomain: string) {
    return await this.prisma.companies.findFirst({
      where: {
        subdomain: subdomain.toLowerCase(),
        deleted_at: null,
      },
      select: {
        id: true,
        name: true,
        subdomain: true,
        subscription_plan: true,
        status: true,
        max_users: true,
        max_branches: true,
        max_storage_gb: true,
        settings: true,
        trial_ends_at: true,
        subscription_ends_at: true,
      },
    });
  }

  private mapCompanyToTenant(company: any) {
    return {
      id: company.id,
      name: company.name,
      subdomain: company.subdomain,
      plan: company.subscription_plan,
      status: company.status,
      max_users: company.max_users,
      max_branches: company.max_branches,
      max_storage_gb: company.max_storage_gb,
      settings: company.settings,
      trial_ends_at: company.trial_ends_at,
      subscription_ends_at: company.subscription_ends_at,
    };
  }
}
