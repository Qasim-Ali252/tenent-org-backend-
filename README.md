# FoodOps Backend

Multi-tenant food operations management system backend built with Node.js, Express, MongoDB, and GraphQL.

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- MongoDB (local or Atlas)
- Redis (for caching and sessions)

### Installation

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

Server will run on `http://localhost:4000`

---

## 📚 Documentation

All project documentation is located in the `/docs` folder:

- **[Complete Documentation Index](docs/README.md)** - Full documentation catalog
- **[Authentication Plan](docs/USER_AUTHENTICATION_PLAN.md)** - Auth implementation guide
- **[Branches API](docs/TEST_BRANCHES_API.md)** - Branches API documentation
- **[Organization Settings API](docs/TEST_ORGANIZATION_SETTINGS.md)** - Settings API docs
- **[Postman Quick Start](docs/POSTMAN_QUICK_START.md)** - API testing guide
- **[Architecture Patterns](docs/COOPER_PATTERNS_ANALYSIS.md)** - Code patterns and best practices

---

## 🏗️ Project Structure

```
├── src/
│   ├── config/              # Configuration files
│   ├── constants/           # Application constants
│   ├── middleware/          # Express middleware
│   ├── modules/             # Feature modules
│   │   ├── auth/           # Authentication & users
│   │   ├── branches/       # Branch management
│   │   ├── settings/       # Organization settings
│   │   └── ...
│   ├── routes/             # API routes
│   ├── utils/              # Utility functions
│   └── server.js           # Application entry point
├── docs/                   # 📚 All documentation
├── scripts/                # Database scripts
└── package.json
```

---

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start with nodemon (auto-reload)

# Production
npm start                # Start production server

# Testing
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode

# Database
npm run migrate          # Run migrations
npm run seed             # Seed database
```

---

## 🌟 Features

### Implemented ✅
- **Organization Settings** - Multi-tenant organization configuration
- **Branches Management** - Branch CRUD with geolocation
- **Global Schema** - Audit trail and status management
- **Multi-tenant Support** - Tenant isolation and management

### In Progress 🚧
- **User Authentication** - JWT-based auth system
- **Role-Based Access Control** - Permissions management
- **Email Verification** - User email verification

### Planned 📋
- **Menu Management** - Products, categories, variants
- **Order Management** - Order processing and tracking
- **Payment Integration** - Payment gateway integration
- **Reporting & Analytics** - Business intelligence

---

## 🔐 Authentication

Authentication system is currently in development. See [Authentication Plan](docs/USER_AUTHENTICATION_PLAN.md) for details.

**Temporary Auth Bypass**: Some endpoints currently accept `userId` and `tenantId` in request body for testing. This will be removed once authentication is complete.

---

## 📡 API Endpoints

### Organization Settings
- `GET /api/v1/organization-settings` - Get settings
- `POST /api/v1/organization-settings` - Create settings
- `PUT /api/v1/organization-settings/:id` - Update settings
- `DELETE /api/v1/organization-settings/:id` - Delete settings

### Branches
- `GET /api/v1/branches` - Get all branches
- `GET /api/v1/branches/nearby` - Find nearby branches
- `POST /api/v1/branches` - Create branch
- `PUT /api/v1/branches/:id` - Update branch
- `DELETE /api/v1/branches/:id` - Delete branch

See [API Documentation](docs/) for complete endpoint details.

---

## 🧪 Testing

### Postman Collection
Import the Postman collection for easy API testing:
- File: `docs/Branches_API.postman_collection.json`
- Guide: [Postman Quick Start](docs/POSTMAN_QUICK_START.md)

### cURL Commands
See [cURL Commands Reference](docs/CURL_COMMANDS.md) for command-line testing.

---

## 🗄️ Database

### MongoDB Collections
- `users` - User accounts
- `tenants` - Organizations/tenants
- `branches` - Branch locations
- `organizationsettings` - Organization configuration
- `roles` - User roles
- `permissions` - Access permissions

### Indexes
All collections use compound indexes for optimal query performance. See model files for index definitions.

---

## 🔒 Security

- Password hashing with bcrypt
- JWT token authentication
- Rate limiting on sensitive endpoints
- Input validation with Joi
- MongoDB injection prevention
- XSS protection

---

## 🌍 Environment Variables

```env
# Server
PORT=4000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/foodops_dev

# Redis
REDIS_URL=redis://localhost:6379

# JWT (Coming soon)
JWT_SECRET=your-secret-key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Email (Coming soon)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password
```

---

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Update documentation in `/docs`
5. Submit a pull request

---

## 📝 Code Patterns

This project follows specific patterns for consistency:

- **GlobalSchema** - All models use globalSchema for audit trail
- **GlobalService** - Services extend GlobalService for common operations
- **Status Management** - Use APP_STATUS constants
- **Validation** - Joi schemas for all inputs
- **Error Handling** - Centralized error handling with apiError

See [Architecture Patterns](docs/COOPER_PATTERNS_ANALYSIS.md) for details.

---

## 📊 Project Status

- **Phase**: Active Development
- **Version**: 1.0.0-beta
- **Last Updated**: February 13, 2026

See [Current Status](docs/CURRENT_STATUS.md) for detailed progress.

---

## 📞 Support

- Documentation: `/docs` folder
- Issues: GitHub Issues
- Email: support@foodops.com

---

## 📄 License

MIT License - See LICENSE file for details

---

**Built with ❤️ by the FoodOps Team**
