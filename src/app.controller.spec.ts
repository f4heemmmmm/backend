// backend/src/app.controller.spec.ts

import { AppService } from "./app.service";
import { AppController } from "./app.controller";
import { Test, TestingModule } from "@nestjs/testing";

/**
 * Test suite for AppController
 * Tests basic application endpoints and health checks
 */
describe("AppController", () => {
    let appController: AppController;

    beforeEach(async () => {
        const app: TestingModule = await Test.createTestingModule({
            controllers: [AppController],
            providers: [AppService],
        }).compile();
        
        appController = app.get<AppController>(AppController);
    });

    /**
     * Tests for health endpoint functionality
     */
    describe("health endpoint", () => {
        it("should return health status object", () => {
            const result = appController.getHealth();
            expect(result).toHaveProperty("status");
            expect(result).toHaveProperty("timestamp");
            expect(result).toHaveProperty("uptime");
            expect(result.status).toBe("OK");
        });
    });

    /**
     * Tests for application information endpoint
     */
    describe("information endpoint", () => {
        it("should return application information", () => {
            const result = appController.getAppInformation();
            expect(result).toHaveProperty("name");
            expect(result).toHaveProperty("version");
            expect(result).toHaveProperty("description");
            expect(result).toHaveProperty("environment");
            expect(result.name).toBe("Insider Threat Monitoring System");
        });
    });
});