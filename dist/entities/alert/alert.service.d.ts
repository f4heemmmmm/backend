import { Alert } from "./alert.entity";
import { Incident } from "../incident/incident.entity";
import { IncidentService } from "../incident/incident.service";
import { IncidentResponseDTO } from "../incident/incident.dto";
import { CreateAlertDTO, UpdateAlertDTO, AlertResponseDTO } from "./alert.dto";
import { Repository } from "typeorm";
type SortOrder = "asc" | "desc";
type SortField = "datestr" | "score" | "alert_name";
export declare class AlertService {
    private readonly alertRepository;
    private readonly incidentService;
    constructor(alertRepository: Repository<Alert>, incidentService: IncidentService);
    private mapToResponseDTO;
    findMatchingIncidentForAlert(alert: Alert): Promise<string | undefined>;
    create(createAlertDTO: CreateAlertDTO): Promise<AlertResponseDTO>;
    findAll(filters?: Partial<Alert>, limit?: number, offset?: number, sortField?: SortField, sortOrder?: SortOrder): Promise<{
        alerts: AlertResponseDTO[];
        total: number;
    }>;
    searchAlerts(query: string, limit?: number, offset?: number, sortField?: SortField, sortOrder?: SortOrder): Promise<{
        alerts: AlertResponseDTO[];
        total: number;
    }>;
    findAlertByID(id: string): Promise<AlertResponseDTO>;
    getIncidentForAlert(alertID: string): Promise<IncidentResponseDTO | null>;
    findAlertsByIncidentID(incidentID: string, sortField?: SortField, sortOrder?: SortOrder): Promise<AlertResponseDTO[]>;
    updateAlertByID(id: string, updateAlertDTO: UpdateAlertDTO): Promise<AlertResponseDTO>;
    removeAlertByID(id: string): Promise<boolean>;
    findAlertsByDateRange(startDate: Date, endDate: Date, user?: string, sortField?: SortField, sortOrder?: SortOrder): Promise<AlertResponseDTO[]>;
    findAlertsByMITRETactic(tactic: string, sortField?: SortField, sortOrder?: SortOrder): Promise<AlertResponseDTO[]>;
    findAlertsByMITRETechnique(technique: string, sortField?: SortField, sortOrder?: SortOrder): Promise<AlertResponseDTO[]>;
    findAlertsByUser(user: string, sortField?: SortField, sortOrder?: SortOrder): Promise<AlertResponseDTO[]>;
    findAlertsUnderIncident(isUnderIncident: boolean, sortField?: SortField, sortOrder?: SortOrder): Promise<AlertResponseDTO[]>;
    findOne(user: string, datestr: Date, alertName: string): Promise<AlertResponseDTO>;
    update(user: string, datestr: Date, alertName: string, updateAlertDTO: UpdateAlertDTO): Promise<AlertResponseDTO>;
    updateAlertsForIncident(incident: Incident): Promise<void>;
    getAllAlerts(sortField?: SortField, sortOrder?: SortOrder): Promise<AlertResponseDTO[]>;
    getAllAlertsWithCount(sortField?: SortField, sortOrder?: SortOrder): Promise<{
        alerts: AlertResponseDTO[];
        total: number;
    }>;
}
export {};
