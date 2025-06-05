# Production Deployment Guide

This guide provides step-by-step instructions for securely deploying the Prompty application to production.

## 🚀 Pre-Deployment Checklist

### 1. Environment Setup
- [ ] Production environment variables configured
- [ ] SSL certificates obtained and configured
- [ ] Domain name configured with proper DNS
- [ ] CDN configured (if applicable)
- [ ] Database backups configured
- [ ] Monitoring and logging setup

### 2. Security Configuration
- [ ] All security middleware enabled
- [ ] Rate limiting configured
- [ ] CORS origins restricted to production domains
- [ ] Security headers configured
- [ ] Content Security Policy implemented
- [ ] File upload restrictions in place
- [ ] Authentication flows tested

### 3. Performance Optimization
- [ ] Static assets optimized
- [ ] Database queries optimized
- [ ] Caching strategies implemented
- [ ] Image optimization enabled
- [ ] Bundle size analyzed and optimized

## 🔧 Environment Variables

### Required Production Variables
```bash
# Application
NODE_ENV=production
NEXT_PUBLIC_URL=https://your-production-domain.com

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Security
JWT_SECRET=your_32_character_secret_key
ENCRYPTION_KEY=your_32_character_encryption_key

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=900000

# File Upload
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp,image/gif
VIRUS_SCAN_ENABLED=true

# AI Services
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key

# Monitoring (Optional)
SENTRY_DSN=your_sentry_dsn
LOG_LEVEL=info
```

## 🏗️ Deployment Steps

### 1. Code Preparation
```bash
# Clone repository
git clone https://github.com/your-repo/prompty.git
cd prompty

# Install dependencies
npm ci --production

# Build application
npm run build

# Test build
npm run start
```

### 2. Database Setup
```bash
# Run Supabase migrations
npx supabase db push

# Enable Row Level Security
npx supabase db reset --linked

# Verify RLS policies
npx supabase db diff
```

### 3. Security Configuration
```bash
# Validate environment variables
node -e "
const { validateSecurityConfig } = require('./src/lib/security/config');
const errors = validateSecurityConfig();
if (errors.length > 0) {
  console.error('Security configuration errors:', errors);
  process.exit(1);
}
console.log('Security configuration valid');
"
```

### 4. SSL/TLS Setup
```bash
# Using Let's Encrypt (example)
certbot --nginx -d your-domain.com -d www.your-domain.com

# Verify SSL configuration
openssl s_client -connect your-domain.com:443 -servername your-domain.com
```

## 🔒 Security Hardening

### 1. Server Configuration
```nginx
# Nginx configuration example
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL Configuration
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 2. Firewall Configuration
```bash
# UFW example
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### 3. Process Management
```bash
# PM2 configuration
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'prompty',
    script: 'npm',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 📊 Monitoring Setup

### 1. Application Monitoring
```javascript
// Add to your application
const monitoring = {
  // Error tracking
  errorRate: 0,
  responseTime: 0,
  
  // Security metrics
  authFailures: 0,
  rateLimitHits: 0,
  suspiciousUploads: 0,
  
  // Performance metrics
  memoryUsage: process.memoryUsage(),
  cpuUsage: process.cpuUsage()
};
```

### 2. Log Management
```bash
# Logrotate configuration
cat > /etc/logrotate.d/prompty << EOF
/var/log/prompty/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload nginx
    endscript
}
EOF
```

### 3. Health Checks
```javascript
// Health check endpoint
app.get('/health', (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: 'connected', // Check database connection
    external_services: {
      stripe: 'connected',
      supabase: 'connected',
      gemini: 'connected'
    }
  };
  
  res.status(200).json(health);
});
```

## 🔄 Backup Strategy

### 1. Database Backups
```bash
# Automated Supabase backup
#!/bin/bash
BACKUP_DIR="/backups/supabase"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup
npx supabase db dump --file "$BACKUP_DIR/backup_$DATE.sql"

# Compress backup
gzip "$BACKUP_DIR/backup_$DATE.sql"

# Clean old backups (keep 30 days)
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete
```

### 2. File Backups
```bash
# Backup uploaded files
rsync -av --delete /path/to/uploads/ /backups/uploads/
```

### 3. Configuration Backups
```bash
# Backup configuration files
tar -czf /backups/config_$(date +%Y%m%d).tar.gz \
  /etc/nginx/ \
  /etc/ssl/ \
  ~/.pm2/ \
  /path/to/app/.env
```

## 🚨 Incident Response

### 1. Security Incident Response
```bash
# Immediate response script
#!/bin/bash
echo "Security incident detected at $(date)"

# Block suspicious IP
iptables -A INPUT -s $SUSPICIOUS_IP -j DROP

# Rotate secrets
# (Implement secret rotation logic)

# Notify team
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Security incident detected"}' \
  $SLACK_WEBHOOK_URL
```

### 2. Performance Issues
```bash
# Performance monitoring
#!/bin/bash
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.2f", $3/$2 * 100.0)}')

if (( $(echo "$CPU_USAGE > 80" | bc -l) )); then
  echo "High CPU usage: $CPU_USAGE%"
  # Scale up or restart services
fi

if (( $(echo "$MEMORY_USAGE > 80" | bc -l) )); then
  echo "High memory usage: $MEMORY_USAGE%"
  # Scale up or restart services
fi
```

## 📈 Performance Optimization

### 1. Caching Strategy
```javascript
// Redis caching example
const redis = require('redis');
const client = redis.createClient();

const cache = {
  get: async (key) => {
    return await client.get(key);
  },
  set: async (key, value, ttl = 3600) => {
    return await client.setex(key, ttl, JSON.stringify(value));
  },
  del: async (key) => {
    return await client.del(key);
  }
};
```

### 2. Database Optimization
```sql
-- Add indexes for performance
CREATE INDEX CONCURRENTLY idx_prompts_user_id ON prompts(user_id);
CREATE INDEX CONCURRENTLY idx_prompts_category ON prompts(category);
CREATE INDEX CONCURRENTLY idx_prompts_created_at ON prompts(created_at DESC);
CREATE INDEX CONCURRENTLY idx_comments_prompt_id ON comments(prompt_id);
CREATE INDEX CONCURRENTLY idx_purchases_user_id ON purchases(user_id);
```

### 3. CDN Configuration
```javascript
// Next.js configuration for CDN
module.exports = {
  assetPrefix: process.env.NODE_ENV === 'production' 
    ? 'https://cdn.your-domain.com' 
    : '',
  images: {
    domains: ['your-domain.com', 'cdn.your-domain.com'],
    loader: 'custom',
    loaderFile: './src/lib/image-loader.js'
  }
};
```

## ✅ Post-Deployment Verification

### 1. Functional Testing
- [ ] User registration and login
- [ ] File upload functionality
- [ ] Payment processing
- [ ] AI code generation
- [ ] Database operations
- [ ] Email notifications

### 2. Security Testing
- [ ] SSL/TLS configuration
- [ ] Security headers present
- [ ] Rate limiting working
- [ ] Authentication flows secure
- [ ] File upload restrictions enforced
- [ ] CORS policies correct

### 3. Performance Testing
- [ ] Page load times acceptable
- [ ] API response times within limits
- [ ] Database query performance
- [ ] Memory usage stable
- [ ] CPU usage reasonable

### 4. Monitoring Verification
- [ ] Error tracking working
- [ ] Performance metrics collected
- [ ] Security events logged
- [ ] Alerts configured
- [ ] Backup processes running

---

**Remember**: Security is an ongoing process. Regularly update dependencies, monitor for vulnerabilities, and review security configurations.