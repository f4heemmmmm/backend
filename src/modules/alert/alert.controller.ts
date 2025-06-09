// backend/src/modules/alert/alert.controller.ts
import { Alert } from "../alert/alert.entity";
import { AlertService } from "../alert/alert.service";
import { JWTAuthGuard } from "../auth/guards/jwt-auth.guard";
import { IncidentResponseDTO } from "../incident/incident.dto";
import { CreateAlertDTO, UpdateAlertDTO, AlertResponseDTO } from "../alert/alert.dto";
import { ApiTags, ApiBody, ApiQuery, ApiResponse, ApiParam, ApiOperation, ApiCookieAuth } from "@nestjs/swagger";
import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseDatePipe, HttpStatus, HttpCode, ParseBoolPipe, UseGuards } from "@nestjs/common";

type SortOrder = "asc" | "desc";
type SortField = "datestr" | "score" | "alert_name";

/**
 * AlertController for managing security alert operations with comprehensive API endpoints.
 * 
 * Provides REST API functionality for:
 * - CRUD operations for alert management with validation
 * - Advanced search and filtering with pagination support
 * - MITRE ATT&CK framework integration for tactic/technique queries
 * - Incident correlation and relationship management
 * - Date range filtering and user-specific alert retrieval
 * - JWT authentication protection for all endpoints
 */
@ApiTags("alerts")
@Controller("alert")
@UseGuards(JWTAuthGuard)
@ApiCookieAuth()
export class AlertController {
    constructor(
        private readonly alertService: AlertService
    ) {}
    
    /**
     * Validates sort field parameter against allowed values.
     */
    private validateSortField(sortField?: string): SortField {
        const validFields: SortField[] = ["datestr", "score", "alert_name"];
        return (sortField && validFields.includes(sortField as SortField))
            ? sortField as SortField
            : "datestr";
    }

    /**
     * Validates sort order parameter for ascending/descending direction.
     */
    private validateSortOrder(sortOrder?: string): SortOrder {
        return (sortOrder && (sortOrder === "asc" || sortOrder === "desc"))
            ? sortOrder as SortOrder
            : "desc";
    }
    
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: "Create a new alert", description: "Creates a new alert with the provided data (requires authentication)"})
    @ApiResponse({ status: 201, description: "Alert successfully created", type: AlertResponseDTO })
    @ApiResponse({ status: 400, description: "Invalid input data" })
    @ApiResponse({ status: 401, description: "Unauthorized - Invalid or missing authentication" })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async create(@Body() createAlertDTO: CreateAlertDTO): Promise<AlertResponseDTO> {
        return this.alertService.create(createAlertDTO);
    }

    @Get()
    @ApiOperation({ summary: "Get all alerts", description: "Retrieves all alerts with optional filtering, pagination and sorting (requires authentication)" })
    @ApiQuery({ name: "limit", required: false, type: Number, description: "Number of alerts per page" })
    @ApiQuery({ name: "offset", required: false, type: Number, description: "Number of alerts to skip" })
    @ApiQuery({ name: "sortField", required: false, enum: ["datestr", "score", "alert_name"], description: "Field to sort by" })
    @ApiQuery({ name: "sortOrder", required: false, enum: ["asc", "desc"], description: "Direction to sort" })
    @ApiResponse({ status: 200, description: "Alerts successfully retrieved", schema: { type: "object", properties: { alerts: { type: "array", items: { $ref: "#/components/schemas/AlertResponseDTO" } }, total: { type: "number" } } } })
    @ApiResponse({ status: 401, description: "Unauthorized - Invalid or missing authentication" })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async findAll(
        @Query() queryParams,
        @Query("limit") limit?: number,
        @Query("offset") offset?: number,
        @Query("sortField") sortField?: string,
        @Query("sortOrder") sortOrder?: string,
    ): Promise<{ alerts: AlertResponseDTO[]; total: number }> {
        const { limit: limitParam, offset: offsetParam, sortField: sortFieldParam, sortOrder: sortOrderParam, ...filters } = queryParams;
        return this.alertService.findAll(
            filters as Partial<Alert>,
            limit ? Number(limit) : undefined,
            offset ? Number(offset) : undefined,
            this.validateSortField(sortField),
            this.validateSortOrder(sortOrder)
        );
    }

    @Get("search")
    @ApiOperation({ summary: "Search alerts", description: "Search alerts by query string across multiple fields (requires authentication)" })
    @ApiQuery({ name: "query", type: String, description: "Search query string" })
    @ApiQuery({ name: "limit", type: Number, description: "Number of records to return", example: 10 })
    @ApiQuery({ name: "offset", type: Number, description: "Number of records to skip, pagination offset", example: 0 })
    @ApiQuery({ name: "sortField", required: false, enum: ["datestr", "score", "alert_name"], description: "Field to sort by" })
    @ApiQuery({ name: "sortOrder", required: false, enum: ["asc", "desc"], description: "Direction to sort by" })
    @ApiResponse({ status: 200, description: "Successfully searched alerts", schema: { type: "object", properties: { alerts: { type: "array", items: { $ref: "#/components/schemas/AlertResponseDTO" } }, total: { type: "number" } } } })
    @ApiResponse({ status: 400, description: "Invalid search query"})
    @ApiResponse({ status: 401, description: "Unauthorized - Invalid or missing authentication" })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async searchAlerts(
        @Query("query") query: string,
        @Query("limit") limit?: number,
        @Query("offset") offset?: number,
        @Query("sortField") sortField?: string,
        @Query("sortOrder") sortOrder?: string,
    ): Promise<{ alerts: AlertResponseDTO[]; total: number }> {
        return this.alertService.searchAlerts(
            query,
            limit ? Number(limit) : 10,
            offset ? Number(offset) : 0,
            this.validateSortField(sortField),
            this.validateSortOrder(sortOrder)
        );
    }

    @Get("date-range")
    @ApiOperation({ summary: "Get alerts by the date range", description: "Retrieve all alerts within a specific date range (requires authentication)" })
    @ApiQuery({ name: "startDate", required: true, type: String, format: "date", description: "Start date for the date range" })    
    @ApiQuery({ name: "endDate", required: true, type: String, format: "date", description: "End date for the date range" })
    @ApiQuery({ name: "user", required: false, type: String, description: "Optional user filter" })
    @ApiQuery({ name: "sortField", required: false, enum: ["datestr", "score", "alert_name"], description: "Field to sort by" })
    @ApiQuery({ name: "sortOrder", required: false, enum: ["asc", "desc"], description: "Direction to sort" })
    @ApiResponse({ status: 200, description: "Successfully searched alerts", type: [AlertResponseDTO] })
    @ApiResponse({ status: 400, description: "Invalid date format" })
    @ApiResponse({ status: 401, description: "Unauthorized - Invalid or missing authentication" })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async findAlertsByDateRange(
        @Query("startDate", new ParseDatePipe()) startDate: Date,
        @Query("endDate", new ParseDatePipe()) endDate: Date,
        @Query("user") user?: string,
        @Query("sortField") sortField?: string,
        @Query("sortOrder") sortOrder?: string,
    ): Promise<AlertResponseDTO[]> {
        return this.alertService.findAlertsByDateRange(
            startDate,
            endDate,
            user,
            this.validateSortField(sortField),
            this.validateSortOrder(sortOrder)
        );
    }

    @Get("all")
    @ApiOperation({ summary: "Get all alerts", description: "Retrieve ALL alerts without any filtering or pagination (requires authentication)" })
    @ApiQuery({ name: "sortField", required: false, enum: ["datestr", "score", "alert_name"], description: "Field to sort by" })
    @ApiQuery({ name: "sortOrder", required: false, enum: ["asc", "desc"], description: "Direction to sort" })
    @ApiResponse({ status: 200, description: "All alerts successfully retrieved", type: [AlertResponseDTO] })
    @ApiResponse({ status: 401, description: "Unauthorized - Invalid or missing authentication" })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async getAllAlerts(
        @Query("sortField") sortField?: string,
        @Query("sortOrder") sortOrder?: string,
    ): Promise<AlertResponseDTO[]> {
        return this.alertService.getAllAlerts(
            this.validateSortField(sortField),
            this.validateSortOrder(sortOrder)
        );
    }

    @Get("all/with-count")
    @ApiOperation({ summary: "Get all alerts with count", description: "Retrieve ALL alerts with total count, no filtering or pagination (requires authentication)" })
    @ApiQuery({ name: "sortField", required: false, enum: ["datestr", "score", "alert_name"], description: "Field to sort by" })
    @ApiQuery({ name: "sortOrder", required: false, enum: ["asc", "desc"], description: "Direction to sort" })
    @ApiResponse({ status: 200, description: "All alerts with count successfully retrieved", schema: { type: "object", properties: { alerts: { type: "array", items: { $ref: "#/components/schemas/AlertResponseDTO" } }, total: { type: "number" } } } })
    @ApiResponse({ status: 401, description: "Unauthorized - Invalid or missing authentication" })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async getAllAlertsWithCount(
        @Query("sortField") sortField?: string,
        @Query("sortOrder") sortOrder?: string,
    ): Promise<{ alerts: AlertResponseDTO[]; total: number }> {
        return this.alertService.getAllAlertsWithCount(
            this.validateSortField(sortField),
            this.validateSortOrder(sortOrder)
        );
    }

    @Get(":id")
    @ApiOperation({ summary: "Get alert by the alert ID", description: "Retrieve a single alert by its ID (requires authentication)" })
    @ApiParam({ name: "id", type: String, description: "Alert ID" })
    @ApiResponse({ status: 200, description: "Successfully received alert", type: AlertResponseDTO })
    @ApiResponse({ status: 401, description: "Unauthorized - Invalid or missing authentication" })
    @ApiResponse({ status: 404, description: "Alert not found" })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async findAlertByID(@Param("id") id: string): Promise<AlertResponseDTO> {
        return this.alertService.findAlertByID(id);
    }

    @Get(":alertID/incident")
    @ApiOperation({ summary: "Get incident for an alert", description: "Retrieve the incident associated with an alert (requires authentication)" })
    @ApiParam({ name: "alertID", type: String, description: "Alert ID to find the related incident" })
    @ApiResponse({ status: 200, description: "Successfully retrieved incident", type: IncidentResponseDTO })
    @ApiResponse({ status: 204, description: "No incident associated with this alert" })
    @ApiResponse({ status: 401, description: "Unauthorized - Invalid or missing authentication" })
    @ApiResponse({ status: 404, description: "Alert not found" })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async getIncidentForAlert(@Param("alertID") alertID: string): Promise<IncidentResponseDTO | null> {
        return this.alertService.getIncidentForAlert(alertID);
    }

    @Get("incident-id/:incidentID")
    @ApiOperation({ summary: "Get alerts by incident ID", description: "Retrieve all alerts associated with a specific incident (requires authentication)" })
    @ApiParam({ name: "incidentID", type: String, description: "Incident ID to find" })
    @ApiQuery({ name: "sortField", required: false, enum: ["datestr", "score", "alert_name"], description: "Field to sort by" })
    @ApiQuery({ name: "sortOrder", required: false, enum: ["asc", "desc"], description: "Direction to sort" })
    @ApiResponse({ status: 200, description: "Successfully retrieved alerts related to the incident", type: [AlertResponseDTO] })
    @ApiResponse({ status: 400, description: "Incident not found" })
    @ApiResponse({ status: 401, description: "Unauthorized - Invalid or missing authentication" })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async findAlertsByIncidentID(
        @Param("incidentID") incidentID: string,
        @Param("sortField") sortField?: string,
        @Param("sortOrder") sortOrder?: string,
    ): Promise<AlertResponseDTO[]> {
        return this.alertService.findAlertsByIncidentID(
            incidentID,
            this.validateSortField(sortField),
            this.validateSortOrder(sortOrder)
        );
    }

    @Put(":id")
    @ApiOperation({ summary: "Update alert", description: "Update an existing alert by its ID (requires authentication)" })
    @ApiParam({ name: "id", type: String, description: "Alert ID" })
    @ApiBody({ type: UpdateAlertDTO, description: "Alert update data" })
    @ApiResponse({ status: 200, description: "Alert successfully updated", type: AlertResponseDTO })
    @ApiResponse({ status: 400, description: "Invalid input data" })
    @ApiResponse({ status: 401, description: "Unauthorized - Invalid or missing authentication" })
    @ApiResponse({ status: 404, description: "Alert not found" })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async updateAlertByID(@Param("id") id: string, @Body() updateAlertDTO: UpdateAlertDTO): Promise<AlertResponseDTO> {
        return this.alertService.updateAlertByID(id, updateAlertDTO);
    }

    @Delete(":id")
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: "Delete alert", description: "Delete an alert by its ID (requires authentication)" })
    @ApiParam({ name: "id", type: String, description: "Alert ID" })
    @ApiResponse({ status: 204, description: "Alert successfully deleted" })
    @ApiResponse({ status: 401, description: "Unauthorized - Invalid or missing authentication" })
    @ApiResponse({ status: 404, description: "Alert not found" })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async removeAlertByID(@Param("id") id: string): Promise<void> {
        await this.alertService.removeAlertByID(id);
    }

    @Get("tactic/:tactic")
    @ApiOperation({ summary: "Get alerts by MITRE tactic", description: "Retrieve all alerts used by a MITRE tactic (requires authentication)" })
    @ApiParam({ name: "tactic", type: String, description: "MITRE tactic to search for" })
    @ApiQuery({ name: "sortField", required: false, enum: ["datestr", "score", "alert_name"], description: "Field to sort by" })
    @ApiQuery({ name: "sortOrder", required: false, enum: ["asc", "desc"], description: "Direction to sort" })
    @ApiResponse({ status: 200, description: "Successfully searched alerts", type: [AlertResponseDTO] })
    @ApiResponse({ status: 401, description: "Unauthorized - Invalid or missing authentication" })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async findAlertsByMITRETactic(
        @Param("tactic") tactic: string, 
        @Query("sortField") sortField?: string, 
        @Query("sortOrder") sortOrder?: string
    ): Promise<AlertResponseDTO[]> {
        return this.alertService.findAlertsByMITRETactic(
            tactic,
            this.validateSortField(sortField),
            this.validateSortOrder(sortOrder)
        );
    }

    @Get("technique/:technique")
    @ApiOperation({ summary: "Get alerts by MITRE technique", description: "Retrieve all alerts used by a MITRE technique (requires authentication)" })
    @ApiParam({ name: "technique", type: String, description: "MITRE technique to search for" })
    @ApiQuery({ name: "sortField", required: false, enum: ["datestr", "score", "alert_name"], description: "Field to sort by" })
    @ApiQuery({ name: "sortOrder", required: false, enum: ["asc", "desc"], description: "Direction to sort" })
    @ApiResponse({ status: 200, description: "Successfully searched alerts", type: [AlertResponseDTO] })
    @ApiResponse({ status: 401, description: "Unauthorized - Invalid or missing authentication" })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async findAlertsByMITRETechnique(
        @Param("technique") technique: string, 
        @Query("sortField") sortField?: string, 
        @Query("sortOrder") sortOrder?: string
    ): Promise<AlertResponseDTO[]> {
        return this.alertService.findAlertsByMITRETechnique(
            technique,
            this.validateSortField(sortField),
            this.validateSortOrder(sortOrder)
        );
    }

    @Get("user/:user")
    @ApiOperation({ summary: "Get alerts by username", description: "Retrieve all alerts under a user (requires authentication)" })
    @ApiParam({ name: "user", type: String, description: "User to search for" })
    @ApiQuery({ name: "sortField", required: false, enum: ["datestr", "score", "alert_name"], description: "Field to sort by" })
    @ApiQuery({ name: "sortOrder", required: false, enum: ["asc", "desc"], description: "Direction to sort" })
    @ApiResponse({ status: 200, description: "Successfully searched alerts", type: [AlertResponseDTO] })
    @ApiResponse({ status: 401, description: "Unauthorized - Invalid or missing authentication" })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async findAlertsByUser(
        @Param("user") user: string, 
        @Query("sortField") sortField?: string, 
        @Query("sortOrder") sortOrder?: string
    ): Promise<AlertResponseDTO[]> {
        return this.alertService.findAlertsByUser(
            user,
            this.validateSortField(sortField),
            this.validateSortOrder(sortOrder)
        );
    }

    @Get("incident/:isUnderIncident")
    @ApiOperation({ summary: "Get alerts under an incident", description: "Retrieve alerts based on whether they are under an incident (requires authentication)" })
    @ApiParam({ name: "isUnderIncident", type: Boolean, description: "Whether the alert is under an incident" })
    @ApiQuery({ name: "sortField", required: false, enum: ["datestr", "score", "alert_name"], description: "Field to sort by" })
    @ApiQuery({ name: "sortOrder", required: false, enum: ["asc", "desc"], description: "Direction to sort" })
    @ApiResponse({ status: 200, description: "Successfully retrieved alerts", type: [AlertResponseDTO] })
    @ApiResponse({ status: 400, description: "Invalid boolean parameter" })
    @ApiResponse({ status: 401, description: "Unauthorized - Invalid or missing authentication" })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async findAlertsUnderIncident(
        @Param("isUnderIncident", ParseBoolPipe) isUnderIncident: boolean, 
        @Query("sortField") sortField?: string, 
        @Query("sortOrder") sortOrder?: string
    ): Promise<AlertResponseDTO[]> {
        return this.alertService.findAlertsUnderIncident(
            isUnderIncident,
            this.validateSortField(sortField),
            this.validateSortOrder(sortOrder)
        );
    }
}