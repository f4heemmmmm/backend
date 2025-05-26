export declare class CreateIncidentDTO {
    user: string;
    windows_start: Date;
    windows_end: Date;
    score: number;
    windows: string[];
}
export declare class UpdateIncidentDTO {
    user?: string;
    windows_start?: Date;
    windows_end?: Date;
    score?: number;
    windows?: string[];
}
export declare class IncidentResponseDTO {
    ID: string;
    user: string;
    windows_start: Date;
    windows_end: Date;
    score: number;
    windows: string[];
    created_at: Date;
    updated_at: Date;
}
