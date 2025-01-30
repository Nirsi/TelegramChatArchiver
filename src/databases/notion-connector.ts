import { Client } from "@notionhq/client";
import type { GetDatabaseResponse } from "@notionhq/client/build/src/api-endpoints";
import type { DbMessage } from "../types/db-message";

/**
 * NotionConnector is used to connect to the Notion database, where it`s shape is specified for this exact bot
 * Shape of database cannot be changed due to constrains of the data collected.
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

    // Verify the database structure when the connector is created
    this.verifyDatabaseStructure();
  }

  /**
   * Retrieve information about a database
   * @returns A promise that resolves with the database information
   * @throws Error if the database retrieval fails
   */
  async getDatabase(): Promise<GetDatabaseResponse> {
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
   * Verify the structure of the notion database to ensure it matches
   * the expected format for the bot. Each property is checked by name
   * and type
   * @throws Error if the database structure has any issues
   */
  async verifyDatabaseStructure() {
    const database = await this.getDatabase();
    console.log("Verifying database structure...");

    const issues: string[] = [];
    const databaseProperties = database.properties;

    for (const [propName, expectedType] of Object.entries(
      this.expectedProperties,
    )) {
      const actualProperty = databaseProperties[propName];

      if (!actualProperty) {
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
      (prop) => !this.expectedProperties.hasOwnProperty(prop),
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
  async queryDatabase() {
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
   * Create a new page in a database specific for DbMessage type
   * @param {DbMessage} dbMessage The message to create a page for
   * @returns {Promise<any>} A promise that resolves with the created page
   * @throws Error if the page creation fails
   */
  async createDatabasePageFromMessageDb(dbMessage: DbMessage): Promise<any> {
    try {
      const response = await this.notion.pages.create({
        parent: {
          database_id: this.databaseId,
        },
        properties: {
          title: {
            title: [
              {
                text: {
                  content: dbMessage.chat.groupName,
                },
              },
            ],
          },
          messageId: {
            number: dbMessage.messageId,
          },
          isBot: {
            checkbox: dbMessage.from.isBot,
          },
          firstName: {
            rich_text: [
              {
                text: {
                  content: dbMessage.from.firstName || "",
                },
              },
            ],
          },
          lastName: {
            rich_text: [
              {
                text: {
                  content: dbMessage.from.lastName || "",
                },
              },
            ],
          },
          username: {
            rich_text: [
              {
                text: {
                  content: dbMessage.from.username,
                },
              },
            ],
          },
          date: {
            date: {
              start: dbMessage.date.toISOString(),
            },
          },
          text: {
            rich_text: [
              {
                text: {
                  content: dbMessage.text,
                },
              },
            ],
          },
        },
      });
      return response;
    } catch (error) {
      console.error("Error creating database page:", error);
      throw error;
    }
  }

  // Helper function to format database ID
  private formatDatabaseId(id: string): string {
    // Remove any existing hyphens and spaces
    const cleanId = id.replace(/-/g, "").replace(/ /g, "");

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

    return id; // Return original if not matching expected format
  }
}
