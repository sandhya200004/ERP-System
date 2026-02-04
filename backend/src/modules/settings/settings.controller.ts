import { Controller, Get, Post, Put, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Roles('ADMIN')
  async getSettings() {
    return this.settingsService.getSettings();
  }

  @Put()
  @Roles('ADMIN')
  async updateSettings(@Body() settingsData: any) {
    return this.settingsService.updateSettings(settingsData);
  }

  @Post('email/test')
  @Roles('ADMIN')
  async testEmail(@Body() emailData: { toEmail: string; settings?: any }) {
    return this.settingsService.testEmail(emailData.toEmail, emailData.settings);
  }
}
