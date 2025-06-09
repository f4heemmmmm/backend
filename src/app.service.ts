// backend/src/app.service.ts
import { Injectable } from "@nestjs/common";

/**
 * AppService for application monitoring and system information retrieval.
 * 
 * Provides essential system functionality including:
 * - Health status monitoring with uptime and environment metrics
 * - Application information service for system identification
 * - Runtime environment detection and version reporting
 * - System timestamp and process metrics for operational monitoring
 */
@Injectable()
export class AppService {
    getHealth() {
        return {
            status: "OK",
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || "development",
            version: process.env.npm_package_version || "1.0.0"
        };
    }

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