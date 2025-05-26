// backend/src/utils/csv-parser.util.ts

import * as fs from "fs";
import * as path from "path";
import * as csv from "csv-parse";
import { ConfigService } from "@nestjs/config";
import { Injectable, Logger } from "@nestjs/common";
import { CreateAlertDTO } from "src/entities/alert/alert.dto";
import { CreateIncidentDTO } from "src/entities/incident/incident.dto";

@Injectable()
export class CSVParserUtil {
    private readonly logger = new Logger(CSVParserUtil.name);
    private readonly dropPath: string;
    private readonly processedPath: string;
    private readonly errorPath: string;

    constructor(private readonly configService: ConfigService) {
        const config = this.configService.get("config");
        if (!config) {
            throw new Error("Configuration not found!");
        }
        
        this.dropPath = process.env.CSV_DROP_PATH || config.storage.csv.dropPath;
        this.processedPath = process.env.CSV_PROCESSED_PATH || config.storage.csv.processedPath;
        this.errorPath = process.env.CSV_ERROR_PATH || config.storage.csv.errorPath;
        
        this.logger.log(`CSV Parser initialized with paths: 
            Drop: ${this.dropPath}, 
            Processed: ${this.processedPath}, 
            Error: ${this.errorPath}`);
    }
    
    /**
     * Parses incident CSV file and converts records into data transfer objects
     * @param filePath - Full path to the incidents CSV file to be processed
     * @returns Promise resolving to array of validated incident DTOs ready for database insertion
     * @throws Error if file cannot be accessed or parsing fails
     */
    async parseIncidentsCSV(filePath: string): Promise<CreateIncidentDTO[]> {
        this.logger.debug(`Parsing incidents CSV file: ${filePath}`);
        
        try {
            await fs.promises.access(filePath, fs.constants.R_OK);
        } catch (error) {
            this.logger.error(`Cannot access file ${filePath}: ${error.message}`);
            throw new Error(`Cannot access file ${filePath}: ${error.message}`);
        }
        
        const records: CreateIncidentDTO[] = [];
        
        try {
            const fileContent = await fs.promises.readFile(filePath, "utf8");
            this.logger.debug(`CSV file content sample: ${fileContent.substring(0, 200)}...`);
            
            const parser = fs
                .createReadStream(filePath)
                .pipe(csv.parse({
                    columns: true,
                    skip_empty_lines: true,
                    cast: true,
                    trim: true
                }));
                
            for await (const record of parser) {
                try {
                    this.logger.debug(`Processing incident record: ${JSON.stringify(record)}`);
                    
                    if (!record.user || !record.windows_start || !record.windows_end) {
                        this.logger.warn("Skipping record with missing required fields!", record);
                        continue;
                    }
                    
                    let windowsStart: Date, windowsEnd: Date;
                    try {
                        if (/^\d+$/.test(record.windows_start.toString())) {
                            windowsStart = new Date(parseInt(record.windows_start) * 1000);
                        } else {
                            windowsStart = new Date(record.windows_start);
                        }
                        
                        if (/^\d+$/.test(record.windows_end.toString())) {
                            windowsEnd = new Date(parseInt(record.windows_end) * 1000);
                        } else {
                            windowsEnd = new Date(record.windows_end);
                        }
                        
                        if (isNaN(windowsStart.getTime()) || isNaN(windowsEnd.getTime())) {
                            throw new Error(`Invalid timestamp values: start=${record.windows_start}, end=${record.windows_end}`);
                        }
                    } catch (error) {
                        this.logger.warn(`Error parsing timestamps: ${error.message}`, record);
                        continue;
                    }

                    const parsedWindows: string[] = [];
                    if (record.windows) {
                        try {
                            if (typeof record.windows === "string") {
                                if (record.windows.startsWith("[") && record.windows.endsWith("]")) {
                                    const windows = record.windows
                                        .replace(/^\[|\]$/g, "")
                                        .split(/"\s*,?\s*"/)
                                        .map((dateStr: string) => dateStr.replace(/^"|"$/g, "").trim())
                                        .filter((dateStr: string) => dateStr.length > 0);
                                    
                                    windows.forEach((dateStr: string) => {
                                        try {
                                            const date = new Date(dateStr);
                                            if (!isNaN(date.getTime())) {
                                                parsedWindows.push(date.toISOString());
                                            }
                                        } catch (e) {
                                            this.logger.warn(`Invalid date string: ${dateStr}`);
                                        }
                                    });
                                } else if (record.windows.includes(",")) {
                                    record.windows
                                        .split(",")
                                        .map(dateStr => dateStr.trim())
                                        .filter(dateStr => dateStr.length > 0)
                                        .forEach(dateStr => {
                                            try {
                                                const date = new Date(dateStr);
                                                if (!isNaN(date.getTime())) {
                                                    parsedWindows.push(date.toISOString());
                                                }
                                            } catch (e) {
                                                this.logger.warn(`Invalid date string: ${dateStr}`);
                                            }
                                        });
                                } else {
                                    try {
                                        const date = new Date(record.windows);
                                        if (!isNaN(date.getTime())) {
                                            parsedWindows.push(date.toISOString());
                                        }
                                    } catch (e) {
                                        this.logger.warn(`Invalid date string: ${record.windows}`);
                                    }
                                }
                            } else if (Array.isArray(record.windows)) {
                                record.windows.forEach((dateStr: string) => {
                                    try {
                                        const date = new Date(dateStr);
                                        if (!isNaN(date.getTime())) {
                                            parsedWindows.push(date.toISOString());
                                        }
                                    } catch (e) {
                                        this.logger.warn(`Invalid date string: ${dateStr}`);
                                    }
                                });
                            }
                        } catch (error) {
                            this.logger.warn(`Error parsing windows array: ${error.message}`, record);
                        }
                    }

                    const incident: CreateIncidentDTO = {
                        user: record.user,
                        windows_start: windowsStart,
                        windows_end: windowsEnd,
                        windows: parsedWindows,
                        score: parseFloat(record.score) || 0,
                    };
                    
                    this.logger.debug(`Created incident DTO: ${JSON.stringify(incident)}`);
                    records.push(incident);
                } catch (error) {
                    this.logger.error(`Error parsing incident record: ${error.message}`, record);
                }
            }
            
            if (records.length === 0) {
                this.logger.warn(`No valid incident records found in the CSV file: ${filePath}`);
            } else {
                this.logger.log(`Successfully parsed ${records.length} incident records from ${filePath}`);
            }
            
            return records;
        } catch (error) {
            this.logger.error(`Failed to parse CSV file ${filePath}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Parses alert CSV file and converts records into data transfer objects with complex evidence parsing
     * @param filePath - Full path to the alert CSV file to be processed
     * @returns Promise resolving to array of validated alert DTOs ready for database insertion
     * @throws Error if file cannot be accessed or parsing fails
     */
    async parseAlertCSV(filePath: string): Promise<CreateAlertDTO[]> {
        this.logger.debug(`Parsing alert CSV file: ${filePath}`);
        
        try {
            await fs.promises.access(filePath, fs.constants.R_OK);
        } catch (error) {
            this.logger.error(`Cannot access file ${filePath}: ${error.message}`);
            throw new Error(`Cannot access file ${filePath}: ${error.message}`);
        }
        
        const records: CreateAlertDTO[] = [];
        
        try {
            const fileContent = await fs.promises.readFile(filePath, "utf8");
            this.logger.debug(`CSV file content sample: ${fileContent.substring(0, 200)}...`);
            
            const parser = fs
                .createReadStream(filePath)
                .pipe(csv.parse({
                    columns: true,
                    skip_empty_lines: true,
                    cast: true,
                    trim: true
                }));
                
            for await (const record of parser) {
                try {
                    this.logger.debug(`Processing alert record: ${JSON.stringify(record)}`);
                    
                    let evidence: any = {
                        site: "",
                        count: 0,
                        list_raw_events: []
                    };
                    
                    try {
                        if (typeof record.evidence === "string") {
                            try {
                                const parsedEvidence = JSON.parse(record.evidence);
                                evidence = {
                                    ...evidence,
                                    ...parsedEvidence
                                };
                            } catch (jsonError) {
                                const parsedEvidence = this.parseStringifiedEvidence(record.evidence);
                                evidence = {
                                    ...evidence,
                                    ...parsedEvidence
                                };
                            }
                        } else if (typeof record.evidence === "object" && record.evidence !== null) {
                            evidence = {
                                ...evidence,
                                ...record.evidence
                            };
                        }
                    } catch (evidenceParseError) {
                        this.logger.warn(`Could not parse evidence for alert ${record.alert_name}: ${evidenceParseError.message}`);
                    }

                    if (!Array.isArray(evidence.list_raw_events)) {
                        try {
                            evidence.list_raw_events = this.parseListRawEvents(evidence.list_raw_events || "");
                        } catch (listEventsError) {
                            this.logger.warn(`Could not parse "list_raw_events": ${listEventsError.message}`);
                            evidence.list_raw_events = [];
                        }
                    }
                    
                    evidence.count = typeof evidence.count === "number" ? evidence.count : parseInt(evidence.count) || 0;
                    evidence.site = evidence.site || "";
                    
                    let datestr: Date;
                    try {
                        if (record.datestr) {
                            if (/^\d+$/.test(record.datestr.toString())) {
                                datestr = new Date(parseInt(record.datestr) * 1000);
                            } else {
                                datestr = new Date(record.datestr);
                            }
                            
                            if (isNaN(datestr.getTime())) {
                                throw new Error(`Invalid timestamp: ${record.datestr}`);
                            }
                        } else {
                            datestr = new Date();
                            this.logger.warn(`Missing datestr in record, using current date: ${datestr.toISOString()}`);
                        }
                    } catch (error) {
                        this.logger.warn(`Error parsing datestr: ${error.message}`, record);
                        datestr = new Date();
                    }
                    
                    const alertRecord: CreateAlertDTO = {
                        user: record.user || "",
                        datestr: datestr,
                        evidence: evidence,
                        score: parseFloat(record.score) || 0,
                        alert_name: record.alert_name || "",
                        MITRE_tactic: record.MITRE_tactic || "",
                        MITRE_technique: record.MITRE_technique || "",
                        isUnderIncident: record.isUnderIncident === true || record.isUnderIncident === "true",
                        Logs: record.Logs || "",
                        Detection_model: record.Detection_model || "",
                        Description: record.Description || "",
                    };
                    
                    this.logger.debug(`Prepared alert record: ${JSON.stringify(alertRecord)}`);
                    records.push(alertRecord);
                } catch (error) {
                    this.logger.error(`Error parsing alert record: ${error.message}`, record);
                }
            }
            
            if (records.length === 0) {
                this.logger.warn(`No valid alert records found in the CSV file: ${filePath}`);
            } else {
                this.logger.log(`Successfully parsed ${records.length} alert records from ${filePath}`);
            }
            
            return records;
        } catch (error) {
            this.logger.error(`Failed to parse CSV file ${filePath}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Moves processed CSV file to designated directory with conflict resolution
     * @param sourcePath - Full path to the source file to be moved
     * @param destinationDirectory - Target directory path (defaults to configured processed path)
     * @throws Error if file movement operation fails
     */
    async moveFile(sourcePath: string, destinationDirectory: string = this.processedPath): Promise<void> {
        try {
            const fileName = path.basename(sourcePath);
            const destinationPath = path.join(destinationDirectory, fileName);
            
            this.logger.debug(`Moving file from ${sourcePath} to ${destinationPath}`);
            
            await fs.promises.mkdir(destinationDirectory, { recursive: true });
            
            try {
                await fs.promises.access(destinationPath);
                const timestamp = new Date().getTime();
                const newDestPath = path.join(
                    destinationDirectory, 
                    `${path.parse(fileName).name}_${timestamp}${path.parse(fileName).ext}`
                );
                this.logger.warn(`Destination file exists, using new path: ${newDestPath}`);
                await fs.promises.copyFile(sourcePath, newDestPath);
                await fs.promises.unlink(sourcePath);
            } catch (err) {
                try {
                    await fs.promises.rename(sourcePath, destinationPath);
                } catch (renameError) {
                    if (renameError.code === "EXDEV") {
                        this.logger.warn("Cross-device rename not supported, using copy + delete");
                        await fs.promises.copyFile(sourcePath, destinationPath);
                        await fs.promises.unlink(sourcePath);
                    } else {
                        throw renameError;
                    }
                }
            }
            
            this.logger.log(`Successfully moved file to ${destinationDirectory}`);
        } catch (error) {
            this.logger.error(`Failed to move file ${sourcePath}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Parses stringified evidence data from CSV records with multiple format support
     * @param evidenceString - Raw evidence string from CSV that may be JSON or Python-dict format
     * @returns Parsed evidence object with fallback to default structure if parsing fails
     */
    private parseStringifiedEvidence(evidenceString: string): any {
        this.logger.debug(`Parsing stringified evidence: ${evidenceString.substring(0, 100)}...`);
        
        let cleanedString = evidenceString
            .replace(/^[""]|[""]$/g, "")
            .replace(/\\"/g, "\"")
            .replace(/\\\\/g, "\\");

        try {
            return JSON.parse(cleanedString);
        } catch (error) {
            this.logger.debug(`Standard JSON.parse failed: ${error.message}, trying normalized format`);
            try {
                const normalizedJSON = cleanedString
                    .replace(/(\w+):/g, "\"$1\":")
                    .replace(/"/g, "\"")
                    .replace(/\\/g, "\\\\");
                
                return JSON.parse(normalizedJSON);
            } catch (normalizeError) {
                this.logger.debug(`Normalized JSON parse failed: ${normalizeError.message}, returning base object`);
                
                return { 
                    site: "",
                    count: 0,
                    list_raw_events: [],
                    original: cleanedString 
                };
            }
        }
    }

    /**
     * Parses list_raw_events field which can be in various formats (array, JSON string, CSV string)
     * @param listRawEvents - Raw list events data that needs to be converted to array format
     * @returns Array of parsed event objects or strings, empty array if parsing fails
     */
    private parseListRawEvents(listRawEvents: any): any[] {
        this.logger.debug(`Parsing list_raw_events: ${typeof listRawEvents}`);
        
        if (Array.isArray(listRawEvents)) {
            return listRawEvents;
        }
        
        if (typeof listRawEvents === "string") {
            if (!listRawEvents || listRawEvents.trim() === "") {
                return [];
            }
            
            if (listRawEvents.startsWith("[") && listRawEvents.endsWith("]")) {
                try {
                    return JSON.parse(listRawEvents);
                } catch (error) {
                    this.logger.debug(`JSON.parse failed for list_raw_events: ${error.message}`);
                }
            }
            
            let cleanedString = listRawEvents
                .replace(/^[""\[]+|[""\\]]+$/g, "")
                .trim();

            if (!cleanedString) {
                return [];
            }

            const events = cleanedString.split(/,\s*(?={)/);
            const parsedEvents: any[] = [];
            
            events.forEach(eventString => {
                eventString = eventString.trim();
                if (!eventString) {
                    return;
                }
                
                try {
                    if (eventString.startsWith("{") && eventString.endsWith("}")) {
                        parsedEvents.push(JSON.parse(eventString));
                    } else {
                        const normalized = eventString
                            .replace(/(\w+):/g, "\"$1\":")
                            .replace(/"/g, "\"");
                            
                        parsedEvents.push(JSON.parse(`{${normalized}}`));
                    }
                } catch (error) {
                    this.logger.debug(`Failed to parse event JSON: ${error.message}, returning as string`);
                    parsedEvents.push(eventString);
                }
            });
            
            return parsedEvents.filter(event => event !== null && event !== "");
        }
        
        return [];
    }
}