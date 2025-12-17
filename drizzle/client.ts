import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";
import { wins } from "./schema";

// 1. Open the raw DB connection
const expo = openDatabaseSync("db.db");

// 2. Export the Drizzle instance
export const db = drizzle(expo, { schema: { wins } });
