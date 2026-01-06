import { pages, posts, products } from "@blackliving/db";
import { desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { MeiliSearch } from "meilisearch";
import { z } from "zod";
import { transformDocument, transformDocuments } from "../utils/searchSync";

type Env = {
  Bindings: {
    DB: D1Database;
    CACHE: KVNamespace;
    R2: R2Bucket;
    NODE_ENV: string;
  };
  Variables: {
    db: any;
    cache: any;
    storage: any;
    user: any;
    session: any;
  };
};

const app = new Hono<Env>();

// Search configuration schema
const searchConfigSchema = z.object({
  host: z.string().url("Invalid MeiliSearch host URL"),
  masterKey: z.string().min(1, "Master key is required"),
  indexName: z
    .string()
    .min(1, "Index name is required")
    .default("blackliving_content"),
});

// Search configuration type
type SearchConfig = {
  host: string;
  masterKey: string;
  searchKey?: string;
  indexName: string;
};

// MeiliSearch client cache
let meiliClient: MeiliSearch | null = null;
let currentConfig: SearchConfig | null = null;

// Initialize MeiliSearch client
function getMeiliClient(config?: SearchConfig): MeiliSearch | null {
  const activeConfig = config || currentConfig;
  if (!activeConfig) {
    console.warn("MeiliSearch not configured");
    return null;
  }

  // Return cached client if config hasn't changed
  if (
    meiliClient &&
    currentConfig &&
    currentConfig.host === activeConfig.host &&
    currentConfig.masterKey === activeConfig.masterKey
  ) {
    return meiliClient;
  }

  try {
    meiliClient = new MeiliSearch({
      host: activeConfig.host,
      apiKey: activeConfig.masterKey,
    });
    currentConfig = activeConfig;
    return meiliClient;
  } catch (error) {
    console.error("Failed to initialize MeiliSearch client:", error);
    return null;
  }
}

// Generate search key from master key
async function generateSearchKey(
  client: MeiliSearch,
  indexName: string
): Promise<string | null> {
  try {
    // Create or update search key with read-only access to our index
    const keyResponse = await client.createKey({
      description: "Public search key for Black Living frontend",
      actions: ["search"],
      indexes: [indexName],
      expiresAt: null, // No expiration
    });

    return keyResponse.key;
  } catch (error) {
    console.error("Failed to generate search key:", error);
    return null;
  }
}

// Save search configuration
async function saveSearchConfig(
  c: any,
  config: SearchConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    const cache = c.get("cache");
    const configKey = "search:config";

    // Test connection
    const client = getMeiliClient(config);
    if (!client) {
      return {
        success: false,
        error: "Failed to initialize MeiliSearch client",
      };
    }

    // Verify connection by getting server stats
    await client.health();

    // Generate search key
    const searchKey = await generateSearchKey(client, config.indexName);
    if (!searchKey) {
      return { success: false, error: "Failed to generate search key" };
    }

    // Save configuration with search key
    const fullConfig = { ...config, searchKey };
    await cache.set(configKey, fullConfig, 86_400 * 30); // 30 days

    // Invalidate public key cache to ensure frontend gets fresh config
    await cache.delete("search:public-key");

    // Update global config
    currentConfig = fullConfig;

    return { success: true };
  } catch (error) {
    console.error("Failed to save search configuration:", error);
    return { success: false, error: "Failed to connect to MeiliSearch server" };
  }
}

// Get search configuration
async function getSearchConfig(c: any): Promise<SearchConfig | null> {
  try {
    const cache = c.get("cache");
    const configKey = "search:config";

    const cached = await cache.get(configKey);
    if (cached) {
      currentConfig = cached; // Update global config
      return cached;
    }

    return null;
  } catch (error) {
    console.error("Failed to get search configuration:", error);
    return null;
  }
}

// Reindex all content
async function reindexAll(
  c: any
): Promise<{ indexed: number; errors: string[] }> {
  const result: { indexed: number; errors: string[] } = {
    indexed: 0,
    errors: [],
  };

  try {
    const db = c.get("db");

    // Ensure config is loaded
    if (!currentConfig) {
      await getSearchConfig(c);
    }

    const client = getMeiliClient();

    if (!(client && currentConfig)) {
      result.errors.push("MeiliSearch not configured");
      return result;
    }

    const index = client.index(currentConfig.indexName);

    // Clear existing index
    try {
      await index.deleteAllDocuments();
    } catch (error) {
      console.warn("Failed to clear index (may be empty):", error);
    }

    // Configure index settings
    try {
      console.log("Updating index settings...");
      await index.updateSettings({
        searchableAttributes: [
          "title",
          "description",
          "content",
          "tags",
          "category",
          "slug",
          "author",
        ],
        filterableAttributes: [
          "type",
          "category",
          "tags",
          "inStock",
          "published",
          "price",
          "id",
        ],
        sortableAttributes: ["updatedAt", "price", "publishedAt"],
        typoTolerance: {
          enabled: true,
          minWordSizeForTypos: {
            oneTypo: 5,
            twoTypos: 9,
          },
        },
      });
      console.log("Index settings updated.");
    } catch (error) {
      console.error("Failed to update index settings:", error);
      result.errors.push(`Failed to update index settings: ${error}`);
    }

    // Index products
    try {
      const allProducts = await db
        .select()
        .from(products)
        .where(eq(products.inStock, true))
        .orderBy(desc(products.updatedAt));

      const productDocuments = transformDocuments("product", allProducts);

      if (productDocuments.length > 0) {
        await index.addDocuments(productDocuments);
        result.indexed += productDocuments.length;
      }
    } catch (error) {
      result.errors.push(`Failed to index products: ${error}`);
    }

    // Index posts
    try {
      const allPosts = await db
        .select()
        .from(posts)
        .where(eq(posts.status, "published"))
        .orderBy(desc(posts.updatedAt));

      const postDocuments = transformDocuments("post", allPosts);

      if (postDocuments.length > 0) {
        await index.addDocuments(postDocuments);
        result.indexed += postDocuments.length;
      }
    } catch (error) {
      result.errors.push(`Failed to index posts: ${error}`);
    }

    // Index pages
    try {
      const allPages = await db
        .select()
        .from(pages)
        .where(eq(pages.status, "published"))
        .orderBy(desc(pages.updatedAt));

      const pageDocuments = transformDocuments("page", allPages);

      if (pageDocuments.length > 0) {
        await index.addDocuments(pageDocuments);
        result.indexed += pageDocuments.length;
      }
    } catch (error) {
      result.errors.push(`Failed to index pages: ${error}`);
    }
  } catch (error) {
    result.errors.push(`Reindex failed: ${error}`);
  }

  return result;
}

// Index single document
async function indexDocument(
  c: any,
  type: string,
  data: any
): Promise<boolean> {
  try {
    // Ensure config is loaded
    if (!currentConfig) {
      await getSearchConfig(c);
    }

    const client = getMeiliClient();
    if (!(client && currentConfig)) {
      console.warn("MeiliSearch not configured, skipping index");
      return false;
    }

    const index = client.index(currentConfig.indexName);

    // Transform document based on type
    const document = transformDocument(type, data);

    if (document) {
      await index.addDocuments([document]);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Failed to index ${type} document:`, error);
    return false;
  }
}

// Delete document from index
async function deleteDocument(
  c: any,
  type: string,
  id: string
): Promise<boolean> {
  try {
    // Ensure config is loaded
    if (!currentConfig) {
      await getSearchConfig(c);
    }

    const client = getMeiliClient();
    if (!(client && currentConfig)) {
      console.warn("MeiliSearch not configured, skipping delete");
      return false;
    }

    const index = client.index(currentConfig.indexName);
    const documentId = `${type}_${id}`;

    await index.deleteDocument(documentId);
    return true;
  } catch (error) {
    console.error(`Failed to delete ${type} document:`, error);
    return false;
  }
}

// SearchModule class for dependency injection
export class SearchModule {
  private context: any;

  constructor(context: any) {
    this.context = context;
  }

  async indexDocument(document: any): Promise<boolean> {
    return indexDocument(this.context, document.type, document);
  }

  async deleteDocument(type: string, id: string): Promise<boolean> {
    return deleteDocument(this.context, type, id);
  }

  async saveConfig(
    config: SearchConfig
  ): Promise<{ success: boolean; error?: string }> {
    return saveSearchConfig(this.context, config);
  }

  async getConfig(): Promise<SearchConfig | null> {
    return getSearchConfig(this.context);
  }

  async reindexAll(): Promise<{ indexed: number; errors: string[] }> {
    return reindexAll(this.context);
  }

  async healthCheck(): Promise<{ status: string }> {
    const client = getMeiliClient();
    if (!client) {
      return { status: "unavailable" };
    }
    try {
      await client.health();
      return { status: "available" };
    } catch (error) {
      return { status: "unavailable" };
    }
  }

  async updateDocument(document: any): Promise<boolean> {
    return indexDocument(this.context, document.type, document);
  }
}

// Export functions for use in other modules
export {
  saveSearchConfig,
  getSearchConfig,
  reindexAll,
  indexDocument,
  deleteDocument,
  getMeiliClient,
};

export default app;
