// backend/src/entities/incident/incident.dto.ts

import { IsString, IsArray, IsNumber, IsDateString } from "class-validator";

/**
 * Data Transfer Object for creating new incidents.
 * Contains all required fields for incident creation with validation decorators.
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
};

/**
 * Data Transfer Object for updating existing incidents.
 * All fields are optional to allow partial updates.
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
};

/**
 * Data Transfer Object for incident responses.
 * Contains all incident fields including generated ID and timestamps.
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
};