// backend/src/modules/user/user.controller.ts
import { Controller, Post, Body, Get, HttpCode, HttpStatus, Res, Req, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiCookieAuth } from "@nestjs/swagger";
import { Response, Request } from "express";
import { UserService } from "./user.service";
import { JWTAuthGuard } from "../auth/guards/jwt-auth.guard";
import { LoginDTO, LoginResponseDTO } from "../auth/dto/login.dto";

/**
 * UserController for JWT authentication and user management with secure cookie support.
 * Provides comprehensive authentication functionality including secure login with HTTP-only JWT cookies,
 * user logout with proper cookie cleanup, current user information retrieval, token verification,
 * administrative user listing with authentication protection, and health check endpoint.
 */
@ApiTags("Authentication")
@Controller("auth")
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Post("login")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "User login with JWT", description: "Authenticate user with email and password, sets HTTP-only cookie with JWT token" })
    @ApiResponse({ status: 200, description: "Login successful", type: LoginResponseDTO, example: { success: true, message: "Login successful", user: { id: "123e4567-e89b-12d3-a456-426614174000", email: "admin@ensigninfosecurity.com", firstName: "Admin", lastName: "User" } } })
    @ApiBadRequestResponse({ description: "Invalid input data", example: { statusCode: 400, message: ["Email is required", "Password must be at least 6 characters long"], error: "Bad Request" } })
    @ApiUnauthorizedResponse({ description: "Invalid credentials", example: { statusCode: 401, message: "Invalid email or password", error: "Unauthorized" } })
    async login(
        @Body() loginDTO: LoginDTO, 
        @Res({ passthrough: true }) response: Response
    ): Promise<Omit<LoginResponseDTO, "token">> {
        const result = await this.userService.login(loginDTO);

        response.cookie("token", result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 24 * 60 * 60 * 1000,
            path: "/",
        });

        return {
            success: result.success,
            message: result.message,
            user: result.user
        };
    }

    @Post("logout")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "User logout", description: "Clear authentication cookie and log out user" })
    @ApiResponse({ status: 200, description: "Logout successful", example: { success: true, message: "Logout successful" } })
    async logout(@Res({ passthrough: true }) response: Response): Promise<{ success: boolean; message: string }> {
        response.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
        });

        return {
            success: true,
            message: "Logout successful"
        };
    }

    @Get("me")
    @UseGuards(JWTAuthGuard)
    @ApiCookieAuth()
    @ApiOperation({ summary: "Get current user", description: "Get current user information from JWT token in cookie" })
    @ApiResponse({ status: 200, description: "Current user information", example: { id: "123e4567-e89b-12d3-a456-426614174000", email: "admin@ensigninfosecurity.com", firstName: "Admin", lastName: "User" } })
    @ApiUnauthorizedResponse({ description: "Invalid or missing token", example: { statusCode: 401, message: "Unauthorized", error: "Unauthorized" } })
    async getCurrentUser(@Req() request: Request): Promise<any> {
        const user = (request as any).user;
        
        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName
        };
    }

    @Get("verify")
    @UseGuards(JWTAuthGuard)
    @ApiCookieAuth()
    @ApiOperation({ summary: "Verify JWT token", description: "Verify if the current JWT token is valid" })
    @ApiResponse({ status: 200, description: "Token is valid", example: { valid: true, message: "Token is valid" } })
    async verifyToken(): Promise<{ valid: boolean; message: string }> {
        return {
            valid: true,
            message: "Token is valid"
        };
    }

    @Get("users")
    @UseGuards(JWTAuthGuard)
    @ApiCookieAuth()
    @ApiOperation({ summary: "Get all users", description: "Retrieve list of all active users (for admin purposes)" })
    @ApiResponse({ status: 200, description: "List of users retrieved successfully", example: [{ id: "123e4567-e89b-12d3-a456-426614174000", email: "admin@ensigninfosecurity.com", firstName: "Admin", lastName: "User", createdAt: "2024-01-01T00:00:00.000Z" }] })
    async getUsers() {
        return this.userService.findAll();
    }

    @Get("health")
    @ApiOperation({ summary: "Authentication service health check", description: "Check if the authentication service is running properly" })
    @ApiResponse({ status: 200, description: "Authentication service is healthy", example: { status: "OK", service: "Authentication", timestamp: "2024-01-01T00:00:00.000Z" } })
    async healthCheck() {
        return {
            status: "OK",
            service: "Authentication",
            timestamp: new Date().toISOString()
        };
    }
}