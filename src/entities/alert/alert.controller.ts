import { Alert } from "../alert/alert.entity";
import { AlertService } from "../alert/alert.service";
import { IncidentResponseDTO } from "../incident/incident.dto";
import { CreateAlertDTO, UpdateAlertDTO, AlertResponseDTO } from "../alert/alert.dto";
import { ApiTags, ApiBody, ApiQuery, ApiResponse, ApiParam, ApiOperation } from "@nestjs/swagger";
import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseDatePipe, HttpStatus, HttpCode, ParseBoolPipe } from "@nestjs/common";

type SortOrder = "asc" | "desc";
type SortField = "datestr" | "score" | "alert_name";

@ApiTags("alerts")
@Controller("alert")
export class AlertController {
    constructor (
        private readonly alertService: AlertService
    ) {}
    
    /**
     * Validates and converts a sort field string to ensure it matches allowed field types
     * @param sortField - Field name string to validate against allowed sort fields
     * @returns Valid SortField type or default "datestr" if invalid
     */
    private validateSortField(sortField?: string): SortField {
        const validFields: SortField[] = ["datestr", "score", "alert_name"];
        return (sortField && validFields.includes(sortField as SortField))
            ? sortField as SortField
            : "datestr";
    }

    /**
     * Validates and converts a sort order string to ensure it matches allowed order types
     * @param sortOrder - Order direction string to validate (asc/desc)
     * @returns Valid SortOrder type or default "desc" if invalid
     */
    private validateSortOrder(sortOrder?: string): SortOrder {
        return (sortOrder && (sortOrder === "asc" || sortOrder === "desc"))
            ? sortOrder as SortOrder
            : "desc";
    }
    
    /**
     * Creates a new alert in the system with the provided data
     * @param createAlertDTO - Data transfer object containing alert creation information
     * @returns Promise resolving to the created alert with response DTO format
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: "Create a new alert", description: "Creates a new alert with the provided data"})
    @ApiResponse({ status: 201, description: "Alert successfully created", type: AlertResponseDTO })
    @ApiResponse({ status: 400, description: "Invalid input data" })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async create(@Body() createAlertDTO: CreateAlertDTO): Promise<AlertResponseDTO> {
        return this.alertService.create(createAlertDTO);
    }

    /**
     * Retrieves all alerts with optional filtering, pagination, and sorting capabilities
     * @param queryParams - Query parameters object containing filter criteria
     * @param limit - Maximum number of alerts to return per page
     * @param offset - Number of alerts to skip for pagination
     * @param sortField - Field name to sort alerts by
     * @param sortOrder - Sort direction, either ascending or descending
     * @returns Promise resolving to paginated alerts list with total count
     */
    @Get()
    @ApiOperation({ summary: "Get all alerts", description: "Retrieves all alerts with optional filtering, pagination and sorting" })
    @ApiQuery({ name: "limit", required: false, type: Number, description: "Number of alerts per page" })
    @ApiQuery({ name: "offset", required: false, type: Number, description: "Number of alerts to skip" })
    @ApiQuery({ name: "sortField", required: false, enum: ["datestr", "score", "alert_name"], description: "Field to sort by" })
    @ApiQuery({ name: "sortOrder", required: false, enum: ["asc", "desc"], description: "Direction to sort" })
    @ApiResponse({ status: 200, description: "Alerts successfully retrieved", schema: { type: "object", properties: { alerts: { type: "array", items: { $ref: "#/components/schemas/AlertResponseDTO" } }, total: { type: "number" } } } })
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

    /**
     * Searches alerts using a query string across multiple alert fields
     * @param query - Search term to match against alert fields
     * @param limit - Maximum number of search results to return (default: 10)
     * @param offset - Number of results to skip for pagination (default: 0)
     * @param sortField - Field name to sort search results by
     * @param sortOrder - Sort direction for search results
     * @returns Promise resolving to matching alerts with total count
     */
    @Get("search")
    @ApiOperation({ summary: "Search alerts", description: "Search alerts by query string across multiple fields" })
    @ApiQuery({ name: "query", type: String, description: "Search query string" })
    @ApiQuery({ name: "limit", type: Number, description: "Number of records to return", example: 10 })
    @ApiQuery({ name: "offset", type: Number, description: "Number of records to skip, pagination offset", example: 0 })
    @ApiQuery({ name: "sortField", required: false, enum: ["datestr", "score", "alert_name"], description: "Field to sort by" })
    @ApiQuery({ name: "sortOrder", required: false, enum: ["asc", "desc"], description: "Direction to sort by" })
    @ApiResponse({ status: 200, description: "Successfully searched alerts", schema: { type: "object", properties: { alerts: { type: "array", items: { $ref: "#/components/schemas/AlertResponseDTO" } }, total: { type: "number" } } } })
    @ApiResponse({ status: 400, description: "Invalid search query"})
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

    /**
     * Retrieves alerts that occurred within a specified date range with optional user filtering
     * @param startDate - Beginning date of the range to filter alerts
     * @param endDate - End date of the range to filter alerts
     * @param user - Optional user filter to narrow results to specific user
     * @param sortField - Field name to sort the results by
     * @param sortOrder - Sort direction for the results
     * @returns Promise resolving to array of alerts within the date range
     */
    @Get("date-range")
    @ApiOperation({ summary: "Get alerts by the date range", description: "Retrieve all alerts within a specific date range" })
    @ApiQuery({ name: "startDate", required: true, type: String, format: "date", description: "Start date for the date range" })    
    @ApiQuery({ name: "endDate", required: true, type: String, format: "date", description: "End date for the date range" })
    @ApiQuery({ name: "user", required: false, type: String, description: "Optional user filter" })
    @ApiQuery({ name: "sortField", required: false, enum: ["datestr", "score", "alert_name"], description: "Field to sort by" })
    @ApiQuery({ name: "sortOrder", required: false, enum: ["asc", "desc"], description: "Direction to sort" })
    @ApiResponse({ status: 200, description: "Successfully searched alerts", type: [AlertResponseDTO] })
    @ApiResponse({ status: 400, description: "Invalid date format" })
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

    /**
     * Retrieves all alerts from the system without any filtering or pagination applied
     * @param sortField - Field name to sort all alerts by
     * @param sortOrder - Sort direction for the complete alert list
     * @returns Promise resolving to array containing all alerts in the system
     */
    @Get("all")
    @ApiOperation({ summary: "Get all alerts", description: "Retrieve ALL alerts without any filtering or pagination" })
    @ApiQuery({ name: "sortField", required: false, enum: ["datestr", "score", "alert_name"], description: "Field to sort by" })
    @ApiQuery({ name: "sortOrder", required: false, enum: ["asc", "desc"], description: "Direction to sort" })
    @ApiResponse({ status: 200, description: "All alerts successfully retrieved", type: [AlertResponseDTO] })
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

    /**
     * Retrieves all alerts with total count metadata without filtering or pagination
     * @param sortField - Field name to sort all alerts by
     * @param sortOrder - Sort direction for the complete alert list
     * @returns Promise resolving to object containing all alerts and total count
     */
    @Get("all/with-count")
    @ApiOperation({ summary: "Get all alerts with count", description: "Retrieve ALL alerts with total count, no filtering or pagination" })
    @ApiQuery({ name: "sortField", required: false, enum: ["datestr", "score", "alert_name"], description: "Field to sort by" })
    @ApiQuery({ name: "sortOrder", required: false, enum: ["asc", "desc"], description: "Direction to sort" })
    @ApiResponse({ status: 200, description: "All alerts with count successfully retrieved", schema: { type: "object", properties: { alerts: { type: "array", items: { $ref: "#/components/schemas/AlertResponseDTO" } }, total: { type: "number" } } } })
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

    /**
     * Retrieves a specific alert using its unique identifier
     * @param id - Unique identifier of the alert to retrieve
     * @returns Promise resolving to the alert matching the provided ID
     */
    @Get(":id")
    @ApiOperation({ summary: "Get alert by the alert ID", description: "Retrieve a single alert by its ID" })
    @ApiParam({ name: "id", type: String, description: "Alert ID" })
    @ApiResponse({ status: 200, description: "Successfully received alert", type: AlertResponseDTO })
    @ApiResponse({ status: 404, description: "Alert not found" })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async findAlertByID(@Param("id") id: string): Promise<AlertResponseDTO> {
        return this.alertService.findAlertByID(id);
    }

    /**
     * Retrieves the incident that is associated with a specific alert
     * @param alertID - Unique identifier of the alert to find the related incident for
     * @returns Promise resolving to the incident associated with the alert, or null if none exists
     */
    @Get(":alertID/incident")
    @ApiOperation({ summary: "Get incident for an alert", description: "Retrieve the incident associated with an alert" })
    @ApiParam({ name: "alertID", type: String, description: "Alert ID to find the related incident" })
    @ApiResponse({ status: 200, description: "Successfully retrieved incident", type: IncidentResponseDTO })
    @ApiResponse({ status: 204, description: "No incident associated with this alert" })
    @ApiResponse({ status: 404, description: "Alert not found" })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async getIncidentForAlert(@Param("alertID") alertID: string): Promise<IncidentResponseDTO | null> {
        return this.alertService.getIncidentForAlert(alertID);
    }

    /**
     * Retrieves all alerts that are associated with a specific incident
     * @param incidentID - Unique identifier of the incident to find alerts for
     * @param sortField - Field name to sort the results by
     * @param sortOrder - Sort direction for the results
     * @returns Promise resolving to array of alerts associated with the specified incident
     */
    @Get("incident-id/:incidentID")
    @ApiOperation({ summary: "Get alerts by incident ID", description: "Retrieve all alerts associated with a specific incident" })
    @ApiParam({ name: "incidentID", type: String, description: "Incident ID to find" })
    @ApiQuery({ name: "sortField", required: false, enum: ["datestr", "score", "alert_name"], description: "Field to sort by" })
    @ApiQuery({ name: "sortOrder", required: false, enum: ["asc", "desc"], description: "Direction to sort" })
    @ApiResponse({ status: 200, description: "Successfully retrieved alerts related to the incident", type: [AlertResponseDTO] })
    @ApiResponse({ status: 400, description: "Incident not found" })
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

    /**
     * Updates an existing alert with new data using its unique identifier
     * @param id - Unique identifier of the alert to update
     * @param updateAlertDTO - Data transfer object containing updated alert information
     * @returns Promise resolving to the updated alert with response DTO format
     */
    @Put(":id")
    @ApiOperation({ summary: "Update alert", description: "Update an existing alert by its ID" })
    @ApiParam({ name: "id", type: String, description: "Alert ID" })
    @ApiBody({ type: UpdateAlertDTO, description: "Alert update data" })
    @ApiResponse({ status: 200, description: "Alert successfully updated", type: AlertResponseDTO })
    @ApiResponse({ status: 400, description: "Invalid input data" })
    @ApiResponse({ status: 404, description: "Alert not found" })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async updateAlertByID(@Param("id") id: string, @Body() updateAlertDTO: UpdateAlertDTO): Promise<AlertResponseDTO> {
        return this.alertService.updateAlertByID(id, updateAlertDTO);
    }

    /**
     * Permanently removes an alert from the system using its unique identifier
     * @param id - Unique identifier of the alert to delete
     * @returns Promise that resolves when the alert has been successfully deleted
     */
    @Delete(":id")
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: "Delete alert", description: "Delete an alert by its ID" })
    @ApiParam({ name: "id", type: String, description: "Alert ID" })
    @ApiResponse({ status: 204, description: "Alert successfully deleted" })
    @ApiResponse({ status: 404, description: "Alert not found" })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async removeAlertByID(@Param("id") id: string): Promise<void> {
        await this.alertService.removeAlertByID(id);
    }

    /**
     * Retrieves all alerts associated with a specific MITRE ATT&CK tactic
     * @param tactic - MITRE tactic identifier to search for alerts
     * @param sortField - Field name to sort the results by
     * @param sortOrder - Sort direction for the results
     * @returns Promise resolving to array of alerts associated with the specified MITRE tactic
     */
    @Get("tactic/:tactic")
    @ApiOperation({ summary: "Get alerts by MITRE tactic", description: "Retrieve all alerts used by a MITRE tactic" })
    @ApiParam({ name: "tactic", type: String, description: "MITRE tactic to search for" })
    @ApiQuery({ name: "sortField", required: false, enum: ["datestr", "score", "alert_name"], description: "Field to sort by" })
    @ApiQuery({ name: "sortOrder", required: false, enum: ["asc", "desc"], description: "Direction to sort" })
    @ApiResponse({ status: 200, description: "Successfully searched alerts", type: [AlertResponseDTO] })
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

    /**
     * Retrieves all alerts associated with a specific MITRE ATT&CK technique
     * @param technique - MITRE technique identifier to search for alerts
     * @param sortField - Field name to sort the results by
     * @param sortOrder - Sort direction for the results
     * @returns Promise resolving to array of alerts associated with the specified MITRE technique
     */
    @Get("technique/:technique")
    @ApiOperation({ summary: "Get alerts by MITRE technique", description: "Retrieve all alerts used by a MITRE technique" })
    @ApiParam({ name: "technique", type: String, description: "MITRE technique to search for" })
    @ApiQuery({ name: "sortField", required: false, enum: ["datestr", "score", "alert_name"], description: "Field to sort by" })
    @ApiQuery({ name: "sortOrder", required: false, enum: ["asc", "desc"], description: "Direction to sort" })
    @ApiResponse({ status: 200, description: "Successfully searched alerts", type: [AlertResponseDTO] })
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

    /**
     * Retrieves all alerts associated with a specific user
     * @param user - Username or user identifier to filter alerts by
     * @param sortField - Field name to sort the results by
     * @param sortOrder - Sort direction for the results
     * @returns Promise resolving to array of alerts belonging to the specified user
     */
    @Get("user/:user")
    @ApiOperation({ summary: "Get alerts by username", description: "Retrieve all alerts under a user" })
    @ApiParam({ name: "user", type: String, description: "User to search for" })
    @ApiQuery({ name: "sortField", required: false, enum: ["datestr", "score", "alert_name"], description: "Field to sort by" })
    @ApiQuery({ name: "sortOrder", required: false, enum: ["asc", "desc"], description: "Direction to sort" })
    @ApiResponse({ status: 200, description: "Successfully searched alerts", type: [AlertResponseDTO] })
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

    /**
     * Retrieves alerts based on whether they are associated with an incident or not
     * @param isUnderIncident - Boolean flag indicating whether to fetch alerts under incidents or standalone alerts
     * @param sortField - Field name to sort the results by
     * @param sortOrder - Sort direction for the results
     * @returns Promise resolving to array of alerts based on incident association status
     */
    @Get("incident/:isUnderIncident")
    @ApiOperation({ summary: "Get alerts under an incident", description: "Retrieve alerts based on whether they are under an incident" })
    @ApiParam({ name: "isUnderIncident", type: Boolean, description: "Whether the alert is under an incident" })
    @ApiQuery({ name: "sortField", required: false, enum: ["datestr", "score", "alert_name"], description: "Field to sort by" })
    @ApiQuery({ name: "sortOrder", required: false, enum: ["asc", "desc"], description: "Direction to sort" })
    @ApiResponse({ status: 200, description: "Successfully retrieved alerts", type: [AlertResponseDTO] })
    @ApiResponse({ status: 400, description: "Invalid boolean parameter" })
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