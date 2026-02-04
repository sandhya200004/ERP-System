import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import * as nodemailer from 'nodemailer';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(private prisma: PrismaService) {}

  async getSettings() {
    try {
      // Get settings from database or return defaults
      const settings = await this.prisma.$queryRaw`
        SELECT * FROM settings WHERE id = 1
      `.catch(() => null);

      if (!settings || (Array.isArray(settings) && settings.length === 0)) {
        return this.getDefaultSettings();
      }

      return Array.isArray(settings) ? settings[0] : settings;
    } catch (error) {
      this.logger.error('Error fetching settings:', error);
      return this.getDefaultSettings();
    }
  }

  private getDefaultSettings() {
    return {
      id: 1,
      appName: 'TriVerse ERP/CRM',
      language: 'en',
      country: 'India',
      dateFormat: 'DD/MM/YYYY',
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUsername: '',
      smtpPassword: '',
      fromEmail: 'noreply@triverse.com',
      fromName: 'TriVerse Solutions',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async updateSettings(settingsData: any) {
    try {
      // Try to check if settings table exists
      const tableExists = await this.prisma.$queryRaw`
        SELECT to_regclass('public.settings') IS NOT NULL as exists
      `.catch(() => [{ exists: false }]);

      const exists = Array.isArray(tableExists) ? tableExists[0]?.exists : false;

      if (!exists) {
        // Create settings table if it doesn't exist
        await this.createSettingsTable();
      }

      // Upsert settings
      const result = await this.prisma.$executeRaw`
        INSERT INTO settings (
          id, "appName", language, country, "dateFormat", timezone, currency,
          "smtpHost", "smtpPort", "smtpUsername", "smtpPassword", 
          "fromEmail", "fromName", "updatedAt"
        )
        VALUES (
          1, 
          ${settingsData.appName || 'TriVerse ERP/CRM'},
          ${settingsData.language || 'en'},
          ${settingsData.country || 'India'},
          ${settingsData.dateFormat || 'DD/MM/YYYY'},
          ${settingsData.timezone || 'Asia/Kolkata'},
          ${settingsData.currency || 'INR'},
          ${settingsData.smtpHost || ''},
          ${settingsData.smtpPort || 587},
          ${settingsData.smtpUsername || ''},
          ${settingsData.smtpPassword || ''},
          ${settingsData.fromEmail || ''},
          ${settingsData.fromName || ''},
          NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          "appName" = EXCLUDED."appName",
          language = EXCLUDED.language,
          country = EXCLUDED.country,
          "dateFormat" = EXCLUDED."dateFormat",
          timezone = EXCLUDED.timezone,
          currency = EXCLUDED.currency,
          "smtpHost" = EXCLUDED."smtpHost",
          "smtpPort" = EXCLUDED."smtpPort",
          "smtpUsername" = EXCLUDED."smtpUsername",
          "smtpPassword" = EXCLUDED."smtpPassword",
          "fromEmail" = EXCLUDED."fromEmail",
          "fromName" = EXCLUDED."fromName",
          "updatedAt" = NOW()
      `;

      return { success: true, message: 'Settings updated successfully' };
    } catch (error) {
      this.logger.error('Error updating settings:', error);
      throw error;
    }
  }

  private async createSettingsTable() {
    await this.prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        "appName" TEXT DEFAULT 'TriVerse ERP/CRM',
        language TEXT DEFAULT 'en',
        country TEXT DEFAULT 'India',
        "dateFormat" TEXT DEFAULT 'DD/MM/YYYY',
        timezone TEXT DEFAULT 'Asia/Kolkata',
        currency TEXT DEFAULT 'INR',
        "smtpHost" TEXT,
        "smtpPort" INTEGER DEFAULT 587,
        "smtpUsername" TEXT,
        "smtpPassword" TEXT,
        "fromEmail" TEXT,
        "fromName" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW(),
        CONSTRAINT settings_single_row CHECK (id = 1)
      )
    `;
  }

  async testEmail(toEmail: string, customSettings?: any) {
    try {
      // Get settings (either custom or from DB)
      const settings = customSettings || await this.getSettings();

      if (!settings.smtpHost || !settings.smtpUsername || !settings.smtpPassword) {
        return {
          success: false,
          message: 'SMTP settings are incomplete. Please configure SMTP host, username, and password.',
        };
      }

      // Create transporter
      const transporter = nodemailer.createTransport({
        host: settings.smtpHost,
        port: settings.smtpPort,
        secure: settings.smtpPort === 465,
        auth: {
          user: settings.smtpUsername,
          pass: settings.smtpPassword,
        },
      });

      // Verify connection
      await transporter.verify();

      // Send test email
      const info = await transporter.sendMail({
        from: `"${settings.fromName}" <${settings.fromEmail}>`,
        to: toEmail,
        subject: 'Test Email from TriVerse ERP',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #6366f1;">Email Configuration Test</h2>
            <p>This is a test email from your TriVerse ERP system.</p>
            <p>If you received this email, your SMTP configuration is working correctly!</p>
            <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #6b7280; font-size: 14px;">
              Sent from ${settings.fromName}<br>
              <a href="mailto:${settings.fromEmail}">${settings.fromEmail}</a>
            </p>
          </div>
        `,
      });

      this.logger.log(`Test email sent successfully: ${info.messageId}`);

      return {
        success: true,
        message: `Test email sent successfully to ${toEmail}`,
        messageId: info.messageId,
      };
    } catch (error) {
      this.logger.error('Error sending test email:', error);
      return {
        success: false,
        message: error.message || 'Failed to send test email',
        error: error.toString(),
      };
    }
  }
}
