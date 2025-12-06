import dotenv from "dotenv";

// Load .env.local first (local dev), then fall back to .env if present.
dotenv.config({ path: ".env.local" });
dotenv.config();
