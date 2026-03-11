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
import { GoodsReceiptService } from './goods-receipt.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateGoodsReceiptDto, UpdateGoodsReceiptDto, GRNFilterDto } from './dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Goods Receipts')
@ApiBearerAuth()
@Controller('goods-receipts')
@UseGuards(JwtAuthGuard)
export class GoodsReceiptController {
  constructor(private readonly grnService: GoodsReceiptService) {}

  @Post()
  @ApiOperation({ summary: 'Create goods receipt note (GRN)' })
  async create(@Request() req: any, @Body() createDto: CreateGoodsReceiptDto) {
    return this.grnService.create(req.user.companyId, req.user.id, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all goods receipts' })
  async findAll(@Request() req: any, @Query() filter: GRNFilterDto) {
    return this.grnService.findAll(req.user.companyId, filter);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get GRN statistics' })
  async getStatistics(@Request() req: any) {
    return this.grnService.getStatistics(req.user.companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get goods receipt by ID' })
  async findOne(@Request() req: any, @Param('id') id: string) {
    return this.grnService.findOne(req.user.companyId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update goods receipt' })
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateDto: UpdateGoodsReceiptDto,
  ) {
    return this.grnService.update(req.user.companyId, id, updateDto);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirm goods receipt and update stock' })
  async confirm(@Request() req: any, @Param('id') id: string) {
    return this.grnService.confirm(req.user.companyId, id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel goods receipt' })
  async cancel(@Request() req: any, @Param('id') id: string) {
    return this.grnService.cancel(req.user.companyId, id);
  }
}
