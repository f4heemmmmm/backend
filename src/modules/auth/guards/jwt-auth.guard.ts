// backend/src/modules/auth/guards/jwt-auth.guard.ts
import { Request } from "express";
import { JwtService } from "@nestjs/jwt";
import { UserService } from "src/modules/user/user.service";
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common";

/**
 * JWTAuthGuard for protecting routes with JWT token validation.
 * 
 * Provides secure authentication by:
 * - Extracting JWT tokens from HTTP-only cookies
 * - Validating token signatures and expiration
 * - Verifying user existence and active status
 * - Attaching authenticated user to request context
 * - Throwing appropriate exceptions for invalid tokens
 */
@Injectable()
export class JWTAuthGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService,
        private readonly userService: UserService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        
        const token = this.extractTokenFromCookie(request);
        
        if (!token) {
            throw new UnauthorizedException("No authentication token found");
        }

        try {
            const payload = this.jwtService.verify(token);
            
            const user = await this.userService.findByEmail(payload.email);
            
            if (!user || !user.isActive) {
                throw new UnauthorizedException("User not found or inactive");
            }

            (request as any).user = user;
            
            return true;
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            throw new UnauthorizedException("Invalid authentication token");
        }
    }

    /**
     * Extracts JWT token from HTTP-only cookie for secure authentication.
     */
    private extractTokenFromCookie(request: Request): string | undefined {
        return request.cookies?.token;
    }
}