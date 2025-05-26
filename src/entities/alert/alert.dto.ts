// backend/src/entities/alert/alert.dto.ts

import { IsString, IsNumber, IsDateString, IsObject, IsBoolean, IsOptional } from "class-validator";

/**
 * Data Transfer Object for creating new alert records
 * Contains all required fields and validation rules for alert creation
 */
export class CreateAlertDTO {
    @IsString()
    user: string;

    @IsDateString()
    datestr: Date;

    @IsObject()
    evidence: Record<string, any>;

    @IsNumber()
    score: number;

    @IsString()
    alert_name: string;

    @IsString()
    MITRE_tactic: string;

    @IsString()
    MITRE_technique: string;

    @IsString()
    Logs: string;

    @IsString()
    Detection_model: string;

    @IsString()
    Description: string;

    @IsBoolean()
    isUnderIncident: boolean;
    
    @IsString()
    @IsOptional()
    incidentID?: string;
}

/**
 * Data Transfer Object for updating existing alert records
 * All fields are optional to allow partial updates of alert data
 */
export class UpdateAlertDTO {
    @IsString()
    @IsOptional()
    user?: string;

    @IsDateString()
    @IsOptional()
    datestr?: Date;

    @IsObject()
    @IsOptional()
    evidence?: Record<string, any>;

    @IsNumber()
    @IsOptional()
    score?: number;

    @IsString()
    @IsOptional()
    alert_name?: string;

    @IsString()
    @IsOptional()
    MITRE_tactic?: string;

    @IsString()
    @IsOptional()
    MITRE_technique?: string;

    @IsString()
    @IsOptional()
    Logs?: string;

    @IsString()
    @IsOptional()
    Detection_model?: string;

    @IsString()
    @IsOptional()
    Description?: string;

    @IsBoolean()
    @IsOptional()
    isUnderIncident?: boolean;
    
    @IsString()
    @IsOptional()
    incidentID?: string;
}

/**
 * Data Transfer Object for alert response data
 * Represents the structure of alert data returned by API endpoints
 */
export class AlertResponseDTO {
    ID: string;
    user: string;
    datestr: Date;
    evidence: Record<string, any>;
    score: number;
    alert_name: string;
    MITRE_tactic: string;
    MITRE_technique: string;
    Logs: string;
    Detection_model: string;
    Description: string;
    isUnderIncident: boolean;
    incidentID?: string;
    created_at: Date;
    updated_at: Date;
}