// backend/src/services/csv-monitor.service.ts

import * as fs from "fs";
import * as path from "path";
import { ConfigService } from "@nestjs/config";
import { Injectable, Logger, NotFoundException, OnModuleInit } from "@nestjs/common";

// CSV Parser Utility Import
import { CSVParserUtil } from "src/utils/csv-parser.util";

// Alert Files Import
import { AlertService } from "src/entities/alert/alert.service";

// Incident Files Import
import { IncidentService } from "src/entities/incident/incident.service";

@Injectable()
export class CSVMonitorService implements OnModuleInit {
    private readonly logger = new Logger(CSVMonitorService.name);
    private readonly dropPath: string;
    private readonly processedPath: string;
    private readonly errorPath: string;
    private readonly monitoringInterval: number;
    private intervalRef: NodeJS.Timeout | null = null;

    constructor (
        private readonly configService: ConfigService,
        private readonly alertService: AlertService,
        private readonly incidentService: IncidentService,
        private readonly csvParserUtil: CSVParserUtil,
    ) {
        const config = this.configService.get("config");
        if (!config) {
            throw new Error("Configuration not found!")
        }
        this.dropPath = config.storage.csv.dropPath;
        this.processedPath = config.storage.csv.processedPath;
        this.errorPath = config.storage.csv.errorPath;
        this.monitoringInterval = config.monitoring.interval;
        
        // Ensures that storage directories exists
        this.initializeStorageDirectories();
    }

    async processAllFiles(): Promise<void> {
        this.logger.log("Processing all CSV files in the directories.");
        try {
            await this.processIncidentFiles();
            await this.processAlertFiles();
            this.logger.log("All files are processed successfully. Manually check the errors/processed folders to see where your files are.");
        } catch (error) {
            this.logger.error("Error processing all CSV files: ", error);
            throw error;
        }
    }

    private stopMonitoring(): void {
        if (this.intervalRef) {
            clearInterval(this.intervalRef);
            this.intervalRef = null;
            this.logger.log("CSV Monitoring STOPPED!");
        }
    }

    // Implement OnModuleInit interface to ensure processing starts after the module is initialized
    async onModuleInit() {
        this.logger.log("CSV Monitor Service is initialized. Starting immediate file processing");
        await this.processAllFiles();
        this.startMonitoring();
    }

    private async initializeStorageDirectories(): Promise<void> {
        try {
            const directories = [
                path.join(this.dropPath, "incidents"),
                path.join(this.dropPath, "alerts"),
                path.join(this.processedPath, "incidents"),
                path.join(this.processedPath, "alerts"),
                this.errorPath,
            ];
            for (const directory of directories) {
                await fs.promises.mkdir(directory, { recursive: true });
                this.logger.log(`Directory ensured: ${directory}`);
            }
        } catch (error) {
            this.logger.error("Failed to initialize storage directories: ", error);
            throw error;
        }
    }

    private startMonitoring(): void {
        this.logger.log("Starting monitoring process with interval: " + this.monitoringInterval + " ms.");
        if (this.intervalRef) {
            clearInterval(this.intervalRef);
        }
        this.intervalRef = setInterval(async () => {
            try {
                await this.processAllFiles();
            } catch (error) {
                this.logger.error("Error processing CSV Files: ", error);
            }
        }, this.monitoringInterval);
    }

    private async processIncidentFiles(): Promise<void> {
        const incidentDropPath = path.join(this.dropPath, "incidents");
        try {
            await fs.promises.access(incidentDropPath);
            const files = await fs.promises.readdir(incidentDropPath);
            this.logger.log(`Found ${files.length} files in incidents directory.`);
            let processedFileCount = 0;
            for (const file of files) {
                if (!file.endsWith(".csv")) {
                    continue;
                }
                const filePath = path.join(incidentDropPath, file);
                try {
                    this.logger.log(`Processing incident file: ${file}.`);
                    const incidents = await this.csvParserUtil.parseIncidentsCSV(filePath);
                    this.logger.log(`Parsed ${incidents.length} incidents from ${file}.`);

                    // Track processing metrics
                    let processedCount = 0;
                    let duplicateCount = 0;
                    let criticalErrorCount = 0;

                    for (const incident of incidents) {
                        try {
                            this.logger.debug(`Creating incident: ${JSON.stringify(incident)}`);
                            const result = await this.incidentService.create(incident);
                            if (result) {
                                processedCount++;
                                this.logger.debug(`Successfully created incident for user ${incident.user}`);
                            } else {
                                duplicateCount++;
                                this.logger.debug(`Skipped duplicate incident in file ${file} for user ${incident.user}.`);
                            }
                        } catch (error) {
                            if (error.code === "ER_DUP_ENTRY" || error.code === "23505" || (error.message && error.message.includes("duplicate") && error.message.includes("unique"))) {
                                duplicateCount++;
                                this.logger.debug(`Skipped duplicate incident in file ${file} for user ${incident.user}: ${error.message}`);
                            } else {
                                criticalErrorCount++;
                                this.logger.error(`Error processing incident in file ${file}: ${error.message}`);
                                this.logger.error(`Full error: ${JSON.stringify(error)}`);
                                this.logger.error(`Incident data: ${JSON.stringify(incident)}`);
                            }
                        }
                    }
                    // Log processing statistics
                    this.logger.log(`File ${file} processing results: processed = ${processedCount}, duplicates = ${duplicateCount}, errors = ${criticalErrorCount}`);

                    // Move to error directory if there were critical errors AND no successfully processed records
                    if (criticalErrorCount > 0 && processedCount === 0) {
                        await this.csvParserUtil.moveFile(filePath, this.errorPath);
                        this.logger.warn(`Moved incident file to error directory due to processing errors: ${file}.`);
                    } else {
                        await this.csvParserUtil.moveFile(
                            filePath,
                            path.join(this.processedPath, "incidents"),
                        );
                        processedFileCount++;
                        this.logger.log(`Successfully processed incident file: ${file} (with ${duplicateCount} duplicates and ${criticalErrorCount} errors).`);
                    }
                } catch (error) {
                    this.logger.error(`Error parsing incident file: ${file}: `, error);
                    try {
                        await this.csvParserUtil.moveFile(filePath, this.errorPath);
                    } catch (moveError) {
                        this.logger.error(`Failed to move error file ${file} to error directory:`, moveError);
                    }       
                }
            }
            this.logger.log(`Processed ${processedFileCount} incident files.`);
        } catch (error) {
            if (error.code === "ENOENT") {
                this.logger.warn(`Incidents directory does not exist: ${incidentDropPath}!`)
            } else {
                this.logger.warn(`Error accessing incidents directory does not exist: ${incidentDropPath}!`, error);
            }
        }
    }

    private async processAlertFiles(): Promise<void> {
        const alertDropPath = path.join(this.dropPath, "alerts");
        try {
            // Check if directory exists
            await fs.promises.access(alertDropPath);
            
            const files = await fs.promises.readdir(alertDropPath);
            this.logger.log(`Found ${files.length} files in alerts directory.`);
            let processedFileCount = 0;
            
            // First, process regular alert files (non-incident detection files)
            for (const file of files) {
                // Skip incidents_detections_output.csv for now - we'll process it last
                const isIncidentDetections = (file === "incidents_detections_output.csv");
                if (isIncidentDetections) {
                    continue;
                }
                
                const alertFilePattern = /^alerts?_([^.]+)\.csv$/;
                
                // Log all files for debugging
                this.logger.debug(`Checking file: ${file}, matches pattern: ${!!file.match(alertFilePattern)}, is incident detection: ${isIncidentDetections}`);
                
                if (!file.match(alertFilePattern)) {
                    this.logger.debug(`Skipping file ${file} - Does not match expected patterns for alert files!`);
                    continue;
                }
                
                const filePath = path.join(alertDropPath, file);
                try {
                    this.logger.log(`Processing alert file: ${file}.`);
                    const alerts = await this.csvParserUtil.parseAlertCSV(filePath);
                    this.logger.log(`Parsed ${alerts.length} alerts from ${file}.`);
                    
                    // Track processing metrics
                    let processedCount = 0;
                    let duplicateCount = 0;
                    let criticalErrorCount = 0;
                    
                    for (const alert of alerts) {
                        try {
                            this.logger.debug(`Creating alert: ${JSON.stringify(alert)}`);
                            const result = await this.alertService.create(alert);
                            if (result) {
                                processedCount++;
                                this.logger.debug(`Successfully created alert for user ${alert.user} with name ${alert.alert_name}`);
                            } else {
                                duplicateCount++;
                                this.logger.debug(`Skipped duplicate alert in file: ${file}!`);
                            }
                        } catch (error) {
                            if (error.code === "ER_DUP_ENTRY" || error.code === "23505" || 
                                (error.message && error.message.includes("duplicate") && error.message.includes("unique"))) {
                                duplicateCount++;
                                this.logger.debug(`Skipped duplicate alert in file ${file}: ${error.message}`);
                            } else {
                                criticalErrorCount++;
                                this.logger.error(`Error processing alert in file ${file}: ${error.message}`);
                                this.logger.error(`Full error: ${JSON.stringify(error)}`);
                                this.logger.error(`Alert data: ${JSON.stringify(alert)}`);
                            }
                        }
                    }
                    
                    // Log processing statistics
                    this.logger.log(`File ${file} processing results: processed=${processedCount}, duplicates=${duplicateCount}, errors=${criticalErrorCount}`);
                    
                    // Move to error directory if there were critical errors AND no successfully processed records
                    if (criticalErrorCount > 0 && processedCount === 0) {
                        await this.csvParserUtil.moveFile(filePath, this.errorPath);
                        this.logger.warn(`Moved file to error directory due to processing errors: ${file}`);
                    } else {
                        await this.csvParserUtil.moveFile(
                            filePath,
                            path.join(this.processedPath, "alerts")
                        );
                        processedFileCount++;
                        this.logger.log(`Successfully processed alert file: ${file} (with ${duplicateCount} duplicates and ${criticalErrorCount} errors)`);
                    }
                } catch (error) {
                    this.logger.error(`Error processing alert file: ${file}:`, error);
                    try {
                        await this.csvParserUtil.moveFile(filePath, this.errorPath);
                    } catch (moveError) {
                        this.logger.error(`Failed to move error file ${file} to error directory:`, moveError);
                    }
                }
            }
            
            // Now process the incidents_detections_output.csv file if it exists
            const incidentDetectionsFile = "incidents_detections_output.csv";
            const incidentDetectionsPath = path.join(alertDropPath, incidentDetectionsFile);
            
            try {
                // Check if the file exists
                await fs.promises.access(incidentDetectionsPath);
                
                this.logger.log(`Processing incident detections file: ${incidentDetectionsFile}.`);
                const incidentAlerts = await this.csvParserUtil.parseAlertCSV(incidentDetectionsPath);
                this.logger.log(`Parsed ${incidentAlerts.length} incident-related alerts.`);
                
                // Track processing metrics
                let processedCount = 0;
                let updatedCount = 0;
                let duplicateCount = 0;
                let criticalErrorCount = 0;
                
                for (const alert of incidentAlerts) {
                    // Set isUnderIncident flag for all alerts from this file
                    alert.isUnderIncident = true;
                    
                    try {
                        // First try to find if this alert already exists
                        try {
                            // Using your existing findOne method which uses composite key
                            await this.alertService.findOne(alert.user, alert.datestr, alert.alert_name);
                            
                            // If we get here, the alert exists - update it
                            const updateResult = await this.alertService.update(
                                alert.user, 
                                alert.datestr, 
                                alert.alert_name,
                                { isUnderIncident: true }
                            );
                            
                            if (updateResult) {
                                updatedCount++;
                                this.logger.debug(`Updated existing alert for user ${alert.user} with name ${alert.alert_name} to mark as under incident.`);
                            }
                        } catch (findError) {
                            // If NotFoundException, the alert doesn't exist yet - create it
                            if (findError instanceof NotFoundException) {
                                const result = await this.alertService.create(alert);
                                if (result) {
                                    processedCount++;
                                    this.logger.debug(`Created new alert from incident detections for user ${alert.user} with name ${alert.alert_name}.`);
                                }
                            } else {
                                // Some other error during find
                                throw findError;
                            }
                        }
                    } catch (error) {
                        if (error.code === "ER_DUP_ENTRY" || error.code === "23505" || 
                            (error.message && error.message.includes("duplicate") && error.message.includes("unique"))) {
                            duplicateCount++;
                            this.logger.debug(`Skipped duplicate alert in incident detections file: ${error.message}`);
                        } else {
                            criticalErrorCount++;
                            this.logger.error(`Error processing alert in incident detections file:`, error);
                        }
                    }
                }
                
                // Log processing statistics
                this.logger.log(`Incident detections file processing results: new=${processedCount}, updated=${updatedCount}, duplicates=${duplicateCount}, errors=${criticalErrorCount}`);
                
                // Move the file based on processing results
                if (criticalErrorCount > 0 && processedCount === 0 && updatedCount === 0) {
                    await this.csvParserUtil.moveFile(incidentDetectionsPath, this.errorPath);
                    this.logger.warn(`Moved incident detections file to error directory due to processing errors.`);
                } else {
                    await this.csvParserUtil.moveFile(
                        incidentDetectionsPath,
                        path.join(this.processedPath, "alerts")
                    );
                    processedFileCount++;
                    this.logger.log(`Successfully processed incident detections file (with ${updatedCount} updates, ${processedCount} new records, ${duplicateCount} duplicates and ${criticalErrorCount} errors).`);
                }
            } catch (error) {
                if (error.code === 'ENOENT') {
                    this.logger.debug(`No incident detections file found.`);
                } else {
                    this.logger.error(`Error processing incident detections file:`, error);
                    try {
                        await this.csvParserUtil.moveFile(incidentDetectionsPath, this.errorPath);
                    } catch (moveError) {
                        this.logger.error(`Failed to move incident detections file to error directory:`, moveError);
                    }
                }
            }
            
            this.logger.log(`Processed ${processedFileCount} alert files.`);
        } catch (error) {
            if (error.code === 'ENOENT') {
                this.logger.warn(`Alerts directory does not exist: ${alertDropPath}!`);
            } else {
                this.logger.error(`Error accessing alerts directory: ${alertDropPath}!`, error);
            }
        }
    }
}