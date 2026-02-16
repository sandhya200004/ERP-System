import { Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../../shared/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

@ApiTags('Admin')
@Controller('admin')
export class SeedController {
  constructor(private prisma: PrismaService) {}

  @Post('seed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Seed database with initial data (one-time use)' })
  async seedDatabase() {
    try {
      // Check if already seeded
      const userCount = await this.prisma.users.count();
      if (userCount > 0) {
        return {
          success: false,
          message: 'Database already seeded',
          userCount,
        };
      }

      // Create company
      const company = await this.prisma.companies.create({
        data: {
          id: randomUUID(),
          name: 'TriVerse',
          email: 'contact@triverse.com',
          default_currency_code: 'INR',
          status: 'active',
          updated_at: new Date(),
        },
      });

      // Hash password
      const passwordHash = await bcrypt.hash('admin123', 10);

      // Create admin user
      const adminUser = await this.prisma.users.create({
        data: {
          id: randomUUID(),
          email: 'veerajmatnale@triverse.com',
          password_hash: passwordHash,
          first_name: 'Veeraj',
          last_name: 'Matnale',
          status: 'active',
          email_verified_at: new Date(),
          updated_at: new Date(),
        },
      });

      // Create all employees
      const employees = [
        { name: 'Charudatta Warke', email: 'charudatta.warke@triverse.com', empId: 'TS2025001', role: 'CEO', designation: 'CEO & Founder', dept: 'Executive' },
        { name: 'Veeraj Matnale', email: 'veeraj.matnale@triverse.com', empId: 'TS2025002', role: 'CTO', designation: 'Co-founder & CTO', dept: 'Executive' },
        { name: 'Omkar Kale', email: 'omkar.kale@triverse.com', empId: 'TS2025003', role: 'CMO', designation: 'CMO & Head Operation', dept: 'Executive' },
        { name: 'HR Department', email: 'hr@triverse.com', empId: 'TSDM2025001', role: 'HR', designation: 'HR', dept: 'HR' },
        { name: 'Sanket Mule', email: 'sanket.mule@triverse.com', empId: 'TSDM2025002', role: 'RND', designation: 'R&D Head', dept: 'R&D' },
        { name: 'Vedant Jadhav', email: 'vedant.jadhav@triverse.com', empId: 'TSDM2025003', role: 'DESIGNER', designation: 'Video Editing/Design', dept: 'Design' },
        { name: 'Shruti Jadhav', email: 'shruti.jadhav@triverse.com', empId: 'TSDM2025004', role: 'MANAGER', designation: 'Lead Manager', dept: 'Management' },
        { name: 'Vaishnavi Sirsat', email: 'vaishnavi.sirsat@triverse.com', empId: 'TSDM2025005', role: 'MARKETING', designation: 'DM Executive', dept: 'Marketing' },
        { name: 'Pratiksha Kharat', email: 'pratiksha.kharat@triverse.com', empId: 'TSDM2025006', role: 'MANAGER', designation: 'Lead Manager', dept: 'Management' },
        { name: 'Sarvesh Daware', email: 'sarvesh.daware@triverse.com', empId: 'TSDM2025007', role: 'RND', designation: 'R&D', dept: 'R&D' },
        { name: 'Kundan Jangale', email: 'kundan.jangale@triverse.com', empId: 'TSTC2025001', role: 'DEVELOPER', designation: 'React Native Developer', dept: 'Technology' },
        { name: 'Vinita Patil', email: 'vinita.patil@triverse.com', empId: 'TSTC2025002', role: 'DEVELOPER', designation: 'Full Stack Developer', dept: 'Technology' },
        { name: 'Vaishnavi Pandurang Jadhav', email: 'vaishnavi.jadhav@triverse.com', empId: 'TSDM2025008', role: 'MARKETING', designation: 'Social Media Marketing', dept: 'Marketing' },
        { name: 'Chinmaya Bhushan Kolhe', email: 'chinmaya.kolhe@triverse.com', empId: 'TSDM2025009', role: 'MARKETING', designation: 'Social Media Marketing', dept: 'Marketing' },
        { name: 'Snehal Sanjivkumar Bandgar', email: 'snehal.bandgar@triverse.com', empId: 'TSDM2025010', role: 'MARKETING', designation: 'Social Media Marketing', dept: 'Marketing' },
        { name: 'Dhiraj Umesh Raut', email: 'dhiraj.raut@triverse.com', empId: 'TSDM2025011', role: 'MARKETING', designation: 'Social Media Marketing', dept: 'Marketing' },
        { name: 'Sachin Sampat Sanap', email: 'sachin.sanap@triverse.com', empId: 'TSDM2025012', role: 'MARKETING', designation: 'Social Media Marketing', dept: 'Marketing' },
        { name: 'Kaveri Govind Pawar', email: 'kaveri.pawar@triverse.com', empId: 'TSDM2025013', role: 'MARKETING', designation: 'Social Media Marketing', dept: 'Marketing' },
        { name: 'Kanchan Sachin Tale', email: 'kanchan.tale@triverse.com', empId: 'TSDM2025014', role: 'MARKETING', designation: 'Social Media Marketing', dept: 'Marketing' },
        { name: 'Vansh Sanjay Raina', email: 'vansh.raina@triverse.com', empId: 'TSDM2025015', role: 'MARKETING', designation: 'Social Media Marketing', dept: 'Marketing' },
      ];

      for (const emp of employees) {
        const [firstName, ...lastNameParts] = emp.name.split(' ');
        const lastName = lastNameParts.join(' ');
        const empPassword = await bcrypt.hash(`${emp.empId}@2025`, 10);

        const user = await this.prisma.users.create({
          data: {
            id: randomUUID(),
            email: emp.email,
            password_hash: empPassword,
            first_name: firstName,
            last_name: lastName,
            status: 'active',
            email_verified_at: new Date(),
            updated_at: new Date(),
          },
        });

        await this.prisma.employee_profiles.create({
          data: {
            id: randomUUID(),
            user_id: user.id,
            employee_id: emp.empId,
            designation: emp.designation,
            department: emp.dept,
            role: emp.role as any,
            date_of_joining: new Date(),
          },
        });
      }

      return {
        success: true,
        message: 'Database seeded successfully',
        company: company.name,
        employeesCreated: employees.length,
        credentials: 'Use email + [EmployeeID]@2025 as password',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Seed failed',
        error: error.message,
      };
    }
  }
}
