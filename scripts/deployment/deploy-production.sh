#!/bin/bash

# ============================================
# TriVerse ERP - Production Deployment Script
# Optimized for 2GB Cloud Server
# ============================================

set -e  # Exit on error

echo "🚀 Starting TriVerse ERP Production Deployment..."
echo "=================================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Please run as root (use sudo)${NC}"
    exit 1
fi

# Step 1: Check system resources
echo -e "\n${YELLOW}📊 Checking system resources...${NC}"
TOTAL_RAM=$(free -m | awk '/^Mem:/{print $2}')
if [ "$TOTAL_RAM" -lt 1800 ]; then
    echo -e "${RED}⚠️  Warning: System has less than 2GB RAM ($TOTAL_RAM MB)${NC}"
    echo "This may cause performance issues with 50+ users"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi
echo -e "${GREEN}✅ RAM: $TOTAL_RAM MB${NC}"

# Step 2: Install dependencies
echo -e "\n${YELLOW}📦 Installing system dependencies...${NC}"
apt-get update -qq
apt-get install -y -qq \
    nodejs \
    npm \
    postgresql-14 \
    nginx \
    certbot \
    python3-certbot-nginx \
    git \
    curl

# Install PM2 globally
npm install -g pm2

echo -e "${GREEN}✅ Dependencies installed${NC}"

# Step 3: Setup PostgreSQL
echo -e "\n${YELLOW}🗄️  Configuring PostgreSQL...${NC}"
sudo -u postgres psql -c "CREATE DATABASE triverse_erp;" 2>/dev/null || echo "Database already exists"
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'YOUR_SECURE_PASSWORD';" 2>/dev/null

# Optimize PostgreSQL for 512MB allocation
cat > /etc/postgresql/14/main/conf.d/performance.conf <<EOF
# Performance tuning for 2GB server
shared_buffers = 256MB
effective_cache_size = 512MB
maintenance_work_mem = 64MB
max_connections = 100
work_mem = 5MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
EOF

systemctl restart postgresql
echo -e "${GREEN}✅ PostgreSQL configured${NC}"

# Step 4: Backend setup
echo -e "\n${YELLOW}⚙️  Setting up backend...${NC}"
cd backend

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env from .env.production${NC}"
    cp ../.env.production .env
    echo -e "${RED}⚠️  IMPORTANT: Edit backend/.env and update all placeholders${NC}"
    read -p "Press Enter to continue after editing .env..." 
fi

# Install dependencies
npm install --production

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Build backend
npm run build

echo -e "${GREEN}✅ Backend ready${NC}"

# Step 5: Frontend setup
echo -e "\n${YELLOW}🎨 Building frontend...${NC}"
cd ../frontend

# Install dependencies
npm install

# Build for production
npm run build

# Copy to web root
rm -rf /var/www/triverse-erp
mkdir -p /var/www/triverse-erp
cp -r dist/* /var/www/triverse-erp/
chown -R www-data:www-data /var/www/triverse-erp

echo -e "${GREEN}✅ Frontend built and deployed${NC}"

# Step 6: Configure Nginx
echo -e "\n${YELLOW}🌐 Configuring Nginx...${NC}"

# Get domain name
read -p "Enter your domain name (e.g., example.com): " DOMAIN

if [ -z "$DOMAIN" ]; then
    echo -e "${RED}❌ Domain name is required${NC}"
    exit 1
fi

cat > /etc/nginx/sites-available/triverse-erp <<EOF
# Rate limiting zones
limit_req_zone \$binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone \$binary_remote_addr zone=auth_limit:10m rate=1r/s;

# Upstream backend
upstream backend {
    server localhost:3000;
    keepalive 32;
}

server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Let's Encrypt challenge
    location ~ /.well-known/acme-challenge {
        allow all;
        root /var/www/html;
    }
    
    # Frontend
    location / {
        root /var/www/triverse-erp;
        try_files \$uri \$uri/ /index.html;
    }
    
    # API Proxy
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/triverse-erp /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx config
nginx -t

# Restart nginx
systemctl restart nginx

echo -e "${GREEN}✅ Nginx configured${NC}"

# Step 7: Setup SSL (Let's Encrypt)
echo -e "\n${YELLOW}🔒 Setting up SSL certificate...${NC}"
read -p "Setup SSL with Let's Encrypt? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter your email for SSL certificate: " EMAIL
    certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m $EMAIL
    echo -e "${GREEN}✅ SSL certificate installed${NC}"
fi

# Step 8: Start backend with PM2
echo -e "\n${YELLOW}🚀 Starting backend with PM2...${NC}"
cd ..

# Start backend
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup systemd -u root --hp /root

echo -e "${GREEN}✅ Backend started with PM2${NC}"

# Step 9: Setup firewall
echo -e "\n${YELLOW}🔥 Configuring firewall...${NC}"
ufw --force enable
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw reload

echo -e "${GREEN}✅ Firewall configured${NC}"

# Step 10: Create monitoring script
cat > /usr/local/bin/triverse-monitor.sh <<'EOF'
#!/bin/bash
echo "=== TriVerse ERP System Status ==="
echo ""
echo "Memory Usage:"
free -h
echo ""
echo "Backend Status:"
pm2 status
echo ""
echo "Database Connections:"
sudo -u postgres psql -d triverse_erp -c "SELECT count(*) as connections FROM pg_stat_activity;" -t
echo ""
echo "Nginx Status:"
systemctl status nginx --no-pager | grep Active
echo ""
echo "Recent Backend Logs:"
pm2 logs triverse-erp-backend --lines 5 --nostream
EOF

chmod +x /usr/local/bin/triverse-monitor.sh

# Final summary
echo ""
echo "=================================================="
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo "=================================================="
echo ""
echo "🌐 Your application is now running at:"
echo "   Frontend: http://$DOMAIN"
echo "   Backend API: http://$DOMAIN/api/v1"
echo "   API Docs: http://$DOMAIN/api/docs"
echo ""
echo "📊 Monitoring:"
echo "   PM2 Dashboard: pm2 monit"
echo "   System Status: triverse-monitor.sh"
echo "   Backend Logs: pm2 logs triverse-erp-backend"
echo ""
echo "🔧 Management Commands:"
echo "   Restart backend: pm2 restart triverse-erp-backend"
echo "   Stop backend: pm2 stop triverse-erp-backend"
echo "   View status: pm2 status"
echo ""
echo -e "${YELLOW}⚠️  Next Steps:${NC}"
echo "1. Update backend/.env with your actual credentials"
echo "2. Create a platform admin account"
echo "3. Setup backup cron jobs"
echo "4. Configure monitoring (optional)"
echo ""
echo -e "${RED}⚠️  SECURITY REMINDERS:${NC}"
echo "• Change all default passwords"
echo "• Setup regular database backups"
echo "• Monitor logs for suspicious activity"
echo "• Keep system packages updated"
echo ""
