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
import { QuoteService } from './quote.service';
import { CreateQuoteDto, UpdateQuoteDto, QueryQuoteDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../../shared/decorators/permissions.decorator';
import { CurrentUser } from '../../shared/decorators/user.decorator';

@ApiTags('Quotes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('quotes')
export class QuoteController {
  constructor(private readonly quoteService: QuoteService) {}

  @Post()
  @RequirePermissions('quotes:create')
  @ApiOperation({ summary: 'Create a new quote' })
  create(@CurrentUser() user: any, @Body() createQuoteDto: CreateQuoteDto) {
    return this.quoteService.create(user.companyId, user.userId, createQuoteDto);
  }

  @Get()
  @RequirePermissions('quotes:read')
  @ApiOperation({ summary: 'Get all quotes with pagination and filters' })
  findAll(@CurrentUser() user: any, @Query() query: QueryQuoteDto) {
    return this.quoteService.findAll(user.companyId, query);
  }

  @Get(':id')
  @RequirePermissions('quotes:read')
  @ApiOperation({ summary: 'Get a quote by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.quoteService.findOne(id, user.companyId);
  }

  @Patch(':id')
  @RequirePermissions('quotes:update')
  @ApiOperation({ summary: 'Update a quote (draft only)' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateQuoteDto: UpdateQuoteDto,
  ) {
    return this.quoteService.update(
      id,
      user.companyId,
      user.userId,
      updateQuoteDto,
    );
  }

  @Patch(':id/status/:status')
  @RequirePermissions('quotes:update')
  @ApiOperation({ summary: 'Update quote status (sent/accepted/rejected/expired)' })
  updateStatus(
    @Param('id') id: string,
    @Param('status') status: 'sent' | 'accepted' | 'rejected' | 'expired',
    @CurrentUser() user: any,
  ) {
    return this.quoteService.updateStatus(id, user.companyId, user.userId, status);
  }

  @Delete(':id')
  @RequirePermissions('quotes:delete')
  @ApiOperation({ summary: 'Delete a quote (soft delete, draft only)' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.quoteService.remove(id, user.companyId, user.userId);
  }
}
