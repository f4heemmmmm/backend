// REFACTOR

import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseDatePipe, HttpStatus, HttpCode, ParseBoolPipe } from "@nestjs/common";

// Alert Files Import
import { Alert } from "./alert.entity";
import { AlertService } from "./alert.service";
import { CreateAlertDTO, UpdateAlertDTO, AlertResponseDTO } from "./alert.dto";
import { IncidentResponseDTO } from "../incident/incident.dto";

// Define types for sorting to match the service
type SortField = 'datestr' | 'score' | 'alert_name';
type SortOrder = 'asc' | 'desc';

@Controller("alert")
export class AlertController {
    constructor (
        private readonly alertService: AlertService
    ) {}

    /**
     * Create a new alert
     * @param createAlertDTO Alert creation data
     * @returns The created alert
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() createAlertDTO: CreateAlertDTO): Promise<AlertResponseDTO> {
        return this.alertService.create(createAlertDTO);
    }

    /**
     * Get all alerts with optional filtering
     * @param queryParams Filter parameters from query string
     * @param limit Number of alerts per page 
     * @param offset Number of alerts to skip
     * @param sortField Field to sort by
     * @param sortOrder Sort direction (asc or desc)
     * @returns Paginated array of alerts
     */
    @Get()
    async findAll(
        @Query() queryParams,
        @Query("limit") limit?: number,
        @Query("offset") offset?: number,
        @Query("sortField") sortField?: string,
        @Query("sortOrder") sortOrder?: string,
    ): Promise<{ alerts: AlertResponseDTO[]; total: number}> {
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
     * Search alerts by query string across multiple fields
     * @param query Search query string
     * @param limit Number of records to return
     * @param offset Pagination offset
     * @param sortField Field to sort by
     * @param sortOrder Sort direction (asc or desc)
     * @returns Alerts matching the search query with total count
     */
     @Get('search')
     async searchAlerts(
         @Query('query') query: string,
         @Query('limit') limit?: number,
         @Query('offset') offset?: number,
         @Query('sortField') sortField?: string,
         @Query('sortOrder') sortOrder?: string,
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
     * Find a single alert by ID
     * @param id Alert ID
     * @returns The found alert
     */
    @Get(":id")
    async findById(@Param("id") id: string): Promise<AlertResponseDTO> {
        return this.alertService.findById(id);
    }

    /**
     * Get the incident associated with an alert
     * @param alertId Alert ID to find the related incident for
     * @returns The associated incident or null
     */
    @Get(':alertId/incident')
    async getIncidentForAlert(
        @Param('alertId') alertId: string
    ): Promise<IncidentResponseDTO | null> {
        return this.alertService.getIncidentForAlert(alertId);
    }

    /**
     * Find alerts by incident ID
     * @param incidentId Incident ID to search for
     * @param sortField Field to sort by
     * @param sortOrder Sort direction (asc or desc)
     * @returns Array of alerts associated with the specified incident
     */
    @Get('incident-id/:incidentId')
    async findAlertsByIncidentId(
        @Param('incidentId') incidentId: string,
        @Query("sortField") sortField?: string,
        @Query("sortOrder") sortOrder?: string,
    ): Promise<AlertResponseDTO[]> {
        return this.alertService.findAlertsByIncidentId(
            incidentId,
            this.validateSortField(sortField),
            this.validateSortOrder(sortOrder)
        );
    }

    /**
     * Update an existing alert by ID 
     * @param id Alert ID
     * @param updateAlertDTO Alert update data
     * @returns The updated alert
     */
    @Put(':id')
    async updateById(
        @Param("id") id: string,
        @Body() updateAlertDTO: UpdateAlertDTO
    ): Promise<AlertResponseDTO> {
        return this.alertService.updateById(id, updateAlertDTO);
    }

    /**
     * Remove an alert by ID
     * @param id Alert ID
     * @returns Void
     */
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async removeById(
        @Param("id") id: string
    ): Promise<void> {
        await this.alertService.removeById(id);
    }

    /**
     * Find alerts by date range
     * @param startDate Start date for the range
     * @param endDate End date for the range
     * @param user Optional user filter
     * @param sortField Field to sort by
     * @param sortOrder Sort direction (asc or desc)
     * @returns Array of alerts within the date range
     */
    @Get("date-range")
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
     * Find alerts by MITRE tactic
     * @param tactic MITRE tactic to search for
     * @param sortField Field to sort by
     * @param sortOrder Sort direction (asc or desc)
     * @returns Array of alerts with the specified MITRE tactic 
     */
    @Get("tactic/:tactic")
    async findAlertsByMITRETactic(
        @Param("tactic") tactic: string,
        @Query("sortField") sortField?: string,
        @Query("sortOrder") sortOrder?: string,
    ): Promise<AlertResponseDTO[]> {
        return this.alertService.findAlertsByMITRETactic(
            tactic,
            this.validateSortField(sortField),
            this.validateSortOrder(sortOrder)
        );
    }

    /**
     * Find alerts by MITRE technique
     * @param technique MITRE technique to search for
     * @param sortField Field to sort by
     * @param sortOrder Sort direction (asc or desc)
     * @returns Array of alerts with the specified MITRE technique
     */
    @Get("technique/:technique")
    async findAlertsByMITRETechnique(
        @Param("technique") technique: string,
        @Query("sortField") sortField?: string,
        @Query("sortOrder") sortOrder?: string,
    ): Promise<AlertResponseDTO[]> {
        return this.alertService.findAlertsByMITRETechnique(
            technique,
            this.validateSortField(sortField),
            this.validateSortOrder(sortOrder)
        );
    }

    /**
     * Find alerts by user
     * @param user Username to search for
     * @param sortField Field to sort by
     * @param sortOrder Sort direction (asc or desc)
     * @returns Array of alerts under the specified user
     */
    @Get("user/:user")
    async findAlertsByUser(
        @Param("user") user: string,
        @Query("sortField") sortField?: string,
        @Query("sortOrder") sortOrder?: string,
    ): Promise<AlertResponseDTO[]> {
        return this.alertService.findAlertsByUser(
            user,
            this.validateSortField(sortField),
            this.validateSortOrder(sortOrder)
        );
    }

    /**
     * Find alerts under incidents
     * @param isUnderIncident Whether the alert is under an incident
     * @param sortField Field to sort by
     * @param sortOrder Sort direction (asc or desc)
     * @returns Array of alerts under incidents
     */
    @Get("incident/:isUnderIncident")
    async fincAlertsUnderIncident(
        @Param("isUnderIncident", ParseBoolPipe) isUnderIncident: boolean,
        @Query("sortField") sortField?: string,
        @Query("sortOrder") sortOrder?: string,
    ): Promise<AlertResponseDTO[]> {
        return this.alertService.findAlertsUnderIncident(
            isUnderIncident,
            this.validateSortField(sortField),
            this.validateSortOrder(sortOrder)
        );
    }

   

    /**
     * Validate and convert sort field string to SortField type
     * @param sortField Field name to validate
     * @returns Valid SortField or default
     */
    private validateSortField(sortField?: string): SortField {
        const validFields: SortField[] = ['datestr', 'score', 'alert_name'];
        return (sortField && validFields.includes(sortField as SortField)) 
            ? sortField as SortField 
            : 'datestr';
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

    @Put(':alertId/associate/:incidentId')
    async associateWithIncident(
        @Param('alertId') alertId: string,
        @Param('incidentId') incidentId: string
    ): Promise<AlertResponseDTO> {
        return this.alertService.associateWithIncident(alertId, incidentId);
    }
}