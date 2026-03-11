import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PurchaseOrderService } from './purchase-order.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto, POFilterDto } from './dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Purchase Orders')
@ApiBearerAuth()
@Controller('purchase-orders')
@UseGuards(JwtAuthGuard)
export class PurchaseOrderController {
  constructor(private readonly poService: PurchaseOrderService) {}

  @Post()
  @ApiOperation({ summary: 'Create purchase order' })
  async create(@Request() req: any, @Body() createDto: CreatePurchaseOrderDto) {
    return this.poService.create(req.user.companyId, req.user.id, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all purchase orders' })
  async findAll(@Request() req: any, @Query() filter: POFilterDto) {
    return this.poService.findAll(req.user.companyId, filter);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get PO statistics' })
  async getStatistics(@Request() req: any) {
    return this.poService.getStatistics(req.user.companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get purchase order by ID' })
  async findOne(@Request() req: any, @Param('id') id: string) {
    return this.poService.findOne(req.user.companyId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update purchase order' })
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateDto: UpdatePurchaseOrderDto,
  ) {
    return this.poService.update(req.user.companyId, id, updateDto);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit PO for approval' })
  async submit(@Request() req: any, @Param('id') id: string) {
    return this.poService.submit(req.user.companyId, id);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve purchase order' })
  async approve(@Request() req: any, @Param('id') id: string) {
    return this.poService.approve(req.user.companyId, id, req.user.id);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject purchase order' })
  async reject(@Request() req: any, @Param('id') id: string) {
    return this.poService.reject(req.user.companyId, id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel purchase order' })
  async cancel(@Request() req: any, @Param('id') id: string) {
    return this.poService.cancel(req.user.companyId, id);
  }
}
