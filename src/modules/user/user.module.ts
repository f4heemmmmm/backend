// backend/src/modules/user/user.module.ts
import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";

import { User } from "./user.entity";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";

/**
 * UserModule for JWT authentication and user management functionality.
 * 
 * Provides comprehensive user authentication capabilities including:
 * - TypeORM entity registration for User data access
 * - JWT module configuration with environment-based secrets
 * - Token security settings including expiration, issuer, and audience
 * - User service for authentication business logic
 * - Service and JWT module exports for cross-module integration
 * - Configurable token lifetime and security parameters
 */
@Module({
    imports: [
        TypeOrmModule.forFeature([User]),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>("JWT_SECRET") || "your-secret-key-change-in-production",
                signOptions: {
                    expiresIn: configService.get<string>("JWT_EXPIRES_IN") || "24h",
                    issuer: "insider-threat-monitoring",
                    audience: "insider-threat-users",
                },
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [UserController],
    providers: [UserService],
    exports: [UserService, JwtModule]
})
export class UserModule {}