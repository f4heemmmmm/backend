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
exports.IncidentService = void 0;
const incident_entity_1 = require("./incident.entity");
const typeorm_1 = require("@nestjs/typeorm");
const alert_service_1 = require("../alert/alert.service");
const common_1 = require("@nestjs/common");
const typeorm_2 = require("typeorm");
let IncidentService = class IncidentService {
    incidentRepository;
    alertService;
    constructor(incidentRepository, alertService) {
        this.incidentRepository = incidentRepository;
        this.alertService = alertService;
    }
    mapToResponseDTO(incident) {
        return {
            ID: incident.ID,
            user: incident.user,
            windows_start: incident.windows_start,
            windows_end: incident.windows_end,
            score: incident.score,
            windows: incident.windows,
            created_at: incident.created_at,
            updated_at: incident.updated_at,
        };
    }
    async findIncidentByID(id) {
        const incident = await this.incidentRepository.findOne({
            where: { ID: id }
        });
        if (!incident) {
            throw new common_1.NotFoundException(`Incident with ID: ${id} not found!`);
        }
        return this.mapToResponseDTO(incident);
    }
    async findOne(user, windows_start, windows_end) {
        const incident = await this.incidentRepository.findOne({
            where: {
                user,
                windows_start,
                windows_end,
            }
        });
        if (!incident) {
            throw new common_1.NotFoundException(`Incident with user: ${user}, windows_start: ${windows_start} and windows_end: ${windows_end} not found!`);
        }
        return this.mapToResponseDTO(incident);
    }
    async findIncidentsByDateRange(startDate, endDate, user) {
        const whereClause = {
            windows_start: (0, typeorm_2.Between)(startDate, endDate)
        };
        if (user) {
            whereClause.user = user;
        }
        const incidents = await this.incidentRepository.find({
            where: whereClause,
            order: { windows_start: "DESC" }
        });
        return incidents.map(incident => this.mapToResponseDTO(incident));
    }
    async findIncidentsByScoreRange(minScore, maxScore) {
        const incidents = await this.incidentRepository.find({
            where: {
                score: (0, typeorm_2.Between)(minScore, maxScore)
            },
            order: { score: "DESC" }
        });
        return incidents.map(incident => this.mapToResponseDTO(incident));
    }
    async findIncidentsByUser(user) {
        const incidents = await this.incidentRepository.find({
            where: { user },
            order: { windows_start: "DESC" }
        });
        return incidents.map(incident => this.mapToResponseDTO(incident));
    }
    async update(user, windows_start, windows_end, updateIncidentDTO) {
        const incident = await this.incidentRepository.findOne({
            where: {
                user,
                windows_start,
                windows_end,
            }
        });
        if (!incident) {
            throw new common_1.NotFoundException(`Incident with user: ${user}, windows_start: ${windows_start} and windows_end: ${windows_end} not found!`);
        }
        try {
            if (updateIncidentDTO.user || updateIncidentDTO.windows_start || updateIncidentDTO.windows_end) {
                const newUser = updateIncidentDTO.user || user;
                const newWindowsStart = updateIncidentDTO.windows_start || windows_start;
                const newWindowsEnd = updateIncidentDTO.windows_end || windows_end;
                if (newUser !== user || newWindowsStart !== windows_start || newWindowsEnd !== windows_end) {
                    const existingIncident = await this.incidentRepository.findOne({
                        where: {
                            user: newUser,
                            windows_start: newWindowsStart,
                            windows_end: newWindowsEnd,
                        }
                    });
                    if (existingIncident && existingIncident.ID !== incident.ID) {
                        throw new common_1.ConflictException(`Duplicate incident. An incident with the same user and time window already exists!`);
                    }
                }
            }
            await this.incidentRepository.update(incident.ID, updateIncidentDTO);
            const updatedIncident = await this.incidentRepository.findOne({
                where: {
                    ID: incident.ID,
                }
            });
            if (!updatedIncident) {
                throw new common_1.NotFoundException("Updated incident not found");
            }
            if (updateIncidentDTO.windows_start || updateIncidentDTO.windows_end || updateIncidentDTO.user) {
                await this.alertService.updateAlertsForIncident(updatedIncident);
            }
            return this.mapToResponseDTO(updatedIncident);
        }
        catch (error) {
            if (error.code === "23505") {
                throw new common_1.ConflictException(`Duplicate incident. An incident with the same user and time window already exists!`);
            }
            throw error;
        }
    }
    async remove(user, windows_start, windows_end) {
        const incident = await this.findOne(user, windows_start, windows_end);
        const result = await this.incidentRepository.delete(incident.ID);
        return result?.affected ? result.affected > 0 : false;
    }
    async findAll(filters, limit = 10, offset = 0, sortField = "windows_start", sortOrder = "desc") {
        const whereClause = {};
        if (filters) {
            Object.keys(filters).forEach(key => {
                if (filters[key] !== undefined) {
                    whereClause[key] = filters[key];
                }
            });
        }
        const order = { [sortField]: sortOrder };
        const [incidents, total] = await this.incidentRepository.findAndCount({
            where: whereClause,
            order,
            take: limit,
            skip: offset
        });
        return {
            incidents: incidents.map(incident => this.mapToResponseDTO(incident)),
            total,
        };
    }
    async findIncidentsByThreshold(threshold) {
        const incidents = await this.incidentRepository.find({
            where: {
                score: (0, typeorm_2.MoreThanOrEqual)(threshold),
            },
            order: {
                score: "DESC"
            }
        });
        return incidents.map(incident => this.mapToResponseDTO(incident));
    }
    async removeById(id) {
        const result = await this.incidentRepository.delete({ ID: id });
        return result?.affected ? result.affected > 0 : false;
    }
    async create(createIncidentDTO) {
        const checkExistingIncident = await this.incidentRepository.findOne({
            where: {
                user: createIncidentDTO.user,
                windows_start: createIncidentDTO.windows_start,
                windows_end: createIncidentDTO.windows_end,
            }
        });
        if (checkExistingIncident) {
            throw new common_1.ConflictException("An incident with the same user and time window is already created!");
        }
        try {
            const incident = this.incidentRepository.create(createIncidentDTO);
            const savedIncident = await this.incidentRepository.save(incident);
            await this.alertService.updateAlertsForIncident(savedIncident);
            return this.mapToResponseDTO(savedIncident);
        }
        catch (error) {
            if (error.code === "23505") {
                throw new common_1.ConflictException(`Duplicate incident. An incident with the same user, and time window already exists!`);
            }
            throw error;
        }
    }
    async updateById(id, updateIncidentDTO) {
        const incident = await this.incidentRepository.findOne({
            where: { ID: id }
        });
        if (!incident) {
            throw new common_1.NotFoundException(`Incident with ID: ${id} not found!`);
        }
        try {
            await this.incidentRepository.update(id, updateIncidentDTO);
            const updatedIncident = await this.incidentRepository.findOne({
                where: { ID: id }
            });
            if (!updatedIncident) {
                throw new common_1.NotFoundException("Updated incident not found");
            }
            if (updateIncidentDTO.windows_start || updateIncidentDTO.windows_end || updateIncidentDTO.user) {
                await this.alertService.updateAlertsForIncident(updatedIncident);
            }
            return this.mapToResponseDTO(updatedIncident);
        }
        catch (error) {
            if (error.code === "23505") {
                throw new common_1.ConflictException(`Duplicate incident. An incident with the same user and time window already exists!`);
            }
            throw error;
        }
    }
    async getAlertsForIncident(incidentID) {
        await this.findIncidentByID(incidentID);
        return this.alertService.findAlertsByIncidentID(incidentID);
    }
    async searchIncidents(query, limit = 10, offset = 0, sortField = "windows_start", sortOrder = "desc") {
        const searchQuery = (0, typeorm_2.ILike)(`%${query}%`);
        const order = { [sortField]: sortOrder };
        const [incidents, total] = await this.incidentRepository.findAndCount({
            where: [
                { ID: searchQuery },
                { user: searchQuery }
            ],
            order,
            take: limit,
            skip: offset,
        });
        return {
            incidents: incidents.map(incident => this.mapToResponseDTO(incident)),
            total
        };
    }
    async getAllIncidents(sortField = "windows_start", sortOrder = "desc") {
        const order = { [sortField]: sortOrder };
        const incidents = await this.incidentRepository.find({
            order
        });
        return incidents.map(incident => this.mapToResponseDTO(incident));
    }
    async getAllIncidentsWithCount(sortField = "windows_start", sortOrder = "desc") {
        const order = { [sortField]: sortOrder };
        const [incidents, total] = await this.incidentRepository.findAndCount({
            order
        });
        return {
            incidents: incidents.map(incident => this.mapToResponseDTO(incident)),
            total
        };
    }
};
exports.IncidentService = IncidentService;
exports.IncidentService = IncidentService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(incident_entity_1.Incident)),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => alert_service_1.AlertService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        alert_service_1.AlertService])
], IncidentService);
//# sourceMappingURL=incident.service.js.map