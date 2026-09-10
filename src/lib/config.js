/**
 * Central runtime configuration.
 *
 * API_URL points at the Spring Boot backend. It is read from the Vite env
 * variable VITE_API_URL (set per-environment in .env / .env.production or
 * in the hosting provider's dashboard) and falls back to localhost for
 * local development.
 */
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
