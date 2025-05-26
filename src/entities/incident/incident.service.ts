// backend/src/entities/incident/incident.service.ts

import { Incident } from "./incident.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { AlertService } from "../alert/alert.service";
import { CreateIncidentDTO, UpdateIncidentDTO, IncidentResponseDTO } from "./incident.dto";
import { Injectable, NotFoundException, ConflictException, Inject, forwardRef } from "@nestjs/common";
import { Repository, Between, FindOptionsWhere, MoreThanOrEqual, ILike, FindOptionsOrder } from "typeorm";

type SortField = "windows_start" | "score" | "user";
type SortOrder = "asc" | "desc";

/**
 * Service class that handles all incident-related business logic.
 * Provides CRUD operations, search functionality, and data filtering capabilities.
 * Integrates with AlertService to manage alert associations.
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
     * Maps an Incident entity to an IncidentResponseDTO.
     * @param incident - The incident entity to map
     * @returns The mapped incident response DTO
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

    /**
     * Finds an incident by its unique ID.
     * @param id - The incident ID to search for
     * @returns The incident with the specified ID
     * @throws NotFoundException if incident is not found
     */
    async findIncidentByID(id: string): Promise<IncidentResponseDTO> {
        const incident = await this.incidentRepository.findOne({
            where: { ID: id }
        });
        if (!incident) {
            throw new NotFoundException(`Incident with ID: ${id} not found!`);
        }
        return this.mapToResponseDTO(incident);
    }
    
    /**
     * Finds a single incident by composite key of user, windows_start and windows_end.
     * @param user - Username to search for
     * @param windows_start - Incident start time
     * @param windows_end - Incident end time
     * @returns A single incident matching the composite key
     * @throws NotFoundException if incident is not found
     */
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

    /**
     * Finds incidents within a specified date range.
     * @param startDate - Start date for the range filter
     * @param endDate - End date for the range filter
     * @param user - Optional user filter to narrow results
     * @returns Array of incidents within the date range
     */
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

    /**
     * Finds incidents within a specified score range.
     * @param minScore - Minimum score threshold
     * @param maxScore - Maximum score threshold
     * @returns Array of incidents within the score range
     */
    async findIncidentsByScoreRange(minScore: number, maxScore: number) {
        const incidents = await this.incidentRepository.find({
            where: {
                score: Between(minScore, maxScore)
            },
            order: { score: "DESC" }
        });
        return incidents.map(incident => this.mapToResponseDTO(incident));
    }

    /**
     * Finds all incidents associated with a specific user.
     * @param user - Username to search for
     * @returns Array of incidents belonging to the specified user
     */
    async findIncidentsByUser(user: string): Promise<IncidentResponseDTO[]> {
        const incidents = await this.incidentRepository.find({
            where: { user },
            order: { windows_start: "DESC" }
        });
        return incidents.map(incident => this.mapToResponseDTO(incident));
    }

    /**
     * Updates an existing incident using composite key identification.
     * @param user - Username of the incident to update
     * @param windows_start - Start time of the incident to update
     * @param windows_end - End time of the incident to update
     * @param updateIncidentDTO - Data containing fields to update
     * @returns The updated incident
     * @throws NotFoundException if incident is not found
     * @throws ConflictException if update would create duplicate
     */
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

    /**
     * Removes an incident using composite key identification.
     * @param user - Username of the incident to remove
     * @param windows_start - Start time of the incident to remove
     * @param windows_end - End time of the incident to remove
     * @returns True if removal was successful, false otherwise
     */
    async remove(user: string, windows_start: Date, windows_end: Date): Promise<boolean> {
        const incident = await this.findOne(user, windows_start, windows_end);
        const result = await this.incidentRepository.delete(incident.ID);
        return result?.affected ? result.affected > 0 : false;
    }

    /**
     * Finds all incidents with pagination support and optional filtering.
     * @param filters - Optional filters to apply to the query
     * @param limit - Number of incidents per page (default: 10)
     * @param offset - Number of records to skip for pagination (default: 0)
     * @param sortField - Field to sort results by (default: "windows_start")
     * @param sortOrder - Sort direction, either "asc" or "desc" (default: "desc")
     * @returns Object containing incidents array and total count
     */
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

    /**
     * Finds incidents with scores above a specified threshold.
     * @param threshold - Minimum score threshold for filtering
     * @returns Array of incidents with scores above the specified threshold
     */
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
    
    /**
     * Removes an incident by its unique ID.
     * @param id - The incident ID to remove
     * @returns True if removal was successful, false otherwise
     */
    async removeById(id: string): Promise<boolean> {
        const result = await this.incidentRepository.delete({ ID: id });
        return result?.affected ? result.affected > 0 : false;
    }
    
    /**
     * Creates a new incident in the system.
     * @param createIncidentDTO - Data for creating the new incident
     * @returns The created incident
     * @throws ConflictException if incident with same composite key already exists
     */
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
    
    /**
     * Updates an incident by its unique ID.
     * @param id - The incident ID to update
     * @param updateIncidentDTO - Data containing fields to update
     * @returns The updated incident
     * @throws NotFoundException if incident is not found
     * @throws ConflictException if update would create duplicate
     */
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
    
    /**
     * Retrieves all alerts associated with a specific incident.
     * @param incidentID - The incident ID to get alerts for
     * @returns Array of alerts associated with the incident
     * @throws NotFoundException if incident is not found
     */
    async getAlertsForIncident(incidentID: string): Promise<any[]> {
        await this.findIncidentByID(incidentID);
        return this.alertService.findAlertsByIncidentID(incidentID);
    }

    /**
     * Searches incidents by query string across multiple fields including ID and user.
     * @param query - Search query string to match against
     * @param limit - Number of records to return (default: 10)
     * @param offset - Pagination offset (default: 0)
     * @param sortField - Field to sort results by (default: "windows_start")
     * @param sortOrder - Sort direction, either "asc" or "desc" (default: "desc")
     * @returns Object containing matching incidents and total count
     */
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

    /**
     * Retrieves ALL incidents without any filtering or pagination.
     * @param sortField - Field to sort results by (default: "windows_start")
     * @param sortOrder - Sort direction, either "asc" or "desc" (default: "desc")
     * @returns Array containing all incidents in the database
     */
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

    /**
     * Retrieves ALL incidents with total count (no filtering, no pagination).
     * @param sortField - Field to sort results by (default: "windows_start")
     * @param sortOrder - Sort direction, either "asc" or "desc" (default: "desc")
     * @returns Object containing all incidents array and total count
     */
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