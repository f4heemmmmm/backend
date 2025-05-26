// backend/src/app.service.ts

import { Injectable } from "@nestjs/common";

/**
 * Application service providing basic health and information endpoints
 * Used for monitoring application status and retrieving system information
 */
@Injectable()
export class AppService {
    /**
     * Returns the current health status of the application
     * including timestamp and uptime information
     */
    getHealth() {
        return {
            status: "OK",
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || "development",
            version: process.env.npm_package_version || "1.0.0"
        };
    }

    /**
     * Returns basic application information including
     * name, version, description, and current environment
     */
    getAppInformation() {
        return {
            name: "Insider Threat Monitoring System",
            version: "1.0.0",
            description: "Backend service for monitoring and analyzing insider threats through CSV data processing and alert management.",
            environment: process.env.NODE_ENV || "development",
            author: "Security Team",
            license: "MIT"
        };
    }
}