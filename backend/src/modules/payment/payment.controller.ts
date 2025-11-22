import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { CreatePaymentDto, QueryPaymentDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../../shared/decorators/permissions.decorator';
import { CurrentUser } from '../../shared/decorators/user.decorator';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @RequirePermissions('payments:create')
  @ApiOperation({ summary: 'Create a new payment and apply to invoices' })
  create(@CurrentUser() user: any, @Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentService.create(user.companyId, user.userId, createPaymentDto);
  }

  @Get()
  @RequirePermissions('payments:read')
  @ApiOperation({ summary: 'Get all payments with pagination and filters' })
  findAll(@CurrentUser() user: any, @Query() query: QueryPaymentDto) {
    return this.paymentService.findAll(user.companyId, query);
  }

  @Get('stats')
  @RequirePermissions('payments:read')
  @ApiOperation({ summary: 'Get payment statistics' })
  getStats(@CurrentUser() user: any) {
    return this.paymentService.getStats(user.companyId);
  }

  @Get(':id')
  @RequirePermissions('payments:read')
  @ApiOperation({ summary: 'Get a payment by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.paymentService.findOne(id, user.companyId);
  }

  @Delete(':id')
  @RequirePermissions('payments:delete')
  @ApiOperation({ summary: 'Delete a payment and reverse applications' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.paymentService.remove(id, user.companyId, user.userId);
  }
}
