// backend/src/modules/analytics/analytics.controller.ts
import { AnalyticsService } from "./analytics.service";
import { JWTAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags, ApiQuery, ApiCookieAuth } from "@nestjs/swagger";

/**
 * AnalyticsController for comprehensive security analytics and reporting.
 * 
 * Provides enterprise analytics functionality including:
 * - Time-based aggregation of alerts and incidents with flexible grouping
 * - MITRE ATT&CK framework analysis for threat intelligence insights
 * - User activity analytics and score distribution analysis
 * - Combined timeline visualization and trend analysis with period comparison
 * - Severity distribution analysis and top technique/tactic identification
 * - JWT authentication protection for all analytics endpoints
 */
@ApiTags("analytics")
@Controller("analytics")
@UseGuards(JWTAuthGuard)
@ApiCookieAuth()
export class AnalyticsController {
    constructor(
        private readonly analyticsService: AnalyticsService
    ) {}

    @Get("alerts-by-date")
    @ApiOperation({ summary: "Get alerts count grouped by date", description: "Retrieve alert counts grouped by specified time periods within a date range (requires authentication)" })
    @ApiQuery({ name: "startDate", type: String, format: "date", description: "Start date for the analysis range (ISO format)" })
    @ApiQuery({ name: "endDate", type: String, format: "date", description: "End date for the analysis range (ISO format)" })
    @ApiQuery({ name: "groupBy", enum: ["day", "week", "month"], required: false, description: "Time grouping strategy for data aggregation" })
    @ApiResponse({ status: 200, description: "Successfully retrieved alerts count by date", schema: { type: "array", items: { type: "object", properties: { date: { type: "string" }, count: { type: "number" } } } } })
    @ApiResponse({ status: 400, description: "Invalid date format or parameters" })
    @ApiResponse({ status: 401, description: "Unauthorized - Invalid or missing authentication" })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async getAlertsByDate(
        @Query("startDate") startDate: string, 
        @Query("endDate") endDate: string, 
        @Query("groupBy") groupBy: "day" | "week" | "month" = "day"
    ) {
        return this.analyticsService.getAlertsByDate(new Date(startDate), new Date(endDate), groupBy);
    }

    @Get("incidents-by-date")
    @ApiOperation({ summary: "Get incidents count grouped by date", description: "Retrieve incident counts grouped by specified time periods within a date range (requires authentication)" })
    @ApiQuery({ name: "startDate", type: String, format: "date", description: "Start date for the analysis range (ISO format)" })
    @ApiQuery({ name: "endDate", type: String, format: "date", description: "End date for the analysis range (ISO format)" })
    @ApiQuery({ name: "groupBy", enum: ["day", "week", "month"], required: false, description: "Time grouping strategy for data aggregation" })
    @ApiResponse({ status: 200, description: "Successfully retrieved incidents count by date", schema: { type: "array", items: { type: "object", properties: { date: { type: "string" }, count: { type: "number" } } } } })
    @ApiResponse({ status: 400, description: "Invalid date format or parameters" })
    @ApiResponse({ status: 401, description: "Unauthorized - Invalid or missing authentication" })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async getIncidentsByDate(
        @Query("startDate") startDate: string, 
        @Query("endDate") endDate: string, 
        @Query("groupBy") groupBy: "day" | "week" | "month" = "day"
    ) {
        return this.analyticsService.getIncidentsByDate(new Date(startDate), new Date(endDate), groupBy);
    }

    @Get("alerts-by-mitre")
    @ApiOperation({ summary: "Get alerts count grouped by MITRE tactics", description: "Retrieve alert distribution across MITRE ATT&CK tactics framework (requires authentication)" })
    @ApiResponse({ status: 200, description: "Successfully retrieved alerts count by MITRE tactics", schema: { type: "array", items: { type: "object", properties: { tactic: { type: "string" }, count: { type: "number" } } } } })
    @ApiResponse({ status: 401, description: "Unauthorized - Invalid or missing authentication" })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async getAlertsByMitre() {
        return this.analyticsService.getAlertsByMITRE();
    }

    @Get("alerts-by-user")
    @ApiOperation({ summary: "Get alerts count grouped by user", description: "Retrieve alert counts grouped by user with optional result limiting (requires authentication)" })
    @ApiQuery({ name: "limit", type: Number, description: "Maximum number of users to return", required: false, example: 10 })
    @ApiResponse({ status: 200, description: "Successfully retrieved alerts count by user", schema: { type: "array", items: { type: "object", properties: { user: { type: "string" }, count: { type: "number" } } } } })
    @ApiResponse({ status: 400, description: "Invalid limit parameter" })
    @ApiResponse({ status: 401, description: "Unauthorized - Invalid or missing authentication" })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async getAlertsByUser(@Query("limit") limit?: string) {
        const limitNumber = limit ? parseInt(limit, 10) : 10;
        return this.analyticsService.getAlertsByUser(limitNumber);
    }

    @Get("score-distribution")
    @ApiOperation({ summary: "Get score distribution for alerts and incidents", description: "Analyze score distribution across predefined ranges for both alerts and incidents (requires authentication)" })
    @ApiResponse({ status: 200, description: "Successfully retrieved score distribution data", schema: { type: "array", items: { type: "object", properties: { scoreRange: { type: "string" }, alertCount: { type: "number" }, incidentCount: { type: "number" } } } } })
    @ApiResponse({ status: 401, description: "Unauthorized - Invalid or missing authentication" })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async getScoreDistribution() {
        return this.analyticsService.getScoreDistribution();
    }

    @Get("timeline")
    @ApiOperation({ summary: "Get combined timeline of alerts and incidents", description: "Generate a unified timeline view showing both alerts and incidents within a specified date range (requires authentication)" })
    @ApiQuery({ name: "startDate", type: String, format: "date", description: "Start date for the timeline range (ISO format)" })
    @ApiQuery({ name: "endDate", type: String, format: "date", description: "End date for the timeline range (ISO format)" })
    @ApiQuery({ name: "groupBy", enum: ["day", "week", "month"], required: false, description: "Time grouping strategy for timeline aggregation" })
    @ApiResponse({ status: 200, description: "Successfully retrieved timeline visualization data", schema: { type: "array", items: { type: "object", properties: { date: { type: "string" }, alerts: { type: "number" }, incidents: { type: "number" } } } } })
    @ApiResponse({ status: 400, description: "Invalid date format or parameters" })
    @ApiResponse({ status: 401, description: "Unauthorized - Invalid or missing authentication" })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async getTimeline(
        @Query("startDate") startDate: string, 
        @Query("endDate") endDate: string, 
        @Query("groupBy") groupBy: "day" | "week" | "month" = "day"
    ) {
        return this.analyticsService.getTimeline(new Date(startDate), new Date(endDate), groupBy);
    }
    
    @Get("trends")
    @ApiOperation({ summary: "Get trend analysis with period comparison", description: "Perform trend analysis comparing current period with previous period to identify changes (requires authentication)" })
    @ApiQuery({ name: "startDate", type: String, format: "date", description: "Start date for the analysis period (ISO format)" })
    @ApiQuery({ name: "endDate", type: String, format: "date", description: "End date for the analysis period (ISO format)" })
    @ApiQuery({ name: "groupBy", enum: ["day", "week", "month"], required: false, description: "Time grouping strategy for trend analysis" })
    @ApiResponse({ status: 200, description: "Successfully retrieved trend analysis data", schema: { type: "array", items: { type: "object", properties: { date: { type: "string" }, alerts: { type: "number" }, incidents: { type: "number" }, alertsChange: { type: "number" }, incidentsChange: { type: "number" }, period: { type: "string" } } } } })
    @ApiResponse({ status: 400, description: "Invalid date format or parameters" })
    @ApiResponse({ status: 401, description: "Unauthorized - Invalid or missing authentication" })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async getTrends(
        @Query("startDate") startDate: string, 
        @Query("endDate") endDate: string, 
        @Query("groupBy") groupBy: "day" | "week" | "month" = "day"
    ) {
        return this.analyticsService.getTrends(new Date(startDate), new Date(endDate), groupBy);
    }

    @Get("alert-severity")
    @ApiOperation({ summary: "Get alert severity distribution", description: "Analyze alert distribution across severity levels based on predefined score ranges (requires authentication)" })
    @ApiResponse({ status: 200, description: "Successfully retrieved alert severity distribution", schema: { type: "array", items: { type: "object", properties: { severity: { type: "string" }, count: { type: "number" } } } } })
    @ApiResponse({ status: 401, description: "Unauthorized - Invalid or missing authentication" })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async getAlertSeverityDistribution() {
        return this.analyticsService.getAlertSeverityDistribution();
    }

    @Get("top-mitre-techniques")
    @ApiOperation({ summary: "Get top MITRE techniques by frequency of occurrence", description: "Retrieve the most frequently occurring MITRE ATT&CK techniques based on alert data (requires authentication)" })
    @ApiQuery({ name: "limit", type: Number, description: "Maximum number of techniques to return", required: false, example: 10 })
    @ApiResponse({ status: 200, description: "Successfully retrieved top MITRE techniques", schema: { type: "array", items: { type: "object", properties: { technique: { type: "string" }, count: { type: "number" } } } } })
    @ApiResponse({ status: 400, description: "Invalid limit parameter" })
    @ApiResponse({ status: 401, description: "Unauthorized - Invalid or missing authentication" })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async getTopMitreTechniques(@Query("limit") limit?: string) {
        const limitNumber = limit ? parseInt(limit, 10) : 10;
        return this.analyticsService.getTopMITRETechniques(limitNumber);
    }

    @Get("top-mitre-tactics")
    @ApiOperation({ summary: "Get top MITRE tactics by frequency of occurrence", description: "Retrieve the most frequently occurring MITRE ATT&CK tactics based on alert data (requires authentication)" })
    @ApiQuery({ name: "limit", type: Number, description: "Maximum number of tactics to return", required: false, example: 10 })
    @ApiResponse({ status: 200, description: "Successfully retrieved top MITRE tactics", schema: { type: "array", items: { type: "object", properties: { tactic: { type: "string" }, count: { type: "number" } } } } })
    @ApiResponse({ status: 400, description: "Invalid limit parameter" })
    @ApiResponse({ status: 401, description: "Unauthorized - Invalid or missing authentication" })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async getTopMitreTactics(@Query("limit") limit?: string) {
        const limitNumber = limit ? parseInt(limit, 10) : 10;
        return this.analyticsService.getTopMITRETactics(limitNumber);
    }
}