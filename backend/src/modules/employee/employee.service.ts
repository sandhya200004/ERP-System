import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto';

@Injectable()
export class EmployeeService {
  constructor(private prisma: PrismaService) {}

  async create(createEmployeeDto: CreateEmployeeDto) {
    const { email, firstName, lastName, designation, department, role, managerId, joiningDate } =
      createEmployeeDto;

    // Check if user already exists
    let user = await this.prisma.users.findUnique({ where: { email } });

    if (!user) {
      // Create new user
      const bcrypt = require('bcrypt');
      const tempPassword = Math.random().toString(36).slice(-8);
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      user = await this.prisma.users.create({
        data: {
          email,
          password_hash: passwordHash,
          first_name: firstName,
          last_name: lastName,
          phone: createEmployeeDto.phone || null,
          status: 'active',
        },
      });
    }

    // Generate employee_id
    const count = await this.prisma.employee_profiles.count();
    const employeeId = `EMP${String(count + 1).padStart(4, '0')}`;

    // Validate manager exists if provided
    if (managerId) {
      const managerProfile = await this.prisma.employee_profiles.findUnique({
        where: { id: managerId },
      });
      if (!managerProfile) {
        throw new NotFoundException('Manager not found');
      }
    }

    // Create employee profile
    const employeeProfile = await this.prisma.employee_profiles.create({
      data: {
        user_id: user.id,
        employee_id: employeeId,
        designation,
        department,
        role: role as any,
        reporting_to_id: managerId || null,
        date_of_joining: new Date(joiningDate),
      },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
            phone: true,
            status: true,
          },
        },
        employee_profiles: {
          select: {
            id: true,
            employee_id: true,
            users: {
              select: {
                first_name: true,
                last_name: true,
              },
            },
          },
        },
      },
    });

    return this.formatEmployeeResponse(employeeProfile);
  }

  async findAll() {
    const employees = await this.prisma.employee_profiles.findMany({
      include: {
        users: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
            phone: true,
            status: true,
          },
        },
        employee_profiles: {
          select: {
            id: true,
            employee_id: true,
            users: {
              select: {
                first_name: true,
                last_name: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return employees.map((emp) => this.formatEmployeeResponse(emp));
  }

  async findOne(id: string) {
    const employee = await this.prisma.employee_profiles.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
            phone: true,
            status: true,
            avatar_url: true,
          },
        },
        employee_profiles: {
          select: {
            id: true,
            employee_id: true,
            designation: true,
            users: {
              select: {
                first_name: true,
                last_name: true,
              },
            },
          },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return this.formatEmployeeResponse(employee);
  }

  async update(id: string, updateEmployeeDto: UpdateEmployeeDto) {
    const employee = await this.prisma.employee_profiles.findUnique({
      where: { id },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Validate manager if provided
    if (updateEmployeeDto.managerId) {
      if (updateEmployeeDto.managerId === id) {
        throw new BadRequestException('Employee cannot be their own manager');
      }

      const managerProfile = await this.prisma.employee_profiles.findUnique({
        where: { id: updateEmployeeDto.managerId },
      });

      if (!managerProfile) {
        throw new NotFoundException('Manager not found');
      }

      // Prevent circular reporting
      if (await this.hasCircularReporting(id, updateEmployeeDto.managerId)) {
        throw new BadRequestException('Circular reporting structure detected');
      }
    }

    // Update user info if provided
    if (updateEmployeeDto.firstName || updateEmployeeDto.lastName || updateEmployeeDto.phone) {
      await this.prisma.users.update({
        where: { id: employee.user_id },
        data: {
          first_name: updateEmployeeDto.firstName,
          last_name: updateEmployeeDto.lastName,
          phone: updateEmployeeDto.phone,
        },
      });
    }

    // Update employee profile
    const updatedEmployee = await this.prisma.employee_profiles.update({
      where: { id },
      data: {
        designation: updateEmployeeDto.designation,
        department: updateEmployeeDto.department,
        role: updateEmployeeDto.role as any,
        reporting_to_id: updateEmployeeDto.managerId,
      },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
            phone: true,
            status: true,
          },
        },
        employee_profiles: {
          select: {
            id: true,
            employee_id: true,
            users: {
              select: {
                first_name: true,
                last_name: true,
              },
            },
          },
        },
      },
    });

    return this.formatEmployeeResponse(updatedEmployee);
  }

  async remove(id: string) {
    const employee = await this.prisma.employee_profiles.findUnique({
      where: { id },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Soft delete user
    await this.prisma.users.update({
      where: { id: employee.user_id },
      data: {
        status: 'inactive',
        deleted_at: new Date(),
      },
    });

    return { message: 'Employee deactivated successfully' };
  }

  async getTeam(managerId: string) {
    const manager = await this.prisma.employee_profiles.findUnique({
      where: { id: managerId },
    });

    if (!manager) {
      throw new NotFoundException('Manager not found');
    }

    const teamMembers = await this.prisma.employee_profiles.findMany({
      where: { reporting_to_id: managerId },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
            phone: true,
            status: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return teamMembers.map((emp) => this.formatEmployeeResponse(emp));
  }

  async getHierarchy(employeeId: string) {
    const employee = await this.findOne(employeeId);

    // Get all subordinates recursively
    const subordinates = await this.getSubordinatesRecursive(employeeId);

    // Get reporting chain up to CEO
    const reportingChain = await this.getReportingChain(employeeId);

    return {
      employee,
      subordinates,
      reportingChain,
    };
  }

  private async getSubordinatesRecursive(managerId: string): Promise<any[]> {
    const directReports = await this.prisma.employee_profiles.findMany({
      where: { reporting_to_id: managerId },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    const result = [];
    for (const report of directReports) {
      const subordinates = await this.getSubordinatesRecursive(report.id);
      result.push({
        ...this.formatEmployeeResponse(report),
        subordinates,
      });
    }

    return result;
  }

  private async getReportingChain(employeeId: string): Promise<any[]> {
    const chain = [];
    let currentEmployee = await this.prisma.employee_profiles.findUnique({
      where: { id: employeeId },
      include: {
        users: true,
        employee_profiles: {
          include: {
            users: true,
          },
        },
      },
    });

    while (currentEmployee?.reporting_to_id) {
      const manager = await this.prisma.employee_profiles.findUnique({
        where: { id: currentEmployee.reporting_to_id },
        include: {
          users: true,
        },
      });

      if (manager) {
        chain.push(this.formatEmployeeResponse(manager));
        currentEmployee = manager as any;
      } else {
        break;
      }
    }

    return chain;
  }

  private async hasCircularReporting(employeeId: string, newManagerId: string): Promise<boolean> {
    const chain = await this.getReportingChain(newManagerId);
    return chain.some((emp: any) => emp.id === employeeId);
  }

  private formatEmployeeResponse(employee: any) {
    return {
      id: employee.id,
      employeeId: employee.employee_id,
      userId: employee.user_id,
      firstName: employee.users.first_name,
      lastName: employee.users.last_name,
      fullName: `${employee.users.first_name} ${employee.users.last_name}`,
      email: employee.users.email,
      phone: employee.users.phone,
      designation: employee.designation,
      department: employee.department,
      role: employee.role,
      joiningDate: employee.date_of_joining,
      managerId: employee.reporting_to_id,
      managerName: employee.employee_profiles
        ? `${employee.employee_profiles.users.first_name} ${employee.employee_profiles.users.last_name}`
        : null,
      status: employee.users.status,
      avatarUrl: employee.users.avatar_url,
      createdAt: employee.created_at,
      updatedAt: employee.updated_at,
    };
  }
}
