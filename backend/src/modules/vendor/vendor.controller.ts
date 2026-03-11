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
import { VendorService } from './vendor.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateVendorDto, UpdateVendorDto, VendorFilterDto } from './dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Vendors')
@ApiBearerAuth()
@Controller('vendors')
@UseGuards(JwtAuthGuard)
export class VendorController {
  constructor(private readonly vendorService: VendorService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new vendor' })
  async create(@Request() req: any, @Body() createDto: CreateVendorDto) {
    return this.vendorService.create(req.user.companyId, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all vendors' })
  async findAll(@Request() req: any, @Query() filter: VendorFilterDto) {
    return this.vendorService.findAll(req.user.companyId, filter);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get vendor statistics' })
  async getStatistics(@Request() req: any) {
    return this.vendorService.getStatistics(req.user.companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vendor by ID' })
  async findOne(@Request() req: any, @Param('id') id: string) {
    return this.vendorService.findOne(req.user.companyId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update vendor' })
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateDto: UpdateVendorDto,
  ) {
    return this.vendorService.update(req.user.companyId, id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete vendor (soft delete)' })
  async remove(@Request() req: any, @Param('id') id: string) {
    return this.vendorService.remove(req.user.companyId, id);
  }
}
