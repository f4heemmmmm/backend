// backend/src/modules/incident/incident.controller.ts
import { IncidentService } from "./incident.service";
import { AlertResponseDTO } from "../alert/alert.dto";
import { JWTAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateIncidentDTO, UpdateIncidentDTO, IncidentResponseDTO } from "./incident.dto";
import { IncidentStatusHistoryResponseDTO } from "./incident-status-history.dto";
import { CreateIncidentCommentDTO, UpdateIncidentCommentDTO, IncidentCommentResponseDTO } from "./incident-comment.dto";
import { ApiTags, ApiBody, ApiQuery, ApiResponse, ApiParam, ApiOperation, ApiCookieAuth } from "@nestjs/swagger";
import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus, ParseFloatPipe, UseGuards, Request } from "@nestjs/common";

type SortOrder = "asc" | "desc";
type SortField = "windows_start" | "score" | "user";

/**
 * IncidentController for managing security incident operations with comprehensive API endpoints.
 * 
 * Enhanced with user tracking for status changes and full comment functionality:
 * - CRUD operations for incident management with validation
 * - Advanced search and filtering with flexible date and score ranges
 * - User-specific incident retrieval and threshold-based queries
 * - Alert correlation and relationship management
 * - Pagination support and flexible sorting across multiple fields
 * - JWT authentication protection for all endpoints
 * - Status change history tracking with user attribution
 * - User tracking for incident closure/reopening actions
 * - Current user extraction from JWT tokens for audit trails
 * - Complete comment system with CRUD operations and user ownership
 * - Comment timeline integration with user permissions
 */
@ApiTags("incidents")
@Controller("incident")
@UseGuards(JWTAuthGuard)
@ApiCookieAuth()
export class IncidentController {
    constructor(
        private readonly incidentService: IncidentService
    ) {}

    /**
     * Extracts current user ID from JWT token in request
     */
    private getCurrentUserId(req: any): string | undefined {
        return req.user?.sub || req.user?.id;
    }

    // =================== EXISTING INCIDENT ENDPOINTS ===================

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: "Create a new incident", description: "Creates a new incident with the provided data (requires authentication)" })
    @ApiBody({ type: CreateIncidentDTO, description: "Incident creation data" })
    @ApiResponse({ status: 201, description: "Incident successfully created", type: IncidentResponseDTO })
    @ApiResponse({ status: 400, description: "Invalid input data" })
    @ApiResponse({ status: 401, description: "Unauthorized - Invalid or missing authentication" })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async create(@Body() createIncidentDTO: CreateIncidentDTO, @Request() req): Promise<IncidentResponseDTO> {
        const currentUserId = this.getCurrentUserId(req);
        return this.incidentService.create(createIncidentDTO, currentUserId);
    }

    @Get()
    @ApiOperation({ summary: "Get all incidents", description: "Retrieves all incidents with optional filtering, pagination and sorting (requires authentication)" })
    @ApiQuery({ name: "limit", required: false, type: Number, description: "Number of incidents per page" })
    @ApiQuery({ name: "offset", required: false, type: Number, description: "Number of incidents to skip" })
    @ApiQuery({ name: "sortField", required: false, enum: ["windows_start", "score", "user"], description: "Field to sort by" })
    @ApiQuery({ name: "sortOrder", required: false, enum: ["asc", "desc"], description: "Direction to sort" })
    @ApiResponse({ status: 200, description: "Incidents successfully retrieved", schema: { type: "object", properties: { incidents: { type: "array", items: { $ref: "#/components/schemas/IncidentResponseDTO" } }, total: { type: "number" } } } })
    @ApiResponse({ status: 401, description: "Unauthorized - Invalid or missing authentication" })
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

    @Get("search")
    @ApiOperation({ summary: "Search incidents", description: "Search incidents by query string across multiple fields (requires authentication)" })
    @ApiQuery({ name: "query", type: String, description: "Search query string" })
    @ApiQuery({ name: "limit", required: false, type: Number, description: "Number of records to return", example: 10 })
    @ApiQuery({ name: "offset", required: false, type: Number, description: "Number of records to skip, pagination offset", example: 0 })
    @ApiQuery({ name: "sortField", required: false, enum: ["windows_start", "score", "user"], description: "Field to sort by" })
    @ApiQuery({ name: "sortOrder", required: false, enum: ["asc", "desc"], description: "Direction to sort by" })
    @ApiResponse({ status: 200, description: "Successfully searched incidents", schema: { type: "object", properties: { incidents: { type: "array", items: { $ref: "#/components/schemas/IncidentResponseDTO" } }, total: { type: "number" } } } })
    @ApiResponse({ status: 400, description: "Invalid search query" })
    @ApiResponse({ status: 401, description: "Unauthorized - Invalid or missing authentication" })
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

    @Get("date-range")
    @ApiOperation({ summary: "Get incidents by date range", description: "Retrieve incidents within a specified date range (requires authentication)" })
    @ApiQuery({ name: "start_date", required: true, type: String, format: "date", description: "Start date for the range" })
    @ApiQuery({ name: "end_date", required: true, type: String, format: "date", description: "End date for the range" })
    @ApiQuery({ name: "user", required: false, type: String, description: "Optional user filter" })
    @ApiResponse({ status: 200, description: "Successfully retrieved incidents in date range", type: [IncidentResponseDTO] })
    @ApiResponse({ status: 400, description: "Invalid date format" })
    @ApiResponse({ status: 401, description: "Unauthorized - Invalid or missing authentication" })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async findIncidentsByDateRange(
        @Query("start_date") startDate: Date,
        @Query("end_date") endDate: Date,
        @Query("user") user?: string,
    ): Promise<IncidentResponseDTO[]> {
        return this.incidentService.findIncidentsByDateRange(startDate, endDate, user);
    }

    @Get("score-range")
    @ApiOperation({ summary: "Get incidents by score range", description: "Retrieve incidents within a specified score range (requires authentication)" })
    @ApiQuery({ name: "min_score", required: true, type: Number, description: "Minimum score threshold" })
    @ApiQuery({ name: "max_score", required: true, type: Number, description: "Maximum score threshold" })
    @ApiResponse({ status: 200, description: "Successfully retrieved incidents in score range", type: [IncidentResponseDTO] })
    @ApiResponse({ status: 400, description: "Invalid score values" })
    @ApiResponse({ status: 401, description: "Unauthorized - Invalid or missing authentication" })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async findIncidentsByScoreRange(
        @Query("min_score", ParseFloatPipe) minScore: number,
        @Query("max_score", ParseFloatPipe) maxScore: number,
    ): Promise<IncidentResponseDTO[]> {
        return this.incidentService.findIncidentsByScoreRange(minScore, maxScore);
    }

    @Get("all")
    @ApiOperation({ summary: "Get all incidents", description: "Retrieve ALL incidents without any filtering or pagination (requires authentication)" })
    @ApiQuery({ name: "sortField", required: false, enum: ["windows_start", "score", "user"], description: "Field to sort by" })
    @ApiQuery({ name: "sortOrder", required: false, enum: ["asc", "desc"], description: "Direction to sort" })
    @ApiResponse({ status: 200, description: "All incidents successfully retrieved", type: [IncidentResponseDTO] })
    @ApiResponse({ status: 401, description: "Unauthorized - Invalid or missing authentication" })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async getAllIncidents(
        @Query("sortField") sortField?: string,
        @Query("sortOrder") sortOrder?: string,
    ): Promise<IncidentResponseDTO[]> {
        return this.incidentService.getAllIncidents(
            this.validateSortField(sortField),
            this.validateSortOrder(sortOrder)
        );
    }

    @Get("all/with-count")
    @ApiOperation({ summary: "Get all incidents with count", description: "Retrieve ALL incidents with total count, no filtering or pagination (requires authentication)" })
    @ApiQuery({ name: "sortField", required: false, enum: ["windows_start", "score", "user"], description: "Field to sort by" })
    @ApiQuery({ name: "sortOrder", required: false, enum: ["asc", "desc"], description: "Direction to sort" })
    @ApiResponse({ status: 200, description: "All incidents with count successfully retrieved", schema: { type: "object", properties: { incidents: { type: "array", items: { $ref: "#/components/schemas/IncidentResponseDTO" } }, total: { type: "number" } } } })
    @ApiResponse({ status: 401, description: "Unauthorized - Invalid or missing authentication" })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async getAllIncidentsWithCount(
        @Query("sortField") sortField?: string,
        @Query("sortOrder") sortOrder?: string,
    ): Promise<{ incidents: IncidentResponseDTO[]; total: number }> {
        return this.incidentService.getAllIncidentsWithCount(
            this.validateSortField(sortField),
            this.validateSortOrder(sortOrder)
        );
    }

    @Get(":id")
    @ApiOperation({ summary: "Get incident by ID", description: "Retrieve a single incident by its ID (requires authentication)" })
    @ApiParam({ name: "id", type: String, description: "Incident ID" })
    @ApiResponse({ status: 200, description: "Successfully retrieved incident", type: IncidentResponseDTO })
    @ApiResponse({ status: 401, description: "Unauthorized - Invalid or missing authentication" })
    @ApiResponse({ status: 404, description: "Incident not found" })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async findById(@Param("id") id: string): Promise<IncidentResponseDTO> {
        return this.incidentService.findIncidentByID(id);
    }

    @Get(":incidentID/alerts")
    @ApiOperation({ summary: "Get alerts for an incident", description: "Retrieve all alerts associated with a specific incident (requires authentication)" })
    @ApiParam({ name: "incidentID", type: String, description: "Incident ID to find alerts for" })
    @ApiResponse({ status: 200, description: "Successfully retrieved alerts for the incident", type: [AlertResponseDTO] })
    @ApiResponse({ status: 401, description: "Unauthorized - Invalid or missing authentication" })
    @ApiResponse({ status: 404, description: "Incident not found" })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async getAlertsForIncident(
        @Param("incidentID") incidentID: string
    ): Promise<AlertResponseDTO[]> {
        return this.incidentService.getAlertsForIncident(incidentID);
    }

    @Get(":id/status-history")
    @ApiOperation({ summary: "Get incident status history", description: "Retrieve the complete status change history for a specific incident (requires authentication)" })
    @ApiParam({ name: "id", type: String, description: "Incident ID to get status history for" })
    @ApiResponse({ status: 200, description: "Successfully retrieved incident status history", type: [IncidentStatusHistoryResponseDTO] })
    @ApiResponse({ status: 401, description: "Unauthorized - Invalid or missing authentication" })
    @ApiResponse({ status: 404, description: "Incident not found" })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async getIncidentStatusHistory(
        @Param("id") id: string
    ): Promise<IncidentStatusHistoryResponseDTO[]> {
        return this.incidentService.getIncidentStatusHistory(id);
    }

    @Get("user/:user")
    @ApiOperation({ summary: "Get incidents by user", description: "Retrieve all incidents associated with a specific user (requires authentication)" })
    @ApiParam({ name: "user", type: String, description: "User to search for" })
    @ApiResponse({ status: 200, description: "Successfully retrieved incidents for the user", type: [IncidentResponseDTO] })
    @ApiResponse({ status: 401, description: "Unauthorized - Invalid or missing authentication" })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async findIncidentsByUser(@Param("user") user: string): Promise<IncidentResponseDTO[]> {
        return this.incidentService.findIncidentsByUser(user);
    }

    @Get("threshold/:threshold")
    @ApiOperation({ summary: "Get incidents by threshold", description: "Retrieve all incidents with scores above a specified threshold (requires authentication)" })
    @ApiParam({ name: "threshold", type: Number, description: "Minimum score threshold" })
    @ApiResponse({ status: 200, description: "Successfully retrieved incidents above threshold", type: [IncidentResponseDTO] })
    @ApiResponse({ status: 400, description: "Invalid threshold value" })
    @ApiResponse({ status: 401, description: "Unauthorized - Invalid or missing authentication" })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async findIncidentsByThreshold(
        @Param("threshold", ParseFloatPipe) threshold: number
    ): Promise<IncidentResponseDTO[]> {
        return this.incidentService.findIncidentsByThreshold(threshold);
    }

    @Put(":id")
    @ApiOperation({ summary: "Update incident", description: "Update an existing incident by its ID with user tracking for status changes (requires authentication)" })
    @ApiParam({ name: "id", type: String, description: "Incident ID" })
    @ApiBody({ type: UpdateIncidentDTO, description: "Incident update data" })
    @ApiResponse({ status: 200, description: "Incident successfully updated", type: IncidentResponseDTO })
    @ApiResponse({ status: 400, description: "Invalid input data" })
    @ApiResponse({ status: 401, description: "Unauthorized - Invalid or missing authentication" })
    @ApiResponse({ status: 404, description: "Incident not found" })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async updateById(
        @Param("id") id: string,
        @Body() updateIncidentDTO: UpdateIncidentDTO,
        @Request() req
    ): Promise<IncidentResponseDTO> {
        const currentUserId = this.getCurrentUserId(req);
        return this.incidentService.updateById(id, updateIncidentDTO, currentUserId);
    }

    @Delete(":id")
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: "Delete incident", description: "Delete an incident by its ID (requires authentication)" })
    @ApiParam({ name: "id", type: String, description: "Incident ID" })
    @ApiResponse({ status: 204, description: "Incident successfully deleted" })
    @ApiResponse({ status: 401, description: "Unauthorized - Invalid or missing authentication" })
    @ApiResponse({ status: 404, description: "Incident not found" })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async removeById(
        @Param("id") id: string
    ): Promise<void> {
        await this.incidentService.removeById(id);
    }

    // =================== COMMENT ENDPOINTS ===================

    @Post(":id/comments")
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: "Add comment to incident", description: "Creates a new comment on a specific incident (requires authentication)" })
    @ApiParam({ name: "id", type: String, description: "Incident ID to add comment to" })
    @ApiBody({ type: CreateIncidentCommentDTO, description: "Comment creation data" })
    @ApiResponse({ status: 201, description: "Comment successfully created", type: IncidentCommentResponseDTO })
    @ApiResponse({ status: 400, description: "Invalid input data" })
    @ApiResponse({ status: 401, description: "Unauthorized - Invalid or missing authentication" })
    @ApiResponse({ status: 404, description: "Incident not found" })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async createComment(
        @Param("id") incidentId: string,
        @Body() createCommentDTO: CreateIncidentCommentDTO,
        @Request() req
    ): Promise<IncidentCommentResponseDTO> {
        const currentUserId = this.getCurrentUserId(req);
        if (!currentUserId) {
            throw new Error("User ID not found in token");
        }

        // Override incident_id from URL parameter for security
        const commentDTO: CreateIncidentCommentDTO = {
            ...createCommentDTO,
            incident_id: incidentId
        };

        return this.incidentService.createComment(commentDTO, currentUserId);
    }

    @Get(":id/comments")
    @ApiOperation({ summary: "Get incident comments", description: "Retrieve all comments for a specific incident (requires authentication)" })
    @ApiParam({ name: "id", type: String, description: "Incident ID to get comments for" })
    @ApiResponse({ status: 200, description: "Successfully retrieved incident comments", type: [IncidentCommentResponseDTO] })
    @ApiResponse({ status: 401, description: "Unauthorized - Invalid or missing authentication" })
    @ApiResponse({ status: 404, description: "Incident not found" })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async getIncidentComments(
        @Param("id") incidentId: string,
        @Request() req
    ): Promise<IncidentCommentResponseDTO[]> {
        const currentUserId = this.getCurrentUserId(req);
        return this.incidentService.getIncidentComments(incidentId, currentUserId);
    }

    @Put("comments/:commentId")
    @ApiOperation({ summary: "Update comment", description: "Update a comment by its ID (only comment owner can edit) (requires authentication)" })
    @ApiParam({ name: "commentId", type: String, description: "Comment ID to update" })
    @ApiBody({ type: UpdateIncidentCommentDTO, description: "Comment update data" })
    @ApiResponse({ status: 200, description: "Comment successfully updated", type: IncidentCommentResponseDTO })
    @ApiResponse({ status: 400, description: "Invalid input data" })
    @ApiResponse({ status: 401, description: "Unauthorized - Invalid or missing authentication" })
    @ApiResponse({ status: 403, description: "Forbidden - You can only edit your own comments" })
    @ApiResponse({ status: 404, description: "Comment not found" })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async updateComment(
        @Param("commentId") commentId: string,
        @Body() updateCommentDTO: UpdateIncidentCommentDTO,
        @Request() req
    ): Promise<IncidentCommentResponseDTO> {
        const currentUserId = this.getCurrentUserId(req);
        if (!currentUserId) {
            throw new Error("User ID not found in token");
        }

        return this.incidentService.updateComment(commentId, updateCommentDTO, currentUserId);
    }

    @Delete("comments/:commentId")
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: "Delete comment", description: "Delete a comment by its ID (only comment owner can delete) (requires authentication)" })
    @ApiParam({ name: "commentId", type: String, description: "Comment ID to delete" })
    @ApiResponse({ status: 204, description: "Comment successfully deleted" })
    @ApiResponse({ status: 401, description: "Unauthorized - Invalid or missing authentication" })
    @ApiResponse({ status: 403, description: "Forbidden - You can only delete your own comments" })
    @ApiResponse({ status: 404, description: "Comment not found" })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async deleteComment(
        @Param("commentId") commentId: string,
        @Request() req
    ): Promise<void> {
        const currentUserId = this.getCurrentUserId(req);
        if (!currentUserId) {
            throw new Error("User ID not found in token");
        }

        await this.incidentService.deleteComment(commentId, currentUserId);
    }

    @Get("comments/:commentId")
    @ApiOperation({ summary: "Get comment by ID", description: "Retrieve a specific comment by its ID (requires authentication)" })
    @ApiParam({ name: "commentId", type: String, description: "Comment ID to retrieve" })
    @ApiResponse({ status: 200, description: "Successfully retrieved comment", type: IncidentCommentResponseDTO })
    @ApiResponse({ status: 401, description: "Unauthorized - Invalid or missing authentication" })
    @ApiResponse({ status: 404, description: "Comment not found" })
    @ApiResponse({ status: 500, description: "Internal server error" })
    async getCommentById(
        @Param("commentId") commentId: string,
        @Request() req
    ): Promise<IncidentCommentResponseDTO> {
        const currentUserId = this.getCurrentUserId(req);
        return this.incidentService.getCommentById(commentId, currentUserId);
    }

    /**
     * Validates sort field parameter against allowed values.
     */
    private validateSortField(sortField?: string): SortField {
        const validFields: SortField[] = ["windows_start", "score", "user"];
        return (sortField && validFields.includes(sortField as SortField)) 
            ? sortField as SortField 
            : "windows_start";
    }

    /**
     * Validates sort order parameter for ascending/descending direction.
     */
    private validateSortOrder(sortOrder?: string): SortOrder {
        return (sortOrder && (sortOrder === "asc" || sortOrder === "desc")) 
            ? sortOrder as SortOrder 
            : "desc";
    }
}