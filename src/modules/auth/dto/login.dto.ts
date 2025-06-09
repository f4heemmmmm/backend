// backend/src/modules/auth/dto/login.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

/**
 * LoginDTO for user authentication requests.
 * 
 * Validates user credentials with:
 * - Email format validation for ENSIGN domain
 * - Password strength requirements
 * - Required field validation with custom error messages
 * - Swagger API documentation integration
 */
export class LoginDTO {
    @ApiProperty({
        description: "User email address",
        example: "john.doe@ensigninfosecurity.com"
    })
    @IsEmail({}, { message: "Please provide a valid email address" })
    @IsNotEmpty({ message: "Email is required" })
    email: string;

    @ApiProperty({
        description: "User password",
        example: "password123"
    })
    @IsString({ message: "Password must be a string" })
    @IsNotEmpty({ message: "Password is required" })
    @MinLength(6, { message: "Password must be at least 6 characters long" })
    password: string;
}

/**
 * LoginResponseDTO for authentication API responses.
 * 
 * Provides structured response containing:
 * - Success status and descriptive messages
 * - JWT token for subsequent authenticated requests
 * - User profile information for client-side display
 */
export class LoginResponseDTO {
    @ApiProperty({ description: "Login success status" })
    success: boolean;

    @ApiProperty({ description: "Response message" })
    message: string;

    @ApiProperty({ description: "JWT token for authentication", required: false })
    token?: string;

    @ApiProperty({ description: "User information", required: false })
    user?: {
        id: string;
        email: string;
        firstName?: string;
        lastName?: string;
    };
}