// troubleshoot.ts
import { Client } from "@notionhq/client";

const troubleshoot = async () => {
  const raw_token: string =
    "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";
  const raw_database_id: string = "1893ee383180806d86e3ddbc804e44f9";
  const db_id = formatDatabaseId(raw_database_id);

  console.log("=== Starting Notion Integration Troubleshooting ===");

  // 1. Check environment variables
  console.log("\n1. Checking environment variables:");
  console.log("NOTION_TOKEN exists:", !!raw_token);
  console.log("DATABASE_ID exists:", !!db_id);

  // 2. Verify token format
  console.log("\n2. Checking token format:");
  const token = raw_token || "";
  console.log('Token starts with "ntn_":', token.startsWith("ntn_"));

  // 3. Initialize Notion client
  console.log("\n3. Initializing Notion client");
  const notion = new Client({
    auth: raw_token,
  });

  try {
    // 4. Verify API connection
    console.log("\n4. Verifying API connection");
    const user = await notion.users.me();
    console.log("✓ Successfully connected to Notion API");
    console.log("Bot user:", user.name);

    // 5. Try to access database
    console.log("\n5. Attempting to access database");
    const databaseId = db_id || "";
    console.log("Using Database ID:", databaseId);

    const database = await notion.databases.retrieve({
      database_id: databaseId,
    });

    console.log("✓ Successfully accessed database");
    console.log("Database title:", database.title[0]?.plain_text);
  } catch (error) {
    console.error("\n❌ Error occurred:", error);
  }

  console.log("\n=== Troubleshooting Complete ===");
};

function formatDatabaseId(rawId: string): string {
  // Remove any existing hyphens
  const cleanId = rawId.replace(/-/g, "");

  // Insert hyphens in the correct positions
  return [
    cleanId.slice(0, 8),
    cleanId.slice(8, 12),
    cleanId.slice(12, 16),
    cleanId.slice(16, 20),
    cleanId.slice(20),
  ].join("-");
}

troubleshoot();
