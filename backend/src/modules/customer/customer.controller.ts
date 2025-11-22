import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CustomerService } from './customer.service';
import { CreateCustomerDto, UpdateCustomerDto, QueryCustomerDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../../shared/decorators/permissions.decorator';
import { CurrentUser } from '../../shared/decorators/user.decorator';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  @RequirePermissions('customers:create')
  @ApiOperation({ summary: 'Create a new customer' })
  create(
    @CurrentUser() user: any,
    @Body() createCustomerDto: CreateCustomerDto,
  ) {
    return this.customerService.create(
      user.companyId,
      user.userId,
      createCustomerDto,
    );
  }

  @Get()
  @RequirePermissions('customers:read')
  @ApiOperation({ summary: 'Get all customers with pagination and search' })
  findAll(@CurrentUser() user: any, @Query() query: QueryCustomerDto) {
    return this.customerService.findAll(user.companyId, query);
  }

  @Get('stats')
  @RequirePermissions('customers:read')
  @ApiOperation({ summary: 'Get customer statistics' })
  getStats(@CurrentUser() user: any) {
    return this.customerService.getStats(user.companyId);
  }

  @Get(':id')
  @RequirePermissions('customers:read')
  @ApiOperation({ summary: 'Get a customer by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.customerService.findOne(id, user.companyId);
  }

  @Patch(':id')
  @RequirePermissions('customers:update')
  @ApiOperation({ summary: 'Update a customer' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customerService.update(
      id,
      user.companyId,
      user.userId,
      updateCustomerDto,
    );
  }

  @Delete(':id')
  @RequirePermissions('customers:delete')
  @ApiOperation({ summary: 'Delete a customer (soft delete)' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.customerService.remove(id, user.companyId, user.userId);
  }
}
