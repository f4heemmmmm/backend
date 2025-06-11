// backend/src/modules/incident/incident-status-history.dto.ts
import { IsString, IsBoolean, IsOptional, IsUUID, IsIn } from "class-validator";

/**
 * CreateIncidentStatusHistoryDTO for creating new status change records.
 * Used internally by the service when status changes occur.
 */
export class CreateIncidentStatusHistoryDTO {
    @IsString()
    incident_id: string;

    @IsBoolean()
    previous_status: boolean;

    @IsBoolean()
    new_status: boolean;

    @IsString()
    @IsIn(['closed', 'reopened', 'created_open', 'created_closed'])
    action: string; // "closed" | "reopened" | "created_open" | "created_closed"

    @IsOptional()
    @IsString()
    user_id?: string;
}

/**
 * IncidentStatusHistoryResponseDTO for API response data structure.
 * Represents complete status change information for frontend consumption.
 */
export class IncidentStatusHistoryResponseDTO {
    id: string;
    incident_id: string;
    previous_status: boolean;
    new_status: boolean;
    action: string;
    user_id?: string;
    created_at: Date;
}