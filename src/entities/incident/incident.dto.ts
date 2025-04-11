import { IsString, IsArray, IsNumber, IsDateString } from "class-validator";

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