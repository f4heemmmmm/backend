import { IsString, IsNumber, IsDateString, IsObject, IsBoolean } from "class-validator";

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
}

export class UpdateAlertDTO {
    @IsString()
    user?: string;

    @IsDateString()
    datestr?: Date;

    @IsObject()
    evidence?: Record<string, any>;

    @IsNumber()
    score?: number;

    @IsString()
    alert_name?: string;

    @IsString()
    MITRE_tactic?: string;

    @IsString()
    MITRE_technique?: string;

    @IsString()
    Logs?: string;

    @IsString()
    Detection_model?: string;

    @IsString()
    Description?: string;

    @IsBoolean()
    isUnderIncident?: boolean;
}

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
    created_at: Date;
    updated_at: Date;
}