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
import { JournalService } from './journal.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateJournalEntryDto,
  JournalFilterDto,
  FinancialReportDto,
} from './dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Journal & Ledger')
@ApiBearerAuth()
@Controller('api/v1/journal')
@UseGuards(JwtAuthGuard)
export class JournalController {
  constructor(private readonly journalService: JournalService) {}

  @Post()
  @ApiOperation({ summary: 'Create journal entry' })
  async create(@Request() req: any, @Body() createDto: CreateJournalEntryDto) {
    return this.journalService.create(req.user.companyId, req.user.id, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all journal entries' })
  async findAll(@Request() req: any, @Query() filter: JournalFilterDto) {
    return this.journalService.findAll(req.user.companyId, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get journal entry by ID' })
  async findOne(@Request() req: any, @Param('id') id: string) {
    return this.journalService.findOne(req.user.companyId, id);
  }

  @Post(':id/post')
  @ApiOperation({ summary: 'Post journal entry' })
  async post(@Request() req: any, @Param('id') id: string) {
    return this.journalService.post(req.user.companyId, id, req.user.id);
  }

  @Post(':id/void')
  @ApiOperation({ summary: 'Void journal entry' })
  async void(@Request() req: any, @Param('id') id: string) {
    return this.journalService.void(req.user.companyId, id);
  }

  @Get('reports/income-statement')
  @ApiOperation({ summary: 'Get income statement (P&L)' })
  async getIncomeStatement(@Request() req: any, @Query() params: FinancialReportDto) {
    return this.journalService.getIncomeStatement(
      req.user.companyId,
      new Date(params.startDate),
      new Date(params.endDate),
    );
  }

  @Get('reports/balance-sheet')
  @ApiOperation({ summary: 'Get balance sheet' })
  async getBalanceSheet(@Request() req: any, @Query() params: FinancialReportDto) {
    return this.journalService.getBalanceSheet(
      req.user.companyId,
      new Date(params.endDate),
    );
  }

  @Get('reports/cash-flow')
  @ApiOperation({ summary: 'Get cash flow statement' })
  async getCashFlow(@Request() req: any, @Query() params: FinancialReportDto) {
    return this.journalService.getCashFlow(
      req.user.companyId,
      new Date(params.startDate),
      new Date(params.endDate),
    );
  }
}
