// backend/src/utils/csv-parser.util.ts

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
        
        // Use environment variables if provided, otherwise use config defaults
        this.dropPath = process.env.CSV_DROP_PATH || config.storage.csv.dropPath;
        this.processedPath = process.env.CSV_PROCESSED_PATH || config.storage.csv.processedPath;
        this.errorPath = process.env.CSV_ERROR_PATH || config.storage.csv.errorPath;
        
        this.logger.log(`CSV Parser initialized with paths: 
            Drop: ${this.dropPath}, 
            Processed: ${this.processedPath}, 
            Error: ${this.errorPath}`);
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
                        // Try parsing as Unix timestamp (seconds)
                        if (/^\d+$/.test(record.windows_start.toString())) {
                            windowsStart = new Date(parseInt(record.windows_start) * 1000);
                        } else {
                            // Try parsing as standard date string
                            windowsStart = new Date(record.windows_start);
                        }
                        
                        if (/^\d+$/.test(record.windows_end.toString())) {
                            windowsEnd = new Date(parseInt(record.windows_end) * 1000);
                        } else {
                            windowsEnd = new Date(record.windows_end);
                        }
                        
                        // Validate dates
                        if (isNaN(windowsStart.getTime()) || isNaN(windowsEnd.getTime())) {
                            throw new Error(`Invalid timestamp values: start=${record.windows_start}, end=${record.windows_end}`);
                        }
                    } catch (error) {
                        this.logger.warn(`Error parsing timestamps: ${error.message}`, record);
                        continue;
                    }

                    // Custom parsing for Python-style list string
                    const parsedWindows: string[] = [];
                    if (record.windows) {
                        try {
                            // Handle different array formats
                            if (typeof record.windows === 'string') {
                                if (record.windows.startsWith('[') && record.windows.endsWith(']')) {
                                    // Python-style list representation
                                    const windows = record.windows
                                        .replace(/^\[|\]$/g, '')                                        // Remove outer brackets
                                        .split(/'\s*,?\s*'/)                                            // Split by comma or whitespace between quotes
                                        .map((dateStr: string) => dateStr.replace(/^'|'$/g, '').trim()) // Remove quotes and trim
                                        .filter((dateStr: string) => dateStr.length > 0);               // Filter out empty strings
                                    
                                    windows.forEach((dateStr: string) => {
                                        try {
                                            // Convert to ISO format
                                            const date = new Date(dateStr);
                                            if (!isNaN(date.getTime())) {
                                                parsedWindows.push(date.toISOString());
                                            }
                                        } catch (e) {
                                            this.logger.warn(`Invalid date string: ${dateStr}`);
                                        }
                                    });
                                } else if (record.windows.includes(',')) {
                                    // Simple comma-separated format
                                    record.windows
                                        .split(',')
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
                                    // Single date string
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
                                // Already an array
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
                            // Keep parsedWindows as empty array
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
                    // Always ensure required fields are present according to database constraints
                    let evidence: any = {
                        site: "",
                        count: 0,
                        list_raw_events: []
                    };
                    
                    try {
                        if (typeof record.evidence === "string") {
                            try {
                                // Try standard JSON parsing first
                                const parsedEvidence = JSON.parse(record.evidence);
                                evidence = {
                                    ...evidence, // Keep defaults as fallback
                                    ...parsedEvidence // Override with parsed values
                                };
                            } catch (jsonError) {
                                // Fallback to custom parsing
                                const parsedEvidence = this.parseStringifiedEvidence(record.evidence);
                                evidence = {
                                    ...evidence, // Keep defaults as fallback
                                    ...parsedEvidence // Override with parsed values
                                };
                            }
                        } else if (typeof record.evidence === "object" && record.evidence !== null) {
                            evidence = {
                                ...evidence, // Keep defaults as fallback
                                ...record.evidence // Override with provided values
                            };
                        }
                    } catch (evidenceParseError) {
                        this.logger.warn(`Could not parse evidence for alert ${record.alert_name}: ${evidenceParseError.message}`);
                        // Default evidence object already has required fields
                    }

                    // Ensure list_raw_events is always an array
                    if (!Array.isArray(evidence.list_raw_events)) {
                        try {
                            evidence.list_raw_events = this.parseListRawEvents(evidence.list_raw_events || "");
                        } catch (listEventsError) {
                            this.logger.warn(`Could not parse 'list_raw_events': ${listEventsError.message}`);
                            evidence.list_raw_events = [];
                        }
                    }
                    
                    // Convert count to number if it's not already
                    evidence.count = typeof evidence.count === 'number' ? evidence.count : parseInt(evidence.count) || 0;
                    
                    // Ensure site is a string
                    evidence.site = evidence.site || "";
                    
                    // Ensure date is properly parsed
                    let datestr;
                    try {
                        if (record.datestr) {
                            // Try parsing as Unix timestamp first
                            if (/^\d+$/.test(record.datestr.toString())) {
                                datestr = new Date(parseInt(record.datestr) * 1000);
                            } else {
                                // Try parsing as date string
                                datestr = new Date(record.datestr);
                            }
                            
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
                    
                    // Ensure all required fields have default values
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
                // Try to normalize Python-like dictionary strings to valid JSON
                const normalizedJSON = cleanedString
                    .replace(/(\w+):/g, '"$1":')        // Add quotes to keys
                    .replace(/'/g, '"')                 // Replace single quotes with double quotes
                    .replace(/\\/g, '\\\\');            // Escape backslashes
                
                return JSON.parse(normalizedJSON);
            } catch (normalizeError) {
                this.logger.debug(`Normalized JSON parse failed: ${normalizeError.message}, returning base object`);
                
                // Return fallback object with required fields
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
            // Empty string check
            if (!listRawEvents || listRawEvents.trim() === '') {
                return [];
            }
            
            // Try to parse as JSON array
            if (listRawEvents.startsWith('[') && listRawEvents.endsWith(']')) {
                try {
                    return JSON.parse(listRawEvents);
                } catch (error) {
                    // Continue with other parsing methods if JSON.parse fails
                    this.logger.debug(`JSON.parse failed for list_raw_events: ${error.message}`);
                }
            }
            
            // Remove outer brackets/quotes
            let cleanedString = listRawEvents
                .replace(/^["'\[]+|["\'\]]+$/g, '')     // Remove outer quotes and brackets
                .trim();                                // Trim whitespaces

            // Empty string check after cleaning
            if (!cleanedString) {
                return [];
            }

            // Split by comma, handling potential JSON conflicts
            const events = cleanedString.split(/,\s*(?={)/);
            
            const parsedEvents: any[] = [];
            
            events.forEach(eventString => {
                eventString = eventString.trim();
                if (!eventString) {
                    return; // Skip empty strings
                }
                
                try {
                    // Try to parse as JSON object
                    if (eventString.startsWith('{') && eventString.endsWith('}')) {
                        parsedEvents.push(JSON.parse(eventString));
                    } else {
                        // Try to normalize and then parse
                        const normalized = eventString
                            .replace(/(\w+):/g, '"$1":')
                            .replace(/'/g, '"');
                            
                        parsedEvents.push(JSON.parse(`{${normalized}}`));
                    }
                } catch (error) {
                    this.logger.debug(`Failed to parse event JSON: ${error.message}, returning as string`);
                    parsedEvents.push(eventString);
                }
            });
            
            return parsedEvents.filter(event => event !== null && event !== "");
        }
        
        // If it's not an array or string, return empty array
        return [];
    }
}