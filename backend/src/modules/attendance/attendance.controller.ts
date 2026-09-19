import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiForbiddenResponse } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { CheckInDto, CheckOutDto, AttendanceQueryDto } from './dto/attendance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../../shared/decorators/user.decorator';

@ApiTags('Attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('check-in')
  @Permissions('attendance:checkin')
  @ApiOperation({ summary: 'Check in for the day' })
  @ApiResponse({ status: 201, description: 'Checked in successfully' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions for check-in' })
  async checkIn(@CurrentUser() user: any, @Body() checkInDto: CheckInDto) {
    return this.attendanceService.checkIn(user.userId, user.companyId, checkInDto);
  }

  @Post('check-out')
  @Permissions('attendance:checkout')
  @ApiOperation({ summary: 'Check out for the day' })
  @ApiResponse({ status: 200, description: 'Checked out successfully' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions for check-out' })
  async checkOut(@CurrentUser() user: any, @Body() checkOutDto: CheckOutDto) {
    return this.attendanceService.checkOut(user.userId, user.companyId, checkOutDto);
  }

  @Get('my-attendance')
  @Permissions('attendance:read')
  @ApiOperation({ summary: 'Get my attendance history' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions to view attendance' })
  async getMyAttendance(@CurrentUser() user: any, @Query() query: AttendanceQueryDto) {
    return this.attendanceService.getMyAttendance(user.userId, user.companyId, query);
  }

  @Get('team-attendance')
  @Roles('ADMIN')
  @Permissions('attendance:manage')
  @ApiOperation({ summary: 'Get team attendance (Admin only)' })
  @ApiForbiddenResponse({ description: 'Admin access or attendance:manage permission required' })
  async getTeamAttendance(@CurrentUser() user: any, @Query() query: AttendanceQueryDto) {
    return this.attendanceService.getTeamAttendance(user.companyId, query);
  }

  @Get('today-status')
  @Permissions('attendance:read')
  @ApiOperation({ summary: 'Get today check-in/out status' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions to view status' })
  async getTodayStatus(@CurrentUser() user: any) {
    return this.attendanceService.getTodayStatus(user.userId, user.companyId);
  }

  @Get('my-stats')
  @Permissions('attendance:read')
  @ApiOperation({ summary: 'Get my attendance statistics' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions to view statistics' })
  async getMyStats(@CurrentUser() user: any, @Query('days') days?: number) {
    return this.attendanceService.getMyStats(user.userId, user.companyId, days ? parseInt(days.toString()) : 30);
  }
}
