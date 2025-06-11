// backend/src/modules/incident/incident-comment.dto.ts
import { IsString, IsNotEmpty, IsOptional, MinLength, MaxLength } from "class-validator";

/**
 * CreateIncidentCommentDTO for creating new comments on incidents.
 * Used when users add comments to incidents with validation.
 */
export class CreateIncidentCommentDTO {
    @IsString()
    @IsNotEmpty()
    incident_id: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(1, { message: "Comment cannot be empty" })
    @MaxLength(2000, { message: "Comment cannot exceed 2000 characters" })
    content: string;
}

/**
 * UpdateIncidentCommentDTO for updating existing comments.
 * Allows users to edit their own comments with content validation.
 */
export class UpdateIncidentCommentDTO {
    @IsString()
    @IsNotEmpty()
    @MinLength(1, { message: "Comment cannot be empty" })
    @MaxLength(2000, { message: "Comment cannot exceed 2000 characters" })
    content: string;
}

/**
 * IncidentCommentResponseDTO for API response data structure.
 * Represents complete comment information including user details for frontend consumption.
 */
export class IncidentCommentResponseDTO {
    id: string;
    incident_id: string;
    user_id: string;
    content: string;
    created_at: Date;
    updated_at: Date;
    is_deleted: boolean;
    user_display_name?: string; // Enriched with user information
    can_edit?: boolean; // Whether current user can edit this comment
    can_delete?: boolean; // Whether current user can delete this comment
}