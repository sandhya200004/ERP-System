import { Controller, Get, Post, Body, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { KpiTasksService } from './kpi-tasks.service';
import { CreateKpiTaskDto, SubmitTaskDto, ReviewTaskDto } from './dto/kpi-tasks.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../../shared/decorators/user.decorator';

@ApiTags('KPI Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('kpi-tasks')
export class KpiTasksController {
  constructor(private readonly kpiTasksService: KpiTasksService) {}

  @Post('create')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create and assign KPI task (Admin only)' })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  async createTask(@CurrentUser() user: any, @Body() dto: CreateKpiTaskDto) {
    return this.kpiTasksService.createTask(user.companyId, user.userId, dto);
  }

  @Get('my-tasks')
  @ApiOperation({ summary: 'Get my assigned tasks' })
  async getMyTasks(@CurrentUser() user: any) {
    return this.kpiTasksService.getMyTasks(user.userId, user.companyId);
  }

  @Post('submit')
  @ApiOperation({ summary: 'Submit task completion' })
  @ApiResponse({ status: 200, description: 'Task submitted successfully' })
  async submitTask(@CurrentUser() user: any, @Body() dto: SubmitTaskDto) {
    return this.kpiTasksService.submitTask(user.userId, user.companyId, dto);
  }

  @Get('submitted')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all submitted tasks for review (Admin only)' })
  async getSubmittedTasks(@CurrentUser() user: any) {
    return this.kpiTasksService.getSubmittedTasks(user.companyId);
  }

  @Post('review')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Approve or reject task (Admin only)' })
  @ApiResponse({ status: 200, description: 'Task reviewed successfully' })
  async reviewTask(@CurrentUser() user: any, @Body() dto: ReviewTaskDto) {
    return this.kpiTasksService.reviewTask(user.companyId, user.userId, dto);
  }

  @Get('all')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all tasks (Admin only)' })
  async getAllTasks(@CurrentUser() user: any) {
    return this.kpiTasksService.getAllTasks(user.companyId);
  }

  @Get('stats/:userId')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get KPI statistics for a user (Admin only)' })
  async getUserStats(@Param('userId') userId: string, @CurrentUser() user: any) {
    return this.kpiTasksService.getUserKpiStats(userId, user.companyId);
  }

  @Get('my-stats')
  @ApiOperation({ summary: 'Get my KPI statistics' })
  async getMyStats(@CurrentUser() user: any) {
    return this.kpiTasksService.getUserKpiStats(user.userId, user.companyId);
  }
}
