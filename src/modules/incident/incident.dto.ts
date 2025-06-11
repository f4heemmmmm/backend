// backend/src/modules/incident/incident.dto.ts
import { IsString, IsArray, IsNumber, IsDateString, IsBoolean, IsOptional } from "class-validator";

/**
 * CreateIncidentDTO for creating new security incident records with validation.
 * Contains required incident fields including time windows, scoring data, and closure status.
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

    @IsOptional()
    @IsBoolean()
    isClosed?: boolean;
}

/**
 * UpdateIncidentDTO for partial incident updates with optional field validation.
 * Allows selective modification of incident properties including closure status.
 */
export class UpdateIncidentDTO {
    @IsOptional()
    @IsString()
    user?: string;

    @IsOptional()
    @IsDateString()
    windows_start?: Date;

    @IsOptional()
    @IsDateString()
    windows_end?: Date;

    @IsOptional()
    @IsNumber()
    score?: number;

    @IsOptional()
    @IsArray()
    windows?: string[];

    @IsOptional()
    @IsBoolean()
    isClosed?: boolean;
}

/**
 * IncidentResponseDTO for API response data structure.
 * Represents complete incident information including generated ID, closure status, and audit timestamps.
 */
export class IncidentResponseDTO {
    ID: string;
    user: string;
    windows_start: Date;
    windows_end: Date;
    score: number;
    windows: string[];
    isClosed: boolean;
    created_at: Date;
    updated_at: Date;
}