import { Repository } from "typeorm";
import { Alert } from "src/entities/alert/alert.entity";
import { Incident } from "src/entities/incident/incident.entity";
export declare class AnalyticsService {
    private alertRepository;
    private incidentRepository;
    constructor(alertRepository: Repository<Alert>, incidentRepository: Repository<Incident>);
    private formatDateForGroupBy;
    getAlertsByDate(startDate: Date, endDate: Date, groupBy?: "day" | "week" | "month"): Promise<{
        date: any;
        count: number;
    }[]>;
    getIncidentsByDate(startDate: Date, endDate: Date, groupBy?: "day" | "week" | "month"): Promise<{
        date: any;
        count: number;
    }[]>;
    getAlertsByMITRE(): Promise<{
        tactic: any;
        count: number;
    }[]>;
    getAlertsByUser(limit?: number): Promise<{
        user: any;
        count: number;
    }[]>;
    getScoreDistribution(): Promise<{
        scoreRange: string;
        alertCount: number;
        incidentCount: number;
    }[]>;
    getTimeline(startDate: Date, endDate: Date, groupBy?: "day" | "week" | "month"): Promise<any[]>;
    getTrends(startDate: Date, endDate: Date, groupBy?: "day" | "week" | "month"): Promise<any[]>;
    getAlertSeverityDistribution(): Promise<{
        severity: string;
        count: number;
    }[]>;
    getTopMITRETechniques(limit?: number): Promise<{
        technique: any;
        count: number;
    }[]>;
    getTopMITRETactics(limit?: number): Promise<{
        tactic: any;
        count: number;
    }[]>;
}
