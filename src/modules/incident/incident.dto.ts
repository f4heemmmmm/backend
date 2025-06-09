// backend/src/modules/incident/incident.dto.ts
import { IsString, IsArray, IsNumber, IsDateString } from "class-validator";

/**
 * CreateIncidentDTO for creating new security incident records with validation.
 * Contains required incident fields including time windows and scoring data.
 */
export class CreateIncidentDTO {
    @IsString()
    user: string;

    @IsDateString()
    windows_start: Date;

    @IsDateString()
    windows_end: Date;

    @IsNumber()
    score: number;

    @IsArray()
    windows: string[];
}

/**
 * UpdateIncidentDTO for partial incident updates with optional field validation.
 * Allows selective modification of incident properties.
 */
export class UpdateIncidentDTO {
    @IsString()
    user?: string;

    @IsDateString()
    windows_start?: Date;

    @IsDateString()
    windows_end?: Date;

    @IsNumber()
    score?: number;

    @IsArray()
    windows?: string[];
}

/**
 * IncidentResponseDTO for API response data structure.
 * Represents complete incident information including generated ID and audit timestamps.
 */
export class IncidentResponseDTO {
    ID: string;
    user: string;
    windows_start: Date;
    windows_end: Date;
    score: number;
    windows: string[];
    created_at: Date;
    updated_at: Date;
}