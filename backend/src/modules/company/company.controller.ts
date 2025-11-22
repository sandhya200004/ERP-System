import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CompanyService } from './company.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentCompany } from '../../shared/decorators/user.decorator';

@ApiTags('companies')
@Controller('companies')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current company details' })
  @ApiResponse({ status: 200, description: 'Company details retrieved' })
  async getCurrentCompany(
    @CurrentCompany() companyId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.companyService.findOne(companyId, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get company by ID' })
  @ApiResponse({ status: 200, description: 'Company found' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.companyService.findOne(id, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update company' })
  @ApiResponse({ status: 200, description: 'Company updated' })
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() data: any,
  ) {
    return this.companyService.update(id, userId, data);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get company statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  async getStats(@Param('id') id: string) {
    return this.companyService.getStats(id);
  }
}
