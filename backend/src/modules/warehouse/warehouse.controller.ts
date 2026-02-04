import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateWarehouseDto, UpdateWarehouseDto, WarehouseFilterDto } from './dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Warehouses')
@ApiBearerAuth()
@Controller('api/v1/warehouses')
@UseGuards(JwtAuthGuard)
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new warehouse' })
  async create(@Request() req: any, @Body() createDto: CreateWarehouseDto) {
    return this.warehouseService.create(req.user.companyId, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all warehouses' })
  async findAll(@Request() req: any, @Query() filter: WarehouseFilterDto) {
    return this.warehouseService.findAll(req.user.companyId, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get warehouse by ID' })
  async findOne(@Request() req: any, @Param('id') id: string) {
    return this.warehouseService.findOne(req.user.companyId, id);
  }

  @Get(':id/stock')
  @ApiOperation({ summary: 'Get stock levels for warehouse' })
  async getStockLevels(@Request() req: any, @Param('id') id: string) {
    return this.warehouseService.getStockLevels(req.user.companyId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update warehouse' })
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateDto: UpdateWarehouseDto,
  ) {
    return this.warehouseService.update(req.user.companyId, id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete warehouse (soft delete)' })
  async remove(@Request() req: any, @Param('id') id: string) {
    return this.warehouseService.remove(req.user.companyId, id);
  }
}
