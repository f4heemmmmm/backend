// backend/src/common/utils/csv-parser.util.ts
import * as fs from "fs";
import * as path from "path";
import * as csv from "csv-parse";
import { ConfigService } from "@nestjs/config";
import { Injectable, Logger } from "@nestjs/common";

import { CreateAlertDTO } from "src/modules/alert/alert.dto";
import { CreateIncidentDTO } from "src/modules/incident/incident.dto";

/**
 * CSVParserUtil - Enhanced enterprise CSV parsing utility for security incident and alert data processing.
 * 
 * This comprehensive utility provides robust CSV parsing capabilities including:
 * - Advanced multi-format CSV parsing with intelligent column mapping and data validation
 * - Sophisticated evidence parsing supporting complex JSON arrays, escaped strings, and malformed data
 * - Multi-strategy JSON parsing with progressive fallback mechanisms
 * - Intelligent timestamp parsing supporting Unix timestamps, ISO dates, and custom formats
 * - Complex array parsing for incident windows and alert event lists with various serialization formats
 * - Enhanced file system operations with cross-device compatibility and conflict resolution
 * - Comprehensive error handling with detailed logging for debugging and monitoring
 * - Advanced data transformation pipelines converting raw CSV data into validated DTOs
 * - Resilient parsing mechanisms for handling real-world data inconsistencies
 * 
 * The utility is designed to handle enterprise-grade CSV data with complex nested structures,
 * providing maximum data recovery while maintaining integrity and providing meaningful fallbacks.
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
     * Parses incident CSV files and transforms records into validated DTOs for database insertion.
     * 
     * This method provides comprehensive incident data processing including:
     * - Strict validation of required fields (user, windows_start, windows_end)
     * - Intelligent timestamp parsing supporting Unix timestamps and ISO date strings
     * - Complex windows array parsing with support for various string formats and delimiters
     * - Data type conversion and validation with fallback values for optional fields
     * - Error recovery mechanisms to maximize successful record processing
     * - Detailed logging for monitoring parsing progress and debugging failures
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
     * Enhanced alert CSV parsing with sophisticated evidence processing.
     * 
     * This method now includes:
     * - Multi-strategy evidence parsing for complex JSON structures
     * - Support for arrays of objects with escaped quotes
     * - Progressive fallback mechanisms for malformed data
     * - Enhanced list_raw_events parsing for various formats
     * - Robust error recovery with meaningful defaults
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
                    
                    // Enhanced evidence parsing with multiple strategies
                    let evidence: any = {
                        site: "",
                        count: 0,
                        list_raw_events: []
                    };
                    
                    if (record.evidence) {
                        evidence = this.parseEvidenceField(record.evidence);
                    }

                    // Enhanced list_raw_events parsing
                    if (!Array.isArray(evidence.list_raw_events)) {
                        try {
                            evidence.list_raw_events = this.parseListRawEvents(evidence.list_raw_events || "");
                        } catch (listEventsError) {
                            this.logger.warn(`Could not parse "list_raw_events": ${listEventsError.message}`);
                            evidence.list_raw_events = [];
                        }
                    }
                    
                    // Ensure evidence has proper structure
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
     * Enhanced evidence field parsing with comprehensive strategies for complex JSON structures.
     * 
     * This method handles:
     * - Direct object/array evidence (already parsed)
     * - JSON strings with various escape patterns
     * - Arrays of complex objects with nested structures
     * - Microsoft Graph API evidence format
     * - Malformed JSON with intelligent recovery
     * - Progressive fallback with meaningful defaults
     */
    private parseEvidenceField(evidenceData: any): any {
        this.logger.debug(`Parsing evidence field of type: ${typeof evidenceData}`);
        
        const defaultEvidence = {
            site: "",
            count: 0,
            list_raw_events: []
        };

        // If it's already an object or array, use it directly
        if (typeof evidenceData === "object" && evidenceData !== null) {
            this.logger.debug("Evidence is already an object/array");
            return { ...defaultEvidence, ...evidenceData };
        }

        // If it's not a string, convert to string and try parsing
        if (typeof evidenceData !== "string") {
            try {
                evidenceData = String(evidenceData);
            } catch (error) {
                this.logger.warn(`Could not convert evidence to string: ${error.message}`);
                return defaultEvidence;
            }
        }

        // Comprehensive parsing strategies for complex CSV evidence
        const strategies = [
            // Strategy 1: Direct JSON parse
            () => {
                const parsed = JSON.parse(evidenceData);
                this.logger.debug("Strategy 1 (direct JSON parse) succeeded");
                return parsed;
            },

            // Strategy 2: Handle doubled quotes (most common in CSV exports)
            () => {
                const doubleQuotesCleaned = evidenceData.replace(/""/g, '"');
                const parsed = JSON.parse(doubleQuotesCleaned);
                this.logger.debug("Strategy 2 (doubled quotes cleaning) succeeded");
                return parsed;
            },

            // Strategy 3: Handle escaped quotes and surrounding quotes
            () => {
                let cleaned = evidenceData.trim();
                
                // Remove surrounding quotes if present
                if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || 
                    (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
                    cleaned = cleaned.slice(1, -1);
                }
                
                // Handle escaped quotes
                cleaned = cleaned
                    .replace(/\\"/g, '"')
                    .replace(/\\\\/g, '\\')
                    .replace(/""/g, '"');
                
                const parsed = JSON.parse(cleaned);
                this.logger.debug("Strategy 3 (escaped quotes cleaning) succeeded");
                return parsed;
            },

            // Strategy 4: Handle Microsoft Graph API format with @odata.type
            () => {
                let cleaned = evidenceData
                    .replace(/""/g, '"')
                    .replace(/\\""/g, '"')
                    .replace(/""@/g, '"@')
                    .replace(/""#/g, '"#')
                    .replace(/"":/g, '":')
                    .replace(/:""([^"]*)""/g, ':"$1"')
                    .trim();

                // Remove outer quotes if they exist
                if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
                    cleaned = cleaned.slice(1, -1);
                }

                const parsed = JSON.parse(cleaned);
                this.logger.debug("Strategy 4 (Microsoft Graph format) succeeded");
                return parsed;
            },

            // Strategy 5: Handle nested escaping (common in complex CSV scenarios)
            () => {
                let nestedEscaped = evidenceData;
                // Handle multiple levels of escaping
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

            // Strategy 6: Handle CSV cell format with aggressive cleaning
            () => {
                let aggressiveCleaned = evidenceData
                    .replace(/^""|""$/g, '') // Remove leading/trailing doubled quotes
                    .replace(/""/g, '"')      // Replace doubled quotes with single quotes
                    .replace(/\\"/g, '"')     // Replace escaped quotes
                    .replace(/\\\\/g, '\\')   // Replace escaped backslashes
                    .replace(/\\n/g, '\n')    // Replace escaped newlines
                    .replace(/\\r/g, '\r')    // Replace escaped carriage returns
                    .replace(/\\t/g, '\t')    // Replace escaped tabs
                    .trim();
                
                const parsed = JSON.parse(aggressiveCleaned);
                this.logger.debug("Strategy 6 (aggressive cleaning) succeeded");
                return parsed;
            }
        ];

        // Try each strategy in order
        for (let i = 0; i < strategies.length; i++) {
            try {
                const parsed = strategies[i]();
                
                // If it's an array, store it in list_raw_events
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

        // Strategy 7: Try to extract meaningful data from malformed JSON
        try {
            const extracted = this.extractDataFromMalformedJSON(evidenceData);
            if (extracted && Object.keys(extracted).length > 0) {
                this.logger.debug("Strategy 7 (malformed JSON extraction) succeeded");
                return { ...defaultEvidence, ...extracted };
            }
        } catch (error) {
            this.logger.debug(`Strategy 7 failed: ${error.message}`);
        }

        // Fallback: Store original string for manual inspection
        this.logger.warn(`All evidence parsing strategies failed, storing original data`);
        return { 
            ...defaultEvidence, 
            originalEvidenceString: evidenceData.substring(0, 500) + (evidenceData.length > 500 ? '...' : ''),
            parsingError: "Could not parse evidence field"
        };
    }

    /**
     * Attempts to extract meaningful data from malformed JSON strings.
     * 
     * This method looks for common patterns and tries to extract:
     * - Email addresses, user names, file names
     * - Timestamps and dates
     * - URLs and domains
     * - Numeric values that might be counts or scores
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

            // Try to count objects in the string (approximate)
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
     * Enhanced list_raw_events parsing with support for complex nested structures.
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
            
            // Strategy 1: Direct JSON parse
            if (listRawEvents.startsWith("[") && listRawEvents.endsWith("]")) {
                try {
                    return JSON.parse(listRawEvents);
                } catch (error) {
                    this.logger.debug(`Direct JSON.parse failed for list_raw_events: ${error.message}`);
                }
            }
            
            // Strategy 2: Handle doubled quotes
            try {
                const doubleQuotesCleaned = listRawEvents.replace(/""/g, '"');
                if (doubleQuotesCleaned.startsWith("[") && doubleQuotesCleaned.endsWith("]")) {
                    return JSON.parse(doubleQuotesCleaned);
                }
            } catch (error) {
                this.logger.debug(`Doubled quotes strategy failed: ${error.message}`);
            }
            
            // Strategy 3: Advanced cleaning for escaped JSON
            try {
                let cleaned = listRawEvents
                    .replace(/^["'\[]+|['"\\]+$/g, "")
                    .replace(/""/g, '"')
                    .replace(/\\""/g, '"')
                    .trim();

                if (!cleaned) {
                    return [];
                }

                // If it looks like a JSON array, wrap it properly
                if (!cleaned.startsWith("[") && cleaned.includes("}{")) {
                    cleaned = `[${cleaned.replace(/}{/g, "},{")}]`;
                } else if (!cleaned.startsWith("[") && cleaned.startsWith("{")) {
                    cleaned = `[${cleaned}]`;
                }

                return JSON.parse(cleaned);
            } catch (error) {
                this.logger.debug(`Advanced cleaning strategy failed: ${error.message}`);
            }

            // Strategy 4: Split and parse individual objects
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

            // Fallback: Return as single string item
            return [listRawEvents];
        }
        
        return [];
    }

    /**
     * Moves processed CSV files to designated directories with intelligent conflict resolution.
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
}