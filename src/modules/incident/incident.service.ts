// backend/src/modules/incident/incident.service.ts
import { Incident } from "./incident.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { AlertService } from "../alert/alert.service";
import { CreateIncidentDTO, UpdateIncidentDTO, IncidentResponseDTO } from "./incident.dto";
import { Injectable, NotFoundException, ConflictException, Inject, forwardRef } from "@nestjs/common";
import { Repository, Between, FindOptionsWhere, MoreThanOrEqual, ILike, FindOptionsOrder } from "typeorm";

type SortField = "windows_start" | "score" | "user";
type SortOrder = "asc" | "desc";

/**
 * IncidentService for comprehensive security incident management and alert integration.
 * 
 * Provides enterprise incident functionality including:
 * - CRUD operations with automatic alert association updates
 * - Advanced search and filtering with date/score range queries
 * - User-specific incident retrieval and threshold-based filtering
 * - Composite key operations for duplicate detection and prevention
 * - Real-time alert correlation updates when incidents are modified
 * - Flexible sorting and pagination for large-scale incident data
 */
@Injectable()
export class IncidentService {
    constructor(
        @InjectRepository(Incident)
        private incidentRepository: Repository<Incident>,
        @Inject(forwardRef(() => AlertService))
        private readonly alertService: AlertService
    ) {}

    /**
     * Maps Incident entity to IncidentResponseDTO for consistent API responses.
     */
    private mapToResponseDTO(incident: Incident): IncidentResponseDTO {
        return {
            ID: incident.ID,
            user: incident.user,
            windows_start: incident.windows_start,
            windows_end: incident.windows_end,
            score: incident.score,
            windows: incident.windows,
            created_at: incident.created_at,
            updated_at: incident.updated_at,
        };
    }

    async findIncidentByID(id: string): Promise<IncidentResponseDTO> {
        const incident = await this.incidentRepository.findOne({
            where: { ID: id }
        });
        if (!incident) {
            throw new NotFoundException(`Incident with ID: ${id} not found!`);
        }
        return this.mapToResponseDTO(incident);
    }
    
    async findOne(user: string, windows_start: Date, windows_end: Date): Promise<IncidentResponseDTO> {
        const incident = await this.incidentRepository.findOne({
            where: {
                user,
                windows_start,
                windows_end,
            }
        });
        if (!incident) {
            throw new NotFoundException(`Incident with user: ${user}, windows_start: ${windows_start} and windows_end: ${windows_end} not found!`);
        }
        return this.mapToResponseDTO(incident);
    }

    async findIncidentsByDateRange(startDate: Date, endDate: Date, user?: string): Promise<IncidentResponseDTO[]> {
        const whereClause: FindOptionsWhere<Incident> = {
            windows_start: Between(startDate, endDate)
        };
        if (user) {
            whereClause.user = user;
        }
        const incidents = await this.incidentRepository.find({
            where: whereClause,
            order: { windows_start: "DESC" }
        });
        return incidents.map(incident => this.mapToResponseDTO(incident));
    }

    async findIncidentsByScoreRange(minScore: number, maxScore: number) {
        const incidents = await this.incidentRepository.find({
            where: {
                score: Between(minScore, maxScore)
            },
            order: { score: "DESC" }
        });
        return incidents.map(incident => this.mapToResponseDTO(incident));
    }

    async findIncidentsByUser(user: string): Promise<IncidentResponseDTO[]> {
        const incidents = await this.incidentRepository.find({
            where: { user },
            order: { windows_start: "DESC" }
        });
        return incidents.map(incident => this.mapToResponseDTO(incident));
    }

    async update(user: string, windows_start: Date, windows_end: Date, updateIncidentDTO: UpdateIncidentDTO): Promise<IncidentResponseDTO> {
        const incident = await this.incidentRepository.findOne({
            where: {
                user,
                windows_start,
                windows_end,
            }
        });
        if (!incident) {
            throw new NotFoundException(`Incident with user: ${user}, windows_start: ${windows_start} and windows_end: ${windows_end} not found!`);
        }
        try {
            if (updateIncidentDTO.user || updateIncidentDTO.windows_start || updateIncidentDTO.windows_end) {
                const newUser = updateIncidentDTO.user || user;
                const newWindowsStart = updateIncidentDTO.windows_start || windows_start;
                const newWindowsEnd = updateIncidentDTO.windows_end || windows_end;
                if (newUser !== user || newWindowsStart !== windows_start || newWindowsEnd !== windows_end) {
                    const existingIncident = await this.incidentRepository.findOne({
                        where: {
                            user: newUser,
                            windows_start: newWindowsStart,
                            windows_end: newWindowsEnd,
                        }
                    });
                    if (existingIncident && existingIncident.ID!== incident.ID) {
                        throw new ConflictException(`Duplicate incident. An incident with the same user and time window already exists!`);
                    }
                }
            }
            await this.incidentRepository.update(incident.ID, updateIncidentDTO);
            const updatedIncident = await this.incidentRepository.findOne({
                where: {
                    ID: incident.ID,
                }
            });
            if (!updatedIncident) {
                throw new NotFoundException("Updated incident not found");
            }
            
            if (updateIncidentDTO.windows_start || updateIncidentDTO.windows_end || updateIncidentDTO.user) {
                await this.alertService.updateAlertsForIncident(updatedIncident);
            }
            
            return this.mapToResponseDTO(updatedIncident);
        } catch (error) {
            if (error.code === "23505") {
                throw new ConflictException(`Duplicate incident. An incident with the same user and time window already exists!`);
            }
            throw error;
        }
    }

    async remove(user: string, windows_start: Date, windows_end: Date): Promise<boolean> {
        const incident = await this.findOne(user, windows_start, windows_end);
        const result = await this.incidentRepository.delete(incident.ID);
        return result?.affected ? result.affected > 0 : false;
    }

    async findAll(
        filters?: Partial<Incident>,
        limit = 10,
        offset = 0,
        sortField: SortField = "windows_start",
        sortOrder: SortOrder = "desc"
    ): Promise<{ incidents: IncidentResponseDTO[], total: number }> {
        const whereClause: FindOptionsWhere<Incident> = {};
        if (filters) {
            Object.keys(filters).forEach(key => {
                if (filters[key] !== undefined) {
                    whereClause[key] = filters[key];
                }
            });
        }

        const order: FindOptionsOrder<Incident> = { [sortField]: sortOrder };

        const [incidents, total] = await this.incidentRepository.findAndCount({
            where: whereClause,
            order,
            take: limit,
            skip: offset
        });
        return {
            incidents: incidents.map(incident => this.mapToResponseDTO(incident)),
            total,
        };
    }

    async findIncidentsByThreshold(threshold: number): Promise<IncidentResponseDTO[]> {
        const incidents = await this.incidentRepository.find({
            where: {
                score: MoreThanOrEqual(threshold),
            },
            order: {
                score: "DESC"
            }
        });
        return incidents.map(incident => this.mapToResponseDTO(incident));
    }
    
    async removeById(id: string): Promise<boolean> {
        const result = await this.incidentRepository.delete({ ID: id });
        return result?.affected ? result.affected > 0 : false;
    }
    
    async create(createIncidentDTO: CreateIncidentDTO): Promise<IncidentResponseDTO> {
        const checkExistingIncident = await this.incidentRepository.findOne({
            where: {
                user: createIncidentDTO.user,
                windows_start: createIncidentDTO.windows_start,
                windows_end: createIncidentDTO.windows_end,
            }
        });
        if (checkExistingIncident) {
            throw new ConflictException("An incident with the same user and time window is already created!")
        }
        try {
            const incident = this.incidentRepository.create(createIncidentDTO);
            
            const savedIncident = await this.incidentRepository.save(incident);
            
            await this.alertService.updateAlertsForIncident(savedIncident);
            
            return this.mapToResponseDTO(savedIncident);
        } catch (error) {
            if (error.code === "23505") {
                throw new ConflictException(`Duplicate incident. An incident with the same user, and time window already exists!`);
            }
            throw error;
        }
    }
    
    async updateById(id: string, updateIncidentDTO: UpdateIncidentDTO): Promise<IncidentResponseDTO> {
        const incident = await this.incidentRepository.findOne({
            where: { ID: id }
        });
        if (!incident) {
            throw new NotFoundException(`Incident with ID: ${id} not found!`);
        }
        try {
            await this.incidentRepository.update(id, updateIncidentDTO);
            
            const updatedIncident = await this.incidentRepository.findOne({
                where: { ID: id }
            });
            if (!updatedIncident) {
                throw new NotFoundException("Updated incident not found");
            }
            if (updateIncidentDTO.windows_start || updateIncidentDTO.windows_end || updateIncidentDTO.user) {
                await this.alertService.updateAlertsForIncident(updatedIncident);
            }
            return this.mapToResponseDTO(updatedIncident);
        } catch (error) {
            if (error.code === "23505") {
                throw new ConflictException(`Duplicate incident. An incident with the same user and time window already exists!`);
            }
            throw error;
        }
    }
    
    async getAlertsForIncident(incidentID: string): Promise<any[]> {
        await this.findIncidentByID(incidentID);
        return this.alertService.findAlertsByIncidentID(incidentID);
    }

    async searchIncidents(
        query: string,
        limit: number = 10,
        offset: number = 0,
        sortField: SortField = "windows_start",
        sortOrder: SortOrder = "desc"
    ): Promise<{ incidents: IncidentResponseDTO[]; total: number }> {
        const searchQuery = ILike(`%${query}%`);
        
        const order: FindOptionsOrder<Incident> = { [sortField]: sortOrder };
        
        const [incidents, total] = await this.incidentRepository.findAndCount({
            where: [
                { ID: searchQuery },
                { user: searchQuery }
            ],
            order,
            take: limit,
            skip: offset,
        });
    
        return { 
            incidents: incidents.map(incident => this.mapToResponseDTO(incident)), 
            total 
        };
    }

    async getAllIncidents(
        sortField: SortField = "windows_start",
        sortOrder: SortOrder = "desc"
    ): Promise<IncidentResponseDTO[]> {
        const order: FindOptionsOrder<Incident> = { [sortField]: sortOrder };
        
        const incidents = await this.incidentRepository.find({
            order
        });
        
        return incidents.map(incident => this.mapToResponseDTO(incident));
    }

    async getAllIncidentsWithCount(
        sortField: SortField = "windows_start",
        sortOrder: SortOrder = "desc"
    ): Promise<{ incidents: IncidentResponseDTO[], total: number }> {
        const order: FindOptionsOrder<Incident> = { [sortField]: sortOrder };
        const [incidents, total] = await this.incidentRepository.findAndCount({
            order
        });
        return {
            incidents: incidents.map(incident => this.mapToResponseDTO(incident)),
            total
        };
    }
}