import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { AuditService } from '../../shared/audit/audit.service';
import { Prisma } from '@prisma/client';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  ChangePasswordDto,
  AuthResponseDto,
} from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private audit: AuditService,
  ) { }

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    // Check if user exists
    const existingUser = await this.prisma.users.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create company
      const company = await tx.companies.create({
        data: {
          id: randomUUID(),
          name: dto.companyName,
          default_currency_code: dto.currencyCode || 'USD',
          status: 'trial',
          updated_at: new Date(),
        },
      });

      // Create user
      const user = await tx.users.create({
        data: {
          id: randomUUID(),
          email: dto.email,
          password_hash: passwordHash,
          first_name: dto.firstName,
          last_name: dto.lastName,
          phone: dto.phone,
          status: 'active',
          updated_at: new Date(),
        },
      });

      // Create admin role
      const adminRole = await tx.roles.create({
        data: {
          id: randomUUID(),
          company_id: company.id,
          name: 'Administrator',
          description: 'Full system access',
          is_system_role: true,
          updated_at: new Date(),
        },
      });

      // Get all permissions
      const permissions = await tx.permissions.findMany();

      // Assign all permissions to admin role
      await tx.role_permissions.createMany({
        data: permissions.map((p: any) => ({
          role_id: adminRole.id,
          permission_id: p.id,
        })),
      });

      // Assign user to admin role
      await tx.user_roles.create({
        data: {
          id: randomUUID(),
          user_id: user.id,
          role_id: adminRole.id,
          company_id: company.id,
        },
      });

      // Create main branch
      await tx.branches.create({
        data: {
          id: randomUUID(),
          company_id: company.id,
          name: 'Main Branch',
          code: 'MAIN',
          status: 'active',
          updated_at: new Date(),
        },
      });

      // Create number sequences
      const documentTypes = ['QUOTE', 'INVOICE', 'PAYMENT', 'JOURNAL'];
      await tx.number_sequences.createMany({
        data: documentTypes.map((type) => ({
          id: randomUUID(),
          company_id: company.id,
          document_type: type,
          prefix: type.substring(0, 3),
          next_number: 1,
          padding: 5,
          updated_at: new Date(),
        })),
      });

      // Create default chart of accounts
      await this.createDefaultAccounts(tx, company.id);

      return { user, company };
    });

    // Log the registration
    await this.audit.log({
      action: 'create' as any,
      entity_type: 'user',
      entityId: result.user.id,
      newValues: {
        email: result.user.email,
        firstName: result.user.first_name,
        lastName: result.user.last_name,
      },
    });

    // Generate tokens (register doesn't have employee profile yet, use default values)
    const tokens = await this.generateTokens(result.user.id, result.company.id, '', 'ADMIN');

    return {
      ...tokens,
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.first_name,
        lastName: result.user.last_name,
        status: result.user.status,
        role: 'ADMIN',
      },
      company: {
        id: result.company.id,
        name: result.company.name,
      },
    };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    // Find user by employee_id through employee_profiles
    const employeeProfile = await this.prisma.employee_profiles.findUnique({
      where: { employee_id: dto.employeeId },
      include: {
        users: {
          include: {
            user_roles: {
              include: {
                companies: true,
                roles: true,
              },
            
            },
          },
        },
      },
    });

    if (!employeeProfile || !employeeProfile.users) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = employeeProfile.users;

    // Skip password verification in dev mode
    if (process.env.NODE_ENV !== 'production') {
      // Dev mode: skip password check, but proceed with real logic
    } else {
      // Verify password in production
      const isPasswordValid = await bcrypt.compare(dto.password, user.password_hash);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }
    }

    // Check user status (always check, even in dev)
    if (user.status !== 'active') {
      throw new UnauthorizedException('Account is not active');
    }

    // Update last login
    await this.prisma.users.update({
      where: { id: user.id },
      data: { last_login_at: new Date() },
    });

    // Get primary company (optional)
    const primaryRole = user.user_roles?.[0];
    const primaryCompany = primaryRole?.companies;

    if (!primaryCompany) {
      // keep the existing behavior you saw earlier
      // (prevents the 500 crash and returns a clean 401 with message)
      throw new UnauthorizedException('No company assigned to user');
    }

    // now you can safely use primaryCompany.id / primaryCompany.name
    const companyId = primaryCompany.id;
    const companyName = primaryCompany.name;

    const roleName = (primaryRole?.roles?.name ?? 'EMPLOYEE').toUpperCase();

    // Log the login
    await this.audit.log({
      action: 'login' as any,
      entity_type: 'user',
      entityId: user.id,
      userId: user.id,
      companyId: primaryCompany.id,
    });

    // Generate real tokens (works in dev and prod)
    const tokens = await this.generateTokens(user.id, primaryCompany.id, employeeProfile.employee_id, roleName);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        status: user.status,
        role: roleName,
        employeeId: employeeProfile.employee_id,
        designation: employeeProfile.designation,
        department: employeeProfile.department,
      },
      company: {
        id: companyId,
        name: companyName,
      },
    };
  }

  async refreshToken(dto: RefreshTokenDto): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });

      // Check if refresh token is revoked
      const token = await this.prisma.refresh_tokens.findUnique({
        where: { token: dto.refreshToken },
      });

      if (!token || token.revoked_at) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new access token
      const accessToken = this.jwtService.sign(
        {
          sub: payload.sub,
          company_id: payload.company_id,
        },
        {
          expiresIn: this.config.get('JWT_ACCESS_EXPIRY', '15m'),
        },
      );

      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async changePassword(
    user_id: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.prisma.users.findUnique({
      where: { id: user_id },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.password_hash,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(dto.newPassword, 10);

    // Update password
    await this.prisma.users.update({
      where: { id: user_id },
      data: { password_hash: newPasswordHash },
    });

    // Revoke all refresh tokens
    await this.prisma.refresh_tokens.updateMany({
      where: { user_id: user_id },
      data: { revoked_at: new Date() },
    });

    // Log the password change
    await this.audit.log({
      action: 'update' as any,
      entity_type: 'user',
      entityId: user_id,
      userId: user_id,
      newValues: { password: 'changed' },
    });

    return { message: 'Password changed successfully' };
  }

  async logout(user_id: string, refreshToken: string): Promise<{ message: string }> {
    // Revoke the refresh token
    await this.prisma.refresh_tokens.updateMany({
      where: {
        user_id,
        token: refreshToken,
      },
      data: { revoked_at: new Date() },
    });

    // Log the logout
    await this.audit.log({
      action: 'logout' as any,
      entity_type: 'user',
      entityId: user_id,
      userId: user_id,
    });

    return { message: 'Logged out successfully' };
  }

  private async generateTokens(
    user_id: string,
    companyId: string,
    employeeId: string,
    role: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = {
      sub: user_id,
      company_id: companyId,
      employee_id: employeeId,
      role: role,
    };

    // Generate access token
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.config.get('JWT_ACCESS_EXPIRY', '15m'),
    });

    // Generate refresh token
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get('JWT_REFRESH_EXPIRY', '7d'),
    });

    // Store refresh token
    const expiresIn = parseInt(this.config.get('JWT_REFRESH_EXPIRY', '7'), 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresIn);

    await this.prisma.refresh_tokens.create({
      data: {
        id: randomUUID(),
        user_id,
        token: refreshToken,
        expires_at: expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }
  private async createDefaultAccounts(tx: Prisma.TransactionClient, companyId: string): Promise<void> {
    const defaultAccounts = [
      // Assets
      { number: '1000', name: 'Cash', type: 'asset', currency: 'USD' },
      { number: '1100', name: 'Bank Account', type: 'asset', currency: 'USD' },
      { number: '1200', name: 'Accounts Receivable', type: 'asset', currency: 'USD' },
      { number: '1500', name: 'Inventory', type: 'asset', currency: 'USD' },

      // Liabilities
      { number: '2000', name: 'Accounts Payable', type: 'liability', currency: 'USD' },
      { number: '2100', name: 'Sales Tax Payable', type: 'liability', currency: 'USD' },

      // Equity
      { number: '3000', name: 'Owner Equity', type: 'equity', currency: 'USD' },
      { number: '3200', name: 'Retained Earnings', type: 'equity', currency: 'USD' },

      // Revenue
      { number: '4000', name: 'Sales Revenue', type: 'revenue', currency: 'USD' },
      { number: '4100', name: 'Service Revenue', type: 'revenue', currency: 'USD' },

      // Expenses
      { number: '5000', name: 'Cost of Goods Sold', type: 'expense', currency: 'USD' },
      { number: '5100', name: 'Operating Expenses', type: 'expense', currency: 'USD' },
      { number: '5200', name: 'Salaries & Wages', type: 'expense', currency: 'USD' },
    ];

    await tx.accounts.createMany({
      data: defaultAccounts.map((acc: any) => ({
        id: randomUUID(),
        company_id: companyId,
        account_number: acc.number,
        name: acc.name,
        account_type: acc.type as any,
        currency_code: acc.currency,
        is_system_account: true,
        is_active: true,
        updated_at: new Date(),
      })),
    });
  }
}
