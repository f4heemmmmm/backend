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
exports.IncidentResponseDTO = exports.UpdateIncidentDTO = exports.CreateIncidentDTO = void 0;
const class_validator_1 = require("class-validator");
class CreateIncidentDTO {
    user;
    windows_start;
    windows_end;
    score;
    windows;
}
exports.CreateIncidentDTO = CreateIncidentDTO;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIncidentDTO.prototype, "user", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", Date)
], CreateIncidentDTO.prototype, "windows_start", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", Date)
], CreateIncidentDTO.prototype, "windows_end", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateIncidentDTO.prototype, "score", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], CreateIncidentDTO.prototype, "windows", void 0);
;
class UpdateIncidentDTO {
    user;
    windows_start;
    windows_end;
    score;
    windows;
}
exports.UpdateIncidentDTO = UpdateIncidentDTO;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateIncidentDTO.prototype, "user", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", Date)
], UpdateIncidentDTO.prototype, "windows_start", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", Date)
], UpdateIncidentDTO.prototype, "windows_end", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateIncidentDTO.prototype, "score", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], UpdateIncidentDTO.prototype, "windows", void 0);
;
class IncidentResponseDTO {
    ID;
    user;
    windows_start;
    windows_end;
    score;
    windows;
    created_at;
    updated_at;
}
exports.IncidentResponseDTO = IncidentResponseDTO;
;
//# sourceMappingURL=incident.dto.js.map