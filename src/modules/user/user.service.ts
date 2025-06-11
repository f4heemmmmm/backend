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
            where: { email, is_active: true }
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
            first_name: user.first_name,
            last_name: user.last_name,
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
                first_name: user.first_name,
                last_name: user.last_name
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
                where: { id: decoded.sub, is_active: true }
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
            where: { email, is_active: true }
        });
    }

    /**
     * Finds user by ID for incident status tracking and user information retrieval.
     */
    async findByID(id: string): Promise<User | null> {
        return this.userRepository.findOne({
            where: { id, is_active: true },
            select: ["id", "email", "first_name", "last_name", "created_at"]
        });
    }

    /**
     * Returns all active users with basic information for administrative purposes.
     */
    async findAll(): Promise<User[]> {
        return this.userRepository.find({
            where: { is_active: true },
            select: ["id", "email", "first_name", "last_name", "created_at"]
        });
    }

    /**
     * Gets user display name for status history tracking.
     */
    async getUserDisplayName(userID: string): Promise<string> {
        const user = await this.findByID(userID);
        if (!user) {
            return "Unknown User";
        }
        return `${user.first_name} ${user.last_name}`.trim() || user.email;
    }
}