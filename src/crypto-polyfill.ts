// backend/src/crypto-polyfill.ts
import { webcrypto } from "node:crypto";

/**
 * Crypto polyfill for ensuring crypto module availability across environments.
 * 
 * Provides compatibility layer for:
 * - TypeORM crypto requirements and database operations
 * - Global crypto object availability for modern web APIs
 * - Cross-platform Node.js compatibility for different versions
 * - Development and production environment consistency
 * 
 * This polyfill resolves "crypto is not defined" errors in TypeORM
 * and ensures consistent crypto functionality across all environments.
 */
if (typeof globalThis.crypto === "undefined") {
    // @ts-ignore - TypeScript doesn't recognize this polyfill assignment
    globalThis.crypto = webcrypto;
}

if (typeof global.crypto === "undefined") {
    // @ts-ignore - Required for Node.js compatibility
    global.crypto = webcrypto;
}

console.log("✅ Crypto polyfill applied successfully");