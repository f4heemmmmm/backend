import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
    getHealth() {
        return {
            status: "OK",
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        };
    }

    getAppInformation() {
        return {
            name: "Insider Threat Monitoring System",
            version: "1.0.0",
            description: "Backend service for monitoring and analyzing insider threats.",
            environment: process.env.NODE_ENV || "development",
        };
    }
}