import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { CheckInDto, CheckOutDto, AttendanceQueryDto } from './dto/attendance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../../shared/decorators/user.decorator';

@ApiTags('Attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('check-in')
  @ApiOperation({ summary: 'Check in for the day' })
  @ApiResponse({ status: 201, description: 'Checked in successfully' })
  async checkIn(@CurrentUser() user: any, @Body() checkInDto: CheckInDto) {
    return this.attendanceService.checkIn(user.userId, user.companyId, checkInDto);
  }

  @Post('check-out')
  @ApiOperation({ summary: 'Check out for the day' })
  @ApiResponse({ status: 200, description: 'Checked out successfully' })
  async checkOut(@CurrentUser() user: any, @Body() checkOutDto: CheckOutDto) {
    return this.attendanceService.checkOut(user.userId, user.companyId, checkOutDto);
  }

  @Get('my-attendance')
  @ApiOperation({ summary: 'Get my attendance history' })
  async getMyAttendance(@CurrentUser() user: any, @Query() query: AttendanceQueryDto) {
    return this.attendanceService.getMyAttendance(user.userId, user.companyId, query);
  }

  @Get('team-attendance')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get team attendance (Admin only)' })
  async getTeamAttendance(@CurrentUser() user: any, @Query() query: AttendanceQueryDto) {
    return this.attendanceService.getTeamAttendance(user.companyId, query);
  }

  @Get('today-status')
  @ApiOperation({ summary: 'Get today check-in/out status' })
  async getTodayStatus(@CurrentUser() user: any) {
    return this.attendanceService.getTodayStatus(user.userId, user.companyId);
  }

  @Get('my-stats')
  @ApiOperation({ summary: 'Get my attendance statistics' })
  async getMyStats(@CurrentUser() user: any, @Query('days') days?: number) {
    return this.attendanceService.getMyStats(user.userId, user.companyId, days ? parseInt(days.toString()) : 30);
  }
}
