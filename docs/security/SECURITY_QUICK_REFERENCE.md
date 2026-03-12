# 🔐 Security Quick Reference - TriVerse ERP

## 🚀 Quick Start for Developers

### 1. Protect a Route with Authentication & Authorization

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { AbilitiesGuard } from '@shared/guards/abilities.guard';
import { CheckAbilities } from '@shared/decorators/check-abilities.decorator';

@Controller('employees')
@UseGuards(JwtAuthGuard) // Step 1: Require login
export class EmployeeController {
  
  @Get('salaries')
  @UseGuards(AbilitiesGuard) // Step 2: Check permissions
  @CheckAbilities({ action: 'read', subject: 'Salary' })
  async getSalaries() {
    // Only HR, CEO, CTO can access
  }
}
```

---

### 2. Encrypt Sensitive Data

```typescript
import { EncryptionService } from '@shared/encryption/encryption.service';

@Injectable()
export class SalaryService {
  constructor(private encryption: EncryptionService) {}

  // SAVE: Encrypt before storing
  async create(data: CreateSalaryDto) {
    return this.prisma.salaries.create({
      data: {
        employee_id: data.employee_id,
        base_salary: this.encryption.encrypt(data.base_salary.toString()),
        ssn: this.encryption.encrypt(data.ssn),
      },
    });
  }

  // RETRIEVE: Decrypt when fetching
  async findOne(id: string) {
    const salary = await this.prisma.salaries.findUnique({ where: { id } });
    return {
      ...salary,
      base_salary: parseFloat(this.encryption.decrypt(salary.base_salary)),
      ssn: this.encryption.decrypt(salary.ssn),
    };
  }
}
```

---

### 3. Custom Rate Limiting

```typescript
import { Throttle } from '@nestjs/throttler';

// Default: 100 requests/minute
@Get('list')
async list() { }

// Custom: 2 requests/minute (expensive operation)
@Post('export')
@Throttle({ default: { limit: 2, ttl: 60000 } })
async export() { }

// Skip throttling for specific endpoint
@SkipThrottle()
@Get('public')
async public() { }
```

---

### 4. Role Permission Matrix

| Role | Tasks | Salaries | Invoices | Reports | Settings |
|------|-------|----------|----------|---------|----------|
| CEO | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| CTO | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| HR | ✅ Read | ✅ Full | ❌ None | ❌ None | ❌ None |
| MANAGER | ✅ Manage | ❌ None | ❌ None | ✅ Read | ❌ None |
| DEVELOPER | 👤 Own | ❌ None | ❌ None | ❌ None | ❌ None |
| EMPLOYEE | 👤 Own | ❌ None | ❌ None | ❌ None | ❌ None |

👤 Own = Can only access their own records

---

### 5. Environment Variables

```env
# .env file
DATABASE_URL="postgresql://..."
JWT_SECRET="generate-with-crypto-randombytes-32"
JWT_REFRESH_SECRET="generate-with-crypto-randombytes-32"
ENCRYPTION_KEY="generate-with-crypto-randombytes-32"
NODE_ENV="production"
```

**Generate secure keys:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### 6. Security Testing Commands

```bash
# Check vulnerabilities
npm audit

# Fix non-breaking issues
npm audit fix

# Test rate limiting (should fail on 6th attempt)
for i in {1..6}; do curl -X POST http://localhost:3000/api/v1/auth/login; done

# Check security headers
curl -I http://localhost:3000/api/v1/health

# Build with security features
npm run build
```

---

### 7. Audit Logs

**Automatic logging** for: POST, PUT, PATCH, DELETE

**View logs:**
```sql
SELECT * FROM audit_logs 
WHERE user_id = 'user-id' 
ORDER BY created_at DESC 
LIMIT 50;
```

**What's logged:**
- User ID & IP Address
- Action (CREATE, UPDATE, DELETE)
- Entity Type & Entity ID
- Old/New Values
- Timestamp & Duration

---

### 8. Common Security Mistakes to Avoid

❌ **DON'T:**
```typescript
// Logging sensitive data
console.log('User password:', password);

// Storing JWT in LocalStorage
localStorage.setItem('token', jwt);

// Exposing internal errors
throw new Error('Database: users table column password_hash...');

// Missing input validation
@Post()
createUser(@Body() data: any) { } // No DTO!
```

✅ **DO:**
```typescript
// Never log sensitive data
console.log('Login attempt for:', email);

// Use HttpOnly cookies for JWT
response.cookie('token', jwt, { httpOnly: true, secure: true });

// Use generic error messages
throw new ForbiddenException('Access denied');

// Always use DTOs with validation
@Post()
createUser(@Body() data: CreateUserDto) { }
```

---

### 9. Security Headers (Helmet)

**Automatically set:**
- `Content-Security-Policy` - Prevents XSS
- `Strict-Transport-Security` - Forces HTTPS
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing

---

### 10. Emergency Security Procedures

**If compromised:**
1. Revoke JWT secrets (rotate keys)
2. Force logout all sessions
3. Check audit logs for suspicious activity
4. Disable affected user accounts
5. Notify security team

**Contacts:**
- Security: security@triverse.com
- CTO: veeraj.matnale@triverse.com

---

## 📚 Full Documentation

- [`SECURITY_IMPLEMENTATION_GUIDE.md`](SECURITY_IMPLEMENTATION_GUIDE.md) - Complete guide
- [`SECURITY_IMPLEMENTATION_COMPLETE.md`](SECURITY_IMPLEMENTATION_COMPLETE.md) - Implementation summary

---

**Last Updated:** February 15, 2026  
**Security Level:** ⚡ Enterprise-Grade
