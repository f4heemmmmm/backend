// backend/src/modules/user/user.service.ts
import { User } from "./user.entity";
import { Repository } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import { LoginDTO } from "../auth/dto/login.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Injectable, UnauthorizedException } from "@nestjs/common";

/**
 * UserService for JWT authentication and user management.
 * 
 * Provides comprehensive authentication functionality including:
 * - JWT token generation and verification with payload standardization
 * - User credential validation with plaintext password comparison
 * - Token lifecycle management including signing and verification
 * - User lookup operations by email and administrative user listing
 * - Secure user authentication flow with proper error handling
 * - User information retrieval for incident status tracking
 * 
 * Note: Test users should be created manually via SQL for better production practices.
 */
@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly jwtService: JwtService,
    ) {}

    /**
     * Validates user credentials and returns user if authentication succeeds.
     */
    async validateUser(loginDTO: LoginDTO): Promise<User | null> {
        const { email, password } = loginDTO;

        const user = await this.userRepository.findOne({
            where: { email, isActive: true }
        });

        if (!user) {
            return null;
        }

        if (user.password === password) {
            return user;
        }

        return null;
    }

    /**
     * Generates JWT token with standardized payload for authenticated users.
     */
    private generateJWTToken(user: User): string {
        const payload = {
            sub: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            iat: Math.floor(Date.now() / 1000),
        };

        return this.jwtService.sign(payload);
    }

    async login(loginDTO: LoginDTO): Promise<{ success: boolean; message: string; user?: any; token?: string }> {
        const user = await this.validateUser(loginDTO);

        if (!user) {
            throw new UnauthorizedException("Invalid email or password");
        }

        const token = this.generateJWTToken(user);

        return {
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
            }
        };
    }

    /**
     * Verifies JWT token and returns associated user data.
     */
    async verifyToken(token: string): Promise<User | null> {
        try {
            const decoded = this.jwtService.verify(token);
            
            const user = await this.userRepository.findOne({
                where: { id: decoded.sub, isActive: true }
            });

            return user;
        } catch (error) {
            console.error("Token verification failed:", error);
            return null;
        }
    }

    /**
     * Finds user by email address for authentication and lookup purposes.
     */
    async findByEmail(email: string): Promise<User | null> {
        return this.userRepository.findOne({
            where: { email, isActive: true }
        });
    }

    /**
     * Finds user by ID for incident status tracking and user information retrieval.
     */
    async findById(id: string): Promise<User | null> {
        return this.userRepository.findOne({
            where: { id, isActive: true },
            select: ["id", "email", "firstName", "lastName", "createdAt"]
        });
    }

    /**
     * Returns all active users with basic information for administrative purposes.
     */
    async findAll(): Promise<User[]> {
        return this.userRepository.find({
            where: { isActive: true },
            select: ["id", "email", "firstName", "lastName", "createdAt"]
        });
    }

    /**
     * Gets user display name for status history tracking.
     */
    async getUserDisplayName(userId: string): Promise<string> {
        const user = await this.findById(userId);
        if (!user) {
            return "Unknown User";
        }
        return `${user.firstName} ${user.lastName}`.trim() || user.email;
    }
}