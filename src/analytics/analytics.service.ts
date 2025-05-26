// backend/src/analytics/analytics.module.ts

import { Repository } from "typeorm";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Alert } from "src/entities/alert/alert.entity";
import { Incident } from "src/entities/incident/incident.entity";

@Injectable()
export class AnalyticsService {
    constructor(
        @InjectRepository(Alert)
        private alertRepository: Repository<Alert>,

        @InjectRepository(Incident)
        private incidentRepository: Repository<Incident>
    ) {}

    /**
     * Formats a date according to the specified grouping strategy for analytics queries
     * @param date - Date to format
     * @param groupBy - Grouping strategy (day, week, or month)
     * @returns Formatted date string for grouping purposes
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

    /**
     * Retrieves alert counts grouped by date within a specified date range
     * @param startDate - Beginning date of the range to analyze
     * @param endDate - End date of the range to analyze
     * @param groupBy - Time grouping strategy (day, week, or month)
     * @returns Promise resolving to array of date-grouped alert counts
     */
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

    /**
     * Retrieves incident counts grouped by date within a specified date range
     * @param startDate - Beginning date of the range to analyze
     * @param endDate - End date of the range to analyze
     * @param groupBy - Time grouping strategy (day, week, or month)
     * @returns Promise resolving to array of date-grouped incident counts
     */
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

    /**
     * Analyzes alert distribution across MITRE ATT&CK tactics
     * @returns Promise resolving to array of MITRE tactics with their alert counts
     */
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

    /**
     * Retrieves alert counts grouped by user with optional result limiting
     * @param limit - Maximum number of users to return (default: 10)
     * @returns Promise resolving to array of users with their alert counts
     */
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

    /**
     * Analyzes score distribution across predefined ranges for both alerts and incidents
     * @returns Promise resolving to array of score ranges with alert and incident counts
     */
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

    /**
     * Generates a combined timeline view of alerts and incidents within a date range
     * @param startDate - Beginning date of the timeline range
     * @param endDate - End date of the timeline range
     * @param groupBy - Time grouping strategy (day, week, or month)
     * @returns Promise resolving to timeline data with alerts and incidents counts
     */
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

    /**
     * Performs trend analysis comparing current period data with previous period
     * @param startDate - Beginning date of the current analysis period
     * @param endDate - End date of the current analysis period
     * @param groupBy - Time grouping strategy (day, week, or month)
     * @returns Promise resolving to trend data with percentage changes
     */
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

    /**
     * Analyzes alert distribution across severity levels based on score ranges
     * @returns Promise resolving to array of severity levels with their alert counts
     */
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

    /**
     * Retrieves the most frequently occurring MITRE ATT&CK techniques
     * @param limit - Maximum number of techniques to return (default: 10)
     * @returns Promise resolving to array of MITRE techniques with their occurrence counts
     */
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

    /**
     * Retrieves the most frequently occurring MITRE ATT&CK tactics
     * @param limit - Maximum number of tactics to return (default: 10)
     * @returns Promise resolving to array of MITRE tactics with their occurrence counts
     */
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