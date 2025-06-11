// backend/src/modules/incident/incident.service.ts
import { Incident } from "./incident.entity";
import { IncidentStatusHistory } from "./incident-status-history.entity";
import { IncidentComment } from "./incident-comment.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { AlertService } from "../alert/alert.service";
import { UserService } from "../user/user.service";
import { CreateIncidentDTO, UpdateIncidentDTO, IncidentResponseDTO } from "./incident.dto";
import { CreateIncidentStatusHistoryDTO, IncidentStatusHistoryResponseDTO } from "./incident-status-history.dto";
import { CreateIncidentCommentDTO, UpdateIncidentCommentDTO, IncidentCommentResponseDTO } from "./incident-comment.dto";
import { Injectable, NotFoundException, ConflictException, Inject, forwardRef, ForbiddenException } from "@nestjs/common";
import { Repository, Between, FindOptionsWhere, MoreThanOrEqual, ILike, FindOptionsOrder } from "typeorm";

type SortField = "windows_start" | "score" | "user";
type SortOrder = "asc" | "desc";

/**
 * IncidentService for comprehensive security incident management with enhanced comment functionality.
 * 
 * Enhanced with user tracking for status changes and comprehensive comment management:
 * - CRUD operations with automatic alert association updates
 * - Advanced search and filtering with date/score range queries
 * - User-specific incident retrieval and threshold-based filtering
 * - Composite key operations for duplicate detection and prevention
 * - Real-time alert correlation updates when incidents are modified
 * - Flexible sorting and pagination for large-scale incident data
 * - Incident closure status tracking and management
 * - Comprehensive status change history with user attribution and audit trails
 * - User tracking for all incident status changes (creation, closure, reopening)
 * - Full comment system with user ownership, editing, and deletion capabilities
 * - Comment timeline integration with user display names and permissions
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
            isClosed: incident.isClosed,
            created_at: incident.created_at,
            updated_at: incident.updated_at,
        };
    }

    /**
     * Maps IncidentStatusHistory entity to response DTO.
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
     * Maps IncidentComment entity to response DTO with user permissions.
     */
    private async mapCommentToResponseDTO(comment: IncidentComment, currentUserId?: string): Promise<IncidentCommentResponseDTO> {
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
            can_edit: currentUserId === comment.user_id,
            can_delete: currentUserId === comment.user_id
        };
    }

    /**
     * Creates a status history record for incident status changes with user tracking.
     */
    private async createStatusHistoryRecord(
        incidentId: string, 
        previousStatus: boolean, 
        newStatus: boolean,
        userId?: string,
        isInitialCreation = false
    ): Promise<void> {
        let action: string;
        
        if (isInitialCreation) {
            action = newStatus ? 'created_closed' : 'created_open';
        } else {
            action = newStatus ? 'closed' : 'reopened';
        }

        const statusHistoryDTO: CreateIncidentStatusHistoryDTO = {
            incident_id: incidentId,
            previous_status: previousStatus,
            new_status: newStatus,
            action: action,
            user_id: userId
        };

        const statusHistory = this.statusHistoryRepository.create(statusHistoryDTO);
        await this.statusHistoryRepository.save(statusHistory);
        
        console.log(`✅ Status change recorded: ${action} by user ${userId || 'system'} for incident ${incidentId}`);
    }

    // =================== EXISTING INCIDENT METHODS ===================

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

    async update(user: string, windows_start: Date, windows_end: Date, updateIncidentDTO: UpdateIncidentDTO, userId?: string): Promise<IncidentResponseDTO> {
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

        const previousStatus = incident.isClosed;

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
                    if (existingIncident && existingIncident.ID !== incident.ID) {
                        throw new ConflictException(`Duplicate incident. An incident with the same user and time window already exists!`);
                    }
                }
            }
            
            await this.incidentRepository.update(incident.ID, updateIncidentDTO);
            
            const updatedIncident = await this.incidentRepository.findOne({
                where: { ID: incident.ID }
            });
            if (!updatedIncident) {
                throw new NotFoundException("Updated incident not found");
            }

            if (updateIncidentDTO.isClosed !== undefined && updateIncidentDTO.isClosed !== previousStatus) {
                await this.createStatusHistoryRecord(
                    incident.ID,
                    previousStatus,
                    updateIncidentDTO.isClosed,
                    userId
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
    
    async create(createIncidentDTO: CreateIncidentDTO, userId?: string): Promise<IncidentResponseDTO> {
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

            const initialStatus = savedIncident.isClosed || false;
            await this.createStatusHistoryRecord(
                savedIncident.ID,
                false,
                initialStatus,
                userId,
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
    
    async updateById(id: string, updateIncidentDTO: UpdateIncidentDTO, userId?: string): Promise<IncidentResponseDTO> {
        const incident = await this.incidentRepository.findOne({
            where: { ID: id }
        });
        if (!incident) {
            throw new NotFoundException(`Incident with ID: ${id} not found!`);
        }

        const previousStatus = incident.isClosed;

        try {
            if (Object.keys(updateIncidentDTO).length === 1 && updateIncidentDTO.isClosed !== undefined) {
                await this.incidentRepository.update(id, { isClosed: updateIncidentDTO.isClosed });
            } else {
                await this.incidentRepository.update(id, updateIncidentDTO);
            }
            
            const updatedIncident = await this.incidentRepository.findOne({
                where: { ID: id }
            });
            if (!updatedIncident) {
                throw new NotFoundException("Updated incident not found");
            }

            if (updateIncidentDTO.isClosed !== undefined && updateIncidentDTO.isClosed !== previousStatus) {
                await this.createStatusHistoryRecord(
                    id,
                    previousStatus,
                    updateIncidentDTO.isClosed,
                    userId
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

    async getIncidentStatusHistory(incidentId: string): Promise<IncidentStatusHistoryResponseDTO[]> {
        await this.findIncidentByID(incidentId);
        
        const statusHistory = await this.statusHistoryRepository.find({
            where: { incident_id: incidentId },
            order: { created_at: 'ASC' }
        });

        return statusHistory.map(status => this.mapStatusHistoryToResponseDTO(status));
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

    async getAlertsForIncident(incidentID: string): Promise<any[]> {
        await this.findIncidentByID(incidentID);
        return this.alertService.findAlertsByIncidentID(incidentID);
    }

    // =================== COMMENT METHODS ===================

    /**
     * Creates a new comment on an incident with user tracking.
     */
    async createComment(createCommentDTO: CreateIncidentCommentDTO, userId: string): Promise<IncidentCommentResponseDTO> {
        // Verify incident exists
        await this.findIncidentByID(createCommentDTO.incident_id);

        const comment = this.commentRepository.create({
            incident_id: createCommentDTO.incident_id,
            user_id: userId,
            content: createCommentDTO.content
        });

        const savedComment = await this.commentRepository.save(comment);
        console.log(`✅ Comment created: ${savedComment.id} by user ${userId} for incident ${createCommentDTO.incident_id}`);
        
        return this.mapCommentToResponseDTO(savedComment, userId);
    }

    /**
     * Retrieves all comments for a specific incident with user information.
     */
    async getIncidentComments(incidentId: string, currentUserId?: string): Promise<IncidentCommentResponseDTO[]> {
        // Verify incident exists
        await this.findIncidentByID(incidentId);
        
        const comments = await this.commentRepository.find({
            where: { 
                incident_id: incidentId,
                is_deleted: false
            },
            order: { created_at: 'ASC' }
        });

        const commentDTOs = await Promise.all(
            comments.map(comment => this.mapCommentToResponseDTO(comment, currentUserId))
        );

        return commentDTOs;
    }

    /**
     * Updates a comment if the user owns it.
     */
    async updateComment(commentId: string, updateCommentDTO: UpdateIncidentCommentDTO, userId: string): Promise<IncidentCommentResponseDTO> {
        const comment = await this.commentRepository.findOne({
            where: { 
                id: commentId,
                is_deleted: false
            }
        });

        if (!comment) {
            throw new NotFoundException(`Comment with ID: ${commentId} not found!`);
        }

        // Check if user owns the comment
        if (comment.user_id !== userId) {
            throw new ForbiddenException("You can only edit your own comments");
        }

        await this.commentRepository.update(commentId, {
            content: updateCommentDTO.content,
            updated_at: new Date()
        });

        const updatedComment = await this.commentRepository.findOne({
            where: { id: commentId }
        });

        if (!updatedComment) {
            throw new NotFoundException("Updated comment not found");
        }

        console.log(`✅ Comment updated: ${commentId} by user ${userId}`);
        return this.mapCommentToResponseDTO(updatedComment, userId);
    }

    /**
     * Soft deletes a comment if the user owns it.
     */
    async deleteComment(commentId: string, userId: string): Promise<boolean> {
        const comment = await this.commentRepository.findOne({
            where: { 
                id: commentId,
                is_deleted: false
            }
        });

        if (!comment) {
            throw new NotFoundException(`Comment with ID: ${commentId} not found!`);
        }

        // Check if user owns the comment
        if (comment.user_id !== userId) {
            throw new ForbiddenException("You can only delete your own comments");
        }

        const result = await this.commentRepository.update(commentId, {
            is_deleted: true,
            updated_at: new Date()
        });

        console.log(`✅ Comment deleted: ${commentId} by user ${userId}`);
        return result?.affected ? result.affected > 0 : false;
    }

    /**
     * Gets a specific comment by ID with user permissions.
     */
    async getCommentById(commentId: string, currentUserId?: string): Promise<IncidentCommentResponseDTO> {
        const comment = await this.commentRepository.findOne({
            where: { 
                id: commentId,
                is_deleted: false
            }
        });

        if (!comment) {
            throw new NotFoundException(`Comment with ID: ${commentId} not found!`);
        }

        return this.mapCommentToResponseDTO(comment, currentUserId);
    }
}