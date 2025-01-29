// notion-connector.ts
import { Client } from "@notionhq/client";
import type { GetDatabaseResponse } from "@notionhq/client/build/src/api-endpoints";

export class NotionConnector {
  private notion: Client;
  private databaseId: string;

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
   * Create a new page in a database
   * @param title The title of the new page
   * @param text The text content to be stored
   * @returns A promise that resolves with the created page
   * @throws Error if the page creation fails
   */
  async createDatabasePage(title: string, text: string) {
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
                  content: title,
                },
              },
            ],
          },
          Text: {
            rich_text: [
              {
                text: {
                  content: text,
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
