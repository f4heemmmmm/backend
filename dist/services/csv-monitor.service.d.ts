import { ConfigService } from "@nestjs/config";
import { CSVParserUtil } from "src/utils/csv-parser.util";
import { AlertService } from "src/entities/alert/alert.service";
import { IncidentService } from "src/entities/incident/incident.service";
import { OnModuleInit } from "@nestjs/common";
export declare class CSVMonitorService implements OnModuleInit {
    private readonly configService;
    private readonly alertService;
    private readonly incidentService;
    private readonly csvParserUtil;
    private readonly logger;
    private readonly dropPath;
    private readonly processedPath;
    private readonly errorPath;
    private readonly monitoringInterval;
    private intervalRef;
    constructor(configService: ConfigService, alertService: AlertService, incidentService: IncidentService, csvParserUtil: CSVParserUtil);
    onModuleInit(): Promise<void>;
    processAllFiles(): Promise<void>;
    private initializeStorageDirectories;
    private startMonitoring;
    private stopMonitoring;
    private processIncidentFiles;
    private processAlertFiles;
}
