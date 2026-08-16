/**
 * Delete ALL storefront users from the database.
 *
 * Removes:
 *   - better-auth collections: user, session, account, verification
 *   - the app's Customer collection (customers)
 *
 * Order history, products, categories, settings, media, contacts and the
 * admincredentials record are NOT touched.
 *
 * Usage:
 *   node scripts/remove-users.mjs
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { MongoClient } from "mongodb";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnv(path) {
  const vars = {};
  try {
    const content = readFileSync(path, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      vars[key] = value;
    }
  } catch {
    // Ignore — fall through to process.env.
  }
  return vars;
}

const env = { ...process.env, ...loadEnv(resolve(root, ".env")) };

const uri = env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI not found in .env");
  process.exit(1);
}

const dbName = env.MONGODB_DB_NAME || undefined;

const AUTH_COLLECTIONS = ["user", "session", "account", "verification"];
const CUSTOMER_COLLECTION = "customers";

async function main() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    console.log(`Connected to database: ${db.databaseName}\n`);

    for (const collection of AUTH_COLLECTIONS) {
      const result = await db.collection(collection).deleteMany({});
      console.log(`- deleted ${result.deletedCount} from "auth" collection "${collection}"`);
    }

    const customers = await db.collection(CUSTOMER_COLLECTION).deleteMany({});
    console.log(`- deleted ${customers.deletedCount} from collection "${CUSTOMER_COLLECTION}"`);

    console.log("\nDone. All storefront users have been removed.");
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error("Failed to remove users:", error);
  process.exit(1);
});