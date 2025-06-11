// backend/src/modules/incident/incident.service.ts
import { Repository, Between, FindOptionsWhere, MoreThanOrEqual, ILike, FindOptionsOrder } from "typeorm";
import { Injectable, NotFoundException, ConflictException, Inject, forwardRef, ForbiddenException } from "@nestjs/common";

import { Incident } from "./incident.entity";
import { UserService } from "../user/user.service";
import { InjectRepository } from "@nestjs/typeorm";
import { AlertService } from "../alert/alert.service";
import { IncidentComment } from "./comment/incident-comment.entity";
import { IncidentStatusHistory } from "./status-history/incident-status-history.entity";
import { CreateIncidentDTO, UpdateIncidentDTO, IncidentResponseDTO } from "./incident.dto";
import { CreateIncidentStatusHistoryDTO, IncidentStatusHistoryResponseDTO } from "./status-history/incident-status-history.dto";
import { CreateIncidentCommentDTO, UpdateIncidentCommentDTO, IncidentCommentResponseDTO } from "./comment/incident-comment.dto";

type SortField = "windows_start" | "score" | "user";
type SortOrder = "asc" | "desc";

/**
 * Comprehensive security incident management service with enhanced comment functionality.
 * Provides full CRUD operations for incidents, status history tracking, and comment management
 * with user permissions and audit trails. Handles alert correlation, duplicate detection,
 * and real-time updates for incident-related data across the security platform.
 */
@Injectable()
export class IncidentService {
    constructor(
        @InjectRepository(Incident)
        private incidentRepository: Repository<Incident>,

        @InjectRepository(IncidentStatusHistory)
        private statusHistoryRepository: Repository<IncidentStatusHistory>,

        @InjectRepository(IncidentComment)
        private commentRepository: Repository<IncidentComment>,

        @Inject(forwardRef(() => AlertService))
        private readonly alertService: AlertService,
        
        private readonly userService: UserService
    ) {}

    /**
     * Transforms Incident entity to standardized response DTO format.
     * @param incident - The incident entity to transform
     * @returns Formatted incident response DTO
     */
    private mapToResponseDTO(incident: Incident): IncidentResponseDTO {
        return {
            id: incident.id,
            user: incident.user,
            windows_start: incident.windows_start,
            windows_end: incident.windows_end,
            score: incident.score,
            windows: incident.windows,
            is_closed: incident.is_closed,
            created_at: incident.created_at,
            updated_at: incident.updated_at,
        };
    }

    /**
     * Transforms IncidentStatusHistory entity to response DTO format.
     * @param statusHistory - The status history entity to transform
     * @returns Formatted status history response DTO
     */
    private mapStatusHistoryToResponseDTO(statusHistory: IncidentStatusHistory): IncidentStatusHistoryResponseDTO {
        return {
            id: statusHistory.id,
            incident_id: statusHistory.incident_id,
            previous_status: statusHistory.previous_status,
            new_status: statusHistory.new_status,
            action: statusHistory.action,
            user_id: statusHistory.user_id,
            created_at: statusHistory.created_at,
        };
    }

    /**
     * Transforms IncidentComment entity to response DTO with user permissions and display information.
     * @param comment - The comment entity to transform
     * @param currentUserID - Current user ID for permission checking
     * @returns Formatted comment response DTO with user permissions
     */
    private async mapCommentToResponseDTO(comment: IncidentComment, currentUserID: string): Promise<IncidentCommentResponseDTO> {
        const userDisplayName = await this.userService.getUserDisplayName(comment.user_id);
        
        return {
            id: comment.id,
            incident_id: comment.incident_id,
            user_id: comment.user_id,
            content: comment.content,
            created_at: comment.created_at,
            updated_at: comment.updated_at,
            is_deleted: comment.is_deleted,
            user_display_name: userDisplayName,
            can_edit: currentUserID === comment.user_id,
            can_delete: currentUserID === comment.user_id
        };
    }

    /**
     * Creates audit trail record for incident status changes with user attribution.
     * @param incidentID - The incident ID for status tracking
     * @param previousStatus - Previous status before change
     * @param newStatus - New status after change
     * @param userID - User ID who made the change
     * @param isInitialCreation - Whether this is the initial creation record
     */
    private async createStatusHistoryRecord(
        incidentID: string, 
        previousStatus: boolean, 
        newStatus: boolean,
        userID: string,
        isInitialCreation = false
    ): Promise<void> {
        let action: string;
        
        if (isInitialCreation) {
            action = newStatus ? "created_closed" : "created_open";
        } else {
            action = newStatus ? "closed" : "reopened";
        }

        const statusHistoryDTO: CreateIncidentStatusHistoryDTO = {
            incident_id: incidentID,
            previous_status: previousStatus,
            new_status: newStatus,
            action: action,
            user_id: userID
        };
        const statusHistory = this.statusHistoryRepository.create(statusHistoryDTO);
        await this.statusHistoryRepository.save(statusHistory);
        console.log(`✅ Status change recorded: ${action} by user ${userID || "system"} for incident ${incidentID}`);
    }

    /**
     * Retrieves a single incident by its unique identifier.
     * @param id - The incident ID to search for
     * @returns Incident response DTO
     * @throws NotFoundException if incident not found
     */
    async findIncidentByID(id: string): Promise<IncidentResponseDTO> {
        const incident = await this.incidentRepository.findOne({
            where: { id: id }
        });
        if (!incident) {
            throw new NotFoundException(`Incident with ID: ${id} not found!`);
        }
        return this.mapToResponseDTO(incident);
    }
    
    /**
     * Finds incident by composite key of user and time window.
     * @param user - Username associated with the incident
     * @param windows_start - Start time of the incident window
     * @param windows_end - End time of the incident window
     * @returns Incident response DTO
     * @throws NotFoundException if incident not found
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
     * Retrieves incidents within a specified date range with optional user filtering.
     * @param startDate - Start date for filtering incidents
     * @param endDate - End date for filtering incidents
     * @param user - Optional user filter
     * @returns Array of incident response DTOs
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
     * Retrieves incidents within a specified score range for threat analysis.
     * @param minScore - Minimum score threshold
     * @param maxScore - Maximum score threshold
     * @returns Array of incident response DTOs ordered by score
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
     * Retrieves all incidents associated with a specific user.
     * @param user - Username to filter incidents by
     * @returns Array of incident response DTOs for the user
     */
    async findIncidentsByUser(user: string): Promise<IncidentResponseDTO[]> {
        const incidents = await this.incidentRepository.find({
            where: { user },
            order: { windows_start: "DESC" }
        });
        return incidents.map(incident => this.mapToResponseDTO(incident));
    }

    /**
     * Updates an incident using composite key with duplicate detection and alert correlation.
     * @param user - Username for incident identification
     * @param windows_start - Start time for incident identification
     * @param windows_end - End time for incident identification
     * @param updateIncidentDTO - Data transfer object containing update fields
     * @param userID - User ID for audit tracking
     * @returns Updated incident response DTO
     * @throws NotFoundException if incident not found
     * @throws ConflictException if update would create duplicate
     */
    async update(user: string, windows_start: Date, windows_end: Date, updateIncidentDTO: UpdateIncidentDTO, userID: string): Promise<IncidentResponseDTO> {
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
        const previousStatus = incident.is_closed;
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
                    if (existingIncident && existingIncident.id !== incident.id) {
                        throw new ConflictException(`Duplicate incident. An incident with the same user and time window already exists!`);
                    }
                }
            }
            await this.incidentRepository.update(incident.id, updateIncidentDTO);
            const updatedIncident = await this.incidentRepository.findOne({
                where: { id: incident.id }
            });
            if (!updatedIncident) {
                throw new NotFoundException("Updated incident not found");
            }

            if (updateIncidentDTO.is_closed !== undefined && updateIncidentDTO.is_closed !== previousStatus) {
                await this.createStatusHistoryRecord(
                    incident.id,
                    previousStatus,
                    updateIncidentDTO.is_closed,
                    userID
                );
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
     * @param user - Username for incident identification
     * @param windows_start - Start time for incident identification
     * @param windows_end - End time for incident identification
     * @returns Boolean indicating successful deletion
     */
    async remove(user: string, windows_start: Date, windows_end: Date): Promise<boolean> {
        const incident = await this.findOne(user, windows_start, windows_end);
        const result = await this.incidentRepository.delete(incident.id);
        return result?.affected ? result.affected > 0 : false;
    }

    /**
     * Retrieves paginated incidents with advanced filtering and sorting capabilities.
     * @param filters - Optional filters to apply to incident search
     * @param limit - Maximum number of results to return (default: 10)
     * @param offset - Number of results to skip for pagination (default: 0)
     * @param sortField - Field to sort by (default: "windows_start")
     * @param sortOrder - Sort direction (default: "desc")
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
     * Retrieves incidents above a specified score threshold for high-severity analysis.
     * @param threshold - Minimum score threshold for filtering
     * @returns Array of incident response DTOs above threshold
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
     * Removes an incident by its unique identifier.
     * @param id - The incident ID to delete
     * @returns Boolean indicating successful deletion
     */
    async removeByID(id: string): Promise<boolean> {
        const result = await this.incidentRepository.delete({ id: id });
        return result?.affected ? result.affected > 0 : false;
    }
    
    /**
     * Creates a new incident with duplicate detection and automatic alert correlation.
     * @param createIncidentDTO - Data transfer object containing incident creation data
     * @param userID - User ID for audit tracking
     * @returns Created incident response DTO
     * @throws ConflictException if incident with same composite key exists
     */
    async create(createIncidentDTO: CreateIncidentDTO, userID: string): Promise<IncidentResponseDTO> {
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

            const initialStatus = savedIncident.is_closed || false;
            await this.createStatusHistoryRecord(
                savedIncident.id,
                false,
                initialStatus,
                userID,
                true
            );
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
     * Updates an incident by its unique identifier with status tracking and alert correlation.
     * @param id - The incident ID to update
     * @param updateIncidentDTO - Data transfer object containing update fields
     * @param userID - User ID for audit tracking
     * @returns Updated incident response DTO
     * @throws NotFoundException if incident not found
     * @throws ConflictException if update would create duplicate
     */
    async updateByID(id: string, updateIncidentDTO: UpdateIncidentDTO, userID: string): Promise<IncidentResponseDTO> {
        const incident = await this.incidentRepository.findOne({
            where: { id: id }
        });
        if (!incident) {
            throw new NotFoundException(`Incident with ID: ${id} not found!`);
        }
        const previousStatus = incident.is_closed;
        try {
            if (Object.keys(updateIncidentDTO).length === 1 && updateIncidentDTO.is_closed !== undefined) {
                await this.incidentRepository.update(id, { is_closed: updateIncidentDTO.is_closed });
            } else {
                await this.incidentRepository.update(id, updateIncidentDTO);
            }
            
            const updatedIncident = await this.incidentRepository.findOne({
                where: { id: id }
            });
            if (!updatedIncident) {
                throw new NotFoundException("Updated incident not found");
            }

            if (updateIncidentDTO.is_closed !== undefined && updateIncidentDTO.is_closed !== previousStatus) {
                await this.createStatusHistoryRecord(
                    id,
                    previousStatus,
                    updateIncidentDTO.is_closed,
                    userID
                );
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
     * Retrieves complete status change history for an incident with chronological ordering.
     * @param incidentID - The incident ID to get history for
     * @returns Array of status history response DTOs
     * @throws NotFoundException if incident not found
     */
    async getIncidentStatusHistory(incidentID: string): Promise<IncidentStatusHistoryResponseDTO[]> {
        await this.findIncidentByID(incidentID);
        const statusHistory = await this.statusHistoryRepository.find({
            where: { incident_id: incidentID },
            order: { created_at: "ASC" }
        });

        return statusHistory.map(status => this.mapStatusHistoryToResponseDTO(status));
    }

    /**
     * Searches incidents using text-based queries with pagination and sorting.
     * @param query - Search query string for ID or user matching
     * @param limit - Maximum number of results to return (default: 10)
     * @param offset - Number of results to skip for pagination (default: 0)
     * @param sortField - Field to sort by (default: "windows_start")
     * @param sortOrder - Sort direction (default: "desc")
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
                { id: searchQuery },
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
     * Retrieves all incidents in the system with sorting capabilities.
     * @param sortField - Field to sort by (default: "windows_start")
     * @param sortOrder - Sort direction (default: "desc")
     * @returns Array of all incident response DTOs
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
     * Retrieves all incidents with total count for dashboard and analytics purposes.
     * @param sortField - Field to sort by (default: "windows_start")
     * @param sortOrder - Sort direction (default: "desc")
     * @returns Object containing all incidents and total count
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

    /**
     * Retrieves all alerts associated with a specific incident for correlation analysis.
     * @param incidentID - The incident ID to get alerts for
     * @returns Array of alerts related to the incident
     * @throws NotFoundException if incident not found
     */
    async getAlertsForIncident(incidentID: string): Promise<any[]> {
        await this.findIncidentByID(incidentID);
        return this.alertService.findAlertsByIncidentID(incidentID);
    }

    /**
     * Creates a new comment on an incident with user ownership tracking.
     * @param createCommentDTO - Data transfer object for comment creation
     * @param userID - User ID of the comment author
     * @returns Created comment response DTO with permissions
     * @throws NotFoundException if incident not found
     */
    async createComment(createCommentDTO: CreateIncidentCommentDTO, userID: string): Promise<IncidentCommentResponseDTO> {
        await this.findIncidentByID(createCommentDTO.incident_id);

        const comment = this.commentRepository.create({
            incident_id: createCommentDTO.incident_id,
            user_id: userID,
            content: createCommentDTO.content
        });

        const savedComment = await this.commentRepository.save(comment);
        console.log(`✅ Comment created: ${savedComment.id} by user ${userID} for incident ${createCommentDTO.incident_id}`);
        
        return this.mapCommentToResponseDTO(savedComment, userID);
    }

    /**
     * Retrieves all active comments for an incident with user information and permissions.
     * @param incidentID - The incident ID to get comments for
     * @param currentUserID - Current user ID for permission checking
     * @returns Array of comment response DTOs with user information
     * @throws NotFoundException if incident not found
     */
    async getIncidentComments(incidentID: string, currentUserID: string): Promise<IncidentCommentResponseDTO[]> {
        await this.findIncidentByID(incidentID);
        
        const comments = await this.commentRepository.find({
            where: { 
                incident_id: incidentID,
                is_deleted: false
            },
            order: { created_at: "ASC" }
        });

        const commentDTOs = await Promise.all(
            comments.map(comment => this.mapCommentToResponseDTO(comment, currentUserID))
        );

        return commentDTOs;
    }

    /**
     * Updates a comment with ownership verification and audit tracking.
     * @param commentID - The comment ID to update
     * @param updateCommentDTO - Data transfer object containing update fields
     * @param userID - User ID attempting the update
     * @returns Updated comment response DTO
     * @throws NotFoundException if comment not found
     * @throws ForbiddenException if user doesn't own the comment
     */
    async updateComment(commentID: string, updateCommentDTO: UpdateIncidentCommentDTO, userID: string): Promise<IncidentCommentResponseDTO> {
        const comment = await this.commentRepository.findOne({
            where: { 
                id: commentID,
                is_deleted: false
            }
        });

        if (!comment) {
            throw new NotFoundException(`Comment with ID: ${commentID} not found!`);
        }

        if (comment.user_id !== userID) {
            throw new ForbiddenException("You can only edit your own comments");
        }

        await this.commentRepository.update(commentID, {
            content: updateCommentDTO.content,
            updated_at: new Date()
        });

        const updatedComment = await this.commentRepository.findOne({
            where: { id: commentID }
        });

        if (!updatedComment) {
            throw new NotFoundException("Updated comment not found");
        }

        console.log(`✅ Comment updated: ${commentID} by user ${userID}`);
        return this.mapCommentToResponseDTO(updatedComment, userID);
    }

    /**
     * Soft deletes a comment with ownership verification and audit tracking.
     * @param commentID - The comment ID to delete
     * @param userID - User ID attempting the deletion
     * @returns Boolean indicating successful deletion
     * @throws NotFoundException if comment not found
     * @throws ForbiddenException if user doesn't own the comment
     */
    async deleteComment(commentID: string, userID: string): Promise<boolean> {
        const comment = await this.commentRepository.findOne({
            where: { 
                id: commentID,
                is_deleted: false
            }
        });

        if (!comment) {
            throw new NotFoundException(`Comment with ID: ${commentID} not found!`);
        }

        if (comment.user_id !== userID) {
            throw new ForbiddenException("You can only delete your own comments");
        }

        const result = await this.commentRepository.update(commentID, {
            is_deleted: true,
            updated_at: new Date()
        });

        console.log(`✅ Comment deleted: ${commentID} by user ${userID}`);
        return result?.affected ? result.affected > 0 : false;
    }

    /**
     * Retrieves a specific comment by ID with user permissions information.
     * @param commentID - The comment ID to retrieve
     * @param currentUserID - Current user ID for permission checking
     * @returns Comment response DTO with user information and permissions
     * @throws NotFoundException if comment not found
     */
    async getCommentByID(commentID: string, currentUserID: string): Promise<IncidentCommentResponseDTO> {
        const comment = await this.commentRepository.findOne({
            where: { 
                id: commentID,
                is_deleted: false
            }
        });

        if (!comment) {
            throw new NotFoundException(`Comment with ID: ${commentID} not found!`);
        }

        return this.mapCommentToResponseDTO(comment, currentUserID);
    }
}