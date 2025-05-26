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
exports.IncidentController = void 0;
const incident_service_1 = require("./incident.service");
const alert_dto_1 = require("../alert/alert.dto");
const incident_dto_1 = require("./incident.dto");
const swagger_1 = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
let IncidentController = class IncidentController {
    incidentService;
    constructor(incidentService) {
        this.incidentService = incidentService;
    }
    async create(createIncidentDTO) {
        return this.incidentService.create(createIncidentDTO);
    }
    async findAll(queryParams, limit, offset, sortField, sortOrder) {
        const { limit: limitParam, offset: offsetParam, sortField: sortFieldParam, sortOrder: sortOrderParam, ...filters } = queryParams;
        return this.incidentService.findAll(filters, limit ? Number(limit) : undefined, offset ? Number(offset) : undefined, this.validateSortField(sortField), this.validateSortOrder(sortOrder));
    }
    async searchIncidents(query, limit, offset, sortField, sortOrder) {
        return this.incidentService.searchIncidents(query, limit ? Number(limit) : 10, offset ? Number(offset) : 0, this.validateSortField(sortField), this.validateSortOrder(sortOrder));
    }
    async findIncidentsByDateRange(startDate, endDate, user) {
        return this.incidentService.findIncidentsByDateRange(startDate, endDate, user);
    }
    async findIncidentsByScoreRange(minScore, maxScore) {
        return this.incidentService.findIncidentsByScoreRange(minScore, maxScore);
    }
    async getAllIncidents(sortField, sortOrder) {
        return this.incidentService.getAllIncidents(this.validateSortField(sortField), this.validateSortOrder(sortOrder));
    }
    async getAllIncidentsWithCount(sortField, sortOrder) {
        return this.incidentService.getAllIncidentsWithCount(this.validateSortField(sortField), this.validateSortOrder(sortOrder));
    }
    async findById(id) {
        return this.incidentService.findIncidentByID(id);
    }
    async getAlertsForIncident(incidentID) {
        return this.incidentService.getAlertsForIncident(incidentID);
    }
    async findIncidentsByUser(user) {
        return this.incidentService.findIncidentsByUser(user);
    }
    async findIncidentsByThreshold(threshold) {
        return this.incidentService.findIncidentsByThreshold(threshold);
    }
    async updateById(id, updateIncidentDTO) {
        return this.incidentService.updateById(id, updateIncidentDTO);
    }
    async removeById(id) {
        await this.incidentService.removeById(id);
    }
    validateSortField(sortField) {
        const validFields = ["windows_start", "score", "user"];
        return (sortField && validFields.includes(sortField))
            ? sortField
            : "windows_start";
    }
    validateSortOrder(sortOrder) {
        return (sortOrder && (sortOrder === "asc" || sortOrder === "desc"))
            ? sortOrder
            : "desc";
    }
};
exports.IncidentController = IncidentController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: "Create a new incident", description: "Creates a new incident with the provided data" }),
    (0, swagger_1.ApiBody)({ type: incident_dto_1.CreateIncidentDTO, description: "Incident creation data" }),
    (0, swagger_1.ApiResponse)({ status: 201, description: "Incident successfully created", type: incident_dto_1.IncidentResponseDTO }),
    (0, swagger_1.ApiResponse)({ status: 400, description: "Invalid input data" }),
    (0, swagger_1.ApiResponse)({ status: 500, description: "Internal server error" }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [incident_dto_1.CreateIncidentDTO]),
    __metadata("design:returntype", Promise)
], IncidentController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: "Get all incidents", description: "Retrieves all incidents with optional filtering, pagination and sorting" }),
    (0, swagger_1.ApiQuery)({ name: "limit", required: false, type: Number, description: "Number of incidents per page" }),
    (0, swagger_1.ApiQuery)({ name: "offset", required: false, type: Number, description: "Number of incidents to skip" }),
    (0, swagger_1.ApiQuery)({ name: "sortField", required: false, enum: ["windows_start", "score", "user"], description: "Field to sort by" }),
    (0, swagger_1.ApiQuery)({ name: "sortOrder", required: false, enum: ["asc", "desc"], description: "Direction to sort" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Incidents successfully retrieved", schema: { type: "object", properties: { incidents: { type: "array", items: { $ref: "#/components/schemas/IncidentResponseDTO" } }, total: { type: "number" } } } }),
    (0, swagger_1.ApiResponse)({ status: 500, description: "Internal server error" }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Query)("limit")),
    __param(2, (0, common_1.Query)("offset")),
    __param(3, (0, common_1.Query)("sortField")),
    __param(4, (0, common_1.Query)("sortOrder")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number, String, String]),
    __metadata("design:returntype", Promise)
], IncidentController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)("search"),
    (0, swagger_1.ApiOperation)({ summary: "Search incidents", description: "Search incidents by query string across multiple fields" }),
    (0, swagger_1.ApiQuery)({ name: "query", type: String, description: "Search query string" }),
    (0, swagger_1.ApiQuery)({ name: "limit", required: false, type: Number, description: "Number of records to return", example: 10 }),
    (0, swagger_1.ApiQuery)({ name: "offset", required: false, type: Number, description: "Number of records to skip, pagination offset", example: 0 }),
    (0, swagger_1.ApiQuery)({ name: "sortField", required: false, enum: ["windows_start", "score", "user"], description: "Field to sort by" }),
    (0, swagger_1.ApiQuery)({ name: "sortOrder", required: false, enum: ["asc", "desc"], description: "Direction to sort by" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Successfully searched incidents", schema: { type: "object", properties: { incidents: { type: "array", items: { $ref: "#/components/schemas/IncidentResponseDTO" } }, total: { type: "number" } } } }),
    (0, swagger_1.ApiResponse)({ status: 400, description: "Invalid search query" }),
    (0, swagger_1.ApiResponse)({ status: 500, description: "Internal server error" }),
    __param(0, (0, common_1.Query)("query")),
    __param(1, (0, common_1.Query)("limit")),
    __param(2, (0, common_1.Query)("offset")),
    __param(3, (0, common_1.Query)("sortField")),
    __param(4, (0, common_1.Query)("sortOrder")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number, String, String]),
    __metadata("design:returntype", Promise)
], IncidentController.prototype, "searchIncidents", null);
__decorate([
    (0, common_1.Get)("date-range"),
    __param(0, (0, common_1.Query)("start_date")),
    __param(1, (0, common_1.Query)("end_date")),
    __param(2, (0, common_1.Query)("user")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Date,
        Date, String]),
    __metadata("design:returntype", Promise)
], IncidentController.prototype, "findIncidentsByDateRange", null);
__decorate([
    (0, common_1.Get)("score-range"),
    __param(0, (0, common_1.Query)("min_score", common_1.ParseFloatPipe)),
    __param(1, (0, common_1.Query)("max_score", common_1.ParseFloatPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], IncidentController.prototype, "findIncidentsByScoreRange", null);
__decorate([
    (0, common_1.Get)("all"),
    __param(0, (0, common_1.Query)("sortField")),
    __param(1, (0, common_1.Query)("sortOrder")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], IncidentController.prototype, "getAllIncidents", null);
__decorate([
    (0, common_1.Get)("all/with-count"),
    __param(0, (0, common_1.Query)("sortField")),
    __param(1, (0, common_1.Query)("sortOrder")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], IncidentController.prototype, "getAllIncidentsWithCount", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, swagger_1.ApiOperation)({ summary: "Get incident by ID", description: "Retrieve a single incident by its ID" }),
    (0, swagger_1.ApiParam)({ name: "id", type: String, description: "Incident ID" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Successfully retrieved incident", type: incident_dto_1.IncidentResponseDTO }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Incident not found" }),
    (0, swagger_1.ApiResponse)({ status: 500, description: "Internal server error" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], IncidentController.prototype, "findById", null);
__decorate([
    (0, common_1.Get)(":incidentID/alerts"),
    (0, swagger_1.ApiOperation)({ summary: "Get alerts for an incident", description: "Retrieve all alerts associated with a specific incident" }),
    (0, swagger_1.ApiParam)({ name: "incidentID", type: String, description: "Incident ID to find alerts for" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Successfully retrieved alerts for the incident", type: [alert_dto_1.AlertResponseDTO] }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Incident not found" }),
    (0, swagger_1.ApiResponse)({ status: 500, description: "Internal server error" }),
    __param(0, (0, common_1.Param)("incidentID")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], IncidentController.prototype, "getAlertsForIncident", null);
__decorate([
    (0, common_1.Get)("user/:user"),
    (0, swagger_1.ApiOperation)({ summary: "Get incidents by user", description: "Retrieve all incidents associated with a specific user" }),
    (0, swagger_1.ApiParam)({ name: "user", type: String, description: "User to search for" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Successfully retrieved incidents for the user", type: [incident_dto_1.IncidentResponseDTO] }),
    (0, swagger_1.ApiResponse)({ status: 500, description: "Internal server error" }),
    __param(0, (0, common_1.Param)("user")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], IncidentController.prototype, "findIncidentsByUser", null);
__decorate([
    (0, common_1.Get)("threshold/:threshold"),
    (0, swagger_1.ApiOperation)({ summary: "Get incidents by threshold", description: "Retrieve all incidents with scores above a specified threshold" }),
    (0, swagger_1.ApiParam)({ name: "threshold", type: Number, description: "Minimum score threshold" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Successfully retrieved incidents above threshold", type: [incident_dto_1.IncidentResponseDTO] }),
    (0, swagger_1.ApiResponse)({ status: 400, description: "Invalid threshold value" }),
    (0, swagger_1.ApiResponse)({ status: 500, description: "Internal server error" }),
    __param(0, (0, common_1.Param)("threshold", common_1.ParseFloatPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], IncidentController.prototype, "findIncidentsByThreshold", null);
__decorate([
    (0, common_1.Put)(":id"),
    (0, swagger_1.ApiOperation)({ summary: "Update incident", description: "Update an existing incident by its ID" }),
    (0, swagger_1.ApiParam)({ name: "id", type: String, description: "Incident ID" }),
    (0, swagger_1.ApiBody)({ type: incident_dto_1.UpdateIncidentDTO, description: "Incident update data" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Incident successfully updated", type: incident_dto_1.IncidentResponseDTO }),
    (0, swagger_1.ApiResponse)({ status: 400, description: "Invalid input data" }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Incident not found" }),
    (0, swagger_1.ApiResponse)({ status: 500, description: "Internal server error" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, incident_dto_1.UpdateIncidentDTO]),
    __metadata("design:returntype", Promise)
], IncidentController.prototype, "updateById", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: "Delete incident", description: "Delete an incident by its ID" }),
    (0, swagger_1.ApiParam)({ name: "id", type: String, description: "Incident ID" }),
    (0, swagger_1.ApiResponse)({ status: 204, description: "Incident successfully deleted" }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Incident not found" }),
    (0, swagger_1.ApiResponse)({ status: 500, description: "Internal server error" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], IncidentController.prototype, "removeById", null);
exports.IncidentController = IncidentController = __decorate([
    (0, swagger_1.ApiTags)("incidents"),
    (0, common_1.Controller)("incident"),
    __metadata("design:paramtypes", [incident_service_1.IncidentService])
], IncidentController);
//# sourceMappingURL=incident.controller.js.map