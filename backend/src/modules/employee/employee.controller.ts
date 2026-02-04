import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('employees')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Post()
  @Roles('ADMIN')
  create(@Body() createEmployeeDto: CreateEmployeeDto, @Request() req: any) {
    return this.employeeService.create(createEmployeeDto);
  }

  @Get()
  @Roles('ADMIN', 'LEAD_MANAGER')
  findAll(@Request() req: any) {
    return this.employeeService.findAll();
  }

  @Get(':id')
  @Roles('ADMIN', 'LEAD_MANAGER')
  findOne(@Param('id') id: string) {
    return this.employeeService.findOne(id);
  }

  @Get(':id/team')
  @Roles('ADMIN', 'LEAD_MANAGER')
  getTeam(@Param('id') id: string) {
    return this.employeeService.getTeam(id);
  }

  @Get(':id/hierarchy')
  @Roles('ADMIN', 'LEAD_MANAGER')
  getHierarchy(@Param('id') id: string) {
    return this.employeeService.getHierarchy(id);
  }

  @Put(':id')
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() updateEmployeeDto: UpdateEmployeeDto) {
    return this.employeeService.update(id, updateEmployeeDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.employeeService.remove(id);
  }
}
