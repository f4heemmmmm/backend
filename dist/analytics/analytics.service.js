"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const typeorm_1 = require("typeorm");
const common_1 = require("@nestjs/common");
const typeorm_2 = require("@nestjs/typeorm");
const alert_entity_1 = require("../entities/alert/alert.entity");
const incident_entity_1 = require("../entities/incident/incident.entity");
let AnalyticsService = class AnalyticsService {
    alertRepository;
    incidentRepository;
    constructor(alertRepository, incidentRepository) {
        this.alertRepository = alertRepository;
        this.incidentRepository = incidentRepository;
    }
    formatDateForGroupBy(date, groupBy) {
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
    async getAlertsByDate(startDate, endDate, groupBy = "day") {
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
    async getIncidentsByDate(startDate, endDate, groupBy = "day") {
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
    async getAlertsByUser(limit = 10) {
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
        const results = [];
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
    async getTimeline(startDate, endDate, groupBy = "day") {
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
        return Array.from(dateMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    async getTrends(startDate, endDate, groupBy = "day") {
        const currentData = await this.getTimeline(startDate, endDate, groupBy);
        const periodLength = endDate.getTime() - startDate.getTime();
        const previousEndDate = new Date(startDate.getTime() - 1);
        const previousStartDate = new Date(previousEndDate.getTime() - periodLength);
        const previousData = await this.getTimeline(previousStartDate, previousEndDate, groupBy);
        const currentTotals = currentData.reduce((acc, item) => ({
            alerts: acc.alerts + item.alerts,
            incidents: acc.incidents + item.incidents,
        }), { alerts: 0, incidents: 0 });
        const previousTotals = previousData.reduce((acc, item) => ({
            alerts: acc.alerts + item.alerts,
            incidents: acc.incidents + item.incidents,
        }), { alerts: 0, incidents: 0 });
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
        const results = [];
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
    async getTopMITRETechniques(limit = 10) {
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
    async getTopMITRETactics(limit = 10) {
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
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_2.InjectRepository)(alert_entity_1.Alert)),
    __param(1, (0, typeorm_2.InjectRepository)(incident_entity_1.Incident)),
    __metadata("design:paramtypes", [typeorm_1.Repository,
        typeorm_1.Repository])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map