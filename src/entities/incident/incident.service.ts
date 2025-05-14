import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between, FindOptionsWhere, MoreThanOrEqual, ILike, FindOptionsOrder } from "typeorm";
import { Injectable, NotFoundException, ConflictException, Inject, forwardRef } from "@nestjs/common";

// Incident Files Import
import { Incident } from "./incident.entity";
import { CreateIncidentDTO, UpdateIncidentDTO, IncidentResponseDTO } from "./incident.dto";
import { AlertService } from "../alert/alert.service";

// Define types for sorting
type SortField = 'windows_start' | 'score' | 'user';
type SortOrder = 'asc' | 'desc';

@Injectable()
export class IncidentService {
    constructor(
        @InjectRepository(Incident)
        private incidentRepository: Repository<Incident>,
        @Inject(forwardRef(() => AlertService))
        private readonly alertService: AlertService
    ) {}

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
     * Find an incident by its ID
     * @param id Incident ID
     * @returns The incident with the specified ID
     */
    async findById(id: string): Promise<IncidentResponseDTO> {
        const incident = await this.incidentRepository.findOne({
            where: { ID: id }
        });
        
        if (!incident) {
            throw new NotFoundException(`Incident with ID: ${id} not found!`);
        }
        
        return this.mapToResponseDTO(incident);
    }
    
    /**
     * Find a single incident by the composite key of user, windows_start and windows_end
     * @param user Username
     * @param windows_start Incident start time
     * @param windows_end Incident end time
     * @return A single incident belonging to the user with the specified time window (or throw NotFoundException)
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
     * Find incidents by their date range
     * @param startDate Start date for the range
     * @param endDate End date for the range
     * @param user Optional user filter
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
     * Find incidents by score range
     * @param minScore Minimum score
     * @param maxScore Maximum score
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
     * Find incidents by user
     * @param user Username to search for
     * @returns Array of incidents under the specified user
     */
    async findIncidentsByUser(user: string): Promise<IncidentResponseDTO[]> {
        const incidents = await this.incidentRepository.find({
            where: { user },
            order: { windows_start: "DESC" }
        });
        return incidents.map(incident => this.mapToResponseDTO(incident));
    }

    /**
     * Update an existing incident by the composite key of user, windows_start and windows_end
     * @param user Username
     * @param windows_start Incident start time
     * @param windows_end Incident end time
     * @param updateIncidentDTO Incident update data
     * @returns The updated incident
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
                throw new NotFoundException('Updated incident not found');
            }
            
            // If the time window or user was updated, update alert associations
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
     * Remove an incident by the composite key of user, windows_start and windows_end
     * @param user Username
     * @param windows_start Incident start time
     * @param windows_end Incident end time
     * @returns True if successful (False, vice versa)
     */
    async remove(user: string, windows_start: Date, windows_end: Date): Promise<boolean> {
        const incident = await this.findOne(user, windows_start, windows_end);
        const result = await this.incidentRepository.delete(incident.ID);
        return result?.affected ? result.affected > 0 : false;
    }

    /**
     * Find all incidents with pagination and optional filtering, including sorting
     * @param filters Optional filters for the query
     * @param limit Number of incidents per page
     * @param offset Number of records to skip
     * @param sortField Field to sort by
     * @param sortOrder Sort direction (asc or desc)
     * @returns Array of incidents with total count
     */
    async findAll(
        filters?: Partial<Incident>,
        limit = 10,
        offset = 0,
        sortField: SortField = 'windows_start',
        sortOrder: SortOrder = 'desc'
    ): Promise<{ incidents: IncidentResponseDTO[], total: number }> {
        const whereClause: FindOptionsWhere<Incident> = {};
        if (filters) {
            Object.keys(filters).forEach(key => {
                if (filters[key] !== undefined) {
                    whereClause[key] = filters[key];
                }
            });
        }

        // Create the order object for sorting
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

    /** Find incidents with scores above a specified threshold
     * @param threshold Minimum score threshold
     * @returns Array of incidents with socres above the specified threshold
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
    
    async removeById(id: string): Promise<boolean> {
        const result = await this.incidentRepository.delete({ ID: id });
        return result?.affected ? result.affected > 0 : false;
    }
    
    /**
     * Create a new incident
     * @param createIncidentDTO Incident creation data
     * @returns The created incident
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
            // Create the incident entity
            const incident = this.incidentRepository.create(createIncidentDTO);
            
            const savedIncident = await this.incidentRepository.save(incident);
            
            // Update all matching alerts to associate them with this incident
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
     * Update an incident by ID
     * @param id Incident ID
     * @param updateIncidentDTO Update data
     * @returns The updated incident
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
                throw new NotFoundException('Updated incident not found');
            }
            
            // If the time window or user was updated, update alert associations
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
     * Get alerts for an incident
     * @param incidentId Incident ID
     * @returns Array of alerts associated with the incident
     */
    async getAlertsForIncident(incidentId: string): Promise<any[]> {
        // Verify the incident exists
        await this.findById(incidentId);
        
        // Use the AlertService to find alerts by incident ID
        return this.alertService.findAlertsByIncidentId(incidentId);
    }

    /**
         * Search incidents by query string across multiple fields including ID
         * @param query Search query string
         * @param limit Number of records to return
         * @param offset Pagination offset
         * @param sortField Field to sort by
         * @param sortOrder Sort direction (asc or desc)
         * @returns Incidents matching the search query with total count
         */
    async searchIncidents(
        query: string,
        limit: number = 10,
        offset: number = 0,
        sortField: SortField = 'windows_start',
        sortOrder: SortOrder = 'desc'
    ): Promise<{ incidents: IncidentResponseDTO[]; total: number }> {
        // Create ILike expressions for case-insensitive search
        const searchQuery = ILike(`%${query}%`);
        
        // Create the order object for sorting
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
};