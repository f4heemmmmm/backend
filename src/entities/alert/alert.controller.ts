import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseDatePipe, HttpStatus, HttpCode, ParseBoolPipe } from "@nestjs/common";

// Alert Files Import
import { Alert } from "./alert.entity";
import { AlertService } from "./alert.service";
import { CreateAlertDTO, UpdateAlertDTO, AlertResponseDTO } from "./alert.dto";

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
     * @retuns Paginated array of alerts
     */
    @Get()
    async findAll(
        @Query() queryParams,
        @Query("limit") limit?: number,
        @Query("offset") offset?: number,
    ): Promise<{ alerts: AlertResponseDTO[]; total: number}> {
        const { limit: limitParam, offset: offsetParam, ...filters } = queryParams;
        return this.alertService.findAll(
            filters as Partial<Alert>,
            limit ? Number(limit) : undefined,
            offset ? Number(offset) : undefined
        );
    }

    /**
     * Find a single alert by the composite key
     * @param user Username
     * @param datestr Alert date
     * @param alertName Alert name
     * @returns The found alert
     */
    @Get(":user/:datestr/:alertName")
    async findOne(@Param("user") user: string, @Param("datestr", new ParseDatePipe()) datestr: Date, @Param("alertName") alertName: string): Promise<AlertResponseDTO> {
        return this.alertService.findOne(user, datestr, alertName);
    }

    /**
     * Update an existing alert by the composite key 
     * @param user Username
     * @param datestr Alert date
     * @param alertName Alert name
     * @param updateAlertDTO Alert update data
     * @returns The updated alert
     */
    @Put()
    async update(
        @Param("user") user: string,
        @Param("datestr", new ParseDatePipe()) datestr: Date,
        @Param("alertName") alertName: string,
        @Body() updateAlertDTO: UpdateAlertDTO
    ): Promise<AlertResponseDTO> {
        return this.alertService.update(user, datestr, alertName, updateAlertDTO);
    }

    /**
     * Remove an alert by the composite key
     * @param user Username
     * @param datestr Alert date
     * @param alertName Alert name
     * @returns Void
     */
    @Delete()
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(
        @Param("user") user: string,
        @Param("datestr", new ParseDatePipe()) datestr: Date,
        @Param("alertName") alertName: string
    ): Promise<void> {
        await this.alertService.remove(user, datestr, alertName);
    }

    /**
     * Find alerts by date range
     * @param startDate Start date for the range
     * @param endDate End date for the range
     * @param user Optional user filter
     * @returns Array of alerts within the date range
     */
    @Get("date-range")
    async findAlertsByDateRange(
        @Query("startDate", new ParseDatePipe()) startDate: Date,
        @Query("endDate", new ParseDatePipe()) endDate: Date,
        @Query("user") user?: string
    ): Promise<AlertResponseDTO[]> {
        return this.alertService.findAlertsByDateRange(startDate, endDate, user);
    }

    /**
     * Find alerts by MITRE tactic
     * @param tactic MITRE tactic to search for
     * @returns Array of alerts with the specified MITRE tactic 
     */
    @Get("tactic/:tactic")
    async findAlertsByMITRETactic(@Param("tactic") tactic: string): Promise<AlertResponseDTO[]> {
        return this.alertService.findAlertsByMITRETactic(tactic);
    }

    /**
     * Find alerts by MITRE technique
     * @param technique MITRE technique to search for
     * @returns Array of alerts with the specified MITRE technique
     */
    @Get("technique/:technique")
    async findAlertsByMITRETechnique(@Param("technique") technique: string): Promise<AlertResponseDTO[]> {
        return this.alertService.findAlertsByMITRETechnique(technique);
    }

    /**
     * Find alerts by user
     * @param user Username to search for
     * @returns Array of alerts under the specified user
     */
    @Get("user/:user")
    async findAlertsByUser(@Param("user") user: string): Promise<AlertResponseDTO[]> {
        return this.alertService.findAlertsByUser(user);
    }

    /**
     * Find alerts under incidents
     * @returns Array of alerts under incidents
     */
    @Get("incident/:isUnderIncident")
    async fincAlertsUnderIncident(@Param("isUnderIncident", ParseBoolPipe) isUnderIncident: boolean): Promise<AlertResponseDTO[]> {
        return this.alertService.findAlertsUnderIncident(isUnderIncident);
    }
}