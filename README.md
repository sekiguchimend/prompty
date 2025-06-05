# Prompty - AI-Powered Prompt Sharing Platform

A secure, production-ready Next.js application for sharing and monetizing AI prompts with enterprise-grade security features.

## 🔒 Security Features

### ✅ Comprehensive Security Implementation
- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Input Validation**: Zod schema validation for all API endpoints
- **Rate Limiting**: Advanced rate limiting with IP-based tracking
- **File Upload Security**: Virus scanning, type validation, and secure storage
- **SQL Injection Prevention**: Parameterized queries and input sanitization
- **XSS Protection**: Content Security Policy and HTML sanitization
- **CSRF Protection**: Token-based CSRF protection
- **Security Headers**: Comprehensive security header implementation
- **Error Handling**: Safe error responses without information leakage
- **Audit Logging**: Security event logging and monitoring

### 🛡️ Production Security Standards
- **HTTPS Enforcement**: Automatic HTTP to HTTPS redirects
- **Content Security Policy**: Strict CSP to prevent injection attacks
- **CORS Configuration**: Restricted origins for production
- **Environment Validation**: Required security variables checked at startup
- **Dependency Security**: Regular security audits and updates
- **Secret Management**: Proper environment variable handling

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Stripe account (for payments)
- Google AI API key (for Gemini)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-repo/prompty.git
cd prompty
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment setup**
```bash
# Copy environment template
cp .env.example .env

# Configure your environment variables
# See PRODUCTION_DEPLOYMENT.md for complete list
```

4. **Database setup**
```bash
# Initialize Supabase
npx supabase init
npx supabase start
npx supabase db push
```

5. **Development server**
```bash
# Start development server
npm run dev

# Start with Gemini server
npm run dev:with-gemini
```

## 📁 Project Structure

```
prompty/
├── src/
│   ├── components/          # React components
│   ├── pages/              # Next.js pages and API routes
│   │   └── api/            # API endpoints
│   │       ├── auth/       # Authentication endpoints
│   │       ├── stripe/     # Payment processing
│   │       └── upload-image-secure.ts  # Secure file upload
│   ├── lib/                # Utility libraries
│   │   ├── security/       # Security modules
│   │   │   ├── auth-middleware.ts     # Authentication middleware
│   │   │   ├── rate-limiter.ts        # Rate limiting
│   │   │   ├── validation.ts          # Input validation
│   │   │   ├── error-handler.ts       # Error handling
│   │   │   └── config.ts              # Security configuration
│   │   └── supabase/       # Database clients
│   │       ├── client-secure.ts       # Secure client
│   │       └── admin-secure.ts        # Secure admin client
│   ├── styles/             # CSS styles
│   └── types/              # TypeScript types
├── supabase/               # Database migrations and functions
├── SECURITY.md             # Security documentation
├── PRODUCTION_DEPLOYMENT.md # Deployment guide
└── next.config.js          # Next.js configuration with security
```

## 🔧 Configuration

### Environment Variables

#### Required for Production
```bash
# Application
NODE_ENV=production
NEXT_PUBLIC_URL=https://your-domain.com

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Security
JWT_SECRET=your_32_character_secret
ENCRYPTION_KEY=your_32_character_key
```

#### Optional Security Configuration
```bash
# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=900000

# File Upload
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp,image/gif
VIRUS_SCAN_ENABLED=true

# Monitoring
LOG_LEVEL=info
SENTRY_DSN=your_sentry_dsn
```

### Security Configuration

The application includes comprehensive security configuration in `src/lib/security/config.ts`:

- **Rate Limiting**: Different limits for different endpoint types
- **File Upload Security**: Type validation, size limits, virus scanning
- **CORS**: Restricted origins for production
- **CSP**: Strict Content Security Policy
- **Headers**: Security headers for all responses

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev                 # Start development server
npm run dev:gemini         # Start Gemini AI server
npm run dev:with-gemini    # Start both servers

# Production
npm run build              # Build for production
npm run start              # Start production server
npm run start:with-gemini  # Start production with Gemini

# Utilities
npm run lint               # Run ESLint
npm run type-check         # Run TypeScript checks
```

### Security Development Guidelines

1. **Input Validation**: Always validate inputs using Zod schemas
2. **Authentication**: Use provided auth middleware for protected routes
3. **Rate Limiting**: Apply appropriate rate limits to new endpoints
4. **Error Handling**: Use safe error handlers that don't leak information
5. **File Uploads**: Use secure upload handlers with validation
6. **Database Access**: Use provided secure database clients

### Adding New API Endpoints

```typescript
// Example secure API endpoint
import { withAuth } from '../../lib/security/auth-middleware';
import { withRateLimit, generalRateLimit } from '../../lib/security/rate-limiter';
import { withErrorHandler } from '../../lib/security/error-handler';
import { validateRequest, yourSchema } from '../../lib/security/validation';

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  // Validate input
  const validatedData = validateRequest(yourSchema, req.body);
  
  // Your logic here
  
  res.status(200).json({ success: true });
};

export default withRateLimit(
  generalRateLimit,
  withAuth({ requireAuth: true }, withErrorHandler(handler))
);
```

## 🚀 Deployment

### Production Deployment

See [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) for comprehensive deployment instructions.

#### Quick Deploy Checklist
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Security headers enabled
- [ ] Rate limiting configured
- [ ] Database migrations applied
- [ ] Monitoring setup
- [ ] Backup procedures established

### Supported Platforms
- **Vercel**: Recommended for Next.js applications
- **Netlify**: Full-stack deployment support
- **AWS**: EC2, ECS, or Lambda deployment
- **Google Cloud**: App Engine or Compute Engine
- **DigitalOcean**: App Platform or Droplets

## 📊 Monitoring & Analytics

### Security Monitoring
- Authentication failures
- Rate limit violations
- Suspicious file uploads
- API error rates
- Database query performance

### Performance Monitoring
- Page load times
- API response times
- Memory usage
- CPU utilization
- Database performance

## 🔍 Security Auditing

### Regular Security Tasks
- **Weekly**: Review security logs and failed authentication attempts
- **Monthly**: Update dependencies and review access permissions
- **Quarterly**: Conduct security assessments and penetration testing

### Security Testing
```bash
# Run security audit
npm audit

# Check for vulnerabilities
npm audit fix

# Analyze bundle for security issues
npm run build && npm run analyze
```

## 🤝 Contributing

### Security Guidelines for Contributors
1. Follow secure coding practices
2. Validate all inputs
3. Use provided security middleware
4. Don't expose sensitive information in logs
5. Test security features thoroughly
6. Update security documentation

### Pull Request Requirements
- [ ] Security review completed
- [ ] Input validation implemented
- [ ] Error handling follows safe patterns
- [ ] Tests include security scenarios
- [ ] Documentation updated

## 📚 Documentation

- [Security Implementation](./SECURITY.md) - Comprehensive security documentation
- [Production Deployment](./PRODUCTION_DEPLOYMENT.md) - Deployment guide
- [API Documentation](./docs/API.md) - API endpoint documentation
- [Database Schema](./docs/DATABASE.md) - Database structure and relationships

## 🆘 Support & Security

### Security Issues
For security vulnerabilities, please email: security@prompty-ai.com

**Do not** create public issues for security vulnerabilities.

### General Support
- Create an issue on GitHub
- Check existing documentation
- Review security guidelines

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js** - React framework
- **Supabase** - Backend as a Service
- **Stripe** - Payment processing
- **Zod** - Schema validation
- **Radix UI** - UI components
- **Tailwind CSS** - Styling framework

---

## 🔐 Security Notice

This application implements enterprise-grade security features including:
- Input validation and sanitization
- Authentication and authorization
- Rate limiting and DDoS protection
- Secure file upload handling
- SQL injection prevention
- XSS protection
- CSRF protection
- Security headers and CSP
- Audit logging and monitoring

For production deployment, ensure all security configurations are properly set up according to the deployment guide.