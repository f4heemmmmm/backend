import { ConfigService } from "@nestjs/config";
import { CreateAlertDTO } from "src/entities/alert/alert.dto";
import { CreateIncidentDTO } from "src/entities/incident/incident.dto";
export declare class CSVParserUtil {
    private readonly configService;
    private readonly logger;
    private readonly dropPath;
    private readonly processedPath;
    private readonly errorPath;
    constructor(configService: ConfigService);
    parseIncidentsCSV(filePath: string): Promise<CreateIncidentDTO[]>;
    parseAlertCSV(filePath: string): Promise<CreateAlertDTO[]>;
    moveFile(sourcePath: string, destinationDirectory?: string): Promise<void>;
    private parseStringifiedEvidence;
    private parseListRawEvents;
}
