import { Incident } from "./incident.entity";
import { AlertService } from "../alert/alert.service";
import { CreateIncidentDTO, UpdateIncidentDTO, IncidentResponseDTO } from "./incident.dto";
import { Repository } from "typeorm";
type SortField = "windows_start" | "score" | "user";
type SortOrder = "asc" | "desc";
export declare class IncidentService {
    private incidentRepository;
    private readonly alertService;
    constructor(incidentRepository: Repository<Incident>, alertService: AlertService);
    private mapToResponseDTO;
    findIncidentByID(id: string): Promise<IncidentResponseDTO>;
    findOne(user: string, windows_start: Date, windows_end: Date): Promise<IncidentResponseDTO>;
    findIncidentsByDateRange(startDate: Date, endDate: Date, user?: string): Promise<IncidentResponseDTO[]>;
    findIncidentsByScoreRange(minScore: number, maxScore: number): Promise<IncidentResponseDTO[]>;
    findIncidentsByUser(user: string): Promise<IncidentResponseDTO[]>;
    update(user: string, windows_start: Date, windows_end: Date, updateIncidentDTO: UpdateIncidentDTO): Promise<IncidentResponseDTO>;
    remove(user: string, windows_start: Date, windows_end: Date): Promise<boolean>;
    findAll(filters?: Partial<Incident>, limit?: number, offset?: number, sortField?: SortField, sortOrder?: SortOrder): Promise<{
        incidents: IncidentResponseDTO[];
        total: number;
    }>;
    findIncidentsByThreshold(threshold: number): Promise<IncidentResponseDTO[]>;
    removeById(id: string): Promise<boolean>;
    create(createIncidentDTO: CreateIncidentDTO): Promise<IncidentResponseDTO>;
    updateById(id: string, updateIncidentDTO: UpdateIncidentDTO): Promise<IncidentResponseDTO>;
    getAlertsForIncident(incidentID: string): Promise<any[]>;
    searchIncidents(query: string, limit?: number, offset?: number, sortField?: SortField, sortOrder?: SortOrder): Promise<{
        incidents: IncidentResponseDTO[];
        total: number;
    }>;
    getAllIncidents(sortField?: SortField, sortOrder?: SortOrder): Promise<IncidentResponseDTO[]>;
    getAllIncidentsWithCount(sortField?: SortField, sortOrder?: SortOrder): Promise<{
        incidents: IncidentResponseDTO[];
        total: number;
    }>;
}
export {};
