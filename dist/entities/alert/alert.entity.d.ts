export declare class Alert {
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
    incidentID: string;
    created_at: Date;
    updated_at: Date;
    generateId(): void;
}
