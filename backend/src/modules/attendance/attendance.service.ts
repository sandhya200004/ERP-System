import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CheckInDto, CheckOutDto, AttendanceQueryDto } from './dto/attendance.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  // Office location: Shop No 1, Vyankatesh Primerose, Talegaon Dabhade, Maharashtra 410507
  // Coordinates: Talegaon Dabhade area
  private readonly OFFICE_LAT = 18.7351;
  private readonly OFFICE_LON = 73.6758;
  private readonly RADIUS_METERS = 500; // 500 meters radius

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  async checkIn(user_id: string, companyId: string, dto: CheckInDto) {
    // Check if user already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingAttendance = await this.prisma.attendance.findFirst({
      where: {
        user_id,
        company_id: companyId,
        date: {
          gte: today,
        },
        check_out: null,
      },
    });

    if (existingAttendance) {
      throw new BadRequestException('You have already checked in today');
    }

    // Validate location
    const distance = this.calculateDistance(
      dto.latitude,
      dto.longitude,
      this.OFFICE_LAT,
      this.OFFICE_LON
    );

    if (distance > this.RADIUS_METERS) {
      throw new BadRequestException(
        `You are ${Math.round(distance)}m away from the office. Please check in from within ${this.RADIUS_METERS}m of the office location.`
      );
    }

    // Create attendance record
    const attendance = await this.prisma.attendance.create({
      data: {
        id: randomUUID(),
        user_id,
        company_id: companyId,
        date: new Date(),
        check_in: new Date(),
        check_in_latitude: dto.latitude.toString(),
        check_in_longitude: dto.longitude.toString(),
        check_in_location: dto.location,
        check_in_notes: dto.notes,
        updated_at: new Date(),
      },
      include: {
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    return {
      message: 'Check-in successful',
      attendance,
      distance: Math.round(distance),
    };
  }

  async checkOut(user_id: string, companyId: string, dto: CheckOutDto) {
    // Find today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await this.prisma.attendance.findFirst({
      where: {
        user_id,
        company_id: companyId,
        date: {
          gte: today,
        },
        check_out: null,
      },
    });

    if (!attendance) {
      throw new NotFoundException('No active check-in found for today');
    }

    // Validate location
    const distance = this.calculateDistance(
      dto.latitude,
      dto.longitude,
      this.OFFICE_LAT,
      this.OFFICE_LON
    );

    if (distance > this.RADIUS_METERS) {
      throw new BadRequestException(
        `You are ${Math.round(distance)}m away from the office. Please check out from within ${this.RADIUS_METERS}m of the office location.`
      );
    }

    // Calculate work hours
    const checkInTime = attendance.check_in.getTime();
    const checkOutTime = new Date().getTime();
    const hoursWorked = (checkOutTime - checkInTime) / (1000 * 60 * 60);

    // Update attendance with check-out
    const updatedAttendance = await this.prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        check_out: new Date(),
        check_out_latitude: dto.latitude.toString(),
        check_out_longitude: dto.longitude.toString(),
        check_out_notes: dto.notes,
        hours_worked: Math.round(hoursWorked * 100) / 100,
      },
      include: {
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    return {
      message: 'Check-out successful',
      attendance: updatedAttendance,
      hours_worked: Math.round(hoursWorked * 100) / 100,
      distance: Math.round(distance),
    };
  }

  async getMyAttendance(user_id: string, companyId: string, query: AttendanceQueryDto) {
    const where: any = {
      user_id,
      company_id: companyId,
    };

    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) where.date.gte = new Date(query.startDate);
      if (query.endDate) where.date.lte = new Date(query.endDate);
    }

    const attendance = await this.prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    return attendance;
  }

  async getTeamAttendance(companyId: string, query: AttendanceQueryDto) {
    const where: any = {
      companyId,
    };

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) where.date.gte = new Date(query.startDate);
      if (query.endDate) where.date.lte = new Date(query.endDate);
    }

    const attendance = await this.prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    return attendance;
  }

  async getTodayStatus(user_id: string, companyId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await this.prisma.attendance.findFirst({
      where: {
        user_id,
        company_id: companyId,
        date: {
          gte: today,
        },
      },
    });

    return {
      hasCheckedIn: !!attendance,
      hasCheckedOut: attendance?.check_out !== null,
      attendance,
    };
  }

  async getMyStats(user_id: string, companyId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const attendance = await this.prisma.attendance.findMany({
      where: {
        user_id,
        company_id: companyId,
        date: {
          gte: startDate,
        },
      },
    });

    const totalDays = attendance.length;
    const presentDays = attendance.filter(a => a.check_in !== null).length;
    const totalHours = attendance.reduce((sum, a) => sum + (Number(a.hours_worked) || 0), 0);
    const avgHours = totalDays > 0 ? totalHours / totalDays : 0;

    return {
      totalDays,
      presentDays,
      totalHours: Math.round(totalHours * 10) / 10,
      averageHours: Math.round(avgHours * 10) / 10,
      attendanceRate: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0,
    };
  }
}
