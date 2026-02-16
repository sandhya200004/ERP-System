import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface Alert {
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp?: Date;
}

@Injectable()
export class AlertNotificationService {
  private readonly logger = new Logger(AlertNotificationService.name);
  private readonly slackWebhookUrl: string;
  private readonly alertEmail: string;
  private readonly enableSlack: boolean;
  private readonly enableEmail: boolean;

  constructor(private configService: ConfigService) {
    this.slackWebhookUrl = this.configService.get<string>('SLACK_WEBHOOK_URL') || '';
    this.alertEmail = this.configService.get<string>('ALERT_EMAIL') || 'security@triverse.com';
    this.enableSlack = this.configService.get<boolean>('ENABLE_SLACK_ALERTS') || false;
    this.enableEmail = this.configService.get<boolean>('ENABLE_EMAIL_ALERTS') || false;
  }

  /**
   * Send alert notification via configured channels
   */
  async sendAlert(alert: Alert): Promise<void> {
    const timestamp = alert.timestamp || new Date();
    
    // Log alert locally
    this.logger.warn(`Security Alert [${alert.severity.toUpperCase()}]: ${alert.message}`);

    // Send to Slack if configured
    if (this.enableSlack && this.slackWebhookUrl) {
      await this.sendSlackAlert(alert, timestamp);
    }

    // Send email if configured
    if (this.enableEmail) {
      await this.sendEmailAlert(alert, timestamp);
    }
  }

  /**
   * Send alert to Slack
   */
  private async sendSlackAlert(alert: Alert, timestamp: Date): Promise<void> {
    try {
      const color = this.getSeverityColor(alert.severity);
      const emoji = this.getSeverityEmoji(alert.severity);

      const payload = {
        text: `${emoji} Security Alert: ${alert.type}`,
        attachments: [
          {
            color: color,
            fields: [
              {
                title: 'Type',
                value: alert.type,
                short: true,
              },
              {
                title: 'Severity',
                value: alert.severity.toUpperCase(),
                short: true,
              },
              {
                title: 'Message',
                value: alert.message,
                short: false,
              },
              {
                title: 'Timestamp',
                value: timestamp.toISOString(),
                short: true,
              },
            ],
            footer: 'TriVerse ERP Security Monitoring',
            footer_icon: 'https://triverse.com/favicon.ico',
            ts: Math.floor(timestamp.getTime() / 1000),
          },
        ],
      };

      await axios.post(this.slackWebhookUrl, payload);
      this.logger.log('Alert sent to Slack successfully');
    } catch (error) {
      this.logger.error('Failed to send Slack alert:', error.message);
    }
  }

  /**
   * Send alert via email (placeholder - integrate with your email service)
   */
  private async sendEmailAlert(alert: Alert, timestamp: Date): Promise<void> {
    try {
      // TODO: Integrate with SendGrid, AWS SES, or your email provider
      // For now, just log
      this.logger.log(`Email alert would be sent to ${this.alertEmail}`);
      this.logger.log(`Subject: [${alert.severity.toUpperCase()}] Security Alert: ${alert.type}`);
      this.logger.log(`Body: ${alert.message}`);
      this.logger.log(`Time: ${timestamp.toISOString()}`);

      // Example SendGrid integration:
      /*
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      
      const msg = {
        to: this.alertEmail,
        from: 'alerts@triverse.com',
        subject: `[${alert.severity.toUpperCase()}] Security Alert: ${alert.type}`,
        text: alert.message,
        html: `
          <h2>Security Alert</h2>
          <p><strong>Type:</strong> ${alert.type}</p>
          <p><strong>Severity:</strong> ${alert.severity.toUpperCase()}</p>
          <p><strong>Message:</strong> ${alert.message}</p>
          <p><strong>Time:</strong> ${timestamp.toISOString()}</p>
        `,
      };
      
      await sgMail.send(msg);
      */
    } catch (error) {
      this.logger.error('Failed to send email alert:', error.message);
    }
  }

  /**
   * Send multiple alerts in batch
   */
  async sendBatchAlerts(alerts: Alert[]): Promise<void> {
    if (alerts.length === 0) return;

    this.logger.log(`Sending ${alerts.length} security alerts`);
    
    // Send individual alerts
    for (const alert of alerts) {
      await this.sendAlert(alert);
    }
  }

  /**
   * Get color code for alert severity
   */
  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical':
        return '#d32f2f'; // Red
      case 'high':
        return '#f57c00'; // Orange
      case 'medium':
        return '#fbc02d'; // Yellow
      case 'low':
        return '#388e3c'; // Green
      default:
        return '#757575'; // Gray
    }
  }

  /**
   * Get emoji for alert severity
   */
  private getSeverityEmoji(severity: string): string {
    switch (severity) {
      case 'critical':
        return '🚨';
      case 'high':
        return '⚠️';
      case 'medium':
        return '⚡';
      case 'low':
        return 'ℹ️';
      default:
        return '📋';
    }
  }
}
