Insider Threat Detection System - Backend
A comprehensive cybersecurity analytics backend system built with NestJS for processing, analyzing, and managing security alerts and incidents. The system provides automated CSV processing, MITRE ATT&CK framework integration, and advanced analytics capabilities.

🚀 Tech Stack
Core Framework & Runtime
Node.js - JavaScript runtime environment
NestJS - Progressive Node.js framework for building efficient server-side applications
TypeScript - Strongly typed programming language that builds on JavaScript
Database & ORM
PostgreSQL - Advanced open-source relational database
TypeORM - Object-Relational Mapping library for TypeScript and JavaScript
Reflect Metadata - Metadata reflection API for TypeScript decorators
Data Processing & Validation
CSV-Parse - CSV parsing library for Node.js
Class-validator - Decorator-based validation library
Class-transformer - Transformation library for plain objects to class instances
Documentation & API
Swagger/OpenAPI - API documentation and testing interface
@nestjs/swagger - NestJS Swagger module for automatic API documentation
Configuration & Environment
@nestjs/config - Configuration module for environment variables
dotenv - Environment variable loader (implicit dependency)
Security & Cryptography
Node.js Crypto - Built-in cryptographic functionality for ID generation
SHA-256 Hashing - For generating deterministic entity IDs
📋 Prerequisites
Before running this application, make sure you have the following installed:

Node.js (v16.0.0 or higher)
npm or yarn package manager
PostgreSQL (v12.0 or higher)
Git for version control
🛠️ Installation
Clone the repository
bash
git clone <repository-url>
cd insider-threat-backend
Install dependencies
bash
npm install
# or
yarn install
Set up environment variables Create a .env file in the root directory:
env
# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=insider_threat
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_password

# CSV Processing Paths
CSV_DROP_PATH=./storage/csv/drop
CSV_PROCESSED_PATH=./storage/csv/processed
CSV_ERROR_PATH=./storage/csv/error

# Monitoring Configuration
CSV_MONITOR_INTERVAL=5000

# Server Configuration
PORT=3000
NODE_ENV=development
Set up PostgreSQL Database
sql
CREATE DATABASE insider_threat;
CREATE USER postgres WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE insider_threat TO postgres;
Run database migrations
bash
npm run migration:run
# or
yarn migration:run
🚦 Running the Application
Development Mode
bash
npm run start:dev
# or
yarn start:dev
Production Mode
bash
npm run build
npm run start:prod
# or
yarn build
yarn start:prod
Debug Mode
bash
npm run start:debug
# or
yarn start:debug
The application will start on http://localhost:3000 by default.

📚 API Documentation
Once the application is running, you can access the interactive API documentation at:

Swagger UI: http://localhost:3000/api
OpenAPI JSON: http://localhost:3000/api-json
🏗️ Project Structure
src/
├── config/                 # Configuration files
│   ├── app.config.ts      # Application configuration
│   └── data-source.ts     # TypeORM data source configuration
├── entities/              # Database entities and related modules
│   ├── alert/            # Alert entity, service, controller, DTOs
│   │   ├── alert.controller.ts
│   │   ├── alert.service.ts
│   │   ├── alert.entity.ts
│   │   ├── alert.dto.ts
│   │   └── alert.module.ts
│   └── incident/         # Incident entity, service, controller, DTOs
│       ├── incident.controller.ts
│       ├── incident.service.ts
│       ├── incident.entity.ts
│       ├── incident.dto.ts
│       └── incident.module.ts
├── analytics/            # Analytics module for data insights
│   ├── analytics.controller.ts
│   ├── analytics.service.ts
│   └── analytics.module.ts
├── services/             # Business logic services
│   └── csv-monitor.service.ts
├── utils/                # Utility functions and helpers
│   └── csv-parser.util.ts
└── migrations/           # Database migration files
🔧 Core Features
1. Alert Management
CRUD Operations: Create, read, update, and delete security alerts
MITRE ATT&CK Integration: Supports MITRE tactics and techniques classification
Evidence Storage: JSONB storage for complex evidence data
User Association: Links alerts to specific users
Incident Correlation: Automatic association with related incidents
2. Incident Management
Time Window Tracking: Manages incident start and end times
Score-based Prioritization: Numerical scoring system for incident severity
Alert Aggregation: Groups related alerts under incidents
User Tracking: Associates incidents with specific users
3. CSV Processing System
Automated Monitoring: Watches for new CSV files in drop directories
Intelligent Parsing: Handles complex CSV formats with error recovery
File Management: Automatically moves processed files to appropriate directories
Duplicate Detection: Prevents duplicate entries during import
Error Handling: Moves problematic files to error directory for review
4. Analytics & Reporting
Time-based Analytics: Alerts and incidents grouped by day/week/month
MITRE Framework Analysis: Distribution analysis of tactics and techniques
Score Distribution: Statistical analysis of alert and incident scores
User Analytics: Per-user alert and incident statistics
Trend Analysis: Period-over-period comparison and change detection
Timeline Visualization: Combined view of alerts and incidents over time
5. Advanced Search & Filtering
Full-text Search: Search across multiple fields simultaneously
Date Range Filtering: Filter by specific time periods
Score Range Filtering: Filter by severity scores
User-specific Filtering: Filter by individual users
MITRE-based Filtering: Filter by specific tactics or techniques
Pagination Support: Efficient handling of large datasets
Flexible Sorting: Sort by multiple fields in ascending/descending order
📊 Database Schema
Alert Entity
Primary Key: SHA-256 hash of user + datestr + alert_name
Composite Index: (user, datestr, alert_name) - Unique
JSON Storage: Evidence field uses PostgreSQL JSONB
Incident Linking: Optional incidentID for correlation
Incident Entity
Primary Key: SHA-256 hash of user + windows_start + windows_end
Composite Index: (user, windows_start, windows_end) - Unique
Array Storage: Windows field stores array of timestamps
Time Windows: Defined start and end times for incident scope
🔄 CSV File Processing
Directory Structure
storage/
├── csv/
│   ├── drop/          # Place CSV files here for processing
│   │   ├── alerts/    # Alert CSV files
│   │   └── incidents/ # Incident CSV files
│   ├── processed/     # Successfully processed files
│   │   ├── alerts/
│   │   └── incidents/
│   └── error/         # Files with processing errors
Supported CSV Formats
Alert CSV Format
Required Fields: user, datestr, alert_name, score
Optional Fields: evidence, MITRE_tactic, MITRE_technique, Logs, Detection_model, Description
Special Handling: Evidence field supports JSON parsing and complex nested structures
Incident CSV Format
Required Fields: user, windows_start, windows_end, score
Optional Fields: windows (array of timestamps)
Time Format Support: Unix timestamps and ISO date strings
Processing Features
Automatic Detection: Monitors directories every 5 seconds (configurable)
Error Recovery: Attempts multiple parsing strategies for malformed data
Duplicate Prevention: Checks for existing records before insertion
Batch Processing: Processes multiple files simultaneously
Logging: Comprehensive logging of all processing activities
🔍 API Endpoints Overview
Alert Endpoints (/alert)
GET /alert - List alerts with filtering and pagination
GET /alert/search - Search alerts across multiple fields
GET /alert/all - Get all alerts without pagination
GET /alert/:id - Get specific alert by ID
GET /alert/user/:user - Get alerts by user
GET /alert/tactic/:tactic - Get alerts by MITRE tactic
GET /alert/technique/:technique - Get alerts by MITRE technique
GET /alert/date-range - Get alerts within date range
POST /alert - Create new alert
PUT /alert/:id - Update alert
DELETE /alert/:id - Delete alert
Incident Endpoints (/incident)
GET /incident - List incidents with filtering and pagination
GET /incident/search - Search incidents
GET /incident/all - Get all incidents without pagination
GET /incident/:id - Get specific incident by ID
GET /incident/user/:user - Get incidents by user
GET /incident/:incidentID/alerts - Get alerts for incident
GET /incident/date-range - Get incidents within date range
GET /incident/score-range - Get incidents within score range
POST /incident - Create new incident
PUT /incident/:id - Update incident
DELETE /incident/:id - Delete incident
Analytics Endpoints (/analytics)
GET /analytics/alerts-by-date - Alert counts by date
GET /analytics/incidents-by-date - Incident counts by date
GET /analytics/alerts-by-mitre - Alert distribution by MITRE tactics
GET /analytics/alerts-by-user - Alert counts by user
GET /analytics/score-distribution - Score distribution analysis
GET /analytics/timeline - Combined timeline view
GET /analytics/trends - Trend analysis with period comparison
GET /analytics/alert-severity - Alert severity distribution
GET /analytics/top-mitre-techniques - Most frequent MITRE techniques
GET /analytics/top-mitre-tactics - Most frequent MITRE tactics
🧪 Testing
Run Tests
bash
# Unit tests
npm run test
# or
yarn test

# End-to-end tests
npm run test:e2e
# or
yarn test:e2e

# Test coverage
npm run test:cov
# or
yarn test:cov
📝 Development Guidelines
Code Style
Use TypeScript for all new code
Follow NestJS conventions and best practices
Use decorators for validation and documentation
Implement proper error handling with custom exceptions
Database Guidelines
Use TypeORM entities with proper decorators
Implement composite keys for data integrity
Use proper indexing for performance
Handle database constraints gracefully
API Design
Use DTOs for request/response validation
Implement proper HTTP status codes
Provide comprehensive Swagger documentation
Support pagination for list endpoints
🐛 Troubleshooting
Common Issues
Database Connection Issues
Verify PostgreSQL is running
Check connection credentials in .env
Ensure database exists and user has proper permissions
CSV Processing Issues
Check file permissions on storage directories
Verify CSV format matches expected schema
Review logs for specific parsing errors
Check that required fields are present
Memory Issues with Large Files
Increase Node.js memory limit: node --max-old-space-size=4096
Process files in smaller batches
Monitor system resources during import
API Performance Issues
Use pagination for large datasets
Implement proper database indexes
Consider caching for frequently accessed data
🤝 Contributing
Fork the repository
Create a feature branch (git checkout -b feature/amazing-feature)
Commit your changes (git commit -m 'Add amazing feature')
Push to the branch (git push origin feature/amazing-feature)
Open a Pull Request
📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

📞 Support
For support and questions, please contact the development team or create an issue in the repository.

Note: This system handles sensitive security data. Ensure proper security measures are in place when deploying to production environments, including proper authentication, authorization, and data encryption.

