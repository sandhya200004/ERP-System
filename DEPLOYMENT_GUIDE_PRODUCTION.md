# TRIVERSE ERP - PRODUCTION DEPLOYMENT GUIDE

## 🚀 DigitalOcean Deployment (Ubuntu Server)

This guide will help you deploy TriVerse ERP as a multi-tenant SaaS on DigitalOcean.

---

## PREREQUISITES

- DigitalOcean Droplet (Ubuntu 22.04 LTS)
- Domain name (e.g., myerp.com)
- SSH access to server
- PostgreSQL database

---

## STEP 1: SERVER SETUP

```bash
# SSH into your server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PostgreSQL
apt install -y postgresql postgresql-contrib

# Install Nginx
apt install -y nginx

# Install PM2 globally
npm install -g pm2

# Install build tools
apt install -y build-essential git
```

---

## STEP 2: POSTGRESQL DATABASE SETUP

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE triverse_erp_prod;
CREATE USER erp_user WITH ENCRYPTED PASSWORD 'your-strong-password';
GRANT ALL PRIVILEGES ON DATABASE triverse_erp_prod TO erp_user;
GRANT ALL ON SCHEMA public TO erp_user;
\q

# Edit PostgreSQL config to allow connections
nano /etc/postgresql/14/main/postgresql.conf
# Set: listen_addresses = 'localhost'

# Restart PostgreSQL
systemctl restart postgresql
```

---

## STEP 3: DEPLOY BACKEND

```bash
# Create application directory
mkdir -p /var/www/triverse-erp
cd /var/www/triverse-erp

# Clone your repository
git clone https://github.com/yourusername/triverse-erp.git .

# Navigate to backend
cd backend

# Install dependencies
npm install --production

# Create .env file
cat > .env << EOF
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://erp_user:your-strong-password@localhost:5432/triverse_erp_prod

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_EXPIRES_IN=12h
REFRESH_TOKEN_SECRET=your-refresh-token-secret-change-this
REFRESH_TOKEN_EXPIRES_IN=7d

# Application
BASE_URL=https://myerp.com
BASE_DOMAIN=myerp.com
FRONTEND_URL=https://myerp.com

# Email (Optional - Configure SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-email-password
SMTP_FROM=noreply@myerp.com

# Encryption
ENCRYPTION_KEY=your-32-character-encryption-key
EOF

# Run Prisma migrations
npx prisma generate
npx prisma migrate deploy

# Build NestJS application
npm run build

# Start with PM2
pm2 start ecosystem.config.json
pm2 save
pm2 startup
```

---

## STEP 4: NGINX CONFIGURATION (Multi-Tenant Subdomains)

```bash
# Create Nginx configuration
nano /etc/nginx/sites-available/triverse-erp
```

Paste this configuration:

```nginx
# Wildcard for all subdomains (*.myerp.com)
server {
    listen 80;
    server_name *.myerp.com myerp.com;

    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name *.myerp.com myerp.com;

    # SSL Configuration (Update with your certificate paths)
    ssl_certificate /etc/letsencrypt/live/myerp.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/myerp.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Client max body size
    client_max_body_size 50M;

    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Frontend (React app)
    location / {
        root /var/www/triverse-erp/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Health check endpoint (for monitoring)
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
```

Enable the site:

```bash
# Enable site
ln -s /etc/nginx/sites-available/triverse-erp /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Restart Nginx
systemctl restart nginx
```

---

## STEP 5: SSL CERTIFICATE (Let's Encrypt)

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get wildcard SSL certificate
certbot certonly --manual --preferred-challenges dns \
  -d myerp.com -d *.myerp.com

# Follow the prompts to add DNS TXT records for verification

# Auto-renewal (already set up by certbot)
certbot renew --dry-run
```

---

## STEP 6: DNS CONFIGURATION

Add these DNS records in your domain registrar (e.g., Namecheap, GoDaddy):

```
A Record:
  Name: @
  Value: your-server-ip
  TTL: 300

A Record:
  Name: *
  Value: your-server-ip
  TTL: 300

A Record:
  Name: admin
  Value: your-server-ip
  TTL: 300
```

---

## STEP 7: DEPLOY FRONTEND

```bash
cd /var/www/triverse-erp/frontend

# Install dependencies
npm install

# Create production .env
cat > .env.production << EOF
VITE_API_BASE_URL=https://myerp.com/api/v1
EOF

# Build React app
npm run build

# Frontend files will be in dist/ folder (served by Nginx)
```

---

## STEP 8: FIREWALL SETUP

```bash
# Enable UFW firewall
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable

# Check status
ufw status
```

---

## STEP 9: CREATE FIRST PLATFORM ADMIN

```bash
# Use curl to create first platform admin
curl -X POST https://admin.myerp.com/api/v1/platform-admin/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@myerp.com",
    "password": "SecurePassword123!",
    "first_name": "Platform",
    "last_name": "Admin",
    "phone": "+1234567890"
  }'
```

---

## STEP 10: CREATE FIRST COMPANY

Login to platform admin dashboard at: https://admin.myerp.com

Use the API or dashboard to create your first company:

```bash
# Login as platform admin (get access token)
curl -X POST https://admin.myerp.com/api/v1/platform-admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@myerp.com",
    "password": "SecurePassword123!"
  }'

# Create company (use token from login)
curl -X POST https://admin.myerp.com/api/v1/platform-admin/companies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "ABC Company",
    "subdomain": "abc",
    "admin_email": "admin@abc.com",
    "admin_password": "Password123!",
    "admin_first_name": "John",
    "admin_last_name": "Doe",
    "admin_phone": "+1234567890",
    "subscription_plan": "professional",
    "max_users": 20,
    "max_branches": 3,
    "currency_code": "USD"
  }'
```

Company will be accessible at: https://abc.myerp.com

---

## PM2 MANAGEMENT

```bash
# View logs
pm2 logs triverse-erp-backend

# Restart application
pm2 restart triverse-erp-backend

# Stop application
pm2 stop triverse-erp-backend

# Monitor
pm2 monit

# List processes
pm2 list

# Delete process
pm2 delete triverse-erp-backend
```

---

## MONITORING & MAINTENANCE

```bash
# Check Nginx status
systemctl status nginx

# Check PostgreSQL status
systemctl status postgresql

# View Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# View application logs
pm2 logs triverse-erp-backend --lines 100

# Database backup
pg_dump -U erp_user triverse_erp_prod > backup_$(date +%Y%m%d).sql

# Restart all services
pm2 restart all
systemctl restart nginx
```

---

## SECURITY CHECKLIST

- [x] Firewall enabled (UFW)
- [x] SSL/HTTPS enabled
- [x] Strong database password
- [x] Strong JWT secrets
- [x] Security headers configured
- [x] Rate limiting enabled
- [x] Helmet middleware
- [x] CORS configured
- [x] Regular backups enabled
- [x] Monitoring setup

---

## TROUBLESHOOTING

### Cannot connect to database
```bash
# Check PostgreSQL is running
systemctl status postgresql

# Test connection
psql -U erp_user -d triverse_erp_prod -h localhost
```

### Subdomain not working
- Check DNS propagation: `nslookup abc.myerp.com`
- Check Nginx configuration: `nginx -t`
- Check logs: `tail -f /var/log/nginx/error.log`

### Application crashes
```bash
# Check PM2 logs
pm2 logs

# Restart application
pm2 restart triverse-erp-backend

# Check memory usage
pm2 monit
```

---

## SCALING TIPS

1. **Database**: Use managed PostgreSQL (DigitalOcean Managed Database)
2. **File Storage**: Use S3-compatible object storage
3. **Load Balancer**: Add DigitalOcean Load Balancer for multiple droplets
4. **Redis**: Add Redis for session management and caching
5. **CDN**: Use Cloudflare for static assets

---

## PRODUCTION CHECKLIST

Before going live:

- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] SSL certificate installed
- [ ] DNS records configured
- [ ] PM2 running and auto-restart enabled
- [ ] Nginx configured for subdomains
- [ ] Firewall enabled
- [ ] First platform admin created
- [ ] Test company created and verified
- [ ] Backups configured
- [ ] Monitoring setup
- [ ] Email SMTP configured

---

## SUPPORT

For issues or questions, contact your development team.

**Access URLs:**
- Platform Admin Dashboard: https://admin.myerp.com
- Company ERP (example): https://abc.myerp.com
- API Documentation: https://myerp.com/api/docs
