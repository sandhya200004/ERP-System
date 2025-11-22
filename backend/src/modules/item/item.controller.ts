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
import { ItemService } from './item.service';
import { CreateItemDto, UpdateItemDto, QueryItemDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../../shared/decorators/permissions.decorator';
import { CurrentUser } from '../../shared/decorators/user.decorator';

@ApiTags('Items')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('items')
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  @Post()
  @RequirePermissions('items:create')
  @ApiOperation({ summary: 'Create a new item/product' })
  create(@CurrentUser() user: any, @Body() createItemDto: CreateItemDto) {
    return this.itemService.create(user.companyId, user.userId, createItemDto);
  }

  @Get()
  @RequirePermissions('items:read')
  @ApiOperation({ summary: 'Get all items with pagination and search' })
  findAll(@CurrentUser() user: any, @Query() query: QueryItemDto) {
    return this.itemService.findAll(user.companyId, query);
  }

  @Get('stats')
  @RequirePermissions('items:read')
  @ApiOperation({ summary: 'Get item statistics' })
  getStats(@CurrentUser() user: any) {
    return this.itemService.getStats(user.companyId);
  }

  @Get(':id')
  @RequirePermissions('items:read')
  @ApiOperation({ summary: 'Get an item by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.itemService.findOne(id, user.companyId);
  }

  @Patch(':id')
  @RequirePermissions('items:update')
  @ApiOperation({ summary: 'Update an item' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateItemDto: UpdateItemDto,
  ) {
    return this.itemService.update(
      id,
      user.companyId,
      user.userId,
      updateItemDto,
    );
  }

  @Delete(':id')
  @RequirePermissions('items:delete')
  @ApiOperation({ summary: 'Delete an item (soft delete)' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.itemService.remove(id, user.companyId, user.userId);
  }
}
