// backend/src/app.controller.spec.ts
import { AppService } from "./app.service";
import { AppController } from "./app.controller";
import { Test, TestingModule } from "@nestjs/testing";

/**
 * AppController test suite for basic application endpoints and health monitoring.
 * 
 * Tests comprehensive application functionality including:
 * - Health endpoint status verification and response structure validation
 * - Application information endpoint data integrity and content verification
 * - Controller dependency injection and service integration testing
 * - Response format consistency and property presence validation
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

    describe("health endpoint", () => {
        it("should return health status object", () => {
            const result = appController.getHealth();
            expect(result).toHaveProperty("status");
            expect(result).toHaveProperty("timestamp");
            expect(result).toHaveProperty("uptime");
            expect(result.status).toBe("OK");
        });
    });

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