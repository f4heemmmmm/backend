"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const app_service_1 = require("./app.service");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
let AppController = class AppController {
    appService;
    constructor(appService) {
        this.appService = appService;
    }
    getHealth() {
        return this.appService.getHealth();
    }
    getAppInformation() {
        return this.appService.getAppInformation();
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)("health"),
    (0, swagger_1.ApiOperation)({
        summary: "Get application health status",
        description: "Returns the current health status of the application including uptime and environment information"
    }),
    (0, swagger_1.ApiResponse)({
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
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getHealth", null);
__decorate([
    (0, common_1.Get)("information"),
    (0, swagger_1.ApiOperation)({
        summary: "Get application information",
        description: "Returns basic information about the application including name, version, and description"
    }),
    (0, swagger_1.ApiResponse)({
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
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getAppInformation", null);
exports.AppController = AppController = __decorate([
    (0, swagger_1.ApiTags)("Application"),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [app_service_1.AppService])
], AppController);
//# sourceMappingURL=app.controller.js.map