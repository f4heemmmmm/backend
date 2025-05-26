"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncidentModule = void 0;
const incident_entity_1 = require("./incident.entity");
const typeorm_1 = require("@nestjs/typeorm");
const alert_module_1 = require("../alert/alert.module");
const common_1 = require("@nestjs/common");
const incident_service_1 = require("./incident.service");
const incident_controller_1 = require("./incident.controller");
let IncidentModule = class IncidentModule {
};
exports.IncidentModule = IncidentModule;
exports.IncidentModule = IncidentModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([incident_entity_1.Incident]),
            (0, common_1.forwardRef)(() => alert_module_1.AlertModule),
        ],
        controllers: [incident_controller_1.IncidentController],
        providers: [incident_service_1.IncidentService],
        exports: [incident_service_1.IncidentService],
    })
], IncidentModule);
//# sourceMappingURL=incident.module.js.map