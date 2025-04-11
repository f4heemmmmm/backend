import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsWhere, Between, MoreThan } from "typeorm";
import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";

// Alert Files Import
import { Alert } from "./alert.entity";
import { CreateAlertDTO, UpdateAlertDTO, AlertResponseDTO } from "./alert.dto";

@Injectable()
export class AlertService {
    constructor(
        @InjectRepository(Alert)
        private readonly alertRepository: Repository<Alert>
    ) {}

    private mapToResponseDTO(alert: Alert): AlertResponseDTO {
        return {
            ID: alert.ID,
            user: alert.user,
            datestr: alert.datestr,
            evidence: alert.evidence,
            score: alert.score,
            alert_name: alert.alert_name,
            MITRE_tactic: alert.MITRE_tactic,
            MITRE_technique: alert.MITRE_technique,
            Logs: alert.Logs,
            Detection_model: alert.Detection_model,
            Description: alert.Description,
            isUnderIncident: alert.isUnderIncident,
            created_at: alert.created_at,
            updated_at: alert.updated_at
        };
    }

    /**
     * Create a new alert
     * @param createAlertDTO Alert creation data
     * @returns The created alert
     */
    async create(createAlertDTO: CreateAlertDTO): Promise<AlertResponseDTO> {
        const checkExistingAlert = await this.alertRepository.findOne({
            where: {
                user: createAlertDTO.user,
                datestr: createAlertDTO.datestr,
                alert_name: createAlertDTO.alert_name,
            }
        });
        if (checkExistingAlert) {
            throw new ConflictException("An alert with the same user, date and alert nameis already created!")
        }
        try {
            const alert = this.alertRepository.create(createAlertDTO);
            const savedAlert = await this.alertRepository.save(alert);
            return this.mapToResponseDTO(savedAlert);
        } catch (error) {
            if (error.code === "23505") {
                throw new ConflictException(`Duplicate alert. An alert with the same user, date and alert name already exists!`);
            }
            throw error;
        }
    }

    /**
     * Get all alerts with optional filtering
     * @param filters Optional filters for the query
     * @param limit Number of alerts per page
     * @param offset Number of records to skip
     * @returns Paginate array of alerts
     */
    async findAll(
        filters?: Partial<Alert>,
        limit = 10,
        offset = 0
    ): Promise<{ alerts: AlertResponseDTO[], total: number }> {
        const whereClause: FindOptionsWhere<Alert> = {};
        if (filters) {
            Object.keys(filters).forEach(key => {
                if (filters[key] !== undefined) {
                    whereClause[key] = filters[key];
                }
            });
        }
        const [alerts, total] = await this.alertRepository.findAndCount({
            where: whereClause,
            order: { datestr: "DESC" },
            take: limit,
            skip: offset
        });
        return {
            alerts: alerts.map(alert => this.mapToResponseDTO(alert)),
            total
        }
    }

    /**
     * Find alerts by their date range
     * @param startDate Start date for the range
     * @param endDate End date for the range
     * @param user Optional user filter
     * @returns Array of alerts within the date range
     */
    async findAlertsByDateRange(startDate: Date, endDate: Date, user?: string): Promise<AlertResponseDTO[]> {
        const whereClause: FindOptionsWhere<Alert> = {
            datestr: Between(startDate, endDate)
        };
        if (user) {
            whereClause.user = user;
        }
        const alerts = await this.alertRepository.find({
            where: whereClause,
            order: { datestr: "DESC" }
        });
        return alerts.map(alert => this.mapToResponseDTO(alert));
    }

    /**
     * Find alerts by score range
     * @param minScore Minimum score
     * @param maxScore Maximum score
     * @returns Array of alerts within the score range
     */
    async findAlertsByScoreRange(minScore: number, maxScore: number) {
        const alerts = await this.alertRepository.find({
            where: {
                score: Between(minScore, maxScore)
            },
            order: { score: "DESC" }
        });
        return alerts.map(alert => this.mapToResponseDTO(alert));
    }

    /**
     * Find alerts by MITRE tactic
     * @param tactic MITRE tactic to search for
     * @returns Array of alerts with the specified MITRE tactic
     */
    async findAlertsByMITRETactic(tactic: string): Promise<AlertResponseDTO[]> {
        const alerts = await this.alertRepository.find({
            where: { MITRE_tactic: tactic },
            order: { datestr: "DESC"}
        });
        return alerts.map(alert => this.mapToResponseDTO(alert));
    }

    /**
     * Find alerts by MITRE technique
     * @param technique MITRE technique to search for
     * @returns Array of alerts with the specified MITRE technique
     */
    async findAlertsByMITRETechnique(technique: string): Promise<AlertResponseDTO[]> {
        const alerts = await this.alertRepository.find({
            where: { MITRE_technique: technique },
            order: { datestr: "DESC" }
        });
        return alerts.map(alert => this.mapToResponseDTO(alert));
    }

    /**
     * Find alerts by user
     * @param user Username to search for
     * @returns Array of alerts under the specified user
     */
    async findAlertsByUser(user: string): Promise<AlertResponseDTO[]> {
        const alerts = await this.alertRepository.find({
            where: { user },
            order: { datestr: "DESC" }
        });
        return alerts.map(alert => this.mapToResponseDTO(alert));
    }

    /**
     * Find alerts that are under an incident
     * @returns Array of alerts that are under an incident
     */
    async findAlertsUnderIncident(isUnderIncident: boolean): Promise<AlertResponseDTO[]> {
        const alerts = await this.alertRepository.find({
            where: { isUnderIncident: true },
            order: { datestr: "DESC" }
        });
        return alerts.map(alert => this.mapToResponseDTO(alert));
    }

    /**
     * Find a single alert by the composite key of user, datestr and alert_name
     * @param user Username
     * @param datestr Alert date
     * @param alert_name Alert name
     * @return A single alert belonging to the user with the specified date and alert name (or throw NotFoundException)
     */
    async findOne(user: string, datestr: Date, alertName: string): Promise<AlertResponseDTO> {
        const alert = await this.alertRepository.findOne({
            where: {
                user,
                datestr,
                alert_name: alertName
            }
        });
        if (!alert) {
            throw new NotFoundException(`Alert with user: ${user}, datestr: ${datestr} and alert_name: ${alertName} not found!`);
        }
        return this.mapToResponseDTO(alert);
    }

    /**
     * Update an existing alert by the composite key of user, datestr and alert_name
     * @param user Username
     * @param datestr Alert date
     * @param alert_name Alert name
     * @param updateAlertDTO Alert update data
     * @returns The updated alert
     */
    async update(user: string, datestr: Date, alertName: string, updateAlertDTO: UpdateAlertDTO): Promise<AlertResponseDTO> {
        const existingAlert = await this.findOne(user, datestr, alertName);
        try {
            await this.alertRepository.update(existingAlert.ID, updateAlertDTO);
            if (updateAlertDTO.user || updateAlertDTO.datestr || updateAlertDTO.alert_name) {
                const newUser = updateAlertDTO.user || user;
                const newDatestr = updateAlertDTO.datestr || datestr;
                const newAlertName = updateAlertDTO.alert_name || alertName;
                return this.findOne(newUser, newDatestr, newAlertName);
            }
            return this.findOne(user, datestr, alertName);
        } catch (error) {
            if (error.code === "23505") {
                throw new ConflictException(`Duplicate alert. An alert with the same user, date and alert name already exists!`);
            }
            throw error;
        }
    }

    /**
     * Remove an alert by the composite key of user, datestr and alert_name
     * @param user Username
     * @param datestr Alert date
     * @param alert_name Alert name
     * @returns True if successful (False, vice versa)
     */
    async remove(user: string, datestr: Date, alertName: string): Promise<boolean> {
        const alert = await this.findOne(user, datestr, alertName);
        const result = await this.alertRepository.delete(alert.ID);
        return result?.affected ? result.affected > 0 : false;
    }
}