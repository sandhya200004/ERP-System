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
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SupplierInvoiceService } from './supplier-invoice.service';
import {
  CreateSupplierInvoiceDto,
  UpdateSupplierInvoiceDto,
  InvoiceFilterDto,
  ApproveInvoiceDto,
  RejectInvoiceDto,
  RecordPaymentDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

@ApiTags('Supplier Invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('supplier-invoices')
export class SupplierInvoiceController {
  constructor(private readonly supplierInvoiceService: SupplierInvoiceService) {}

  @Post()
  @ApiOperation({ summary: 'Create supplier invoice' })
  @ApiResponse({ status: 201, description: 'Invoice created successfully' })
  create(@Request() req: any, @Body() createDto: CreateSupplierInvoiceDto) {
    return this.supplierInvoiceService.create(
      req.user.companyId,
      req.user.sub,
      createDto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all supplier invoices' })
  @ApiResponse({ status: 200, description: 'List of supplier invoices' })
  findAll(@Request() req: any, @Query() filter: InvoiceFilterDto) {
    return this.supplierInvoiceService.findAll(req.user.companyId, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get supplier invoice by ID' })
  @ApiResponse({ status: 200, description: 'Invoice details' })
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.supplierInvoiceService.findOne(req.user.companyId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update supplier invoice' })
  @ApiResponse({ status: 200, description: 'Invoice updated successfully' })
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateDto: UpdateSupplierInvoiceDto,
  ) {
    return this.supplierInvoiceService.update(
      req.user.companyId,
      id,
      updateDto,
    );
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve supplier invoice' })
  @ApiResponse({ status: 200, description: 'Invoice approved successfully' })
  @HttpCode(HttpStatus.OK)
  approve(
    @Request() req: any,
    @Param('id') id: string,
    @Body() _approveDto: ApproveInvoiceDto,
  ) {
    return this.supplierInvoiceService.approve(
      req.user.companyId,
      id,
      req.user.sub,
    );
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject supplier invoice' })
  @ApiResponse({ status: 200, description: 'Invoice rejected successfully' })
  @HttpCode(HttpStatus.OK)
  reject(
    @Request() req: any,
    @Param('id') id: string,
    @Body() rejectDto: RejectInvoiceDto,
  ) {
    return this.supplierInvoiceService.reject(
      req.user.companyId,
      id,
      rejectDto.notes,
    );
  }

  @Post(':id/payments')
  @ApiOperation({ summary: 'Record payment for supplier invoice' })
  @ApiResponse({ status: 201, description: 'Payment recorded successfully' })
  recordPayment(
    @Request() req: any,
    @Param('id') id: string,
    @Body() paymentDto: RecordPaymentDto,
  ) {
    return this.supplierInvoiceService.recordPayment(
      req.user.companyId,
      id,
      req.user.sub,
      paymentDto,
    );
  }

  @Post(':id/match')
  @ApiOperation({ summary: 'Perform 3-way matching for invoice' })
  @ApiResponse({ status: 200, description: 'Matching completed' })
  @HttpCode(HttpStatus.OK)
  performMatching(@Request() req: any, @Param('id') id: string) {
    return this.supplierInvoiceService.performMatching(
      req.user.companyId,
      id,
      req.user.sub,
    );
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel supplier invoice' })
  @ApiResponse({ status: 200, description: 'Invoice cancelled successfully' })
  @HttpCode(HttpStatus.OK)
  cancel(@Request() req: any, @Param('id') id: string) {
    return this.supplierInvoiceService.cancel(req.user.companyId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete supplier invoice (soft delete)' })
  @ApiResponse({ status: 200, description: 'Invoice deleted successfully' })
  remove(@Request() req: any, @Param('id') id: string) {
    return this.supplierInvoiceService.delete(req.user.companyId, id);
  }

  @Get('vendor/:vendorId/statistics')
  @ApiOperation({ summary: 'Get vendor invoice statistics' })
  @ApiResponse({ status: 200, description: 'Vendor statistics' })
  getVendorStatistics(@Request() req: any, @Param('vendorId') vendorId: string) {
    return this.supplierInvoiceService.getVendorStatistics(
      req.user.companyId,
      vendorId,
    );
  }
}
