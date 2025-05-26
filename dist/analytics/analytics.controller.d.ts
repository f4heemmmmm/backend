import { AnalyticsService } from "./analytics.service";
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getAlertsByDate(startDate: string, endDate: string, groupBy?: "day" | "week" | "month"): Promise<{
        date: any;
        count: number;
    }[]>;
    getIncidentsByDate(startDate: string, endDate: string, groupBy?: "day" | "week" | "month"): Promise<{
        date: any;
        count: number;
    }[]>;
    getAlertsByMitre(): Promise<{
        tactic: any;
        count: number;
    }[]>;
    getAlertsByUser(limit?: string): Promise<{
        user: any;
        count: number;
    }[]>;
    getScoreDistribution(): Promise<{
        scoreRange: string;
        alertCount: number;
        incidentCount: number;
    }[]>;
    getTimeline(startDate: string, endDate: string, groupBy?: "day" | "week" | "month"): Promise<any[]>;
    getTrends(startDate: string, endDate: string, groupBy?: "day" | "week" | "month"): Promise<any[]>;
    getAlertSeverityDistribution(): Promise<{
        severity: string;
        count: number;
    }[]>;
    getTopMitreTechniques(limit?: string): Promise<{
        technique: any;
        count: number;
    }[]>;
    getTopMitreTactics(limit?: string): Promise<{
        tactic: any;
        count: number;
    }[]>;
}
