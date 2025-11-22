import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { EmployeeTaskService } from './employee-task.service';
import { CreateEmployeeTaskDto, UpdateEmployeeTaskDto, EmployeeTaskQueryDto } from './dto/employee-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentCompany } from '../../shared/decorators/user.decorator';

@ApiTags('Employee Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('employee-tasks')
export class EmployeeTaskController {
  constructor(private readonly employeeTaskService: EmployeeTaskService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  async create(
    @CurrentUser() user: any,
    @Body() createDto: CreateEmployeeTaskDto,
  ) {
    return this.employeeTaskService.create(user.userId, user.companyId, createDto);
  }

  @Get('my-tasks')
  @ApiOperation({ summary: 'Get my tasks' })
  @ApiResponse({ status: 200, description: 'List of my tasks' })
  async getMyTasks(
    @CurrentUser() user: any,
    @Query() query: EmployeeTaskQueryDto,
  ) {
    return this.employeeTaskService.findMyTasks(user.userId, user.companyId, query);
  }

  @Get('team-tasks')
  @ApiOperation({ summary: 'Get team tasks (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of team tasks' })
  async getTeamTasks(
    @CurrentUser() user: any,
    @Query() query: EmployeeTaskQueryDto,
  ) {
    return this.employeeTaskService.findTeamTasks(user.companyId, query);
  }

  @Get('my-kpi')
  @ApiOperation({ summary: 'Get my KPI metrics' })
  @ApiResponse({ status: 200, description: 'My KPI metrics' })
  async getMyKPI(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.employeeTaskService.getMyKPIMetrics(user.userId, user.companyId, startDate, endDate);
  }

  @Get('team-kpi')
  @ApiOperation({ summary: 'Get team KPI metrics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Team KPI metrics' })
  async getTeamKPI(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.employeeTaskService.getTeamKPIMetrics(user.companyId, startDate, endDate);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific task' })
  @ApiResponse({ status: 200, description: 'Task details' })
  async getOne(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    const isAdmin = ['CEO', 'CTO', 'HR', 'MANAGER'].includes(user.role);
    return this.employeeTaskService.findOne(id, user.userId, user.companyId, isAdmin);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a task' })
  @ApiResponse({ status: 200, description: 'Task updated successfully' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateDto: UpdateEmployeeTaskDto,
  ) {
    const isAdmin = ['CEO', 'CTO', 'HR', 'MANAGER'].includes(user.role);
    return this.employeeTaskService.update(id, user.userId, user.companyId, isAdmin, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a task' })
  @ApiResponse({ status: 200, description: 'Task deleted successfully' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    const isAdmin = ['CEO', 'CTO', 'HR', 'MANAGER'].includes(user.role);
    return this.employeeTaskService.remove(id, user.userId, user.companyId, isAdmin);
  }
}
