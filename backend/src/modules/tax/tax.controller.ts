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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TaxService } from './tax.service';
import { CreateTaxDto, UpdateTaxDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../../shared/decorators/permissions.decorator';
import { CurrentUser } from '../../shared/decorators/user.decorator';

@ApiTags('Taxes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('taxes')
export class TaxController {
  constructor(private readonly taxService: TaxService) {}

  @Post()
  @RequirePermissions('taxes:create')
  @ApiOperation({ summary: 'Create a new tax' })
  create(@CurrentUser() user: any, @Body() createTaxDto: CreateTaxDto) {
    return this.taxService.create(user.companyId, user.userId, createTaxDto);
  }

  @Get()
  @RequirePermissions('taxes:read')
  @ApiOperation({ summary: 'Get all taxes' })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean })
  findAll(
    @CurrentUser() user: any,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.taxService.findAll(
      user.companyId,
      activeOnly === 'true',
    );
  }

  @Get(':id')
  @RequirePermissions('taxes:read')
  @ApiOperation({ summary: 'Get a tax by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.taxService.findOne(id, user.companyId);
  }

  @Patch(':id')
  @RequirePermissions('taxes:update')
  @ApiOperation({ summary: 'Update a tax' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateTaxDto: UpdateTaxDto,
  ) {
    return this.taxService.update(
      id,
      user.companyId,
      user.userId,
      updateTaxDto,
    );
  }

  @Delete(':id')
  @RequirePermissions('taxes:delete')
  @ApiOperation({ summary: 'Delete a tax (soft delete)' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.taxService.remove(id, user.companyId, user.userId);
  }
}
