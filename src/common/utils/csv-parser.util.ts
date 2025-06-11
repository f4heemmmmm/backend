// backend/src/common/utils/csv-parser.util.ts

// Node.js Core
import * as fs from "fs";
import * as path from "path";

// Third-party Libraries
import * as csv from "csv-parse";

// NestJS Core
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

// DTOs
import { CreateAlertDTO } from "src/modules/alert/alert.dto";
import { CreateIncidentDTO } from "src/modules/incident/incident.dto";

/**
 * CSV parsing utility with robust parsing strategies for security incident and alert data,
 * including complex evidence processing and intelligent file operations.
 */
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
     * Parses incident CSV files with timestamp handling and windows array processing
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
                    
                    // Validate required fields
                    if (!record.user || !record.windows_start || !record.windows_end) {
                        this.logger.warn("Skipping record with missing required fields!", record);
                        continue;
                    }
                    
                    // Parse timestamps with Unix timestamp support
                    let windowsStart: Date, windowsEnd: Date;
                    try {
                        windowsStart = this.parseTimestamp(record.windows_start);
                        windowsEnd = this.parseTimestamp(record.windows_end);
                        
                        if (isNaN(windowsStart.getTime()) || isNaN(windowsEnd.getTime())) {
                            throw new Error(`Invalid timestamp values: start=${record.windows_start}, end=${record.windows_end}`);
                        }
                    } catch (error) {
                        this.logger.warn(`Error parsing timestamps: ${error.message}`, record);
                        continue;
                    }

                    // Parse windows array with multiple format support
                    const parsedWindows: string[] = this.parseWindowsArray(record.windows);

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
     * Parses alert CSV files with advanced evidence processing and data validation
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
                    
                    // Parse evidence with multiple fallback strategies
                    let evidence: any = {
                        site: "",
                        count: 0,
                        list_raw_events: []
                    };
                    
                    if (record.evidence) {
                        evidence = this.parseEvidenceField(record.evidence);
                    }

                    // Ensure list_raw_events is properly formatted
                    if (!Array.isArray(evidence.list_raw_events)) {
                        try {
                            evidence.list_raw_events = this.parseListRawEvents(evidence.list_raw_events || "");
                        } catch (listEventsError) {
                            this.logger.warn(`Could not parse "list_raw_events": ${listEventsError.message}`);
                            evidence.list_raw_events = [];
                        }
                    }
                    
                    // Normalize evidence structure
                    evidence.count = typeof evidence.count === "number" ? evidence.count : parseInt(evidence.count) || 0;
                    evidence.site = evidence.site || "";
                    
                    // Parse datestr with timestamp support
                    let datestr: Date;
                    try {
                        if (record.datestr) {
                            datestr = this.parseTimestamp(record.datestr);
                            
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
                        is_under_incident: record.isUnderIncident === true || record.isUnderIncident === "true",
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

    // =================== PRIVATE HELPER METHODS ===================

    /**
     * Parses timestamps supporting both Unix timestamps and ISO date strings
     */
    private parseTimestamp(timestamp: any): Date {
        if (/^\d+$/.test(timestamp.toString())) {
            return new Date(parseInt(timestamp) * 1000);
        } else {
            return new Date(timestamp);
        }
    }

    /**
     * Parses windows array from various string formats
     */
    private parseWindowsArray(windows: any): string[] {
        const parsedWindows: string[] = [];
        
        if (!windows) {
            return parsedWindows;
        }

        try {
            if (typeof windows === "string") {
                // Handle JSON array format
                if (windows.startsWith("[") && windows.endsWith("]")) {
                    const windowsArray = windows
                        .replace(/^\[|\]$/g, "")
                        .split(/"\s*,?\s*"/)
                        .map((dateStr: string) => dateStr.replace(/^"|"$/g, "").trim())
                        .filter((dateStr: string) => dateStr.length > 0);
                    
                    windowsArray.forEach((dateStr: string) => {
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
                // Handle comma-separated format
                else if (windows.includes(",")) {
                    windows
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
                } 
                // Handle single date string
                else {
                    try {
                        const date = new Date(windows);
                        if (!isNaN(date.getTime())) {
                            parsedWindows.push(date.toISOString());
                        }
                    } catch (e) {
                        this.logger.warn(`Invalid date string: ${windows}`);
                    }
                }
            } else if (Array.isArray(windows)) {
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
            }
        } catch (error) {
            this.logger.warn(`Error parsing windows array: ${error.message}`);
        }

        return parsedWindows;
    }

    /**
     * Parses evidence field using progressive fallback strategies for complex JSON structures
     */
    private parseEvidenceField(evidenceData: any): any {
        this.logger.debug(`Parsing evidence field of type: ${typeof evidenceData}`);
        
        const defaultEvidence = {
            site: "",
            count: 0,
            list_raw_events: []
        };

        // Return objects/arrays directly
        if (typeof evidenceData === "object" && evidenceData !== null) {
            this.logger.debug("Evidence is already an object/array");
            return { ...defaultEvidence, ...evidenceData };
        }

        // Convert to string if needed
        if (typeof evidenceData !== "string") {
            try {
                evidenceData = String(evidenceData);
            } catch (error) {
                this.logger.warn(`Could not convert evidence to string: ${error.message}`);
                return defaultEvidence;
            }
        }

        // Progressive parsing strategies
        const strategies = [
            // Direct JSON parse
            () => {
                const parsed = JSON.parse(evidenceData);
                this.logger.debug("Strategy 1 (direct JSON parse) succeeded");
                return parsed;
            },

            // Handle doubled quotes (CSV export format)
            () => {
                const doubleQuotesCleaned = evidenceData.replace(/""/g, '"');
                const parsed = JSON.parse(doubleQuotesCleaned);
                this.logger.debug("Strategy 2 (doubled quotes cleaning) succeeded");
                return parsed;
            },

            // Handle escaped quotes and surrounding quotes
            () => {
                let cleaned = evidenceData.trim();
                
                if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || 
                    (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
                    cleaned = cleaned.slice(1, -1);
                }
                
                cleaned = cleaned
                    .replace(/\\"/g, '"')
                    .replace(/\\\\/g, '\\')
                    .replace(/""/g, '"');
                
                const parsed = JSON.parse(cleaned);
                this.logger.debug("Strategy 3 (escaped quotes cleaning) succeeded");
                return parsed;
            },

            // Handle Microsoft Graph API format
            () => {
                let cleaned = evidenceData
                    .replace(/""/g, '"')
                    .replace(/\\""/g, '"')
                    .replace(/""@/g, '"@')
                    .replace(/""#/g, '"#')
                    .replace(/"":/g, '":')
                    .replace(/:""([^"]*)""/g, ':"$1"')
                    .trim();

                if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
                    cleaned = cleaned.slice(1, -1);
                }

                const parsed = JSON.parse(cleaned);
                this.logger.debug("Strategy 4 (Microsoft Graph format) succeeded");
                return parsed;
            },

            // Handle nested escaping
            () => {
                let nestedEscaped = evidenceData;
                for (let i = 0; i < 3; i++) {
                    try {
                        if (nestedEscaped.startsWith('"') && nestedEscaped.endsWith('"')) {
                            nestedEscaped = JSON.parse(nestedEscaped);
                        }
                    } catch (e) {
                        break;
                    }
                }
                const finalParsed = typeof nestedEscaped === 'string' ? JSON.parse(nestedEscaped) : nestedEscaped;
                this.logger.debug("Strategy 5 (nested escaping) succeeded");
                return finalParsed;
            },

            // Aggressive cleaning for CSV cells
            () => {
                let aggressiveCleaned = evidenceData
                    .replace(/^""|""$/g, '')
                    .replace(/""/g, '"')
                    .replace(/\\"/g, '"')
                    .replace(/\\\\/g, '\\')
                    .replace(/\\n/g, '\n')
                    .replace(/\\r/g, '\r')
                    .replace(/\\t/g, '\t')
                    .trim();
                
                const parsed = JSON.parse(aggressiveCleaned);
                this.logger.debug("Strategy 6 (aggressive cleaning) succeeded");
                return parsed;
            }
        ];

        // Try each strategy
        for (let i = 0; i < strategies.length; i++) {
            try {
                const parsed = strategies[i]();
                
                // Handle array results
                if (Array.isArray(parsed)) {
                    return { 
                        ...defaultEvidence, 
                        list_raw_events: parsed,
                        count: parsed.length 
                    };
                }
                
                return { ...defaultEvidence, ...parsed };
            } catch (error) {
                this.logger.debug(`Strategy ${i + 1} failed: ${error.message}`);
            }
        }

        // Final fallback: extract data from malformed JSON
        try {
            const extracted = this.extractDataFromMalformedJSON(evidenceData);
            if (extracted && Object.keys(extracted).length > 0) {
                this.logger.debug("Strategy 7 (malformed JSON extraction) succeeded");
                return { ...defaultEvidence, ...extracted };
            }
        } catch (error) {
            this.logger.debug(`Strategy 7 failed: ${error.message}`);
        }

        // Store original string for inspection
        this.logger.warn(`All evidence parsing strategies failed, storing original data`);
        return { 
            ...defaultEvidence, 
            originalEvidenceString: evidenceData.substring(0, 500) + (evidenceData.length > 500 ? '...' : ''),
            parsingError: "Could not parse evidence field"
        };
    }

    /**
     * Extracts meaningful data from malformed JSON strings using pattern matching
     */
    private extractDataFromMalformedJSON(data: string): any {
        const extracted: any = {};
        
        try {
            // Extract email addresses
            const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
            const emails = data.match(emailRegex);
            if (emails && emails.length > 0) {
                extracted.extractedEmails = emails;
            }

            // Extract user principal names
            const upnRegex = /"userPrincipalName":\s*"([^"]+)"/g;
            const upnMatches = [...data.matchAll(upnRegex)];
            if (upnMatches.length > 0) {
                extracted.userPrincipalNames = upnMatches.map(match => match[1]);
            }

            // Extract display names
            const displayNameRegex = /"displayName":\s*"([^"]+)"/g;
            const displayNameMatches = [...data.matchAll(displayNameRegex)];
            if (displayNameMatches.length > 0) {
                extracted.displayNames = displayNameMatches.map(match => match[1]);
            }

            // Extract file names
            const fileNameRegex = /"fileName":\s*"([^"]+)"/g;
            const fileNameMatches = [...data.matchAll(fileNameRegex)];
            if (fileNameMatches.length > 0) {
                extracted.fileNames = fileNameMatches.map(match => match[1]);
            }

            // Extract timestamps
            const timestampRegex = /"createdDateTime":\s*"([^"]+)"/g;
            const timestampMatches = [...data.matchAll(timestampRegex)];
            if (timestampMatches.length > 0) {
                extracted.timestamps = timestampMatches.map(match => match[1]);
            }

            // Extract subject lines
            const subjectRegex = /"subject":\s*"([^"]+)"/g;
            const subjectMatches = [...data.matchAll(subjectRegex)];
            if (subjectMatches.length > 0) {
                extracted.subjects = subjectMatches.map(match => match[1]);
            }

            // Count approximate objects
            const objectCount = (data.match(/{[^}]*}/g) || []).length;
            if (objectCount > 0) {
                extracted.approximateObjectCount = objectCount;
            }

        } catch (error) {
            this.logger.debug(`Error in extractDataFromMalformedJSON: ${error.message}`);
        }

        return extracted;
    }

    /**
     * Parses list_raw_events with support for complex nested structures
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
            
            // Direct JSON parse
            if (listRawEvents.startsWith("[") && listRawEvents.endsWith("]")) {
                try {
                    return JSON.parse(listRawEvents);
                } catch (error) {
                    this.logger.debug(`Direct JSON.parse failed for list_raw_events: ${error.message}`);
                }
            }
            
            // Handle doubled quotes
            try {
                const doubleQuotesCleaned = listRawEvents.replace(/""/g, '"');
                if (doubleQuotesCleaned.startsWith("[") && doubleQuotesCleaned.endsWith("]")) {
                    return JSON.parse(doubleQuotesCleaned);
                }
            } catch (error) {
                this.logger.debug(`Doubled quotes strategy failed: ${error.message}`);
            }
            
            // Advanced cleaning for escaped JSON
            try {
                let cleaned = listRawEvents
                    .replace(/^["'\[]+|['"\\]+$/g, "")
                    .replace(/""/g, '"')
                    .replace(/\\""/g, '"')
                    .trim();

                if (!cleaned) {
                    return [];
                }

                // Format as JSON array if needed
                if (!cleaned.startsWith("[") && cleaned.includes("}{")) {
                    cleaned = `[${cleaned.replace(/}{/g, "},{")}]`;
                } else if (!cleaned.startsWith("[") && cleaned.startsWith("{")) {
                    cleaned = `[${cleaned}]`;
                }

                return JSON.parse(cleaned);
            } catch (error) {
                this.logger.debug(`Advanced cleaning strategy failed: ${error.message}`);
            }

            // Split and parse individual objects
            try {
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
                                .replace(/(\w+):/g, '"$1":')
                                .replace(/"/g, '"');
                                
                            parsedEvents.push(JSON.parse(`{${normalized}}`));
                        }
                    } catch (error) {
                        this.logger.debug(`Failed to parse event JSON: ${error.message}, returning as string`);
                        parsedEvents.push(eventString);
                    }
                });
                return parsedEvents.filter(event => event !== null && event !== "");
            } catch (error) {
                this.logger.debug(`Individual object parsing failed: ${error.message}`);
            }

            // Return as single string item
            return [listRawEvents];
        }
        
        return [];
    }

    /**
     * Moves files with conflict resolution and cross-device support
     */
    async moveFile(sourcePath: string, destinationDirectory: string = this.processedPath): Promise<void> {
        try {
            const fileName = path.basename(sourcePath);
            const destinationPath = path.join(destinationDirectory, fileName);
            
            this.logger.debug(`Moving file from ${sourcePath} to ${destinationPath}`);
            
            await fs.promises.mkdir(destinationDirectory, { recursive: true });
            
            try {
                // Check if destination exists and handle conflict
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
                    // Handle cross-device moves
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
}