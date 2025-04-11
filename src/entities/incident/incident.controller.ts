import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus, ParseIntPipe, ParseFloatPipe } from "@nestjs/common";

// Incident Files Import
import { IncidentService } from "./incident.service";
import { CreateIncidentDTO, UpdateIncidentDTO, IncidentResponseDTO } from "./incident.dto";

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
     * Get all incidents with pagination and optional user filtering
     * @param user Optional user filter
     * @param limit Number of incidents per page (default: 10)
     * @param offset Number of incidents to skip (default: 0)
     * @returns Paginated list of incidents
     */
    @Get()
    async findAll(
        @Query("user") user?: string,
        @Query("limit") limit?: number,
        @Query("offset") offset?: number,
    ): Promise<{ incidents: IncidentResponseDTO[]; total: number}> {
        return this.incidentService.findAll(
            user,
            limit ? Number(limit) : undefined,
            offset ? Number(offset) : undefined
        );
    }

    /**
     * Get a specific incident by the composite key
     * @param user Username
     * @param windowsStart Start of time window
     * @param windowsEnd End of time window
     * @returns The incident matching the composite key
     */
    @Get("find")
    async findOne(
        @Query("user") user: string,
        @Query("windows_start") windowsStart: Date,
        @Query("windows_end") windowsEnd: Date,
    ): Promise<IncidentResponseDTO> {
        return this.incidentService.findOne(user, windowsStart, windowsEnd)
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
     * @returns Array of incidents withint the date range
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
    async findIncidentsByThreshold(
        @Query("threshold", ParseFloatPipe) threshold: number
    ): Promise<IncidentResponseDTO[]> {
        return this.incidentService.findIncidentsByThreshold(threshold);
    }

    /**
     * Update an incident using its composite key
     * @param user Username
     * @windowsStart Start of time window
     * @windowsEnd End of time window
     * @updateIncidentDTO Data for updating the incident
     * @returns The updated incident
     */
    @Put()
    async update(
        @Query("user") user: string,
        @Query("windows_start") windowsStart: Date,
        @Query("windows_end") windowsEnd: Date,
        @Body() UpdateIncidentDTO: UpdateIncidentDTO
    ): Promise<IncidentResponseDTO> {
        return this.incidentService.update(user, windowsStart, windowsEnd, UpdateIncidentDTO);
    }

    /**
     * Delete an incident using its composite key
     * @param user Username
     * @param windowsStart Start of time window
     * @param windowsEnd End of time window
     * @returns Success indicator
     */
    @Delete()
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(
        @Query("user") user: string,
        @Query("windows_start") windowsStart: Date,
        @Query("windows_end") windowsEnd: Date
    ): Promise<void> {
        const result = await this.incidentService.remove(user, windowsStart, windowsEnd);
    }
}