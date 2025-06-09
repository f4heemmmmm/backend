// backend/src/modules/user/user.service.ts
import { User } from "./user.entity";
import { Repository } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import { LoginDTO } from "../auth/dto/login.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Injectable, UnauthorizedException, OnModuleInit } from "@nestjs/common";

/**
 * UserService for JWT authentication and user management with automatic setup.
 * 
 * Provides comprehensive authentication functionality including:
 * - Automatic default user creation for development/testing environments
 * - JWT token generation and verification with payload standardization
 * - User credential validation with plaintext password comparison
 * - Token lifecycle management including signing and verification
 * - User lookup operations by email and administrative user listing
 * - Secure user authentication flow with proper error handling
 */
@Injectable()
export class UserService implements OnModuleInit {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly jwtService: JwtService,
    ) {}

    /**
     * Initializes default user when module starts for development convenience.
     */
    async onModuleInit() {
        await this.createDefaultUserIfNotExists();
    }

    /**
     * Creates default test user for development/testing environments.
     */
    private async createDefaultUserIfNotExists(): Promise<void> {
        try {
            const existingUser = await this.userRepository.findOne({
                where: { email: "admin@ensigninfosecurity.com" }
            });

            if (!existingUser) {
                const defaultUser = this.userRepository.create({
                    email: "admin@ensigninfosecurity.com",
                    password: "password123",
                    firstName: "Admin",
                    lastName: "User",
                    isActive: true
                });

                await this.userRepository.save(defaultUser);
                console.log("✅ Default user created: admin@ensigninfosecurity.com / password123");
            } else {
                console.log("✅ Default user already exists");
            }
        } catch (error) {
            console.error("❌ Error creating default user:", error);
        }
    }

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

    async findByEmail(email: string): Promise<User | null> {
        return this.userRepository.findOne({
            where: { email, isActive: true }
        });
    }

    async findAll(): Promise<User[]> {
        return this.userRepository.find({
            where: { isActive: true },
            select: ["id", "email", "firstName", "lastName", "createdAt"]
        });
    }
}