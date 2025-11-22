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
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto, UpdateInvoiceDto, QueryInvoiceDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../../shared/decorators/permissions.decorator';
import { CurrentUser } from '../../shared/decorators/user.decorator';

@ApiTags('Invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('invoices')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  @RequirePermissions('invoices:create')
  @ApiOperation({ summary: 'Create a new invoice' })
  create(@CurrentUser() user: any, @Body() createInvoiceDto: CreateInvoiceDto) {
    return this.invoiceService.create(user.companyId, user.userId, createInvoiceDto);
  }

  @Post('from-quote/:quoteId')
  @RequirePermissions('invoices:create')
  @ApiOperation({ summary: 'Create invoice from accepted quote' })
  createFromQuote(@Param('quoteId') quoteId: string, @CurrentUser() user: any) {
    return this.invoiceService.createFromQuote(quoteId, user.companyId, user.userId);
  }

  @Get()
  @RequirePermissions('invoices:read')
  @ApiOperation({ summary: 'Get all invoices with pagination and filters' })
  findAll(@CurrentUser() user: any, @Query() query: QueryInvoiceDto) {
    return this.invoiceService.findAll(user.companyId, query);
  }

  @Get('stats')
  @RequirePermissions('invoices:read')
  @ApiOperation({ summary: 'Get invoice statistics' })
  getStats(@CurrentUser() user: any) {
    return this.invoiceService.getStats(user.companyId);
  }

  @Get(':id')
  @RequirePermissions('invoices:read')
  @ApiOperation({ summary: 'Get an invoice by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.invoiceService.findOne(id, user.companyId);
  }

  @Patch(':id')
  @RequirePermissions('invoices:update')
  @ApiOperation({ summary: 'Update an invoice (draft only)' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
  ) {
    return this.invoiceService.update(
      id,
      user.companyId,
      user.userId,
      updateInvoiceDto,
    );
  }

  @Post(':id/finalize')
  @RequirePermissions('invoices:update')
  @ApiOperation({ summary: 'Finalize invoice (make immutable and post to GL)' })
  finalize(@Param('id') id: string, @CurrentUser() user: any) {
    return this.invoiceService.finalize(id, user.companyId, user.userId);
  }

  @Patch(':id/status/:status')
  @RequirePermissions('invoices:update')
  @ApiOperation({ summary: 'Update invoice status (sent/cancelled)' })
  updateStatus(
    @Param('id') id: string,
    @Param('status') status: 'sent' | 'cancelled',
    @CurrentUser() user: any,
  ) {
    return this.invoiceService.updateStatus(id, user.companyId, user.userId, status);
  }

  @Delete(':id')
  @RequirePermissions('invoices:delete')
  @ApiOperation({ summary: 'Delete an invoice (soft delete, draft only)' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.invoiceService.remove(id, user.companyId, user.userId);
  }
}
