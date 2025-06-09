// backend/src/modules/analytics/analytics.service.ts
import { Repository } from "typeorm";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import { Alert } from "../alert/alert.entity";
import { Incident } from "../incident/incident.entity";

/**
 * AnalyticsService for comprehensive security data analysis and reporting.
 * 
 * Provides enterprise analytics capabilities including:
 * - Time-based aggregation with flexible grouping strategies (day/week/month)
 * - MITRE ATT&CK framework analysis for threat intelligence insights
 * - User activity analytics and score distribution analysis across predefined ranges
 * - Combined timeline visualization and trend analysis with period-over-period comparison
 * - Severity distribution analysis and top technique/tactic identification
 * - Advanced SQL query optimization for large-scale security data processing
 */
@Injectable()
export class AnalyticsService {
    constructor(
        @InjectRepository(Alert)
        private alertRepository: Repository<Alert>,

        @InjectRepository(Incident)
        private incidentRepository: Repository<Incident>
    ) {}

    /**
     * Formats dates for consistent grouping across analytics queries.
     */
    private formatDateForGroupBy(date: Date, groupBy: string): string {
        switch (groupBy) {
            case "week":
                const monday = new Date(date);
                monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
                return monday.toISOString().split("T")[0];
            case "month":
                return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
            default:
                return date.toISOString().split("T")[0];
        }
    }

    async getAlertsByDate(startDate: Date, endDate: Date, groupBy: "day" | "week" | "month" = "day") {
        const query = this.alertRepository
            .createQueryBuilder("alert")
            .select(`DATE_TRUNC('${groupBy}', alert.datestr) as date`)
            .addSelect("COUNT(*) as count")
            .where("alert.datestr BETWEEN :startDate AND :endDate", {
                startDate,
                endDate
            })
            .groupBy(`DATE_TRUNC('${groupBy}', alert.datestr)`)
            .orderBy("date", "ASC");

        const results = await query.getRawMany();

        return results.map(result => ({
            date: result.date,
            count: parseInt(result.count),
        }));
    }

    async getIncidentsByDate(startDate: Date, endDate: Date, groupBy: "day" | "week" | "month" = "day") {
        const query = this.incidentRepository
            .createQueryBuilder("incident")
            .select(`DATE_TRUNC('${groupBy}', incident.windows_start) as date`)
            .addSelect("COUNT(*) as count")
            .where("incident.windows_start BETWEEN :startDate AND :endDate", {
                startDate,
                endDate
            })
            .groupBy(`DATE_TRUNC('${groupBy}', incident.windows_start)`)
            .orderBy("date", "ASC");

        const results = await query.getRawMany();

        return results.map(result => ({
            date: result.date,
            count: parseInt(result.count),
        }));
    }

    async getAlertsByMITRE() {
        const results = await this.alertRepository
            .createQueryBuilder("alert")
            .select("alert.MITRE_tactic as tactic")
            .addSelect("COUNT(*) as count")
            .groupBy("alert.MITRE_tactic")
            .orderBy("count", "DESC")
            .getRawMany();

        return results.map(result => ({
            tactic: result.tactic,
            count: parseInt(result.count),
        }));
    }

    async getAlertsByUser(limit: number = 10) {
        const results = await this.alertRepository
            .createQueryBuilder("alert")
            .select("alert.user as user")
            .addSelect("COUNT(*) as count")
            .groupBy("alert.user")
            .orderBy("count", "DESC")
            .limit(limit)
            .getRawMany();

        return results.map(result => ({
            user: result.user,
            count: parseInt(result.count),
        }));
    }

    async getScoreDistribution() {
        const scoreRanges = [
            { min: 0, max: 1, label: "0-1" },
            { min: 1.01, max: 2, label: "1-2" },
            { min: 2.01, max: 3, label: "2-3" },
            { min: 3.01, max: 4, label: "3-4" },
            { min: 4.01, max: 5, label: "4-5" },
            { min: 5.01, max: 6, label: "5-6" },
            { min: 6.01, max: 7, label: "6-7" },
            { min: 7.01, max: 8, label: "7-8" },
            { min: 8.01, max: 9, label: "8-9" },
            { min: 9.01, max: 10, label: "9-10" },
        ];

        const results: Array<{
            scoreRange: string;
            alertCount: number;
            incidentCount: number;
        }> = [];

        for (const range of scoreRanges) {
            const alertCount = await this.alertRepository
                .createQueryBuilder("alert")
                .where("alert.score >= :min AND alert.score <= :max", {
                    min: range.min,
                    max: range.max
                })
                .getCount();

            const incidentCount = await this.incidentRepository
                .createQueryBuilder("incident")
                .where("incident.score >= :min AND incident.score <= :max", {
                    min: range.min,
                    max: range.max
                })
                .getCount();

            results.push({
                scoreRange: range.label,
                alertCount,
                incidentCount,
            });
        }
        return results;
    }

    async getTimeline(startDate: Date, endDate: Date, groupBy: "day" | "week" | "month" = "day") {
        const [alertsByDate, incidentsByDate] = await Promise.all([
            this.getAlertsByDate(startDate, endDate, groupBy),
            this.getIncidentsByDate(startDate, endDate, groupBy)
        ]);

        const dateMap = new Map();

        const current = new Date(startDate);
        const end = new Date(endDate);

        while (current <= end) {
            const key = this.formatDateForGroupBy(current, groupBy);
            dateMap.set(key, { date: key, alerts: 0, incidents: 0 });

            switch (groupBy) {
                case "week":
                    current.setDate(current.getDate() + 7);
                    break;
                case "month":
                    current.setMonth(current.getMonth() + 1);
                    break;
                default:
                    current.setDate(current.getDate() + 1);
                    break;
            }
        }

        alertsByDate.forEach(item => {
            const key = this.formatDateForGroupBy(new Date(item.date), groupBy);
            if (dateMap.has(key)) {
                dateMap.get(key).alerts = item.count;
            }
        });

        incidentsByDate.forEach(item => {
            const key = this.formatDateForGroupBy(new Date(item.date), groupBy);
            if (dateMap.has(key)) {
                dateMap.get(key).incidents = item.count;
            }
        });

        return Array.from(dateMap.values()).sort((a, b) => 
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );
    }

    async getTrends(startDate: Date, endDate: Date, groupBy: "day" | "week" | "month" = "day") {
        const currentData = await this.getTimeline(startDate, endDate, groupBy);

        const periodLength = endDate.getTime() - startDate.getTime();
        const previousEndDate = new Date(startDate.getTime() - 1);
        const previousStartDate = new Date(previousEndDate.getTime() - periodLength);

        const previousData = await this.getTimeline(previousStartDate, previousEndDate, groupBy);

        const currentTotals = currentData.reduce(
            (acc, item) => ({
                alerts: acc.alerts + item.alerts,
                incidents: acc.incidents + item.incidents,
            }),
            { alerts: 0, incidents: 0 }
        );

        const previousTotals = previousData.reduce(
            (acc, item) => ({
                alerts: acc.alerts + item.alerts,
                incidents: acc.incidents + item.incidents,
            }),
            { alerts: 0, incidents: 0 }
        );

        const alertsChange = previousTotals.alerts > 0
            ? ((currentTotals.alerts - previousTotals.alerts) / previousTotals.alerts) * 100
            : 0;
        
        const incidentsChange = previousTotals.incidents > 0
            ? ((currentTotals.incidents - previousTotals.incidents) / previousTotals.incidents) * 100
            : 0;
        
        return currentData.map(item => ({
            ...item,
            alertsChange: parseFloat(alertsChange.toFixed(2)),
            incidentsChange: parseFloat(incidentsChange.toFixed(2)),
            period: item.date,
        }));
    }

    async getAlertSeverityDistribution() {
        const severityRanges = [
            { min: 0, max: 4.99, label: "Low" },
            { min: 5, max: 6.99, label: "Medium" },
            { min: 7, max: 8.99, label: "High" },
            { min: 9, max: 10, label: "Critical" },
        ];

        const results: Array<{
            severity: string;
            count: number;
        }> = [];

        for (const range of severityRanges) {
            const count = await this.alertRepository
                .createQueryBuilder("alert")
                .where("alert.score >= :min AND alert.score <= :max", {
                    min: range.min,
                    max: range.max
                })
                .getCount();
            
            results.push({
                severity: range.label,
                count,
            });
        }
        return results;
    }

    async getTopMITRETechniques(limit: number = 10) {
        const results = await this.alertRepository
            .createQueryBuilder("alert")
            .select("alert.MITRE_technique as technique")
            .addSelect("COUNT(*) as count")
            .groupBy("alert.MITRE_technique")
            .orderBy("count", "DESC")
            .limit(limit)
            .getRawMany();

        return results.map(result => ({
            technique: result.technique,
            count: parseInt(result.count),
        }));
    }

    async getTopMITRETactics(limit: number = 10) {
        const results = await this.alertRepository
            .createQueryBuilder("alert")
            .select("alert.MITRE_tactic as tactic")
            .addSelect("COUNT(*) as count")
            .groupBy("alert.MITRE_tactic")
            .orderBy("count", "DESC")
            .limit(limit)
            .getRawMany();

        return results.map(result => ({
            tactic: result.tactic,
            count: parseInt(result.count),
        }));
    }
}