import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between, FindOptionsWhere, MoreThanOrEqual } from "typeorm";
import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";

// Incident Files Import
import { Incident } from "./incident.entity";
import { CreateIncidentDTO, UpdateIncidentDTO, IncidentResponseDTO } from "./incident.dto";

@Injectable()
export class IncidentService {
    constructor(
        @InjectRepository(Incident)
        private incidentRepository: Repository<Incident>
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
            const incident = this.incidentRepository.create(createIncidentDTO);
            const savedIncident = await this.incidentRepository.save(incident);
            return savedIncident;
        } catch (error) {
            if (error.code === "23505") {
                throw new ConflictException(`Duplicate incident. An incident with the same user, and time window already exists!`);
            }
            throw error;
        }
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
     * Find all incidents with pagination and optional filtering
     * @param user Optional user filter
     * @param limit Number of incidents per page
     * @param offset Number of records to skip
     * @returns Array of incidents with total count
     */
    async findAll(user?: string, limit = 10, offset = 0): Promise<{ incidents: IncidentResponseDTO[], total: number }> {
        const where: FindOptionsWhere<Incident> = {};
        if (user) {
            where.user = user;
        }
        const [incidents, total] = await this.incidentRepository.findAndCount({
            where,
            take: limit,
            skip: offset,
            order: {
                windows_start: 'DESC',
            },
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
}