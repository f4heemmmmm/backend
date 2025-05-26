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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertResponseDTO = exports.UpdateAlertDTO = exports.CreateAlertDTO = void 0;
const class_validator_1 = require("class-validator");
class CreateAlertDTO {
    user;
    datestr;
    evidence;
    score;
    alert_name;
    MITRE_tactic;
    MITRE_technique;
    Logs;
    Detection_model;
    Description;
    isUnderIncident;
    incidentID;
}
exports.CreateAlertDTO = CreateAlertDTO;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAlertDTO.prototype, "user", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", Date)
], CreateAlertDTO.prototype, "datestr", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateAlertDTO.prototype, "evidence", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateAlertDTO.prototype, "score", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAlertDTO.prototype, "alert_name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAlertDTO.prototype, "MITRE_tactic", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAlertDTO.prototype, "MITRE_technique", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAlertDTO.prototype, "Logs", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAlertDTO.prototype, "Detection_model", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAlertDTO.prototype, "Description", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateAlertDTO.prototype, "isUnderIncident", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateAlertDTO.prototype, "incidentID", void 0);
class UpdateAlertDTO {
    user;
    datestr;
    evidence;
    score;
    alert_name;
    MITRE_tactic;
    MITRE_technique;
    Logs;
    Detection_model;
    Description;
    isUnderIncident;
    incidentID;
}
exports.UpdateAlertDTO = UpdateAlertDTO;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateAlertDTO.prototype, "user", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Date)
], UpdateAlertDTO.prototype, "datestr", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdateAlertDTO.prototype, "evidence", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateAlertDTO.prototype, "score", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateAlertDTO.prototype, "alert_name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateAlertDTO.prototype, "MITRE_tactic", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateAlertDTO.prototype, "MITRE_technique", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateAlertDTO.prototype, "Logs", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateAlertDTO.prototype, "Detection_model", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateAlertDTO.prototype, "Description", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateAlertDTO.prototype, "isUnderIncident", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateAlertDTO.prototype, "incidentID", void 0);
class AlertResponseDTO {
    ID;
    user;
    datestr;
    evidence;
    score;
    alert_name;
    MITRE_tactic;
    MITRE_technique;
    Logs;
    Detection_model;
    Description;
    isUnderIncident;
    incidentID;
    created_at;
    updated_at;
}
exports.AlertResponseDTO = AlertResponseDTO;
//# sourceMappingURL=alert.dto.js.map