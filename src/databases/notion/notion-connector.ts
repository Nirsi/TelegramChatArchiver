import { Client } from "@notionhq/client";
import type {
  CreatePageResponse,
  GetDatabaseResponse,
} from "@notionhq/client/build/src/api-endpoints";
import type { DbMessage } from "../../types/db-message";
import { Structures } from "./structures";

/**
 * NotionConnector is used to connect to the Notion database, where it`s shape is specified for this exact bot
 * Shape of database cannot be changed due to constrains of the data collected.
 * @requires process.env.NOTION_TOKEN - Notion API token
 * @requires process.env.NOTION_DATABASE_ID - Notion Database ID
 */
export class NotionConnector {
  private notion: Client;
  private databaseId: string;
  private expectedProperties: Record<string, string> = {
    groupName: "title",
    messageId: "number",
    isBot: "checkbox",
    firstName: "rich_text",
    lastName: "rich_text",
    username: "rich_text",
    date: "date",
    text: "rich_text",
  };

  constructor() {
    if (!process.env.NOTION_TOKEN) {
      throw new Error("NOTION_TOKEN environment variable not set");
    }
    if (!process.env.NOTION_DATABASE_ID) {
      throw new Error("NOTION_DATABASE_ID environment variable not set");
    }

    this.notion = new Client({
      auth: process.env.NOTION_TOKEN,
    });
    this.databaseId = this.formatDatabaseId(process.env.NOTION_DATABASE_ID);
    console.log(
      `Notion client initialized with id ${process.env.NOTION_TOKEN} and databaseId is set to ${this.databaseId}`,
    );

    // Prepare/verify the database structure when the connector is created
    this.PrepareDatabase().catch((err) => {
      console.warn("Database preparation warning:", err?.message ?? err);
    });
  }

  /**
   * Retrieve information about a database
   * @returns A promise that resolves with the database information
   * @throws Error if the database retrieval fails
   */
  public async getDatabase(): Promise<GetDatabaseResponse> {
    try {
      const response = await this.notion.databases.retrieve({
        database_id: this.databaseId,
      });
      return response;
    } catch (error) {
      console.error("Error getting database:", error);
      throw error;
    }
  }

  /**
   * Build database to be by the specifications.
   */
  public async buildDatabase(): Promise<any> {}

  /**
   * Verify the structure of the notion database to ensure it matches
   * the expected format for the bot. Each property is checked by name
   * and type
   * @throws Error if the database structure has any issues
   */
  public async verifyDatabaseStructure() {
    const database = await this.getDatabase();
    console.log("Verifying database structure...");

    const issues: string[] = [];
    const databaseProperties = database.properties;

    for (const [propName, expectedType] of Object.entries(
      this.expectedProperties,
    )) {
      const actualProperty = databaseProperties[propName];

      if (!actualProperty) {
        if (expectedType === "title") {
          const hasSomeTitle = Object.values(databaseProperties).some(
            (p: any) => (p as any).type === "title",
          );
          if (hasSomeTitle) {
            console.warn(
              `Expected title property "${propName}" not found, but a title property exists under a different name. Proceeding.`,
            );
            continue;
          }
        }
        issues.push(
          `Missing property: "${propName}" (should be type "${expectedType}")`,
        );
      } else if (actualProperty.type !== expectedType) {
        issues.push(
          `Wrong type for "${propName}": expected "${expectedType}", got "${actualProperty.type}"`,
        );
      }
    }

    const unexpectedProperties = Object.keys(databaseProperties).filter(
      (prop) =>
        !this.expectedProperties.hasOwnProperty(prop) &&
        (databaseProperties as any)[prop].type !== "title",
    );
    if (unexpectedProperties.length > 0) {
      issues.push(
        `Unexpected properties found: ${unexpectedProperties.join(", ")}`,
      );
    }

    if (issues.length > 0) {
      console.error("Database structure verification failed:");
      issues.forEach((issue) => console.error(`- ${issue}`));
      throw new Error(
        `Database structure is invalid. Found ${issues.length} issue(s). Check console for details.`,
      );
    }

    console.log("Database structure verified successfully.");
  }

  /**
   * Query a database
   * @param databaseId The ID of the database to query
   */
  public async queryDatabase() {
    try {
      const response = await this.notion.databases.query({
        database_id: this.databaseId,
      });
      return response;
    } catch (error) {
      console.error("Error querying database:", error);
      throw error;
    }
  }
  
  /**
   * Prepares a notion database to be used by the bot.
   * Database must be created first and then this function
   * will ensure it has the correct structure.
   */
  public async PrepareDatabase() {
    try {
      const database = await this.getDatabase();
      const dbProps: Record<string, any> = database.properties as any;

      // Helper to build a Notion property schema from a simple type string
      const makeSchema = (type: string) => {
        switch (type) {
          case "title":
            return { title: {} };
          case "number":
            return { number: {} };
          case "checkbox":
            return { checkbox: {} };
          case "rich_text":
            return { rich_text: {} };
          case "date":
            return { date: {} };
          default:
            throw new Error(`Unsupported property type "${type}"`);
        }
      };

      const updates: Record<string, any> = {};

      // Special handling for the unique `title` property: Notion only allows one title property.
      // If the expected `title`-type property is missing but another title exists under a different name,
      // we cannot auto-rename it safely here; we will warn the user to rename it manually.
      const expectedTitleName = Object.entries(this.expectedProperties).find(
        ([, t]) => t === "title",
      )?.[0];

      if (expectedTitleName) {
        const existingTitleEntry = Object.entries(dbProps).find(
          ([, v]: [string, any]) => v.type === "title",
        );
        const hasExpectedTitle = !!dbProps[expectedTitleName];

        if (!hasExpectedTitle) {
          if (!existingTitleEntry) {
            // No title in DB at all -> add the expected one
            updates[expectedTitleName] = makeSchema("title");
          } else if (existingTitleEntry[0] !== expectedTitleName) {
            console.warn(
              `A title property exists with the name "${existingTitleEntry[0]}", but "${expectedTitleName}" is expected. ` +
                "Please rename the existing title property in Notion to match the expected name.",
            );
          }
        }
      }

      // Ensure all other properties exist with correct types
      for (const [name, type] of Object.entries(this.expectedProperties)) {
        if (type === "title") continue; // handled above

        const prop = dbProps[name] as any;
        if (!prop) {
          updates[name] = makeSchema(type);
        } else if (prop.type !== type) {
          console.warn(
            `Property "${name}" has type "${prop.type}" but expected "${type}". Attempting to update.`,
          );
          updates[name] = makeSchema(type);
        }
      }

      // Apply updates if needed
      if (Object.keys(updates).length > 0) {
        console.info(
          `Updating Notion database properties: ${Object.keys(updates).join(", ")}`,
        );
        await this.notion.databases.update({
          database_id: this.databaseId,
          properties: updates as any,
        } as any);
      }

      // Final verification
      await this.verifyDatabaseStructure();
    } catch (error) {
      console.error("Error preparing database:", error);
      throw error;
    }
  }

  /**
   * Create a new page in a database specific for DbMessage type
   * @param {DbMessage} dbMessage The message to create a page for
   * @returns {Promise<CreatePageResponse>} A promise that resolves with the created page
   * @throws Error if the page creation fails
   */
  public async createDatabasePageFromMessageDb(
    dbMessage: DbMessage,
  ): Promise<CreatePageResponse> {
    try {
      const db = await this.getDatabase();
      const titlePropName =
        Object.entries(db.properties).find(([, v]: [string, any]) => (v as any).type === "title")?.[0] || "groupName";
      const props: any = Structures.MessageDbToProperties(dbMessage);
      if (props.title && titlePropName !== "title") {
        props[titlePropName] = props.title;
        delete props.title;
      }
      const response = await this.notion.pages.create({
        parent: {
          database_id: this.databaseId,
        },
        properties: props,
      });
      return response;
    } catch (error) {
      console.error("Error creating database page:", error);
      throw error;
    }
  }

  /**
   * Converts a Notion API key to the format expected by the API
   * @param {string} apiKey Notion API key
   * @returns {string} Formatted Notion API key
   */
  private formatDatabaseId(apiKey: string): string {
    // Remove any existing hyphens and spaces
    const cleanId = apiKey.replace(/-/g, "").replace(/ /g, "");

    // If the ID is already 32 characters, format it with hyphens
    if (cleanId.length === 32) {
      return [
        cleanId.slice(0, 8),
        cleanId.slice(8, 12),
        cleanId.slice(12, 16),
        cleanId.slice(16, 20),
        cleanId.slice(20),
      ].join("-");
    }

    return apiKey;
  }
}
