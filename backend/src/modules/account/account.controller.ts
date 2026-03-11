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
import { AccountService } from './account.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateAccountDto, UpdateAccountDto, AccountFilterDto } from './dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Accounts')
@ApiBearerAuth()
@Controller('accounts')
@UseGuards(JwtAuthGuard)
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new account' })
  async create(@Request() req: any, @Body() createDto: CreateAccountDto) {
    return this.accountService.create(req.user.companyId, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all accounts' })
  async findAll(@Request() req: any, @Query() filter: AccountFilterDto) {
    return this.accountService.findAll(req.user.companyId, filter);
  }

  @Get('chart')
  @ApiOperation({ summary: 'Get chart of accounts' })
  async getChartOfAccounts(@Request() req: any) {
    return this.accountService.getChartOfAccounts(req.user.companyId);
  }

  @Get('trial-balance')
  @ApiOperation({ summary: 'Get trial balance' })
  async getTrialBalance(
    @Request() req: any,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.accountService.getTrialBalance(
      req.user.companyId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('general-ledger')
  @ApiOperation({ summary: 'Get general ledger' })
  async getGeneralLedger(
    @Request() req: any,
    @Query('accountId') accountId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.accountService.getGeneralLedger(
      req.user.companyId,
      accountId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get account by ID' })
  async findOne(@Request() req: any, @Param('id') id: string) {
    return this.accountService.findOne(req.user.companyId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update account' })
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateDto: UpdateAccountDto,
  ) {
    return this.accountService.update(req.user.companyId, id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete account (soft delete)' })
  async remove(@Request() req: any, @Param('id') id: string) {
    return this.accountService.remove(req.user.companyId, id);
  }
}
