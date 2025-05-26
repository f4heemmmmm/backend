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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const analytics_service_1 = require("./analytics.service");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
let AnalyticsController = class AnalyticsController {
    analyticsService;
    constructor(analyticsService) {
        this.analyticsService = analyticsService;
    }
    async getAlertsByDate(startDate, endDate, groupBy = "day") {
        return this.analyticsService.getAlertsByDate(new Date(startDate), new Date(endDate), groupBy);
    }
    async getIncidentsByDate(startDate, endDate, groupBy = "day") {
        return this.analyticsService.getIncidentsByDate(new Date(startDate), new Date(endDate), groupBy);
    }
    async getAlertsByMitre() {
        return this.analyticsService.getAlertsByMITRE();
    }
    async getAlertsByUser(limit) {
        const limitNumber = limit ? parseInt(limit, 10) : 10;
        return this.analyticsService.getAlertsByUser(limitNumber);
    }
    async getScoreDistribution() {
        return this.analyticsService.getScoreDistribution();
    }
    async getTimeline(startDate, endDate, groupBy = "day") {
        return this.analyticsService.getTimeline(new Date(startDate), new Date(endDate), groupBy);
    }
    async getTrends(startDate, endDate, groupBy = "day") {
        return this.analyticsService.getTrends(new Date(startDate), new Date(endDate), groupBy);
    }
    async getAlertSeverityDistribution() {
        return this.analyticsService.getAlertSeverityDistribution();
    }
    async getTopMitreTechniques(limit) {
        const limitNumber = limit ? parseInt(limit, 10) : 10;
        return this.analyticsService.getTopMITRETechniques(limitNumber);
    }
    async getTopMitreTactics(limit) {
        const limitNumber = limit ? parseInt(limit, 10) : 10;
        return this.analyticsService.getTopMITRETactics(limitNumber);
    }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, common_1.Get)("alerts-by-date"),
    (0, swagger_1.ApiOperation)({ summary: "Get alerts count grouped by date", description: "Retrieve alert counts grouped by specified time periods within a date range" }),
    (0, swagger_1.ApiQuery)({ name: "startDate", type: String, format: "date", description: "Start date for the analysis range (ISO format)" }),
    (0, swagger_1.ApiQuery)({ name: "endDate", type: String, format: "date", description: "End date for the analysis range (ISO format)" }),
    (0, swagger_1.ApiQuery)({ name: "groupBy", enum: ["day", "week", "month"], required: false, description: "Time grouping strategy for data aggregation" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Successfully retrieved alerts count by date", schema: { type: "array", items: { type: "object", properties: { date: { type: "string" }, count: { type: "number" } } } } }),
    (0, swagger_1.ApiResponse)({ status: 400, description: "Invalid date format or parameters" }),
    (0, swagger_1.ApiResponse)({ status: 500, description: "Internal server error" }),
    __param(0, (0, common_1.Query)("startDate")),
    __param(1, (0, common_1.Query)("endDate")),
    __param(2, (0, common_1.Query)("groupBy")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getAlertsByDate", null);
__decorate([
    (0, common_1.Get)("incidents-by-date"),
    (0, swagger_1.ApiOperation)({ summary: "Get incidents count grouped by date", description: "Retrieve incident counts grouped by specified time periods within a date range" }),
    (0, swagger_1.ApiQuery)({ name: "startDate", type: String, format: "date", description: "Start date for the analysis range (ISO format)" }),
    (0, swagger_1.ApiQuery)({ name: "endDate", type: String, format: "date", description: "End date for the analysis range (ISO format)" }),
    (0, swagger_1.ApiQuery)({ name: "groupBy", enum: ["day", "week", "month"], required: false, description: "Time grouping strategy for data aggregation" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Successfully retrieved incidents count by date", schema: { type: "array", items: { type: "object", properties: { date: { type: "string" }, count: { type: "number" } } } } }),
    (0, swagger_1.ApiResponse)({ status: 400, description: "Invalid date format or parameters" }),
    (0, swagger_1.ApiResponse)({ status: 500, description: "Internal server error" }),
    __param(0, (0, common_1.Query)("startDate")),
    __param(1, (0, common_1.Query)("endDate")),
    __param(2, (0, common_1.Query)("groupBy")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getIncidentsByDate", null);
__decorate([
    (0, common_1.Get)("alerts-by-mitre"),
    (0, swagger_1.ApiOperation)({ summary: "Get alerts count grouped by MITRE tactics", description: "Retrieve alert distribution across MITRE ATT&CK tactics framework" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Successfully retrieved alerts count by MITRE tactics", schema: { type: "array", items: { type: "object", properties: { tactic: { type: "string" }, count: { type: "number" } } } } }),
    (0, swagger_1.ApiResponse)({ status: 500, description: "Internal server error" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getAlertsByMitre", null);
__decorate([
    (0, common_1.Get)("alerts-by-user"),
    (0, swagger_1.ApiOperation)({ summary: "Get alerts count grouped by user", description: "Retrieve alert counts grouped by user with optional result limiting" }),
    (0, swagger_1.ApiQuery)({ name: "limit", type: Number, description: "Maximum number of users to return", required: false, example: 10 }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Successfully retrieved alerts count by user", schema: { type: "array", items: { type: "object", properties: { user: { type: "string" }, count: { type: "number" } } } } }),
    (0, swagger_1.ApiResponse)({ status: 400, description: "Invalid limit parameter" }),
    (0, swagger_1.ApiResponse)({ status: 500, description: "Internal server error" }),
    __param(0, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getAlertsByUser", null);
__decorate([
    (0, common_1.Get)("score-distribution"),
    (0, swagger_1.ApiOperation)({ summary: "Get score distribution for alerts and incidents", description: "Analyze score distribution across predefined ranges for both alerts and incidents" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Successfully retrieved score distribution data", schema: { type: "array", items: { type: "object", properties: { scoreRange: { type: "string" }, alertCount: { type: "number" }, incidentCount: { type: "number" } } } } }),
    (0, swagger_1.ApiResponse)({ status: 500, description: "Internal server error" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getScoreDistribution", null);
__decorate([
    (0, common_1.Get)("timeline"),
    (0, swagger_1.ApiOperation)({ summary: "Get combined timeline of alerts and incidents", description: "Generate a unified timeline view showing both alerts and incidents within a specified date range" }),
    (0, swagger_1.ApiQuery)({ name: "startDate", type: String, format: "date", description: "Start date for the timeline range (ISO format)" }),
    (0, swagger_1.ApiQuery)({ name: "endDate", type: String, format: "date", description: "End date for the timeline range (ISO format)" }),
    (0, swagger_1.ApiQuery)({ name: "groupBy", enum: ["day", "week", "month"], required: false, description: "Time grouping strategy for timeline aggregation" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Successfully retrieved timeline visualization data", schema: { type: "array", items: { type: "object", properties: { date: { type: "string" }, alerts: { type: "number" }, incidents: { type: "number" } } } } }),
    (0, swagger_1.ApiResponse)({ status: 400, description: "Invalid date format or parameters" }),
    (0, swagger_1.ApiResponse)({ status: 500, description: "Internal server error" }),
    __param(0, (0, common_1.Query)("startDate")),
    __param(1, (0, common_1.Query)("endDate")),
    __param(2, (0, common_1.Query)("groupBy")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getTimeline", null);
__decorate([
    (0, common_1.Get)("trends"),
    (0, swagger_1.ApiOperation)({ summary: "Get trend analysis with period comparison", description: "Perform trend analysis comparing current period with previous period to identify changes" }),
    (0, swagger_1.ApiQuery)({ name: "startDate", type: String, format: "date", description: "Start date for the analysis period (ISO format)" }),
    (0, swagger_1.ApiQuery)({ name: "endDate", type: String, format: "date", description: "End date for the analysis period (ISO format)" }),
    (0, swagger_1.ApiQuery)({ name: "groupBy", enum: ["day", "week", "month"], required: false, description: "Time grouping strategy for trend analysis" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Successfully retrieved trend analysis data", schema: { type: "array", items: { type: "object", properties: { date: { type: "string" }, alerts: { type: "number" }, incidents: { type: "number" }, alertsChange: { type: "number" }, incidentsChange: { type: "number" }, period: { type: "string" } } } } }),
    (0, swagger_1.ApiResponse)({ status: 400, description: "Invalid date format or parameters" }),
    (0, swagger_1.ApiResponse)({ status: 500, description: "Internal server error" }),
    __param(0, (0, common_1.Query)("startDate")),
    __param(1, (0, common_1.Query)("endDate")),
    __param(2, (0, common_1.Query)("groupBy")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getTrends", null);
__decorate([
    (0, common_1.Get)("alert-severity"),
    (0, swagger_1.ApiOperation)({ summary: "Get alert severity distribution", description: "Analyze alert distribution across severity levels based on predefined score ranges" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Successfully retrieved alert severity distribution", schema: { type: "array", items: { type: "object", properties: { severity: { type: "string" }, count: { type: "number" } } } } }),
    (0, swagger_1.ApiResponse)({ status: 500, description: "Internal server error" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getAlertSeverityDistribution", null);
__decorate([
    (0, common_1.Get)("top-mitre-techniques"),
    (0, swagger_1.ApiOperation)({ summary: "Get top MITRE techniques by frequency of occurrence", description: "Retrieve the most frequently occurring MITRE ATT&CK techniques based on alert data" }),
    (0, swagger_1.ApiQuery)({ name: "limit", type: Number, description: "Maximum number of techniques to return", required: false, example: 10 }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Successfully retrieved top MITRE techniques", schema: { type: "array", items: { type: "object", properties: { technique: { type: "string" }, count: { type: "number" } } } } }),
    (0, swagger_1.ApiResponse)({ status: 400, description: "Invalid limit parameter" }),
    (0, swagger_1.ApiResponse)({ status: 500, description: "Internal server error" }),
    __param(0, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getTopMitreTechniques", null);
__decorate([
    (0, common_1.Get)("top-mitre-tactics"),
    (0, swagger_1.ApiOperation)({ summary: "Get top MITRE tactics by frequency of occurrence", description: "Retrieve the most frequently occurring MITRE ATT&CK tactics based on alert data" }),
    (0, swagger_1.ApiQuery)({ name: "limit", type: Number, description: "Maximum number of tactics to return", required: false, example: 10 }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Successfully retrieved top MITRE tactics", schema: { type: "array", items: { type: "object", properties: { tactic: { type: "string" }, count: { type: "number" } } } } }),
    (0, swagger_1.ApiResponse)({ status: 400, description: "Invalid limit parameter" }),
    (0, swagger_1.ApiResponse)({ status: 500, description: "Internal server error" }),
    __param(0, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getTopMitreTactics", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, swagger_1.ApiTags)("analytics"),
    (0, common_1.Controller)("analytics"),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService])
], AnalyticsController);
//# sourceMappingURL=analytics.controller.js.map