// backend/src/entities/alert/alert.service.ts

import { Alert } from "./alert.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Incident } from "../incident/incident.entity";
import { IncidentService } from "../incident/incident.service";
import { IncidentResponseDTO } from "../incident/incident.dto";
import { CreateAlertDTO, UpdateAlertDTO, AlertResponseDTO } from "./alert.dto";
import { Repository, FindOptionsWhere, Between, ILike, FindOptionsOrder } from "typeorm";
import { Injectable, NotFoundException, ConflictException, Inject, forwardRef } from "@nestjs/common";

type SortOrder = "asc" | "desc";
type SortField = "datestr" | "score" | "alert_name";

@Injectable()
export class AlertService {
    constructor (
        @InjectRepository(Alert)
        private readonly alertRepository: Repository<Alert>,
        @Inject(forwardRef(() => IncidentService))
        private readonly incidentService: IncidentService
    ) {}

    /**
     * Maps an Alert entity to AlertResponseDTO format for API responses
     * @param alert - Alert entity from the database
     * @returns AlertResponseDTO object with properly formatted data
     */
    private mapToResponseDTO(alert: Alert): AlertResponseDTO {
        return {
            ID: alert.ID,
            user: alert.user,
            datestr: alert.datestr,
            evidence: alert.evidence,
            alert_name: alert.alert_name,
            score: alert.score,
            MITRE_tactic: alert.MITRE_tactic,
            MITRE_technique: alert.MITRE_technique,
            Logs: alert.Logs,
            Detection_model: alert.Detection_model,
            isUnderIncident: alert.isUnderIncident,
            Description: alert.Description,
            incidentID: alert.incidentID,
            created_at: alert.created_at,
            updated_at: alert.updated_at
        };
    }

    /**
     * Finds an incident that matches the alert's user and time window
     * @param alert - Alert entity to find matching incident for
     * @returns Promise resolving to incident ID if match found, undefined otherwise
     */
    async findMatchingIncidentForAlert(alert: Alert): Promise<string | undefined> {
        try {
            const incidents = await this.incidentService.findIncidentsByUser(alert.user);

            const matchingIncident = incidents.find(incident => 
                alert.datestr >= new Date(incident.windows_start) &&
                alert.datestr <= new Date(incident.windows_end)
            );
            return matchingIncident ? matchingIncident.ID : undefined;
        } catch (error) {
            console.error("Error finding matching incident:", error);
            return undefined;
        }
    }

    /**
     * Creates a new alert record in the database with automatic incident association
     * @param createAlertDTO - Data transfer object containing alert creation data
     * @returns Promise resolving to the created alert in response DTO format
     */
    async create(createAlertDTO: CreateAlertDTO): Promise<AlertResponseDTO> {
        const checkExistingAlert = await this.alertRepository.findOne({
            where: {
                user: createAlertDTO.user,
                datestr: createAlertDTO.datestr,
                alert_name: createAlertDTO.alert_name
            }
        });
        if (checkExistingAlert) {
            throw new ConflictException("An alert with the same user, date and alert name already exists!");
        }
        try {
            const alert = this.alertRepository.create(createAlertDTO);

            const matchingIncidentID = await this.findMatchingIncidentForAlert(alert);
            if (matchingIncidentID) {
                alert.incidentID = matchingIncidentID;
                alert.isUnderIncident = true;
            }
            
            const savedAlert = await this.alertRepository.save(alert);
            return this.mapToResponseDTO(savedAlert);
        } catch (error) {
            if (error.code === "23505") {
                throw new ConflictException("Duplicate alert. An alert with the same user, date and alert name already exists!");
            }
            throw error;
        }
    }

    /**
     * Retrieves alerts with optional filtering, pagination, and sorting
     * @param filters - Optional filter criteria to apply to the query
     * @param limit - Maximum number of alerts to return (default: 10)
     * @param offset - Number of alerts to skip for pagination (default: 0)
     * @param sortField - Field to sort results by (default: "datestr")
     * @param sortOrder - Sort direction (default: "desc")
     * @returns Promise resolving to paginated alerts with total count
     */
    async findAll(filters?: Partial<Alert>, limit = 10, offset = 0, sortField: SortField = "datestr", sortOrder: SortOrder = "desc"): Promise<{ alerts: AlertResponseDTO[], total: number }> {
        const whereClause: FindOptionsWhere<Alert> = {};
        if (filters) {
            Object.keys(filters).forEach(key => {
                if (filters[key] !== undefined) {
                    whereClause[key] = filters[key];
                }
            });
        }

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
     * Searches alerts using a query string across multiple fields
     * @param query - Search term to match against alert fields
     * @param limit - Maximum number of search results to return (default: 10)
     * @param offset - Number of results to skip for pagination (default: 0)
     * @param sortField - Field to sort search results by (default: "datestr")
     * @param sortOrder - Sort direction for search results (default: "desc")
     * @returns Promise resolving to matching alerts with total count
     */
    async searchAlerts(query: string, limit: number = 10, offset: number = 0, sortField: SortField = "datestr", sortOrder: SortOrder = "desc"): Promise<{ alerts: AlertResponseDTO[]; total: number }> {
        const searchQuery = ILike(`%${query}%`);

        const order: FindOptionsOrder<Alert> = { [sortField]: sortOrder };
        const [alerts, total] = await this.alertRepository.findAndCount({
            where: [
                { ID: searchQuery },
                { alert_name: searchQuery },
                { user: searchQuery },
                { MITRE_tactic: searchQuery },
                { MITRE_technique: searchQuery },
                { Description: searchQuery },
                { Detection_model: searchQuery },
            ],
            order,
            take: limit,
            skip: offset,
        });
        return {
            alerts: alerts.map(alert => this.mapToResponseDTO(alert)),
            total
        }
    }

    /**
     * Retrieves a specific alert using its unique identifier
     * @param id - Unique identifier of the alert to retrieve
     * @returns Promise resolving to the alert in response DTO format
     */
    async findAlertByID(id: string): Promise<AlertResponseDTO> {
        const alert = await this.alertRepository.findOne({
            where: {
                ID: id
            }
        });
        if (!alert) {
            throw new NotFoundException(`Unable to find alert with ID: ${id}`);
        }
        return this.mapToResponseDTO(alert);
    }

    /**
     * Retrieves the incident associated with a specific alert
     * @param alertID - Unique identifier of the alert to find the incident for
     * @returns Promise resolving to the associated incident or null if none exists
     */
    async getIncidentForAlert(alertID: string): Promise<IncidentResponseDTO | null> {
        const alert = await this.alertRepository.findOne({
            where: {
                ID: alertID
            }
        });
        if (!alert || !alert.isUnderIncident || !alert.incidentID) {
            return null;
        }
        try {
            return await this.incidentService.findIncidentByID(alert.incidentID);
        } catch (error) {
            throw new NotFoundException(`Unable to find incident related to the alert!`);
        }
    }
    
    /**
     * Retrieves all alerts associated with a specific incident
     * @param incidentID - Unique identifier of the incident to find alerts for
     * @param sortField - Field to sort results by (default: "datestr")
     * @param sortOrder - Sort direction (default: "desc")
     * @returns Promise resolving to array of alerts associated with the incident
     */
    async findAlertsByIncidentID(incidentID: string, sortField: SortField = "datestr", sortOrder: SortOrder = "desc"): Promise<AlertResponseDTO[]> {
        const order: FindOptionsOrder<Alert> = { [sortField]: sortOrder };
        const alerts = await this.alertRepository.find({
            where: {
                incidentID,
                isUnderIncident: true
            },
            order
        });
        return alerts.map(alert => this.mapToResponseDTO(alert));
    }

    /**
     * Updates an existing alert with new data and handles incident association
     * @param id - Unique identifier of the alert to update
     * @param updateAlertDTO - Data transfer object containing updated alert information
     * @returns Promise resolving to the updated alert in response DTO format
     */
    async updateAlertByID(id: string, updateAlertDTO: UpdateAlertDTO): Promise<AlertResponseDTO> {
        const existingAlert = await this.alertRepository.findOne({
            where: {
                ID: id
            }
        });
        if (!existingAlert) {
            throw new NotFoundException(`Unable to find alert with ID: ${id}`);
        }
        try {
            await this.alertRepository.update(id, updateAlertDTO);

            const updatedAlert = await this.alertRepository.findOne({
                where: {
                    ID: id
                }
            });
            if (!updatedAlert) {
                throw new NotFoundException("Updated alert not found!");
            }

            if (updateAlertDTO.datestr || updateAlertDTO.user) {
                const matchingIncidentID = await this.findMatchingIncidentForAlert(updatedAlert);
                if (matchingIncidentID) {
                    updatedAlert.incidentID = matchingIncidentID;
                    updatedAlert.isUnderIncident = true;
                    await this.alertRepository.save(updatedAlert);
                } else if (updatedAlert.isUnderIncident) {
                    updatedAlert.incidentID = "";
                    updatedAlert.isUnderIncident = false;
                    await this.alertRepository.save(updatedAlert);
                }
            }
            return this.mapToResponseDTO(updatedAlert);
        } catch (error) {
            if (error.code === "23505") {
                throw new ConflictException("An alert with the same user, date and alert name already exists!");
            }
            throw error;
        }
    }

    /**
     * Permanently removes an alert from the database
     * @param id - Unique identifier of the alert to delete
     * @returns Promise resolving to boolean indicating success of deletion
     */
    async removeAlertByID(id: string): Promise<boolean> {
        const result = await this.alertRepository.delete({ ID: id });
        return result?.affected ? result.affected > 0 : false;
    }

    /**
     * Retrieves alerts that occurred within a specified date range
     * @param startDate - Beginning date of the range to filter alerts
     * @param endDate - End date of the range to filter alerts
     * @param user - Optional user filter to narrow results to specific user
     * @param sortField - Field to sort results by (default: "datestr")
     * @param sortOrder - Sort direction (default: "desc")
     * @returns Promise resolving to array of alerts within the date range
     */
    async findAlertsByDateRange(
        startDate: Date,
        endDate: Date,
        user?: string,
        sortField: SortField = "datestr", 
        sortOrder: SortOrder = "desc"
    ): Promise<AlertResponseDTO[]> {
        const whereClause: FindOptionsWhere<Alert> = {
            datestr: Between(startDate, endDate)
        };
        if (user) {
            whereClause.user = user;
        }
        const order: FindOptionsOrder<Alert> = { [sortField]: sortOrder };
        const alerts = await this.alertRepository.find({
            where: whereClause,
            order
        });
        return alerts.map(alert => this.mapToResponseDTO(alert));
    }

    /**
     * Retrieves all alerts associated with a specific MITRE ATT&CK tactic
     * @param tactic - MITRE tactic identifier to filter alerts by
     * @param sortField - Field to sort results by (default: "datestr")
     * @param sortOrder - Sort direction (default: "desc")
     * @returns Promise resolving to array of alerts associated with the tactic
     */
    async findAlertsByMITRETactic(tactic: string, sortField: SortField = "datestr", sortOrder: SortOrder = "desc"): Promise<AlertResponseDTO[]> {
        const order: FindOptionsOrder<Alert> = { [sortField]: sortOrder };
        const alerts = await this.alertRepository.find({
            where: {
                MITRE_tactic: tactic,
            },
            order
        });
        return alerts.map(alert => this.mapToResponseDTO(alert));
    }

    /**
     * Retrieves all alerts associated with a specific MITRE ATT&CK technique
     * @param technique - MITRE technique identifier to filter alerts by
     * @param sortField - Field to sort results by (default: "datestr")
     * @param sortOrder - Sort direction (default: "desc")
     * @returns Promise resolving to array of alerts associated with the technique
     */
    async findAlertsByMITRETechnique(technique: string, sortField: SortField = "datestr", sortOrder: SortOrder = "desc"): Promise<AlertResponseDTO[]> {
        const order: FindOptionsOrder<Alert> = { [sortField]: sortOrder };
        const alerts = await this.alertRepository.find({
            where: {
                MITRE_technique: technique,
            },
            order
        });
        return alerts.map(alert => this.mapToResponseDTO(alert));
    }

    /**
     * Retrieves all alerts associated with a specific user
     * @param user - Username or user identifier to filter alerts by
     * @param sortField - Field to sort results by (default: "datestr")
     * @param sortOrder - Sort direction (default: "desc")
     * @returns Promise resolving to array of alerts belonging to the user
     */
    async findAlertsByUser(user: string, sortField: SortField = "datestr", sortOrder: SortOrder = "desc"): Promise<AlertResponseDTO[]> {
        const order: FindOptionsOrder<Alert> = { [sortField]: sortOrder };
        const alerts = await this.alertRepository.find({
            where: {
                user,
            },
            order
        });
        return alerts.map(alert => this.mapToResponseDTO(alert));
    }

    /**
     * Retrieves alerts based on their incident association status
     * @param isUnderIncident - Boolean flag indicating whether to fetch alerts under incidents
     * @param sortField - Field to sort results by (default: "datestr")
     * @param sortOrder - Sort direction (default: "desc")
     * @returns Promise resolving to array of alerts based on incident association
     */
    async findAlertsUnderIncident(isUnderIncident: boolean, sortField: SortField = "datestr", sortOrder: SortOrder = "desc"): Promise<AlertResponseDTO[]> {
        const order: FindOptionsOrder<Alert> = { [sortField]: sortOrder };
        const alerts = await this.alertRepository.find({
            where: {
                isUnderIncident,
            },
            order
        });
        return alerts.map(alert => this.mapToResponseDTO(alert));
    }

    /**
     * Retrieves a specific alert using composite key fields
     * @param user - Username associated with the alert
     * @param datestr - Date string of the alert occurrence
     * @param alertName - Name of the alert
     * @returns Promise resolving to the alert in response DTO format
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
     * Updates an alert using composite key fields instead of ID
     * @param user - Username associated with the alert
     * @param datestr - Date string of the alert occurrence
     * @param alertName - Name of the alert
     * @param updateAlertDTO - Data transfer object containing updated alert information
     * @returns Promise resolving to the updated alert in response DTO format
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
                throw new ConflictException("Duplicate alert. An alert with the same user, date and alert name already exists!");
            }
            throw error;
        }
    }

    /**
     * Updates alert-incident associations when an incident is modified
     * @param incident - Incident entity that was updated
     * @returns Promise that resolves when all alert associations are updated
     */
    async updateAlertsForIncident(incident: Incident): Promise<void> {
        const userAlerts = await this.findAlertsByUser(incident.user);

        for (const alert of userAlerts) {
            const alertDate = new Date(alert.datestr);
            const incidentStart = new Date(incident.windows_start);
            const incidentEnd = new Date(incident.windows_end);

            if (alertDate >= incidentStart && alertDate <= incidentEnd) {
                if (!alert.isUnderIncident || alert.incidentID !== incident.ID) {
                    await this.alertRepository.update(alert.ID, {
                        isUnderIncident: true,
                        incidentID: incident.ID
                    });
                }
            } else if (alert.incidentID === incident.ID) {
                await this.alertRepository.update(alert.ID, {
                    isUnderIncident: false,
                    incidentID: ""
                });
            }
        }
    }

    /**
     * Retrieves all alerts from the database without any filtering or pagination
     * @param sortField - Field to sort results by (default: "datestr")
     * @param sortOrder - Sort direction (default: "desc")
     * @returns Promise resolving to array containing all alerts in the system
     */
    async getAllAlerts(
        sortField: SortField = "datestr",
        sortOrder: SortOrder = "desc"
    ): Promise<AlertResponseDTO[]> {
        const order: FindOptionsOrder<Alert> = { [sortField]: sortOrder };
        
        const alerts = await this.alertRepository.find({
            order
        });
        
        return alerts.map(alert => this.mapToResponseDTO(alert));
    }

    /**
     * Retrieves all alerts with total count metadata without filtering or pagination
     * @param sortField - Field to sort results by (default: "datestr")
     * @param sortOrder - Sort direction (default: "desc")
     * @returns Promise resolving to object containing all alerts and total count
     */
    async getAllAlertsWithCount(
        sortField: SortField = "datestr",
        sortOrder: SortOrder = "desc"
    ): Promise<{ alerts: AlertResponseDTO[], total: number }> {
        const order: FindOptionsOrder<Alert> = { [sortField]: sortOrder };
        
        const [alerts, total] = await this.alertRepository.findAndCount({
            order
        });
        
        return {
            alerts: alerts.map(alert => this.mapToResponseDTO(alert)),
            total
        };
    }
}