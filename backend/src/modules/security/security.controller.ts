import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { AbilitiesGuard } from '../../shared/guards/abilities.guard';
import { CheckAbilities } from '../../shared/decorators/check-abilities.decorator';
import { SecurityService } from './security.service';

@Controller('security')
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  @Get('metrics')
  @UseGuards(JwtAuthGuard, AbilitiesGuard)
  @CheckAbilities({ action: 'read', subject: 'SecurityMetrics' })
  async getSecurityMetrics() {
    const metrics = await this.securityService.getSecurityMetrics();
    return {
      success: true,
      data: metrics,
    };
  }

  @Get('alerts')
  @UseGuards(JwtAuthGuard, AbilitiesGuard)
  @CheckAbilities({ action: 'read', subject: 'SecurityMetrics' })
  async getSecurityAlerts() {
    const alerts = await this.securityService.checkForSecurityAlerts();
    return {
      success: true,
      data: alerts,
    };
  }

  @Get('status')
  // Public endpoint - no auth required
  async getSystemStatus() {
    const status = await this.securityService.getSystemStatus();
    return {
      success: true,
      data: status,
    };
  }
}
