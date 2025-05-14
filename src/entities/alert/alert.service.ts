import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsWhere, Between, ILike, FindOptionsOrder } from "typeorm";
import { Injectable, NotFoundException, ConflictException, Inject, forwardRef } from "@nestjs/common";

// Alert Files Import
import { Alert } from "./alert.entity";
import { CreateAlertDTO, UpdateAlertDTO, AlertResponseDTO } from "./alert.dto";
import { IncidentService } from "../incident/incident.service";
import { IncidentResponseDTO } from "../incident/incident.dto";
import { Incident } from "../incident/incident.entity";

// Define types for sorting
type SortField = 'datestr' | 'score' | 'alert_name';
type SortOrder = 'asc' | 'desc';

@Injectable()
export class AlertService {
    constructor(
        @InjectRepository(Alert)
        private readonly alertRepository: Repository<Alert>,
        private readonly incidentService: IncidentService
    ) {}

    private mapToResponseDTO(alert: Alert): AlertResponseDTO {
        return {
            ID: alert.ID,
            user: alert.user,
            datestr: alert.datestr,
            evidence: alert.evidence,
            score: alert.score,
            alert_name: alert.alert_name,
            MITRE_tactic: alert.MITRE_tactic,
            MITRE_technique: alert.MITRE_technique,
            Logs: alert.Logs,
            Detection_model: alert.Detection_model,
            Description: alert.Description,
            isUnderIncident: alert.isUnderIncident,
            incidentId: alert.incidentId,
            created_at: alert.created_at,
            updated_at: alert.updated_at
        };
    }

    /**
     * Create a new alert
     * @param createAlertDTO Alert creation data
     * @returns The created alert
     */
    // alert.service.ts (partial update for create method)
    async create(createAlertDTO: CreateAlertDTO): Promise<AlertResponseDTO> {
        const checkExistingAlert = await this.alertRepository.findOne({
            where: {
                user: createAlertDTO.user,
                datestr: createAlertDTO.datestr,
                alert_name: createAlertDTO.alert_name,
            }
        });
        if (checkExistingAlert) {
            throw new ConflictException("An alert with the same user, date and alert name is already created!")
        }
        try {
            // Create the alert entity
            const alert = this.alertRepository.create(createAlertDTO);
            
            // Find matching incident based on username and time window
            const matchingIncidentId = await this.findMatchingIncidentForAlert(alert);
            if (matchingIncidentId) {
                alert.incidentId = matchingIncidentId;
                alert.isUnderIncident = true;
            }
            
            const savedAlert = await this.alertRepository.save(alert);
            return this.mapToResponseDTO(savedAlert);
        } catch (error) {
            if (error.code === "23505") {
                throw new ConflictException(`Duplicate alert. An alert with the same user, date and alert name already exists!`);
            }
            throw error;
        }
    }
    /**
     * Get all alerts with optional filtering
     * @param filters Optional filters for the query
     * @param limit Number of alerts per page
     * @param offset Number of records to skip
     * @param sortField Field to sort by
     * @param sortOrder Sort direction (asc or desc)
     * @returns Paginated array of alerts
     */
    async findAll(
        filters?: Partial<Alert>,
        limit = 10,
        offset = 0,
        sortField: SortField = 'datestr',
        sortOrder: SortOrder = 'desc'
    ): Promise<{ alerts: AlertResponseDTO[], total: number }> {
        const whereClause: FindOptionsWhere<Alert> = {};
        if (filters) {
            Object.keys(filters).forEach(key => {
                if (filters[key] !== undefined) {
                    whereClause[key] = filters[key];
                }
            });
        }

        // Create the order object for sorting
        const order: FindOptionsOrder<Alert> = { [sortField]: sortOrder };

        const [alerts, total] = await this.alertRepository.findAndCount({
            where: whereClause,
            order,
            take: limit,
            skip: offset
        });
        return {
            alerts: alerts.map(alert => this.mapToResponseDTO(alert)),
            total
        }
    }

    /**
     * Find alerts by their date range
     * @param startDate Start date for the range
     * @param endDate End date for the range
     * @param user Optional user filter
     * @param sortField Field to sort by
     * @param sortOrder Sort direction (asc or desc)
     * @returns Array of alerts within the date range
     */
    async findAlertsByDateRange(
        startDate: Date, 
        endDate: Date, 
        user?: string,
        sortField: SortField = 'datestr',
        sortOrder: SortOrder = 'desc'
    ): Promise<AlertResponseDTO[]> {
        const whereClause: FindOptionsWhere<Alert> = {
            datestr: Between(startDate, endDate)
        };
        if (user) {
            whereClause.user = user;
        }

        // Create the order object for sorting
        const order: FindOptionsOrder<Alert> = { [sortField]: sortOrder };

        const alerts = await this.alertRepository.find({
            where: whereClause,
            order
        });
        return alerts.map(alert => this.mapToResponseDTO(alert));
    }

    /**
     * Find alerts by score range
     * @param minScore Minimum score
     * @param maxScore Maximum score
     * @param sortField Field to sort by
     * @param sortOrder Sort direction (asc or desc)
     * @returns Array of alerts within the score range
     */
    async findAlertsByScoreRange(
        minScore: number, 
        maxScore: number,
        sortField: SortField = 'score',
        sortOrder: SortOrder = 'desc'
    ) {
        // Create the order object for sorting
        const order: FindOptionsOrder<Alert> = { [sortField]: sortOrder };

        const alerts = await this.alertRepository.find({
            where: {
                score: Between(minScore, maxScore)
            },
            order
        });
        return alerts.map(alert => this.mapToResponseDTO(alert));
    }

    /**
     * Find alerts by MITRE tactic
     * @param tactic MITRE tactic to search for
     * @param sortField Field to sort by
     * @param sortOrder Sort direction (asc or desc)
     * @returns Array of alerts with the specified MITRE tactic
     */
    async findAlertsByMITRETactic(
        tactic: string,
        sortField: SortField = 'datestr',
        sortOrder: SortOrder = 'desc'
    ): Promise<AlertResponseDTO[]> {
        // Create the order object for sorting
        const order: FindOptionsOrder<Alert> = { [sortField]: sortOrder };

        const alerts = await this.alertRepository.find({
            where: { MITRE_tactic: tactic },
            order
        });
        return alerts.map(alert => this.mapToResponseDTO(alert));
    }

    /**
     * Find alerts by MITRE technique
     * @param technique MITRE technique to search for
     * @param sortField Field to sort by
     * @param sortOrder Sort direction (asc or desc)
     * @returns Array of alerts with the specified MITRE technique
     */
    async findAlertsByMITRETechnique(
        technique: string,
        sortField: SortField = 'datestr',
        sortOrder: SortOrder = 'desc'
    ): Promise<AlertResponseDTO[]> {
        // Create the order object for sorting
        const order: FindOptionsOrder<Alert> = { [sortField]: sortOrder };

        const alerts = await this.alertRepository.find({
            where: { MITRE_technique: technique },
            order
        });
        return alerts.map(alert => this.mapToResponseDTO(alert));
    }

    /**
     * Find alerts by user
     * @param user Username to search for
     * @param sortField Field to sort by
     * @param sortOrder Sort direction (asc or desc)
     * @returns Array of alerts under the specified user
     */
    async findAlertsByUser(
        user: string,
        sortField: SortField = 'datestr',
        sortOrder: SortOrder = 'desc'
    ): Promise<AlertResponseDTO[]> {
        // Create the order object for sorting
        const order: FindOptionsOrder<Alert> = { [sortField]: sortOrder };

        const alerts = await this.alertRepository.find({
            where: { user },
            order
        });
        return alerts.map(alert => this.mapToResponseDTO(alert));
    }

    /**
     * Find alerts that are under an incident
     * @param isUnderIncident Whether the alert is under an incident
     * @param sortField Field to sort by
     * @param sortOrder Sort direction (asc or desc)
     * @returns Array of alerts that are under an incident
     */
    async findAlertsUnderIncident(
        isUnderIncident: boolean,
        sortField: SortField = 'datestr',
        sortOrder: SortOrder = 'desc'
    ): Promise<AlertResponseDTO[]> {
        // Create the order object for sorting
        const order: FindOptionsOrder<Alert> = { [sortField]: sortOrder };

        const alerts = await this.alertRepository.find({
            where: { isUnderIncident },
            order
        });
        return alerts.map(alert => this.mapToResponseDTO(alert));
    }

    /**
     * Find alerts by incident ID
     * @param incidentId Incident ID to search for
     * @param sortField Field to sort by
     * @param sortOrder Sort direction (asc or desc)
     * @returns Array of alerts associated with the specified incident
     */
    async findAlertsByIncidentId(
        incidentId: string,
        sortField: SortField = 'datestr',
        sortOrder: SortOrder = 'desc'
    ): Promise<AlertResponseDTO[]> {
        // Create the order object for sorting
        const order: FindOptionsOrder<Alert> = { [sortField]: sortOrder };

        const alerts = await this.alertRepository.find({
            where: { 
                incidentId,
                isUnderIncident: true 
            },
            order
        });
        return alerts.map(alert => this.mapToResponseDTO(alert));
    }

    /**
     * Get the incident associated with an alert
     * @param alertId Alert ID to find the related incident for
     * @returns The associated incident or null if no incident is associated
     */
    async getIncidentForAlert(alertId: string): Promise<IncidentResponseDTO | null> {
        const alert = await this.alertRepository.findOne({
            where: { ID: alertId }
        });
        
        if (!alert || !alert.isUnderIncident || !alert.incidentId) {
            return null;
        }
        
        try {
            return await this.incidentService.findById(alert.incidentId);
        } catch (error) {
            // Handle case where incident doesn't exist
            return null;
        }
    }

    /**
     * Find a single alert by the composite key of user, datestr and alert_name
     * @param user Username
     * @param datestr Alert date
     * @param alert_name Alert name
     * @return A single alert belonging to the user with the specified date and alert name (or throw NotFoundException)
     */
    async findOne(user: string, datestr: Date, alertName: string): Promise<AlertResponseDTO> {
        const alert = await this.alertRepository.findOne({
            where: {
                user,
                datestr,
                alert_name: alertName
            }
        });
        if (!alert) {
            throw new NotFoundException(`Alert with user: ${user}, datestr: ${datestr} and alert_name: ${alertName} not found!`);
        }
        return this.mapToResponseDTO(alert);
    }

    /**
     * Find an alert by its ID
     * @param id Alert ID
     * @returns The alert with the specified ID
     */
    async findById(id: string): Promise<AlertResponseDTO> {
        const alert = await this.alertRepository.findOne({
            where: { ID: id }
        });
        
        if (!alert) {
            throw new NotFoundException(`Alert with ID: ${id} not found!`);
        }
        
        return this.mapToResponseDTO(alert);
    }

    /**
     * Update an existing alert by the composite key of user, datestr and alert_name
     * @param user Username
     * @param datestr Alert date
     * @param alert_name Alert name
     * @param updateAlertDTO Alert update data
     * @returns The updated alert
     */
    async update(user: string, datestr: Date, alertName: string, updateAlertDTO: UpdateAlertDTO): Promise<AlertResponseDTO> {
        const existingAlert = await this.findOne(user, datestr, alertName);
        try {
            await this.alertRepository.update(existingAlert.ID, updateAlertDTO);
            if (updateAlertDTO.user || updateAlertDTO.datestr || updateAlertDTO.alert_name) {
                const newUser = updateAlertDTO.user || user;
                const newDatestr = updateAlertDTO.datestr || datestr;
                const newAlertName = updateAlertDTO.alert_name || alertName;
                return this.findOne(newUser, newDatestr, newAlertName);
            }
            return this.findOne(user, datestr, alertName);
        } catch (error) {
            if (error.code === "23505") {
                throw new ConflictException(`Duplicate alert. An alert with the same user, date and alert name already exists!`);
            }
            throw error;
        }
    }

    /**
     * Remove an alert by the composite key of user, datestr and alert_name
     * @param user Username
     * @param datestr Alert date
     * @param alert_name Alert name
     * @returns True if successful (False, vice versa)
     */
    async remove(user: string, datestr: Date, alertName: string): Promise<boolean> {
        const alert = await this.findOne(user, datestr, alertName);
        const result = await this.alertRepository.delete(alert.ID);
        return result?.affected ? result.affected > 0 : false;
    }

    /**
     * Search alerts by query string across multiple fields including ID
     * @param query Search query string
     * @param limit Number of records to return
     * @param offset Pagination offset
     * @param sortField Field to sort by
     * @param sortOrder Sort direction (asc or desc)
     * @returns Alerts matching the search query with total count
     */
    async searchAlerts(
        query: string,
        limit: number = 10,
        offset: number = 0,
        sortField: SortField = 'datestr',
        sortOrder: SortOrder = 'desc'
    ): Promise<{ alerts: AlertResponseDTO[]; total: number }> {
        // Create ILike expressions for case-insensitive search
        const searchQuery = ILike(`%${query}%`);
        
        // Create the order object for sorting
        const order: FindOptionsOrder<Alert> = { [sortField]: sortOrder };
          
        const [alerts, total] = await this.alertRepository.findAndCount({
            where: [
                { ID: searchQuery },
                { alert_name: searchQuery },
                { user: searchQuery },
                { MITRE_tactic: searchQuery },
                { MITRE_technique: searchQuery },
                { Description: searchQuery },
                { Detection_model: searchQuery }
            ],
            order,
            take: limit,
            skip: offset,
        });
      
        return { 
            alerts: alerts.map(alert => this.mapToResponseDTO(alert)), 
            total 
        };
    }

    async associateWithIncident(alertId: string, incidentId: string): Promise<AlertResponseDTO> {
        const alert = await this.alertRepository.findOne({
            where: { ID: alertId }
        });
        
        if (!alert) {
            throw new NotFoundException(`Alert with ID: ${alertId} not found!`);
        }
        
        // Update the alert to be associated with the incident
        alert.isUnderIncident = true;
        alert.incidentId = incidentId;
        
        await this.alertRepository.save(alert);
        return this.mapToResponseDTO(alert);
    }

    async updateById(id: string, updateAlertDTO: UpdateAlertDTO): Promise<AlertResponseDTO> {
        const existingAlert = await this.alertRepository.findOne({
            where: { ID: id }
        });
        
        if (!existingAlert) {
            throw new NotFoundException(`Alert with ID: ${id} not found!`);
        }
        
        try {
            // Update the alert
            await this.alertRepository.update(id, updateAlertDTO);
            
            // Fetch the updated alert
            const updatedAlert = await this.alertRepository.findOne({
                where: { ID: id }
            });
            
            if (!updatedAlert) {
                throw new NotFoundException(`Updated alert not found!`);
            }
            
            // If date or user was updated, check if it now matches with an incident
            if (updateAlertDTO.datestr || updateAlertDTO.user) {
                const matchingIncidentId = await this.findMatchingIncidentForAlert(updatedAlert);
                if (matchingIncidentId) {
                    updatedAlert.incidentId = matchingIncidentId;
                    updatedAlert.isUnderIncident = true;
                    await this.alertRepository.save(updatedAlert);
                } else if (updatedAlert.isUnderIncident) {
                    // If it was previously associated but now doesn't match any incident
                    updatedAlert.incidentId = ''; // Use empty string instead of null
                    updatedAlert.isUnderIncident = false;
                    await this.alertRepository.save(updatedAlert);
                }
            }
            
            return this.mapToResponseDTO(updatedAlert);
        } catch (error) {
            if (error.code === "23505") {
                throw new ConflictException(`Duplicate alert. An alert with the same user, date and alert name already exists!`);
            }
            throw error;
        }
    }
    
    async removeById(id: string): Promise<boolean> {
        const result = await this.alertRepository.delete({ID: id});
        return result?.affected ? result.affected > 0 : false;
    }

    // In the findMatchingIncidentForAlert method:
async findMatchingIncidentForAlert(alert: Alert): Promise<string | undefined> {
    try {
        // Query incidents by username
        const incidents = await this.incidentService.findIncidentsByUser(alert.user);
        
        // Find an incident whose time window contains the alert's datestr
        const matchingIncident = incidents.find(incident => 
            alert.datestr >= new Date(incident.windows_start) && 
            alert.datestr <= new Date(incident.windows_end)
        );
        
        return matchingIncident ? matchingIncident.ID : undefined;
    } catch (error) {
        console.error('Error finding matching incident:', error);
        return undefined;
    }
}

async updateAlertsForIncident(incident: Incident): Promise<void> {
    // Find all alerts by this user
    const userAlerts = await this.findAlertsByUser(incident.user);
    
    // Process each alert
    for (const alert of userAlerts) {
        const alertDate = new Date(alert.datestr);
        const incidentStart = new Date(incident.windows_start);
        const incidentEnd = new Date(incident.windows_end);
        
        // If alert falls within the incident time window
        if (alertDate >= incidentStart && alertDate <= incidentEnd) {
            // Associate with incident if not already
            if (!alert.isUnderIncident || alert.incidentId !== incident.ID) {
                await this.alertRepository.update(alert.ID, {
                    isUnderIncident: true,
                    incidentId: incident.ID
                });
            }
        } 
        // If alert is associated with this incident but now falls outside window
        else if (alert.incidentId === incident.ID) {
            await this.alertRepository.update(alert.ID, {
                isUnderIncident: false,
                incidentId: '' // Use empty string instead of null
            });
        }
    }
}
}