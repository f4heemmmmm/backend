import * as fs from "fs";
import * as path from "path";
import * as csv from "csv-parse";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

// Alert Files Import
import { Alert } from "src/entities/alert/alert.entity";
import { CreateAlertDTO } from "src/entities/alert/alert.dto";

// Incident Files Import
import { Incident } from "src/entities/incident/incident.entity";
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
        this.dropPath = config.storage.csv.dropPath;
        this.processedPath = config.storage.csv.processedPath;
        this.errorPath = config.storage.csv.errorPath;
    }
    
    /**
     * Parse incidents.csv file into DTOs
     * @param filePath Path to the incidents.csv file
     * @returns Promise<CreateIncidentDTO[]> Array of incident DTOs
     */
    async parseIncidentsCSV(filePath: string): Promise<CreateIncidentDTO[]> {
        this.logger.debug(`Parsing incidents CSV file: ${filePath}`);
        
        try {
            // First verify file exists and is readable
            await fs.promises.access(filePath, fs.constants.R_OK);
        } catch (error) {
            this.logger.error(`Cannot access file ${filePath}: ${error.message}`);
            throw new Error(`Cannot access file ${filePath}: ${error.message}`);
        }
        
        const records: CreateIncidentDTO[] = [];
        
        try {
            const fileContent = await fs.promises.readFile(filePath, 'utf8');
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
                    
                    // Convert UNIX timestamps to Date objects
                    let windowsStart, windowsEnd;
                    try {
                        windowsStart = new Date(parseInt(record.windows_start) * 1000);
                        windowsEnd = new Date(parseInt(record.windows_end) * 1000);
                        
                        // Validate dates
                        if (isNaN(windowsStart.getTime()) || isNaN(windowsEnd.getTime())) {
                            throw new Error(`Invalid timestamp values: start=${record.windows_start}, end=${record.windows_end}`);
                        }
                    } catch (error) {
                        this.logger.warn(`Error parsing timestamps: ${error.message}`, record);
                        continue;
                    }

                    // Custom parsing for Python-style list string
                    let parsedWindows = [];
                    if (record.windows) {
                        try {
                            const windows = record.windows
                                .replace(/^\[|\]$/g, '')                                        // Remove outer brackets
                                .split(/'\s*,?\s*'/)                                            // Split by comma or whitespace between quotes
                                .map((dateStr: string) => dateStr.replace(/^'|'$/g, '').trim()) // Remove quotes and trim
                                .filter((dateStr: string) => dateStr.length > 0);               // Filter out empty strings
                            
                            parsedWindows = windows.map((dateStr: string) => {
                                // Convert to ISO format
                                const date = new Date(dateStr);
                                if (isNaN(date.getTime())) {
                                    throw new Error(`Invalid date string: ${dateStr}`);
                                }
                                return date.toISOString();
                            });
                        } catch (error) {
                            this.logger.warn(`Error parsing windows array: ${error.message}`, record);
                            parsedWindows = [];
                        }
                    }

                    records.push({
                        user: record.user,
                        windows_start: windowsStart,
                        windows_end: windowsEnd,
                        windows: parsedWindows,
                        score: parseFloat(record.score) || 0,
                    });
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
     * Parse alert CSV files into DTOs
     * @param filePath Path to the alert CSV file
     * @returns Promise<CreateAlertDTO[]> Array of alert DTOs
     */
    async parseAlertCSV(filePath: string): Promise<CreateAlertDTO[]> {
        this.logger.debug(`Parsing alert CSV file: ${filePath}`);
        
        try {
            // First verify file exists and is readable
            await fs.promises.access(filePath, fs.constants.R_OK);
        } catch (error) {
            this.logger.error(`Cannot access file ${filePath}: ${error.message}`);
            throw new Error(`Cannot access file ${filePath}: ${error.message}`);
        }
        
        const records: CreateAlertDTO[] = [];
        
        try {
            const fileContent = await fs.promises.readFile(filePath, 'utf8');
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
                    
                    // Robust parsing of Evidence field
                    let evidence: any = {};
                    try {
                        if (typeof record.evidence === "string") {
                            try {
                                evidence = JSON.parse(record.evidence);
                            } catch {
                                evidence = this.parseStringifiedEvidence(record.evidence);
                            }
                        } else if (typeof record.evidence === "object") {
                            evidence = record.evidence;
                        }
                    } catch (evidenceParseError) {
                        this.logger.warn(`Could not parse evidence for alert ${record.alert_name}: ${evidenceParseError.message}`);
                        evidence = {};
                    }

                    // Robust parsing of 'list_raw_events' in Evidence field (if available)
                    let parsedListRawEvents: any[] = [];
                    if (evidence.list_raw_events) {
                        try {
                            parsedListRawEvents = this.parseListRawEvents(evidence.list_raw_events);
                        } catch (listEventsError) {
                            this.logger.warn(`Could not parse 'list_raw_events' for alert ${record.alert_name}: ${listEventsError.message}`);
                        }
                    }
                    
                    // Ensure date is properly parsed
                    let datestr;
                    try {
                        if (record.datestr) {
                            datestr = new Date(parseInt(record.datestr) * 1000);
                            if (isNaN(datestr.getTime())) {
                                throw new Error(`Invalid timestamp: ${record.datestr}`);
                            }
                        } else {
                            // Default to current date if missing
                            datestr = new Date();
                            this.logger.warn(`Missing datestr in record, using current date: ${datestr.toISOString()}`);
                        }
                    } catch (error) {
                        this.logger.warn(`Error parsing datestr: ${error.message}`, record);
                        datestr = new Date(); // Fallback to current date
                    }
                    
                    records.push({
                        user: record.user || "",
                        datestr: datestr,
                        evidence: {
                            site: evidence.site || "",
                            count: parseInt(evidence.count) || 0,
                            list_raw_events: parsedListRawEvents,
                            appAccessContext: evidence.appAccessContext || null,
                            ...evidence
                        },
                        score: parseFloat(record.score) || 0,
                        alert_name: record.alert_name || "",
                        MITRE_tactic: record.MITRE_tactic || "",
                        MITRE_technique: record.MITRE_technique || "",
                        isUnderIncident: record.isUnderIncident || false,
                        Logs: record.Logs || "",
                        Detection_model: record.Detection_model || "",
                        Description: record.Description || "",
                    });
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
     * Move successfully processed CSV file to processed directory
     * @param filePath Source file path
     */
    async moveFile(sourcePath: string, destinationDirectory: string = this.processedPath): Promise<void> {
        try {
            const fileName = path.basename(sourcePath);
            const destinationPath = path.join(destinationDirectory, fileName);
            
            this.logger.debug(`Moving file from ${sourcePath} to ${destinationPath}`);
            
            // Ensure destination directory exists
            await fs.promises.mkdir(destinationDirectory, { recursive: true });
            
            // Check if destination file already exists
            try {
                await fs.promises.access(destinationPath);
                // If file exists, append timestamp to avoid conflicts
                const timestamp = new Date().getTime();
                const newDestPath = path.join(
                    destinationDirectory, 
                    `${path.parse(fileName).name}_${timestamp}${path.parse(fileName).ext}`
                );
                this.logger.warn(`Destination file exists, using new path: ${newDestPath}`);
                await fs.promises.copyFile(sourcePath, newDestPath);
                await fs.promises.unlink(sourcePath);
            } catch (err) {
                // File doesn't exist, proceed with rename
                try {
                    await fs.promises.rename(sourcePath, destinationPath);
                } catch (renameError) {
                    // If rename fails (possibly cross-device), try copy + delete
                    if (renameError.code === 'EXDEV') {
                        this.logger.warn('Cross-device rename not supported, using copy + delete');
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
     * Helper method to parse stringified evidence
     */
    private parseStringifiedEvidence(evidenceString: string): any {
        this.logger.debug(`Parsing stringified evidence: ${evidenceString.substring(0, 100)}...`);
        
        // Remove outer quotes and unescape
        let cleanedString = evidenceString
            .replace(/^["']|["']$/g, '')        // Remove outer quotes
            .replace(/\\"/g, '"')               // Unescape quotes
            .replace(/\\\\/g, '\\');            // Unescape backslashes

        try {
            return JSON.parse(cleanedString);
        } catch (error) {
            this.logger.debug(`Standard JSON.parse failed: ${error.message}, trying normalized format`);
            try {
                const normalizedJSON = cleanedString
                    .replace(/(\w+):/g, '"$1":')        // Add quotes to keys
                    .replace(/'/g, '"')                 // Replace single quotes with double quotes
                    .replace(/\\/g, '\\\\');            // Escape backslashes
                return JSON.parse(normalizedJSON);
            } catch (normalizeError) {
                this.logger.debug(`Normalized JSON parse failed: ${normalizeError.message}, returning original`);
                return { original: cleanedString };
            }
        }
    }

    /**
     * Helper method to parse list_raw_events
     */
    private parseListRawEvents(listRawEvents: any): any[] {
        this.logger.debug(`Parsing list_raw_events: ${typeof listRawEvents}`);
        
        // If it's already an array, then return as it is
        if (Array.isArray(listRawEvents)) {
            return listRawEvents;
        }
        
        // If it's a string, attempt to parse it as JSON
        if (typeof listRawEvents === "string") {
            // Remove outer brackets/quotes
            let cleanedString = listRawEvents
                .replace(/^["'\[]+|["\'\]]+$/g, '')     // Remove outer quotes and brackets
                .trim();                                // Trim whitespaces

            // Empty string check
            if (!cleanedString) {
                return [];
            }

            // Split by comma, handling potential JSON conflicts
            const events = cleanedString.split(/,\s*(?={)/);

            return events.map(eventString => {
                try {
                    return JSON.parse(eventString.trim());
                } catch (error) {
                    this.logger.debug(`Failed to parse event JSON: ${error.message}, returning as string`);
                    return eventString.trim();
                }
            }).filter(event => event !== "");
        }
        
        return [];
    }
}