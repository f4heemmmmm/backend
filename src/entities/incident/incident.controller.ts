import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus, ParseIntPipe, ParseFloatPipe } from "@nestjs/common";

// Incident Files Import
import { IncidentService } from "./incident.service";
import { CreateIncidentDTO, UpdateIncidentDTO, IncidentResponseDTO } from "./incident.dto";
import { AlertResponseDTO } from "../alert/alert.dto";

// Define types for sorting
type SortField = 'windows_start' | 'score' | 'user';
type SortOrder = 'asc' | 'desc';

@Controller("incident")
export class IncidentController {
    constructor(
        private readonly incidentService: IncidentService
    ) {}

    /**
     * Create a new incident
     * @param createIncidentDTO Data for creating a new incident
     * @returns The created incident
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() createIncidentDTO: CreateIncidentDTO): Promise<IncidentResponseDTO> {
        return this.incidentService.create(createIncidentDTO);
    }

    /**
     * Get all incidents with pagination, optional filtering, and sorting
     * @param queryParams Filter parameters from query string
     * @param limit Number of incidents per page (default: 10)
     * @param offset Number of incidents to skip (default: 0)
     * @param sortField Field to sort by
     * @param sortOrder Sort direction (asc or desc)
     * @returns Paginated list of incidents
     */
    @Get()
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
     * Search incidents by query string across multiple fields
     * @param query Search query string
     * @param limit Number of records to return
     * @param offset Pagination offset
     * @param sortField Field to sort by
     * @param sortOrder Sort direction (asc or desc)
     * @returns Incidents matching the search query with total count
     */
    @Get('search')
    async searchIncidents(
        @Query('query') query: string,
        @Query('limit') limit?: number,
        @Query('offset') offset?: number,
        @Query('sortField') sortField?: string,
        @Query('sortOrder') sortOrder?: string,
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
     * Get a specific incident by ID
     * @param id Incident ID
     * @returns The incident matching the ID
     */
    @Get(':id')
    async findById(@Param('id') id: string): Promise<IncidentResponseDTO> {
        return this.incidentService.findById(id);
    }

    /**
     * Get all alerts associated with an incident
     * @param incidentId Incident ID
     * @returns Array of alerts associated with the incident
     */
    @Get(':incidentId/alerts')
    async getAlertsForIncident(
        @Param('incidentId') incidentId: string
    ): Promise<AlertResponseDTO[]> {
        return this.incidentService.getAlertsForIncident(incidentId);
    }

    /**
     * Get inicidents by the user
     * @param user User
     * @returns Array of incidents related to the user
     */
    @Get("user/:user")
    async findIncidentsByUser(@Param("user") user: string): Promise<IncidentResponseDTO[]> {
        return this.incidentService.findIncidentsByUser(user);
    }

    /**
     * Get incidents within the date range
     * @param startDate Start date
     * @param endDate End date
     * @param user Optional user filter
     * @returns Array of incidents within the date range
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
     * Get incidents within a score range
     * @param minScore Minimum score
     * @param maxScore Maximum score
     * @returns Array of incidents within the score range
     */
    @Get("score-range")
    async findIncidentsByScoreRange(
        @Query("min_score", ParseFloatPipe) minScore: number,
        @Query("max_score", ParseFloatPipe) maxScore: number,
    ): Promise<IncidentResponseDTO[]> {
        return this.incidentService.findIncidentsByScoreRange(minScore, maxScore);
    }

    /**
     * Get incidents above a certain threshold
     * @params threshold Minimum score threshold
     * @returns Array of incidents with scores above the specified threshold
     */
    @Get("threshold/:threshold")
    async findIncidentsByThreshold(
        @Param("threshold", ParseFloatPipe) threshold: number
    ): Promise<IncidentResponseDTO[]> {
        return this.incidentService.findIncidentsByThreshold(threshold);
    }

    /**
     * Update an incident by ID
     * @param id Incident ID
     * @updateIncidentDTO Data for updating the incident
     * @returns The updated incident
     */
    @Put(':id')
    async updateById(
        @Param("id") id: string,
        @Body() updateIncidentDTO: UpdateIncidentDTO
    ): Promise<IncidentResponseDTO> {
        return this.incidentService.updateById(id, updateIncidentDTO);
    }

    /**
     * Delete an incident by ID
     * @param id Incident ID
     * @returns Success indicator
     */
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async removeById(
        @Param("id") id: string
    ): Promise<void> {
        await this.incidentService.removeById(id);
    }

    /**
     * Validate and convert sort field string to SortField type
     * @param sortField Field name to validate
     * @returns Valid SortField or default
     */
    private validateSortField(sortField?: string): SortField {
        const validFields: SortField[] = ['windows_start', 'score', 'user'];
        return (sortField && validFields.includes(sortField as SortField)) 
            ? sortField as SortField 
            : 'windows_start';
    }

    /**
     * Validate and convert sort order string to SortOrder type
     * @param sortOrder Order direction to validate
     * @returns Valid SortOrder or default
     */
    private validateSortOrder(sortOrder?: string): SortOrder {
        return (sortOrder && (sortOrder === 'asc' || sortOrder === 'desc')) 
            ? sortOrder as SortOrder 
            : 'desc';
    }
}