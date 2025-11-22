import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.users.findUnique({
      where: { id: payload.sub },
      include: {
        user_roles: {
          where: {
            company_id: payload.company_id,
          },
          include: {
            roles: {
              include: {
                role_permissions: {
                  include: {
                    permissions: true,
                  },
                },
              },
            },
            branches: true,
          },
        },
        employee_profiles: true,
      },
    });

    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Extract permissions
    const permissions = user.user_roles.flatMap((ur: any) =>
      ur.roles.role_permissions.map((rp: any) => rp.permissions.name),
    );

    const employeeProfile = (user.employee_profiles as any)?.[0];

    return {
      user_id: user.id,
      userId: user.id,
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      status: user.status,
      company_id: payload.company_id,
      companyId: payload.company_id,
      branchId: user.user_roles?.[0]?.branch_id,
      permissions: Array.from(new Set(permissions)),
      // Include employee profile data
      role: employeeProfile?.role,
      employeeId: employeeProfile?.employee_id,
      designation: employeeProfile?.designation,
      department: employeeProfile?.department,
    };
  }
}
