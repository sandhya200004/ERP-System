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
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateStockMovementDto,
  StockAdjustmentDto,
  StockTransferDto,
  InventoryFilterDto,
} from './dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Inventory')
@ApiBearerAuth()
@Controller('api/v1/inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('stock-levels')
  @ApiOperation({ summary: 'Get all stock levels' })
  async getStockLevels(@Request() req: any, @Query() filter: InventoryFilterDto) {
    return this.inventoryService.getStockLevels(req.user.companyId, filter);
  }

  @Get('stock-levels/:itemId')
  @ApiOperation({ summary: 'Get stock level for specific item' })
  async getItemStockLevel(
    @Request() req: any,
    @Param('itemId') itemId: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.inventoryService.getItemStockLevel(
      req.user.companyId,
      itemId,
      warehouseId,
    );
  }

  @Get('movements')
  @ApiOperation({ summary: 'Get stock movements' })
  async getStockMovements(@Request() req: any, @Query() filter: InventoryFilterDto) {
    return this.inventoryService.getStockMovements(req.user.companyId, filter);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get low stock items' })
  async getLowStockItems(@Request() req: any) {
    return this.inventoryService.getLowStockItems(req.user.companyId);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get inventory statistics' })
  async getStatistics(@Request() req: any) {
    return this.inventoryService.getStatistics(req.user.companyId);
  }

  @Get('valuation')
  @ApiOperation({ summary: 'Get inventory valuation' })
  async getInventoryValuation(@Request() req: any) {
    return this.inventoryService.getInventoryValuation(req.user.companyId);
  }

  @Post('movements')
  @ApiOperation({ summary: 'Create stock movement' })
  async createMovement(
    @Request() req: any,
    @Body() createDto: CreateStockMovementDto,
  ) {
    return this.inventoryService.createMovement(
      req.user.companyId,
      req.user.id,
      createDto,
    );
  }

  @Post('stock-in')
  @ApiOperation({ summary: 'Stock IN operation' })
  async stockIn(@Request() req: any, @Body() createDto: CreateStockMovementDto) {
    return this.inventoryService.stockIn(
      req.user.companyId,
      req.user.id,
      createDto,
    );
  }

  @Post('stock-out')
  @ApiOperation({ summary: 'Stock OUT operation' })
  async stockOut(@Request() req: any, @Body() createDto: CreateStockMovementDto) {
    return this.inventoryService.stockOut(
      req.user.companyId,
      req.user.id,
      createDto,
    );
  }

  @Post('transfer')
  @ApiOperation({ summary: 'Transfer stock between warehouses' })
  async transfer(@Request() req: any, @Body() transferDto: StockTransferDto) {
    return this.inventoryService.transfer(
      req.user.companyId,
      req.user.id,
      transferDto,
    );
  }

  @Post('adjustment')
  @ApiOperation({ summary: 'Adjust stock levels' })
  async adjustment(@Request() req: any, @Body() adjustmentDto: StockAdjustmentDto) {
    return this.inventoryService.adjustment(
      req.user.companyId,
      req.user.id,
      adjustmentDto,
    );
  }

  @Put('reorder-point/:itemId/:warehouseId')
  @ApiOperation({ summary: 'Update reorder point' })
  async updateReorderPoint(
    @Request() req: any,
    @Param('itemId') itemId: string,
    @Param('warehouseId') warehouseId: string,
    @Body() body: { reorder_point: number; reorder_quantity: number },
  ) {
    return this.inventoryService.updateReorderPoint(
      req.user.companyId,
      itemId,
      warehouseId,
      body.reorder_point,
      body.reorder_quantity,
    );
  }
}
