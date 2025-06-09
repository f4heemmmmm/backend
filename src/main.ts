// backend.src/main.ts
import "./crypto-polyfill";
import { AppModule } from "./app.module";
import { NestFactory } from "@nestjs/core";
import * as cookieParser from "cookie-parser";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

/**
 * Application bootstrap function for NestJS enterprise security monitoring system.
 * 
 * Initializes comprehensive application setup including:
 * - CORS configuration with credentials support for JWT cookie authentication
 * - Cookie parser middleware for secure HTTP-only token extraction
 * - Global validation pipes with transformation and security features
 * - Swagger documentation with JWT authentication integration
 * - Multi-interface server binding for containerized deployments
 * - Comprehensive logging for operational monitoring and debugging
 */
async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    
    app.enableCors({
        origin: process.env.FRONTEND_URL || "http://localhost:3001",
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    });
    
    app.use(cookieParser());
    
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    
    const config = new DocumentBuilder()
        .setTitle("Insider Threat Monitoring API")
        .setDescription("API Documentation for the Insider Threat Monitoring System with JWT Authentication")
        .setVersion("1.0")
        .addTag("Application", "Basic application endpoints")
        .addTag("Authentication", "JWT user authentication endpoints")
        .addTag("Alerts", "Alert management endpoints (requires authentication)")
        .addTag("Incidents", "Incident management endpoints (requires authentication)")
        .addTag("Analytics", "Analytics and reporting endpoints (requires authentication)")
        .addCookieAuth("token", {
            type: "http",
            in: "cookie",
            scheme: "Bearer",
            description: "JWT token stored in HTTP-only cookie"
        })
        .build();
        
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api", app, document);

    const port = parseInt(process.env.PORT || "3000");
    await app.listen(port, "0.0.0.0");
    
    console.log(`🚀 Application is running on http://localhost:${port}`);
    console.log(`📚 API Documentation available at http://localhost:${port}/api`);
    console.log(`🏥 Health check available at http://localhost:${port}/health`);
    console.log(`🔐 Login endpoint available at http://localhost:${port}/auth/login`);
    console.log(`🍪 Using JWT tokens in HTTP-only cookies for authentication`);
    console.log(`👥 Default user: admin@ensigninfosecurity.com / password123`);
    console.log(`📊 Analytics endpoints protected by JWT authentication`);
    console.log(`🚨 Alert and Incident endpoints protected by JWT authentication`);
}

bootstrap().catch((error) => {
    console.error("❌ Failed to start application:", error);
    process.exit(1);
});