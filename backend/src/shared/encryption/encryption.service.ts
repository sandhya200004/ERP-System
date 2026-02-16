import { Injectable } from '@nestjs/common';
import * as CryptoJS from 'crypto-js';

/**
 * Encryption Service for Sensitive Data
 * Encrypts/Decrypts sensitive fields like Salary, SSN, Bank Details
 * Uses AES-256 encryption
 */
@Injectable()
export class EncryptionService {
  private readonly encryptionKey: string;

  constructor() {
    // Use a strong encryption key from environment
    this.encryptionKey = process.env.ENCRYPTION_KEY || this.generateDefaultKey();
    
    if (!process.env.ENCRYPTION_KEY) {
      console.warn(
        '⚠️  WARNING: ENCRYPTION_KEY not set in .env. Using default key. ' +
        'Generate a secure key with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
      );
    }
  }

  /**
   * Encrypt sensitive data (Salary, SSN, Bank Account)
   */
  encrypt(plainText: string): string {
    if (!plainText) return plainText;
    
    try {
      const encrypted = CryptoJS.AES.encrypt(plainText, this.encryptionKey).toString();
      return encrypted;
    } catch (error) {
      console.error('Encryption failed:', error.message);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedText: string): string {
    if (!encryptedText) return encryptedText;
    
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedText, this.encryptionKey);
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption failed:', error.message);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Hash sensitive data (one-way, for comparison)
   * Use for SSN/Aadhaar if you only need to compare, not retrieve
   */
  hash(data: string): string {
    return CryptoJS.SHA256(data + this.encryptionKey).toString();
  }

  /**
   * Generate a secure encryption key (for first-time setup)
   */
  private generateDefaultKey(): string {
    // This is only used if ENCRYPTION_KEY is not set
    // In production, ALWAYS set a custom key in .env
    return 'default-insecure-key-please-change-this-in-production-environment';
  }
}
