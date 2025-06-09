// backend/src/modules/strategies/jwt.strategy.ts
import { Request } from "express";
import { ConfigService } from "@nestjs/config";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { UserService } from "src/modules/user/user.service";
import { Injectable, UnauthorizedException } from "@nestjs/common";

/**
 * JWTStrategy for Passport authentication using cookie-based JWT tokens.
 * 
 * Provides secure authentication by:
 * - Extracting JWT tokens from HTTP-only cookies instead of headers
 * - Validating token signatures using configured secret key
 * - Verifying user existence and active status in database
 * - Returning sanitized user object for request context
 * - Handling token expiration and validation errors
 */
@Injectable()
export class JWTStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly configService: ConfigService,
        private readonly userService: UserService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (request: Request) => {
                    return request?.cookies?.token;
                },
            ]),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>("JWT_SECRET") || "your-secret-key-change-in-production",
            passReqToCallback: false,
        });
    }

    /**
     * Validates JWT payload and returns authenticated user object.
     * Called automatically by Passport after JWT signature verification.
     */
    async validate(payload: any) {
        const user = await this.userService.findByEmail(payload.email);
        if (!user || !user.isActive) {
            throw new UnauthorizedException("User not found or inactive");
        }
        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
        };
    }
}