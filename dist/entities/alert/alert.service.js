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
exports.AlertService = void 0;
const alert_entity_1 = require("./alert.entity");
const typeorm_1 = require("@nestjs/typeorm");
const incident_service_1 = require("../incident/incident.service");
const typeorm_2 = require("typeorm");
const common_1 = require("@nestjs/common");
let AlertService = class AlertService {
    alertRepository;
    incidentService;
    constructor(alertRepository, incidentService) {
        this.alertRepository = alertRepository;
        this.incidentService = incidentService;
    }
    mapToResponseDTO(alert) {
        return {
            ID: alert.ID,
            user: alert.user,
            datestr: alert.datestr,
            evidence: alert.evidence,
            alert_name: alert.alert_name,
            score: alert.score,
            MITRE_tactic: alert.MITRE_tactic,
            MITRE_technique: alert.MITRE_technique,
            Logs: alert.Logs,
            Detection_model: alert.Detection_model,
            isUnderIncident: alert.isUnderIncident,
            Description: alert.Description,
            incidentID: alert.incidentID,
            created_at: alert.created_at,
            updated_at: alert.updated_at
        };
    }
    async findMatchingIncidentForAlert(alert) {
        try {
            const incidents = await this.incidentService.findIncidentsByUser(alert.user);
            const matchingIncident = incidents.find(incident => alert.datestr >= new Date(incident.windows_start) &&
                alert.datestr <= new Date(incident.windows_end));
            return matchingIncident ? matchingIncident.ID : undefined;
        }
        catch (error) {
            console.error("Error finding matching incident:", error);
            return undefined;
        }
    }
    async create(createAlertDTO) {
        const checkExistingAlert = await this.alertRepository.findOne({
            where: {
                user: createAlertDTO.user,
                datestr: createAlertDTO.datestr,
                alert_name: createAlertDTO.alert_name
            }
        });
        if (checkExistingAlert) {
            throw new common_1.ConflictException("An alert with the same user, date and alert name already exists!");
        }
        try {
            const alert = this.alertRepository.create(createAlertDTO);
            const matchingIncidentID = await this.findMatchingIncidentForAlert(alert);
            if (matchingIncidentID) {
                alert.incidentID = matchingIncidentID;
                alert.isUnderIncident = true;
            }
            const savedAlert = await this.alertRepository.save(alert);
            return this.mapToResponseDTO(savedAlert);
        }
        catch (error) {
            if (error.code === "23505") {
                throw new common_1.ConflictException("Duplicate alert. An alert with the same user, date and alert name already exists!");
            }
            throw error;
        }
    }
    async findAll(filters, limit = 10, offset = 0, sortField = "datestr", sortOrder = "desc") {
        const whereClause = {};
        if (filters) {
            Object.keys(filters).forEach(key => {
                if (filters[key] !== undefined) {
                    whereClause[key] = filters[key];
                }
            });
        }
        const order = { [sortField]: sortOrder };
        const [alerts, total] = await this.alertRepository.findAndCount({
            where: whereClause,
            order,
            take: limit,
            skip: offset
        });
        return {
            alerts: alerts.map(alert => this.mapToResponseDTO(alert)),
            total
        };
    }
    async searchAlerts(query, limit = 10, offset = 0, sortField = "datestr", sortOrder = "desc") {
        const searchQuery = (0, typeorm_2.ILike)(`%${query}%`);
        const order = { [sortField]: sortOrder };
        const [alerts, total] = await this.alertRepository.findAndCount({
            where: [
                { ID: searchQuery },
                { alert_name: searchQuery },
                { user: searchQuery },
                { MITRE_tactic: searchQuery },
                { MITRE_technique: searchQuery },
                { Description: searchQuery },
                { Detection_model: searchQuery },
            ],
            order,
            take: limit,
            skip: offset,
        });
        return {
            alerts: alerts.map(alert => this.mapToResponseDTO(alert)),
            total
        };
    }
    async findAlertByID(id) {
        const alert = await this.alertRepository.findOne({
            where: {
                ID: id
            }
        });
        if (!alert) {
            throw new common_1.NotFoundException(`Unable to find alert with ID: ${id}`);
        }
        return this.mapToResponseDTO(alert);
    }
    async getIncidentForAlert(alertID) {
        const alert = await this.alertRepository.findOne({
            where: {
                ID: alertID
            }
        });
        if (!alert || !alert.isUnderIncident || !alert.incidentID) {
            return null;
        }
        try {
            return await this.incidentService.findIncidentByID(alert.incidentID);
        }
        catch (error) {
            throw new common_1.NotFoundException(`Unable to find incident related to the alert!`);
        }
    }
    async findAlertsByIncidentID(incidentID, sortField = "datestr", sortOrder = "desc") {
        const order = { [sortField]: sortOrder };
        const alerts = await this.alertRepository.find({
            where: {
                incidentID,
                isUnderIncident: true
            },
            order
        });
        return alerts.map(alert => this.mapToResponseDTO(alert));
    }
    async updateAlertByID(id, updateAlertDTO) {
        const existingAlert = await this.alertRepository.findOne({
            where: {
                ID: id
            }
        });
        if (!existingAlert) {
            throw new common_1.NotFoundException(`Unable to find alert with ID: ${id}`);
        }
        try {
            await this.alertRepository.update(id, updateAlertDTO);
            const updatedAlert = await this.alertRepository.findOne({
                where: {
                    ID: id
                }
            });
            if (!updatedAlert) {
                throw new common_1.NotFoundException("Updated alert not found!");
            }
            if (updateAlertDTO.datestr || updateAlertDTO.user) {
                const matchingIncidentID = await this.findMatchingIncidentForAlert(updatedAlert);
                if (matchingIncidentID) {
                    updatedAlert.incidentID = matchingIncidentID;
                    updatedAlert.isUnderIncident = true;
                    await this.alertRepository.save(updatedAlert);
                }
                else if (updatedAlert.isUnderIncident) {
                    updatedAlert.incidentID = "";
                    updatedAlert.isUnderIncident = false;
                    await this.alertRepository.save(updatedAlert);
                }
            }
            return this.mapToResponseDTO(updatedAlert);
        }
        catch (error) {
            if (error.code === "23505") {
                throw new common_1.ConflictException("An alert with the same user, date and alert name already exists!");
            }
            throw error;
        }
    }
    async removeAlertByID(id) {
        const result = await this.alertRepository.delete({ ID: id });
        return result?.affected ? result.affected > 0 : false;
    }
    async findAlertsByDateRange(startDate, endDate, user, sortField = "datestr", sortOrder = "desc") {
        const whereClause = {
            datestr: (0, typeorm_2.Between)(startDate, endDate)
        };
        if (user) {
            whereClause.user = user;
        }
        const order = { [sortField]: sortOrder };
        const alerts = await this.alertRepository.find({
            where: whereClause,
            order
        });
        return alerts.map(alert => this.mapToResponseDTO(alert));
    }
    async findAlertsByMITRETactic(tactic, sortField = "datestr", sortOrder = "desc") {
        const order = { [sortField]: sortOrder };
        const alerts = await this.alertRepository.find({
            where: {
                MITRE_tactic: tactic,
            },
            order
        });
        return alerts.map(alert => this.mapToResponseDTO(alert));
    }
    async findAlertsByMITRETechnique(technique, sortField = "datestr", sortOrder = "desc") {
        const order = { [sortField]: sortOrder };
        const alerts = await this.alertRepository.find({
            where: {
                MITRE_technique: technique,
            },
            order
        });
        return alerts.map(alert => this.mapToResponseDTO(alert));
    }
    async findAlertsByUser(user, sortField = "datestr", sortOrder = "desc") {
        const order = { [sortField]: sortOrder };
        const alerts = await this.alertRepository.find({
            where: {
                user,
            },
            order
        });
        return alerts.map(alert => this.mapToResponseDTO(alert));
    }
    async findAlertsUnderIncident(isUnderIncident, sortField = "datestr", sortOrder = "desc") {
        const order = { [sortField]: sortOrder };
        const alerts = await this.alertRepository.find({
            where: {
                isUnderIncident,
            },
            order
        });
        return alerts.map(alert => this.mapToResponseDTO(alert));
    }
    async findOne(user, datestr, alertName) {
        const alert = await this.alertRepository.findOne({
            where: {
                user,
                datestr,
                alert_name: alertName
            }
        });
        if (!alert) {
            throw new common_1.NotFoundException(`Alert with user: ${user}, datestr: ${datestr} and alert_name: ${alertName} not found!`);
        }
        return this.mapToResponseDTO(alert);
    }
    async update(user, datestr, alertName, updateAlertDTO) {
        const existingAlert = await this.findOne(user, datestr, alertName);
        try {
            await this.alertRepository.update(existingAlert.ID, updateAlertDTO);
            if (updateAlertDTO.user || updateAlertDTO.datestr || updateAlertDTO.alert_name) {
                const newUser = updateAlertDTO.user || user;
                const newDatestr = updateAlertDTO.datestr || datestr;
                const newAlertName = updateAlertDTO.alert_name || alertName;
                return this.findOne(newUser, newDatestr, newAlertName);
            }
            return this.findOne(user, datestr, alertName);
        }
        catch (error) {
            if (error.code === "23505") {
                throw new common_1.ConflictException("Duplicate alert. An alert with the same user, date and alert name already exists!");
            }
            throw error;
        }
    }
    async updateAlertsForIncident(incident) {
        const userAlerts = await this.findAlertsByUser(incident.user);
        for (const alert of userAlerts) {
            const alertDate = new Date(alert.datestr);
            const incidentStart = new Date(incident.windows_start);
            const incidentEnd = new Date(incident.windows_end);
            if (alertDate >= incidentStart && alertDate <= incidentEnd) {
                if (!alert.isUnderIncident || alert.incidentID !== incident.ID) {
                    await this.alertRepository.update(alert.ID, {
                        isUnderIncident: true,
                        incidentID: incident.ID
                    });
                }
            }
            else if (alert.incidentID === incident.ID) {
                await this.alertRepository.update(alert.ID, {
                    isUnderIncident: false,
                    incidentID: ""
                });
            }
        }
    }
    async getAllAlerts(sortField = "datestr", sortOrder = "desc") {
        const order = { [sortField]: sortOrder };
        const alerts = await this.alertRepository.find({
            order
        });
        return alerts.map(alert => this.mapToResponseDTO(alert));
    }
    async getAllAlertsWithCount(sortField = "datestr", sortOrder = "desc") {
        const order = { [sortField]: sortOrder };
        const [alerts, total] = await this.alertRepository.findAndCount({
            order
        });
        return {
            alerts: alerts.map(alert => this.mapToResponseDTO(alert)),
            total
        };
    }
};
exports.AlertService = AlertService;
exports.AlertService = AlertService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(alert_entity_1.Alert)),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => incident_service_1.IncidentService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        incident_service_1.IncidentService])
], AlertService);
//# sourceMappingURL=alert.service.js.map