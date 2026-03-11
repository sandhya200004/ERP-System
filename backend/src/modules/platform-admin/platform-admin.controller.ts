import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlatformAdminGuard } from '../../shared/guards/platform-admin.guard';
import { PlatformAdminOnly } from '../../shared/decorators/platform-admin.decorator';
import { PlatformAdminService } from './platform-admin.service';
import {
  CreatePlatformAdminDto,
  LoginPlatformAdminDto,
  CreateCompanyDto,
  UpdateCompanyDto,
  SuspendCompanyDto,
} from './dto/platform-admin.dto';

@ApiTags('Platform Admin')
@Controller('platform-admin')
export class PlatformAdminController {
  constructor(private platformAdminService: PlatformAdminService) {}

  // ==================== Platform Admin Authentication ====================

  @Post('register')
  @ApiOperation({ summary: 'Register first platform admin' })
  @ApiResponse({ status: 201, description: 'Platform admin created successfully' })
  async registerPlatformAdmin(@Body() dto: CreatePlatformAdminDto) {
    return this.platformAdminService.registerPlatformAdmin(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Platform admin login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  async loginPlatformAdmin(@Body() dto: LoginPlatformAdminDto) {
    return this.platformAdminService.loginPlatformAdmin(dto);
  }

  // ==================== Company/Tenant Management ====================

  @Post('companies')
  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  @PlatformAdminOnly()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new company/tenant' })
  @ApiResponse({ status: 201, description: 'Company created successfully' })
  async createCompany(@Body() dto: CreateCompanyDto) {
    return this.platformAdminService.createCompany(dto);
  }

  @Get('companies/check-subdomain/:subdomain')
  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  @PlatformAdminOnly()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if subdomain is available' })
  @ApiResponse({ status: 200, description: 'Returns availability and validation info' })
  async checkSubdomain(@Param('subdomain') subdomain: string) {
    return this.platformAdminService.checkSubdomainAvailability(subdomain);
  }

  @Get('companies')
  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  @PlatformAdminOnly()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all companies' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  async getAllCompanies(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.platformAdminService.getAllCompanies(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      status,
    );
  }

  @Get('companies/:id')
  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  @PlatformAdminOnly()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get company details by ID' })
  async getCompanyById(@Param('id') id: string) {
    return this.platformAdminService.getCompanyById(id);
  }

  @Patch('companies/:id')
  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  @PlatformAdminOnly()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update company details' })
  async updateCompany(@Param('id') id: string, @Body() dto: UpdateCompanyDto) {
    return this.platformAdminService.updateCompany(id, dto);
  }

  @Post('companies/:id/suspend')
  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  @PlatformAdminOnly()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Suspend company' })
  async suspendCompany(@Param('id') id: string, @Body() dto: SuspendCompanyDto) {
    return this.platformAdminService.suspendCompany(id, dto);
  }

  @Post('companies/:id/reactivate')
  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  @PlatformAdminOnly()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reactivate suspended company' })
  async reactivateCompany(@Param('id') id: string) {
    return this.platformAdminService.reactivateCompany(id);
  }

  @Delete('companies/:id')
  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  @PlatformAdminOnly()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete company (soft delete)' })
  async deleteCompany(@Param('id') id: string) {
    return this.platformAdminService.deleteCompany(id);
  }

  // ==================== Platform Statistics ====================

  @Get('stats')
  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  @PlatformAdminOnly()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get platform statistics' })
  async getPlatformStats() {
    return this.platformAdminService.getPlatformStats();
  }
}
