import { AppModule } from "./app.module";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.enableCors();
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    
    // Swagger documentation setup
    const config = new DocumentBuilder()
        .setTitle("Insider Threat Monitoring API")
        .setDescription("API Documnetation for the Insider Threat Monitoring System")
        .setVersion("1.0")
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api", app, document);

    // Start the application
    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    console.log(`Application is running on http://localhost:${port}`);
}
bootstrap();