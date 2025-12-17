// import type { Config } from 'drizzle-kit';

// export default {
//   schema: './drizzle/schema.ts',
//   out: './drizzle',
//   dialect: 'sqlite',
//   driver: 'expo',
// } satisfies Config;

import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  driver: "expo", // <--- very important
});
