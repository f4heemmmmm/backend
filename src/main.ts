// backend/src/main.ts

import { AppModule } from "./app.module";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

/**
 * Application bootstrap function that initializes the NestJS application
 * Sets up CORS, validation pipes, Swagger documentation, and starts the server
 */
async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    
    app.enableCors({
        origin: process.env.FRONTEND_URL || true,
        credentials: true,
    });
    
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
        .setDescription("API Documentation for the Insider Threat Monitoring System")
        .setVersion("1.0")
        .addTag("Application", "Basic application endpoints")
        .addTag("Alerts", "Alert management endpoints")
        .addTag("Incidents", "Incident management endpoints")
        .addTag("Analytics", "Analytics and reporting endpoints")
        .build();
        
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api", app, document);

    const port = parseInt(process.env.PORT || "3000");
    await app.listen(port);
    
    console.log(`🚀 Application is running on http://localhost:${port}`);
    console.log(`📚 API Documentation available at http://localhost:${port}/api`);
    console.log(`🏥 Health check available at http://localhost:${port}/health`);
}

bootstrap().catch((error) => {
    console.error("❌ Failed to start application:", error);
    process.exit(1);
});