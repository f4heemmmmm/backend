// backend/src/entities/incident/incident.controller.ts

import { IncidentService } from "./incident.service";
import { AlertResponseDTO } from "../alert/alert.dto";
import { CreateIncidentDTO, UpdateIncidentDTO, IncidentResponseDTO } from "./incident.dto";
import { ApiTags, ApiBody, ApiQuery, ApiResponse, ApiParam, ApiOperation } from "@nestjs/swagger";
import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus, ParseFloatPipe } from "@nestjs/common";

type SortOrder = "asc" | "desc";
type SortField = "windows_start" | "score" | "user";

@ApiTags("incidents")
@Controller("incident")
export class IncidentController {
    constructor(
        private readonly incidentService: IncidentService
    ) {}

    /**
     * Creates a new incident in the system
     * @param createIncidentDTO - Data transfer object containing incident creation data
     * @returns Promise resolving to the created incident with response DTO format
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: "Create a new incident", description: "Creates a new incident with the provided data" })
    @ApiBody({ type: CreateIncidentDTO, description: "Incident creation data" })
    @ApiResponse({ status: 201, description: "Incident successfully created", type: IncidentResponseDTO })
    @ApiResponse({ status: 400, description: "Invalid input data" })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async create(@Body() createIncidentDTO: CreateIncidentDTO): Promise<IncidentResponseDTO> {
        return this.incidentService.create(createIncidentDTO);
    }

    /**
     * Retrieves all incidents with optional pagination, filtering, and sorting capabilities
     * @param queryParams - Query parameters object containing filter criteria
     * @param limit - Maximum number of incidents to return per page (default: undefined)
     * @param offset - Number of incidents to skip for pagination (default: undefined)
     * @param sortField - Field name to sort incidents by
     * @param sortOrder - Sort direction, either ascending or descending
     * @returns Promise resolving to paginated incidents list with total count
     */
    @Get()
    @ApiOperation({ summary: "Get all incidents", description: "Retrieves all incidents with optional filtering, pagination and sorting" })
    @ApiQuery({ name: "limit", required: false, type: Number, description: "Number of incidents per page" })
    @ApiQuery({ name: "offset", required: false, type: Number, description: "Number of incidents to skip" })
    @ApiQuery({ name: "sortField", required: false, enum: ["windows_start", "score", "user"], description: "Field to sort by" })
    @ApiQuery({ name: "sortOrder", required: false, enum: ["asc", "desc"], description: "Direction to sort" })
    @ApiResponse({ status: 200, description: "Incidents successfully retrieved", schema: { type: "object", properties: { incidents: { type: "array", items: { $ref: "#/components/schemas/IncidentResponseDTO" } }, total: { type: "number" } } } })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async findAll(
        @Query() queryParams,
        @Query("limit") limit?: number,
        @Query("offset") offset?: number,
        @Query("sortField") sortField?: string,
        @Query("sortOrder") sortOrder?: string,
    ): Promise<{ incidents: IncidentResponseDTO[]; total: number}> {
        const { limit: limitParam, offset: offsetParam, sortField: sortFieldParam, sortOrder: sortOrderParam, ...filters } = queryParams;
        return this.incidentService.findAll(
            filters,
            limit ? Number(limit) : undefined,
            offset ? Number(offset) : undefined,
            this.validateSortField(sortField),
            this.validateSortOrder(sortOrder)
        );
    }

    /**
     * Searches incidents using a query string across multiple incident fields
     * @param query - Search term to match against incident fields
     * @param limit - Maximum number of search results to return (default: 10)
     * @param offset - Number of results to skip for pagination (default: 0)
     * @param sortField - Field name to sort search results by
     * @param sortOrder - Sort direction for search results
     * @returns Promise resolving to matching incidents with total count
     */
    @Get("search")
    @ApiOperation({ summary: "Search incidents", description: "Search incidents by query string across multiple fields" })
    @ApiQuery({ name: "query", type: String, description: "Search query string" })
    @ApiQuery({ name: "limit", required: false, type: Number, description: "Number of records to return", example: 10 })
    @ApiQuery({ name: "offset", required: false, type: Number, description: "Number of records to skip, pagination offset", example: 0 })
    @ApiQuery({ name: "sortField", required: false, enum: ["windows_start", "score", "user"], description: "Field to sort by" })
    @ApiQuery({ name: "sortOrder", required: false, enum: ["asc", "desc"], description: "Direction to sort by" })
    @ApiResponse({ status: 200, description: "Successfully searched incidents", schema: { type: "object", properties: { incidents: { type: "array", items: { $ref: "#/components/schemas/IncidentResponseDTO" } }, total: { type: "number" } } } })
    @ApiResponse({ status: 400, description: "Invalid search query" })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async searchIncidents(
        @Query("query") query: string,
        @Query("limit") limit?: number,
        @Query("offset") offset?: number,
        @Query("sortField") sortField?: string,
        @Query("sortOrder") sortOrder?: string,
    ): Promise<{ incidents: IncidentResponseDTO[]; total: number }> {
        return this.incidentService.searchIncidents(
            query,
            limit ? Number(limit) : 10,
            offset ? Number(offset) : 0,
            this.validateSortField(sortField),
            this.validateSortOrder(sortOrder)
        );
    }

    /**
     * Retrieves incidents that occurred within a specified date range
     * @param startDate - Beginning date of the range to filter incidents
     * @param endDate - End date of the range to filter incidents
     * @param user - Optional user filter to narrow results to specific user
     * @returns Promise resolving to array of incidents within the date range
     */
    @Get("date-range")
    async findIncidentsByDateRange(
        @Query("start_date") startDate: Date,
        @Query("end_date") endDate: Date,
        @Query("user") user?: string,
    ): Promise<IncidentResponseDTO[]> {
        return this.incidentService.findIncidentsByDateRange(startDate, endDate, user);
    }

    /**
     * Retrieves incidents with scores falling within a specified numeric range
     * @param minScore - Minimum score threshold for filtering incidents
     * @param maxScore - Maximum score threshold for filtering incidents
     * @returns Promise resolving to array of incidents within the score range
     */
    @Get("score-range")
    async findIncidentsByScoreRange(
        @Query("min_score", ParseFloatPipe) minScore: number,
        @Query("max_score", ParseFloatPipe) maxScore: number,
    ): Promise<IncidentResponseDTO[]> {
        return this.incidentService.findIncidentsByScoreRange(minScore, maxScore);
    }

    /**
     * Retrieves all incidents from the system without any filtering or pagination applied
     * @param sortField - Field name to sort all incidents by
     * @param sortOrder - Sort direction for the complete incident list
     * @returns Promise resolving to array containing all incidents in the system
     */
    @Get("all")
    async getAllIncidents(
        @Query("sortField") sortField?: string,
        @Query("sortOrder") sortOrder?: string,
    ): Promise<IncidentResponseDTO[]> {
        return this.incidentService.getAllIncidents(
            this.validateSortField(sortField),
            this.validateSortOrder(sortOrder)
        );
    }

    /**
     * Retrieves all incidents with total count metadata without filtering or pagination
     * @param sortField - Field name to sort all incidents by
     * @param sortOrder - Sort direction for the complete incident list
     * @returns Promise resolving to object containing all incidents and total count
     */
    @Get("all/with-count")
    async getAllIncidentsWithCount(
        @Query("sortField") sortField?: string,
        @Query("sortOrder") sortOrder?: string,
    ): Promise<{ incidents: IncidentResponseDTO[]; total: number }> {
        return this.incidentService.getAllIncidentsWithCount(
            this.validateSortField(sortField),
            this.validateSortOrder(sortOrder)
        );
    }

    /**
     * Retrieves a specific incident using its unique identifier
     * @param id - Unique identifier of the incident to retrieve
     * @returns Promise resolving to the incident matching the provided ID
     */
    @Get(":id")
    @ApiOperation({ summary: "Get incident by ID", description: "Retrieve a single incident by its ID" })
    @ApiParam({ name: "id", type: String, description: "Incident ID" })
    @ApiResponse({ status: 200, description: "Successfully retrieved incident", type: IncidentResponseDTO })
    @ApiResponse({ status: 404, description: "Incident not found" })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async findById(@Param("id") id: string): Promise<IncidentResponseDTO> {
        return this.incidentService.findIncidentByID(id);
    }

    /**
     * Retrieves all alerts that are associated with a specific incident
     * @param incidentID - Unique identifier of the incident to get alerts for
     * @returns Promise resolving to array of alerts linked to the specified incident
     */
    @Get(":incidentID/alerts")
    @ApiOperation({ summary: "Get alerts for an incident", description: "Retrieve all alerts associated with a specific incident" })
    @ApiParam({ name: "incidentID", type: String, description: "Incident ID to find alerts for" })
    @ApiResponse({ status: 200, description: "Successfully retrieved alerts for the incident", type: [AlertResponseDTO] })
    @ApiResponse({ status: 404, description: "Incident not found" })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async getAlertsForIncident(
        @Param("incidentID") incidentID: string
    ): Promise<AlertResponseDTO[]> {
        return this.incidentService.getAlertsForIncident(incidentID);
    }

    /**
     * Retrieves all incidents associated with a specific user
     * @param user - Username or user identifier to filter incidents by
     * @returns Promise resolving to array of incidents belonging to the specified user
     */
    @Get("user/:user")
    @ApiOperation({ summary: "Get incidents by user", description: "Retrieve all incidents associated with a specific user" })
    @ApiParam({ name: "user", type: String, description: "User to search for" })
    @ApiResponse({ status: 200, description: "Successfully retrieved incidents for the user", type: [IncidentResponseDTO] })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async findIncidentsByUser(@Param("user") user: string): Promise<IncidentResponseDTO[]> {
        return this.incidentService.findIncidentsByUser(user);
    }

    /**
     * Retrieves incidents that have scores above a specified threshold value
     * @param threshold - Minimum score value that incidents must exceed
     * @returns Promise resolving to array of incidents with scores above the threshold
     */
    @Get("threshold/:threshold")
    @ApiOperation({ summary: "Get incidents by threshold", description: "Retrieve all incidents with scores above a specified threshold" })
    @ApiParam({ name: "threshold", type: Number, description: "Minimum score threshold" })
    @ApiResponse({ status: 200, description: "Successfully retrieved incidents above threshold", type: [IncidentResponseDTO] })
    @ApiResponse({ status: 400, description: "Invalid threshold value" })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async findIncidentsByThreshold(
        @Param("threshold", ParseFloatPipe) threshold: number
    ): Promise<IncidentResponseDTO[]> {
        return this.incidentService.findIncidentsByThreshold(threshold);
    }

    /**
     * Updates an existing incident with new data using its unique identifier
     * @param id - Unique identifier of the incident to update
     * @param updateIncidentDTO - Data transfer object containing updated incident information
     * @returns Promise resolving to the updated incident with response DTO format
     */
    @Put(":id")
    @ApiOperation({ summary: "Update incident", description: "Update an existing incident by its ID" })
    @ApiParam({ name: "id", type: String, description: "Incident ID" })
    @ApiBody({ type: UpdateIncidentDTO, description: "Incident update data" })
    @ApiResponse({ status: 200, description: "Incident successfully updated", type: IncidentResponseDTO })
    @ApiResponse({ status: 400, description: "Invalid input data" })
    @ApiResponse({ status: 404, description: "Incident not found" })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async updateById(
        @Param("id") id: string,
        @Body() updateIncidentDTO: UpdateIncidentDTO
    ): Promise<IncidentResponseDTO> {
        return this.incidentService.updateById(id, updateIncidentDTO);
    }

    /**
     * Permanently removes an incident from the system using its unique identifier
     * @param id - Unique identifier of the incident to delete
     * @returns Promise that resolves when the incident has been successfully deleted
     */
    @Delete(":id")
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: "Delete incident", description: "Delete an incident by its ID" })
    @ApiParam({ name: "id", type: String, description: "Incident ID" })
    @ApiResponse({ status: 204, description: "Incident successfully deleted" })
    @ApiResponse({ status: 404, description: "Incident not found" })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async removeById(
        @Param("id") id: string
    ): Promise<void> {
        await this.incidentService.removeById(id);
    }

    /**
     * Validates and converts a sort field string to ensure it matches allowed field types
     * @param sortField - Field name string to validate against allowed sort fields
     * @returns Valid SortField type or default "windows_start" if invalid
     */
    private validateSortField(sortField?: string): SortField {
        const validFields: SortField[] = ["windows_start", "score", "user"];
        return (sortField && validFields.includes(sortField as SortField)) 
            ? sortField as SortField 
            : "windows_start";
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
}