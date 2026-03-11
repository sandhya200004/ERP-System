import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../shared/prisma/prisma.service';
import {
  CreatePlatformAdminDto,
  LoginPlatformAdminDto,
  CreateCompanyDto,
  UpdateCompanyDto,
  SuspendCompanyDto,
} from './dto/platform-admin.dto';

@Injectable()
export class PlatformAdminService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  // ==================== Platform Admin Authentication ====================

  async registerPlatformAdmin(dto: CreatePlatformAdminDto) {
    // Check if platform admin already exists
    const existing = await this.prisma.platform_admins.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Platform admin with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Create platform admin
    const admin = await this.prisma.platform_admins.create({
      data: {
        id: randomUUID(),
        email: dto.email,
        password_hash: passwordHash,
        first_name: dto.first_name,
        last_name: dto.last_name,
        phone: dto.phone,
        is_super_admin: true,
        is_active: true,
        updated_at: new Date(),
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone: true,
        is_super_admin: true,
        created_at: true,
      },
    });

    return {
      message: 'Platform admin created successfully',
      admin,
    };
  }

  async loginPlatformAdmin(dto: LoginPlatformAdminDto) {
    // Find platform admin
    const admin = await this.prisma.platform_admins.findUnique({
      where: { email: dto.email },
    });

    if (!admin || !admin.is_active) {
      throw new UnauthorizedException('Invalid credentials or account inactive');
    }

    // Verify password
    const passwordValid = await bcrypt.compare(dto.password, admin.password_hash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.prisma.platform_admins.update({
      where: { id: admin.id },
      data: { last_login_at: new Date() },
    });

    // Generate JWT
    const payload = {
      sub: admin.id,
      email: admin.email,
      is_platform_admin: true,
      is_super_admin: admin.is_super_admin,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '12h',
    });

    return {
      access_token: accessToken,
      admin: {
        id: admin.id,
        email: admin.email,
        first_name: admin.first_name,
        last_name: admin.last_name,
        is_super_admin: admin.is_super_admin,
      },
    };
  }

  // ==================== Company/Tenant Management ====================

  async checkSubdomainAvailability(subdomain: string) {
    // Validate subdomain format
    const subdomainRegex = /^[a-z0-9-]+$/;
    const isValidFormat = subdomainRegex.test(subdomain);
    
    if (!isValidFormat) {
      return {
        available: false,
        valid: false,
        message: 'Subdomain must contain only lowercase letters, numbers, and hyphens',
        suggestion: subdomain.toLowerCase().replace(/[^a-z0-9-]/g, ''),
      };
    }

    // Check length (min 3, max 63 characters for DNS)
    if (subdomain.length < 3) {
      return {
        available: false,
        valid: false,
        message: 'Subdomain must be at least 3 characters long',
      };
    }

    if (subdomain.length > 63) {
      return {
        available: false,
        valid: false,
        message: 'Subdomain must be less than 63 characters',
      };
    }

    // Check if starts or ends with hyphen
    if (subdomain.startsWith('-') || subdomain.endsWith('-')) {
      return {
        available: false,
        valid: false,
        message: 'Subdomain cannot start or end with a hyphen',
      };
    }

    // Reserved subdomains
    const reserved = [
      'admin', 'www', 'api', 'app', 'mail', 'ftp', 'localhost',
      'platform', 'system', 'root', 'help', 'support', 'billing',
      'dashboard', 'portal', 'management', 'console',
    ];
    
    if (reserved.includes(subdomain.toLowerCase())) {
      return {
        available: false,
        valid: true,
        message: 'This subdomain is reserved for system use',
      };
    }

    // Check if subdomain is already taken
    const existingCompany = await this.prisma.companies.findFirst({
      where: {
        subdomain: subdomain.toLowerCase(),
        deleted_at: null,
      },
    });

    if (existingCompany) {
      return {
        available: false,
        valid: true,
        message: 'This subdomain is already taken',
        suggestion: `${subdomain}${Math.floor(Math.random() * 999)}`,
      };
    }

    // Generate preview URL
    const baseUrl = this.config.get('BASE_URL') || 'http://localhost:3000';
    const previewUrl = baseUrl.replace('://', `://${subdomain}.`);

    return {
      available: true,
      valid: true,
      message: 'Subdomain is available!',
      preview_url: previewUrl,
    };
  }

  async createCompany(dto: CreateCompanyDto) {
    // Validate subdomain format
    const subdomainRegex = /^[a-z0-9-]+$/;
    if (!subdomainRegex.test(dto.subdomain)) {
      throw new BadRequestException(
        'Subdomain must contain only lowercase letters, numbers, and hyphens',
      );
    }

    // Reserved subdomains
    const reserved = ['admin', 'www', 'api', 'app', 'mail', 'ftp', 'localhost'];
    if (reserved.includes(dto.subdomain.toLowerCase())) {
      throw new BadRequestException('This subdomain is reserved');
    }

    // Check if subdomain is already taken
    const existingCompany = await this.prisma.companies.findFirst({
      where: {
        subdomain: dto.subdomain.toLowerCase(),
      },
    });

    if (existingCompany) {
      throw new ConflictException('Subdomain already taken');
    }

    // Check if admin email already exists
    const existingUser = await this.prisma.users.findUnique({
      where: { email: dto.admin_email },
    });

    if (existingUser) {
      throw new ConflictException('Admin email already registered');
    }

    // Create company with admin user
    const result = await this.prisma.$transaction(async (tx) => {
      // Create company
      const company = await tx.companies.create({
        data: {
          id: randomUUID(),
          name: dto.name,
          subdomain: dto.subdomain.toLowerCase(),
          subscription_plan: dto.subscription_plan || 'trial',
          max_users: dto.max_users || 5,
          max_branches: dto.max_branches || 1,
          max_storage_gb: dto.max_storage_gb || 5,
          default_currency_code: dto.currency_code || 'USD',
          status: 'trial',
          trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
          updated_at: new Date(),
        },
      });

      // Hash admin password
      const passwordHash = await bcrypt.hash(dto.admin_password, 10);

      // Create admin user
      const admin = await tx.users.create({
        data: {
          id: randomUUID(),
          email: dto.admin_email,
          password_hash: passwordHash,
          first_name: dto.admin_first_name,
          last_name: dto.admin_last_name,
          phone: dto.admin_phone,
          status: 'active',
          updated_at: new Date(),
        },
      });

      // Create Administrator role for the company
      const adminRole = await tx.roles.create({
        data: {
          id: randomUUID(),
          company_id: company.id,
          name: 'Administrator',
          description: 'Full system access - Company Administrator',
          is_system_role: true,
          updated_at: new Date(),
        },
      });

      // Get all permissions
      const permissions = await tx.permissions.findMany();

      // Assign all permissions to admin role
      if (permissions.length > 0) {
        await tx.role_permissions.createMany({
          data: permissions.map((p) => ({
            role_id: adminRole.id,
            permission_id: p.id,
          })),
        });
      }

      // Assign user to admin role
      await tx.user_roles.create({
        data: {
          id: randomUUID(),
          user_id: admin.id,
          role_id: adminRole.id,
          company_id: company.id,
        },
      });

      return { company, admin };
    });

    // Generate login URL
    const baseUrl = this.config.get('BASE_URL') || 'http://localhost:3000';
    const loginUrl = baseUrl.replace('://', `://${dto.subdomain}.`);

    return {
      message: 'Company created successfully',
      company: {
        id: result.company.id,
        name: result.company.name,
        subdomain: result.company.subdomain,
        status: result.company.status,
        subscription_plan: result.company.subscription_plan,
        max_users: result.company.max_users,
        trial_ends_at: result.company.trial_ends_at,
      },
      admin: {
        email: result.admin.email,
        first_name: result.admin.first_name,
        last_name: result.admin.last_name,
      },
      login_url: loginUrl,
    };
  }

  async getAllCompanies(page: number = 1, limit: number = 20, status?: string) {
    const skip = (page - 1) * limit;
    
    const where: any = { deleted_at: null };
    if (status) {
      where.status = status;
    }

    const [companies, total] = await Promise.all([
      this.prisma.companies.findMany({
        where,
        select: {
          id: true,
          name: true,
          subdomain: true,
          email: true,
          phone: true,
          status: true,
          subscription_plan: true,
          max_users: true,
          max_branches: true,
          trial_ends_at: true,
          subscription_ends_at: true,
          suspended_at: true,
          suspension_reason: true,
          created_at: true,
          _count: {
            select: {
              user_roles: true,
              branches: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.companies.count({ where }),
    ]);

    return {
      data: companies.map((c) => ({
        ...c,
        active_users: c._count.user_roles,
        total_branches: c._count.branches,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCompanyById(id: string) {
    const company = await this.prisma.companies.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            user_roles: true,
            branches: true,
            invoices: true,
            customers: true,
            vendors: true,
            items: true,
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return company;
  }

  async updateCompany(id: string, dto: UpdateCompanyDto) {
    const company = await this.prisma.companies.findUnique({
      where: { id },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // If updating subdomain, check if it's available
    if (dto.subdomain && dto.subdomain !== company.subdomain) {
      const existing = await this.prisma.companies.findFirst({
        where: {
          subdomain: dto.subdomain.toLowerCase(),
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictException('Subdomain already taken');
      }
    }

    const updated = await this.prisma.companies.update({
      where: { id },
      data: {
        ...dto,
        subdomain: dto.subdomain?.toLowerCase(),
        updated_at: new Date(),
      },
    });

    return {
      message: 'Company updated successfully',
      company: updated,
    };
  }

  async suspendCompany(id: string, dto: SuspendCompanyDto) {
    const company = await this.prisma.companies.findUnique({
      where: { id },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    await this.prisma.companies.update({
      where: { id },
      data: {
        status: 'suspended',
        suspended_at: new Date(),
        suspension_reason: dto.reason,
        updated_at: new Date(),
      },
    });

    return {
      message: 'Company suspended successfully',
    };
  }

  async reactivateCompany(id: string) {
    const company = await this.prisma.companies.findUnique({
      where: { id },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    await this.prisma.companies.update({
      where: { id },
      data: {
        status: 'active',
        suspended_at: null,
        suspension_reason: null,
        updated_at: new Date(),
      },
    });

    return {
      message: 'Company reactivated successfully',
    };
  }

  async deleteCompany(id: string) {
    const company = await this.prisma.companies.findUnique({
      where: { id },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Soft delete
    await this.prisma.companies.update({
      where: { id },
      data: {
        status: 'cancelled',
        deleted_at: new Date(),
        updated_at: new Date(),
      },
    });

    return {
      message: 'Company deleted successfully',
    };
  }

  // ==================== Platform Statistics ====================

  async getPlatformStats() {
    const [
      totalCompanies,
      activeCompanies,
      trialCompanies,
      suspendedCompanies,
      totalUsers,
      companiesThisMonth,
    ] = await Promise.all([
      this.prisma.companies.count({ where: { deleted_at: null } }),
      this.prisma.companies.count({ where: { status: 'active', deleted_at: null } }),
      this.prisma.companies.count({ where: { status: 'trial', deleted_at: null } }),
      this.prisma.companies.count({ where: { status: 'suspended', deleted_at: null } }),
      this.prisma.user_roles.count(),
      this.prisma.companies.count({
        where: {
          created_at: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
          deleted_at: null,
        },
      }),
    ]);

    return {
      total_companies: totalCompanies,
      active_companies: activeCompanies,
      trial_companies: trialCompanies,
      suspended_companies: suspendedCompanies,
      total_users: totalUsers,
      new_companies_this_month: companiesThisMonth,
    };
  }
}
