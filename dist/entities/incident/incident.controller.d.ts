import { IncidentService } from "./incident.service";
import { AlertResponseDTO } from "../alert/alert.dto";
import { CreateIncidentDTO, UpdateIncidentDTO, IncidentResponseDTO } from "./incident.dto";
export declare class IncidentController {
    private readonly incidentService;
    constructor(incidentService: IncidentService);
    create(createIncidentDTO: CreateIncidentDTO): Promise<IncidentResponseDTO>;
    findAll(queryParams: any, limit?: number, offset?: number, sortField?: string, sortOrder?: string): Promise<{
        incidents: IncidentResponseDTO[];
        total: number;
    }>;
    searchIncidents(query: string, limit?: number, offset?: number, sortField?: string, sortOrder?: string): Promise<{
        incidents: IncidentResponseDTO[];
        total: number;
    }>;
    findIncidentsByDateRange(startDate: Date, endDate: Date, user?: string): Promise<IncidentResponseDTO[]>;
    findIncidentsByScoreRange(minScore: number, maxScore: number): Promise<IncidentResponseDTO[]>;
    getAllIncidents(sortField?: string, sortOrder?: string): Promise<IncidentResponseDTO[]>;
    getAllIncidentsWithCount(sortField?: string, sortOrder?: string): Promise<{
        incidents: IncidentResponseDTO[];
        total: number;
    }>;
    findById(id: string): Promise<IncidentResponseDTO>;
    getAlertsForIncident(incidentID: string): Promise<AlertResponseDTO[]>;
    findIncidentsByUser(user: string): Promise<IncidentResponseDTO[]>;
    findIncidentsByThreshold(threshold: number): Promise<IncidentResponseDTO[]>;
    updateById(id: string, updateIncidentDTO: UpdateIncidentDTO): Promise<IncidentResponseDTO>;
    removeById(id: string): Promise<void>;
    private validateSortField;
    private validateSortOrder;
}
