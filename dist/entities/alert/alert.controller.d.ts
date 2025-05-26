import { AlertService } from "../alert/alert.service";
import { IncidentResponseDTO } from "../incident/incident.dto";
import { CreateAlertDTO, UpdateAlertDTO, AlertResponseDTO } from "../alert/alert.dto";
export declare class AlertController {
    private readonly alertService;
    constructor(alertService: AlertService);
    private validateSortField;
    private validateSortOrder;
    create(createAlertDTO: CreateAlertDTO): Promise<AlertResponseDTO>;
    findAll(queryParams: any, limit?: number, offset?: number, sortField?: string, sortOrder?: string): Promise<{
        alerts: AlertResponseDTO[];
        total: number;
    }>;
    searchAlerts(query: string, limit?: number, offset?: number, sortField?: string, sortOrder?: string): Promise<{
        alerts: AlertResponseDTO[];
        total: number;
    }>;
    findAlertsByDateRange(startDate: Date, endDate: Date, user?: string, sortField?: string, sortOrder?: string): Promise<AlertResponseDTO[]>;
    getAllAlerts(sortField?: string, sortOrder?: string): Promise<AlertResponseDTO[]>;
    getAllAlertsWithCount(sortField?: string, sortOrder?: string): Promise<{
        alerts: AlertResponseDTO[];
        total: number;
    }>;
    findAlertByID(id: string): Promise<AlertResponseDTO>;
    getIncidentForAlert(alertID: string): Promise<IncidentResponseDTO | null>;
    findAlertsByIncidentID(incidentID: string, sortField?: string, sortOrder?: string): Promise<AlertResponseDTO[]>;
    updateAlertByID(id: string, updateAlertDTO: UpdateAlertDTO): Promise<AlertResponseDTO>;
    removeAlertByID(id: string): Promise<void>;
    findAlertsByMITRETactic(tactic: string, sortField?: string, sortOrder?: string): Promise<AlertResponseDTO[]>;
    findAlertsByMITRETechnique(technique: string, sortField?: string, sortOrder?: string): Promise<AlertResponseDTO[]>;
    findAlertsByUser(user: string, sortField?: string, sortOrder?: string): Promise<AlertResponseDTO[]>;
    findAlertsUnderIncident(isUnderIncident: boolean, sortField?: string, sortOrder?: string): Promise<AlertResponseDTO[]>;
}
