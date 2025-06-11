// backend/src/modules/incident/status-history/incident-status-history.dto.ts
import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsIn } from "class-validator";

/**
 * CreateIncidentStatusHistoryDTO for creating new status change occurences.
 * Used internally by the service when the status change occurs.
 */
export class CreateIncidentStatusHistoryDTO {
    @IsString()
    @IsNotEmpty()
    incident_id: string;

    @IsBoolean()
    previous_status: boolean;

    @IsBoolean()
    new_status: boolean;

    @IsString()
    @IsIn(["closed", "reopened", "created_open", "created_close"])
    action: string;

    @IsString()
    user_id: string;
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
    user_id: string;
    created_at: Date;
}