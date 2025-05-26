export declare class Incident {
    ID: string;
    user: string;
    windows_start: Date;
    windows_end: Date;
    score: number;
    windows: string[];
    created_at: Date;
    updated_at: Date;
    generateID(): void;
}
