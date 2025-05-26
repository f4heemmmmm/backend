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
exports.AlertController = void 0;
const alert_service_1 = require("../alert/alert.service");
const incident_dto_1 = require("../incident/incident.dto");
const alert_dto_1 = require("../alert/alert.dto");
const swagger_1 = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
let AlertController = class AlertController {
    alertService;
    constructor(alertService) {
        this.alertService = alertService;
    }
    validateSortField(sortField) {
        const validFields = ["datestr", "score", "alert_name"];
        return (sortField && validFields.includes(sortField))
            ? sortField
            : "datestr";
    }
    validateSortOrder(sortOrder) {
        return (sortOrder && (sortOrder === "asc" || sortOrder === "desc"))
            ? sortOrder
            : "desc";
    }
    async create(createAlertDTO) {
        return this.alertService.create(createAlertDTO);
    }
    async findAll(queryParams, limit, offset, sortField, sortOrder) {
        const { limit: limitParam, offset: offsetParam, sortField: sortFieldParam, sortOrder: sortOrderParam, ...filters } = queryParams;
        return this.alertService.findAll(filters, limit ? Number(limit) : undefined, offset ? Number(offset) : undefined, this.validateSortField(sortField), this.validateSortOrder(sortOrder));
    }
    async searchAlerts(query, limit, offset, sortField, sortOrder) {
        return this.alertService.searchAlerts(query, limit ? Number(limit) : 10, offset ? Number(offset) : 0, this.validateSortField(sortField), this.validateSortOrder(sortOrder));
    }
    async findAlertsByDateRange(startDate, endDate, user, sortField, sortOrder) {
        return this.alertService.findAlertsByDateRange(startDate, endDate, user, this.validateSortField(sortField), this.validateSortOrder(sortOrder));
    }
    async getAllAlerts(sortField, sortOrder) {
        return this.alertService.getAllAlerts(this.validateSortField(sortField), this.validateSortOrder(sortOrder));
    }
    async getAllAlertsWithCount(sortField, sortOrder) {
        return this.alertService.getAllAlertsWithCount(this.validateSortField(sortField), this.validateSortOrder(sortOrder));
    }
    async findAlertByID(id) {
        return this.alertService.findAlertByID(id);
    }
    async getIncidentForAlert(alertID) {
        return this.alertService.getIncidentForAlert(alertID);
    }
    async findAlertsByIncidentID(incidentID, sortField, sortOrder) {
        return this.alertService.findAlertsByIncidentID(incidentID, this.validateSortField(sortField), this.validateSortOrder(sortOrder));
    }
    async updateAlertByID(id, updateAlertDTO) {
        return this.alertService.updateAlertByID(id, updateAlertDTO);
    }
    async removeAlertByID(id) {
        await this.alertService.removeAlertByID(id);
    }
    async findAlertsByMITRETactic(tactic, sortField, sortOrder) {
        return this.alertService.findAlertsByMITRETactic(tactic, this.validateSortField(sortField), this.validateSortOrder(sortOrder));
    }
    async findAlertsByMITRETechnique(technique, sortField, sortOrder) {
        return this.alertService.findAlertsByMITRETechnique(technique, this.validateSortField(sortField), this.validateSortOrder(sortOrder));
    }
    async findAlertsByUser(user, sortField, sortOrder) {
        return this.alertService.findAlertsByUser(user, this.validateSortField(sortField), this.validateSortOrder(sortOrder));
    }
    async findAlertsUnderIncident(isUnderIncident, sortField, sortOrder) {
        return this.alertService.findAlertsUnderIncident(isUnderIncident, this.validateSortField(sortField), this.validateSortOrder(sortOrder));
    }
};
exports.AlertController = AlertController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: "Create a new alert", description: "Creates a new alert with the provided data" }),
    (0, swagger_1.ApiResponse)({ status: 201, description: "Alert successfully created", type: alert_dto_1.AlertResponseDTO }),
    (0, swagger_1.ApiResponse)({ status: 400, description: "Invalid input data" }),
    (0, swagger_1.ApiResponse)({ status: 500, description: "Internal server error" }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [alert_dto_1.CreateAlertDTO]),
    __metadata("design:returntype", Promise)
], AlertController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: "Get all alerts", description: "Retrieves all alerts with optional filtering, pagination and sorting" }),
    (0, swagger_1.ApiQuery)({ name: "limit", required: false, type: Number, description: "Number of alerts per page" }),
    (0, swagger_1.ApiQuery)({ name: "offset", required: false, type: Number, description: "Number of alerts to skip" }),
    (0, swagger_1.ApiQuery)({ name: "sortField", required: false, enum: ["datestr", "score", "alert_name"], description: "Field to sort by" }),
    (0, swagger_1.ApiQuery)({ name: "sortOrder", required: false, enum: ["asc", "desc"], description: "Direction to sort" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Alerts successfully retrieved", schema: { type: "object", properties: { alerts: { type: "array", items: { $ref: "#/components/schemas/AlertResponseDTO" } }, total: { type: "number" } } } }),
    (0, swagger_1.ApiResponse)({ status: 500, description: "Internal server error" }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Query)("limit")),
    __param(2, (0, common_1.Query)("offset")),
    __param(3, (0, common_1.Query)("sortField")),
    __param(4, (0, common_1.Query)("sortOrder")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number, String, String]),
    __metadata("design:returntype", Promise)
], AlertController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)("search"),
    (0, swagger_1.ApiOperation)({ summary: "Search alerts", description: "Search alerts by query string across multiple fields" }),
    (0, swagger_1.ApiQuery)({ name: "query", type: String, description: "Search query string" }),
    (0, swagger_1.ApiQuery)({ name: "limit", type: Number, description: "Number of records to return", example: 10 }),
    (0, swagger_1.ApiQuery)({ name: "offset", type: Number, description: "Number of records to skip, pagination offset", example: 0 }),
    (0, swagger_1.ApiQuery)({ name: "sortField", required: false, enum: ["datestr", "score", "alert_name"], description: "Field to sort by" }),
    (0, swagger_1.ApiQuery)({ name: "sortOrder", required: false, enum: ["asc", "desc"], description: "Direction to sort by" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Successfully searched alerts", schema: { type: "object", properties: { alerts: { type: "array", items: { $ref: "#/components/schemas/AlertResponseDTO" } }, total: { type: "number" } } } }),
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
], AlertController.prototype, "searchAlerts", null);
__decorate([
    (0, common_1.Get)("date-range"),
    (0, swagger_1.ApiOperation)({ summary: "Get alerts by the date range", description: "Retrieve all alerts within a specific date range" }),
    (0, swagger_1.ApiQuery)({ name: "startDate", required: true, type: String, format: "date", description: "Start date for the date range" }),
    (0, swagger_1.ApiQuery)({ name: "endDate", required: true, type: String, format: "date", description: "End date for the date range" }),
    (0, swagger_1.ApiQuery)({ name: "user", required: false, type: String, description: "Optional user filter" }),
    (0, swagger_1.ApiQuery)({ name: "sortField", required: false, enum: ["datestr", "score", "alert_name"], description: "Field to sort by" }),
    (0, swagger_1.ApiQuery)({ name: "sortOrder", required: false, enum: ["asc", "desc"], description: "Direction to sort" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Successfully searched alerts", type: [alert_dto_1.AlertResponseDTO] }),
    (0, swagger_1.ApiResponse)({ status: 400, description: "Invalid date format" }),
    (0, swagger_1.ApiResponse)({ status: 500, description: "Internal server error" }),
    __param(0, (0, common_1.Query)("startDate", new common_1.ParseDatePipe())),
    __param(1, (0, common_1.Query)("endDate", new common_1.ParseDatePipe())),
    __param(2, (0, common_1.Query)("user")),
    __param(3, (0, common_1.Query)("sortField")),
    __param(4, (0, common_1.Query)("sortOrder")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Date,
        Date, String, String, String]),
    __metadata("design:returntype", Promise)
], AlertController.prototype, "findAlertsByDateRange", null);
__decorate([
    (0, common_1.Get)("all"),
    (0, swagger_1.ApiOperation)({ summary: "Get all alerts", description: "Retrieve ALL alerts without any filtering or pagination" }),
    (0, swagger_1.ApiQuery)({ name: "sortField", required: false, enum: ["datestr", "score", "alert_name"], description: "Field to sort by" }),
    (0, swagger_1.ApiQuery)({ name: "sortOrder", required: false, enum: ["asc", "desc"], description: "Direction to sort" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "All alerts successfully retrieved", type: [alert_dto_1.AlertResponseDTO] }),
    (0, swagger_1.ApiResponse)({ status: 500, description: "Internal server error" }),
    __param(0, (0, common_1.Query)("sortField")),
    __param(1, (0, common_1.Query)("sortOrder")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AlertController.prototype, "getAllAlerts", null);
__decorate([
    (0, common_1.Get)("all/with-count"),
    (0, swagger_1.ApiOperation)({ summary: "Get all alerts with count", description: "Retrieve ALL alerts with total count, no filtering or pagination" }),
    (0, swagger_1.ApiQuery)({ name: "sortField", required: false, enum: ["datestr", "score", "alert_name"], description: "Field to sort by" }),
    (0, swagger_1.ApiQuery)({ name: "sortOrder", required: false, enum: ["asc", "desc"], description: "Direction to sort" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "All alerts with count successfully retrieved", schema: { type: "object", properties: { alerts: { type: "array", items: { $ref: "#/components/schemas/AlertResponseDTO" } }, total: { type: "number" } } } }),
    (0, swagger_1.ApiResponse)({ status: 500, description: "Internal server error" }),
    __param(0, (0, common_1.Query)("sortField")),
    __param(1, (0, common_1.Query)("sortOrder")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AlertController.prototype, "getAllAlertsWithCount", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, swagger_1.ApiOperation)({ summary: "Get alert by the alert ID", description: "Retrieve a single alert by its ID" }),
    (0, swagger_1.ApiParam)({ name: "id", type: String, description: "Alert ID" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Successfully received alert", type: alert_dto_1.AlertResponseDTO }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Alert not found" }),
    (0, swagger_1.ApiResponse)({ status: 500, description: "Internal server error" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AlertController.prototype, "findAlertByID", null);
__decorate([
    (0, common_1.Get)(":alertID/incident"),
    (0, swagger_1.ApiOperation)({ summary: "Get incident for an alert", description: "Retrieve the incident associated with an alert" }),
    (0, swagger_1.ApiParam)({ name: "alertID", type: String, description: "Alert ID to find the related incident" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Successfully retrieved incident", type: incident_dto_1.IncidentResponseDTO }),
    (0, swagger_1.ApiResponse)({ status: 204, description: "No incident associated with this alert" }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Alert not found" }),
    (0, swagger_1.ApiResponse)({ status: 500, description: "Internal server error" }),
    __param(0, (0, common_1.Param)("alertID")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AlertController.prototype, "getIncidentForAlert", null);
__decorate([
    (0, common_1.Get)("incident-id/:incidentID"),
    (0, swagger_1.ApiOperation)({ summary: "Get alerts by incident ID", description: "Retrieve all alerts associated with a specific incident" }),
    (0, swagger_1.ApiParam)({ name: "incidentID", type: String, description: "Incident ID to find" }),
    (0, swagger_1.ApiQuery)({ name: "sortField", required: false, enum: ["datestr", "score", "alert_name"], description: "Field to sort by" }),
    (0, swagger_1.ApiQuery)({ name: "sortOrder", required: false, enum: ["asc", "desc"], description: "Direction to sort" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Successfully retrieved alerts related to the incident", type: [alert_dto_1.AlertResponseDTO] }),
    (0, swagger_1.ApiResponse)({ status: 400, description: "Incident not found" }),
    (0, swagger_1.ApiResponse)({ status: 500, description: "Internal server error" }),
    __param(0, (0, common_1.Param)("incidentID")),
    __param(1, (0, common_1.Param)("sortField")),
    __param(2, (0, common_1.Param)("sortOrder")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AlertController.prototype, "findAlertsByIncidentID", null);
__decorate([
    (0, common_1.Put)(":id"),
    (0, swagger_1.ApiOperation)({ summary: "Update alert", description: "Update an existing alert by its ID" }),
    (0, swagger_1.ApiParam)({ name: "id", type: String, description: "Alert ID" }),
    (0, swagger_1.ApiBody)({ type: alert_dto_1.UpdateAlertDTO, description: "Alert update data" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Alert successfully updated", type: alert_dto_1.AlertResponseDTO }),
    (0, swagger_1.ApiResponse)({ status: 400, description: "Invalid input data" }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Alert not found" }),
    (0, swagger_1.ApiResponse)({ status: 500, description: "Internal server error" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, alert_dto_1.UpdateAlertDTO]),
    __metadata("design:returntype", Promise)
], AlertController.prototype, "updateAlertByID", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: "Delete alert", description: "Delete an alert by its ID" }),
    (0, swagger_1.ApiParam)({ name: "id", type: String, description: "Alert ID" }),
    (0, swagger_1.ApiResponse)({ status: 204, description: "Alert successfully deleted" }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Alert not found" }),
    (0, swagger_1.ApiResponse)({ status: 500, description: "Internal server error" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AlertController.prototype, "removeAlertByID", null);
__decorate([
    (0, common_1.Get)("tactic/:tactic"),
    (0, swagger_1.ApiOperation)({ summary: "Get alerts by MITRE tactic", description: "Retrieve all alerts used by a MITRE tactic" }),
    (0, swagger_1.ApiParam)({ name: "tactic", type: String, description: "MITRE tactic to search for" }),
    (0, swagger_1.ApiQuery)({ name: "sortField", required: false, enum: ["datestr", "score", "alert_name"], description: "Field to sort by" }),
    (0, swagger_1.ApiQuery)({ name: "sortOrder", required: false, enum: ["asc", "desc"], description: "Direction to sort" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Successfully searched alerts", type: [alert_dto_1.AlertResponseDTO] }),
    (0, swagger_1.ApiResponse)({ status: 500, description: "Internal server error" }),
    __param(0, (0, common_1.Param)("tactic")),
    __param(1, (0, common_1.Query)("sortField")),
    __param(2, (0, common_1.Query)("sortOrder")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AlertController.prototype, "findAlertsByMITRETactic", null);
__decorate([
    (0, common_1.Get)("technique/:technique"),
    (0, swagger_1.ApiOperation)({ summary: "Get alerts by MITRE technique", description: "Retrieve all alerts used by a MITRE technique" }),
    (0, swagger_1.ApiParam)({ name: "technique", type: String, description: "MITRE technique to search for" }),
    (0, swagger_1.ApiQuery)({ name: "sortField", required: false, enum: ["datestr", "score", "alert_name"], description: "Field to sort by" }),
    (0, swagger_1.ApiQuery)({ name: "sortOrder", required: false, enum: ["asc", "desc"], description: "Direction to sort" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Successfully searched alerts", type: [alert_dto_1.AlertResponseDTO] }),
    (0, swagger_1.ApiResponse)({ status: 500, description: "Internal server error" }),
    __param(0, (0, common_1.Param)("technique")),
    __param(1, (0, common_1.Query)("sortField")),
    __param(2, (0, common_1.Query)("sortOrder")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AlertController.prototype, "findAlertsByMITRETechnique", null);
__decorate([
    (0, common_1.Get)("user/:user"),
    (0, swagger_1.ApiOperation)({ summary: "Get alerts by username", description: "Retrieve all alerts under a user" }),
    (0, swagger_1.ApiParam)({ name: "user", type: String, description: "User to search for" }),
    (0, swagger_1.ApiQuery)({ name: "sortField", required: false, enum: ["datestr", "score", "alert_name"], description: "Field to sort by" }),
    (0, swagger_1.ApiQuery)({ name: "sortOrder", required: false, enum: ["asc", "desc"], description: "Direction to sort" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Successfully searched alerts", type: [alert_dto_1.AlertResponseDTO] }),
    (0, swagger_1.ApiResponse)({ status: 500, description: "Internal server error" }),
    __param(0, (0, common_1.Param)("user")),
    __param(1, (0, common_1.Query)("sortField")),
    __param(2, (0, common_1.Query)("sortOrder")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AlertController.prototype, "findAlertsByUser", null);
__decorate([
    (0, common_1.Get)("incident/:isUnderIncident"),
    (0, swagger_1.ApiOperation)({ summary: "Get alerts under an incident", description: "Retrieve alerts based on whether they are under an incident" }),
    (0, swagger_1.ApiParam)({ name: "isUnderIncident", type: Boolean, description: "Whether the alert is under an incident" }),
    (0, swagger_1.ApiQuery)({ name: "sortField", required: false, enum: ["datestr", "score", "alert_name"], description: "Field to sort by" }),
    (0, swagger_1.ApiQuery)({ name: "sortOrder", required: false, enum: ["asc", "desc"], description: "Direction to sort" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Successfully retrieved alerts", type: [alert_dto_1.AlertResponseDTO] }),
    (0, swagger_1.ApiResponse)({ status: 400, description: "Invalid boolean parameter" }),
    (0, swagger_1.ApiResponse)({ status: 500, description: "Internal server error" }),
    __param(0, (0, common_1.Param)("isUnderIncident", common_1.ParseBoolPipe)),
    __param(1, (0, common_1.Query)("sortField")),
    __param(2, (0, common_1.Query)("sortOrder")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Boolean, String, String]),
    __metadata("design:returntype", Promise)
], AlertController.prototype, "findAlertsUnderIncident", null);
exports.AlertController = AlertController = __decorate([
    (0, swagger_1.ApiTags)("alerts"),
    (0, common_1.Controller)("alert"),
    __metadata("design:paramtypes", [alert_service_1.AlertService])
], AlertController);
//# sourceMappingURL=alert.controller.js.map