// backend/src/app.controller.ts

import { AppService } from "./app.service";
import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

/**
 * Main application controller providing basic system endpoints
 * Handles health checks and application information requests
 */
@ApiTags("Application")
@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    /**
     * Health check endpoint that returns application status and metrics
     */
    @Get("health")
    @ApiOperation({ 
        summary: "Get application health status",
        description: "Returns the current health status of the application including uptime and environment information"
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

    /**
     * Application information endpoint that returns system details
     */
    @Get("information")
    @ApiOperation({ 
        summary: "Get application information",
        description: "Returns basic information about the application including name, version, and description"
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