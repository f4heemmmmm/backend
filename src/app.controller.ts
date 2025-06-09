// backend/src/app.controller.ts
import { AppService } from "./app.service";
import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

/**
 * AppController for basic system endpoints and monitoring functionality.
 * 
 * Provides essential application services including:
 * - Health check endpoints for load balancer and monitoring system integration
 * - Application information retrieval for system identification and debugging
 * - Public endpoint access for operational monitoring without authentication
 * - System metrics including uptime, environment, and version information
 * 
 * Security Note: These endpoints are intentionally public for monitoring purposes.
 * No sensitive data is exposed. Add @UseGuards(JWTAuthGuard) if protection needed.
 */
@ApiTags("Application")
@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get("health")
    @ApiOperation({ 
        summary: "Get application health status",
        description: "Returns the current health status of the application including uptime and environment information (public endpoint)"
    })
    @ApiResponse({ 
        status: 200, 
        description: "Returns the health status of the application with timestamp and uptime",
        schema: {
            type: "object",
            properties: {
                status: { type: "string", example: "OK" },
                timestamp: { type: "string", example: "2024-01-01T00:00:00.000Z" },
                uptime: { type: "number", example: 123.456 },
                environment: { type: "string", example: "development" },
                version: { type: "string", example: "1.0.0" }
            }
        }
    })
    getHealth() {
        return this.appService.getHealth();
    }

    @Get("information")
    @ApiOperation({ 
        summary: "Get application information",
        description: "Returns basic information about the application including name, version, and description (public endpoint)"
    })
    @ApiResponse({ 
        status: 200, 
        description: "Returns basic information about the application",
        schema: {
            type: "object",
            properties: {
                name: { type: "string", example: "Insider Threat Monitoring System" },
                version: { type: "string", example: "1.0.0" },
                description: { type: "string" },
                environment: { type: "string", example: "development" },
                author: { type: "string", example: "Security Team" },
                license: { type: "string", example: "MIT" }
            }
        }
    })
    getAppInformation() {
        return this.appService.getAppInformation();
    }
}