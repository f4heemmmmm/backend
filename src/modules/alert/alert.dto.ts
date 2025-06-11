// backend/src/modules/alert/alert.dto.ts
import { IsString, IsNumber, IsDateString, IsObject, IsBoolean, IsOptional } from "class-validator";

/**
 * CreateAlertDTO for creating new alert records with validation.
 * Contains required security alert fields and MITRE ATT&CK framework data.
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
    is_under_incident: boolean;
    
    @IsString()
    @IsOptional()
    incident_id?: string;
}

/**
 * UpdateAlertDTO for partial alert updates with optional field validation.
 * Allows selective modification of alert properties.
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
    is_under_incident?: boolean;
    
    @IsString()
    @IsOptional()
    incident_id?: string;
}

/**
 * AlertResponseDTO for API response data structure.
 * Represents complete alert information including timestamps and relationships.
 */
export class AlertResponseDTO {
    id: string;
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
    is_under_incident: boolean;
    incident_id?: string;
    created_at: Date;
    updated_at: Date;
}