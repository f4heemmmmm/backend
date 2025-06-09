"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("./crypto-polyfill");
const app_module_1 = require("./app.module");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: process.env.FRONTEND_URL || true,
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle("Insider Threat Monitoring API")
        .setDescription("API Documentation for the Insider Threat Monitoring System")
        .setVersion("1.0")
        .addTag("Application", "Basic application endpoints")
        .addTag("Authentication", "User authentication endpoints")
        .addTag("Alerts", "Alert management endpoints")
        .addTag("Incidents", "Incident management endpoints")
        .addTag("Analytics", "Analytics and reporting endpoints")
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup("api", app, document);
    const port = parseInt(process.env.PORT || "3000");
    await app.listen(port, '0.0.0.0');
    console.log(`🚀 Application is running on http://localhost:${port}`);
    console.log(`📚 API Documentation available at http://localhost:${port}/api`);
    console.log(`🏥 Health check available at http://localhost:${port}/health`);
    console.log(`🔐 Login endpoint available at http://localhost:${port}/auth/login`);
    console.log(`👥 Default user: admin@ensigninfosecurity.com / password123`);
}
bootstrap().catch((error) => {
    console.error("❌ Failed to start application:", error);
    process.exit(1);
});
//# sourceMappingURL=main.js.map