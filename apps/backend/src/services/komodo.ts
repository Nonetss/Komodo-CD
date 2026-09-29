import { eq } from "drizzle-orm";
import { KomodoClient, Types } from "komodo_client";
import { db } from "@/core/config";
import { komodoTable } from "@/db/models/komodo.table";
import { logger } from "@/lib/logger";

class KomodoService {
	private client: ReturnType<typeof KomodoClient> | null = null;
	private activeCredentials: {
		name: string;
		url: string;
		key: string;
		secret: string;
	} | null = null;

	async initialize() {
		try {
			// Obtener credenciales de la BD
			const credentials = await db.select().from(komodoTable).limit(1);

			if (credentials.length === 0) {
				logger.warn(
					"⚠️ Komodo credentials not configured in database. Deploy features will be unavailable.",
				);
				return;
			}

			const cred = credentials[0];
			this.activeCredentials = {
				name: cred.name || "default",
				url: cred.url || "",
				key: cred.key || "",
				secret: cred.secret || "",
			};

			if (!cred.url || !cred.key || !cred.secret) {
				logger.warn(
					"⚠️ Incomplete Komodo credentials in database. Deploy features will be unavailable.",
				);
				return;
			}

			this.client = KomodoClient(cred.url, {
				type: "api-key",
				params: { key: cred.key, secret: cred.secret },
			});

			logger.info(`✅ Komodo client initialized for: ${cred.name}`);
		} catch (error) {
			logger.error("❌ Failed to initialize Komodo client:", error);
		}
	}

	private ensureClient() {
		if (!this.client) {
			throw new Error("Komodo client not initialized");
		}
		return this.client;
	}

	async buildImage(stackName: string, _imageUrl: string) {
		const client = this.ensureClient();
		logger.info(`🔨 Building image for stack: ${stackName}`);

		try {
			// Execute build action
			const result = await client.execute("DeployStack", {
				stack: stackName,
			});

			logger.info(`✅ Build initiated for stack: ${stackName}`);
			return result;
		} catch (error) {
			logger.error(`❌ Failed to build image for ${stackName}:`, error);
			throw error;
		}
	}

	async pullImage(stackName: string) {
		const client = this.ensureClient();
		logger.info(`📥 Pulling stack: ${stackName}`);

		try {
			const result = await client.execute("PullStack", { stack: stackName });
			logger.info(`✅ Pull completed for stack: ${stackName}`);
			return result;
		} catch (error) {
			logger.error(`❌ Failed to pull stack ${stackName}:`, error);
			throw error;
		}
	}

	async redeploy(stackName: string) {
		const client = this.ensureClient();
		logger.info(`🚀 Redeploying stack: ${stackName}`);

		try {
			const result = await client.execute("DeployStack", {
				stack: stackName,
			});

			logger.info(`✅ Stack redeployed: ${stackName}`);
			return result;
		} catch (error) {
			logger.error(`❌ Failed to redeploy stack ${stackName}:`, error);
			throw error;
		}
	}

	async getStackStatus(stackName: string) {
		const client = this.ensureClient();

		try {
			const stacks = (await client.read(
				"ListStacks",
				{},
			)) as Types.StackListItem[];
			const stack = stacks.find((s) => s.name === stackName);

			if (!stack) {
				throw new Error(`Stack not found: ${stackName}`);
			}

			return stack;
		} catch (error) {
			logger.error(`❌ Failed to get status for ${stackName}:`, error);
			throw error;
		}
	}

	async getActiveCredentials() {
		return this.activeCredentials;
	}

	async updateCredentials(
		name: string,
		url: string,
		key: string,
		secret: string,
	) {
		try {
			// Actualizar en BD
			const existing = await db.select().from(komodoTable).limit(1);

			if (existing.length > 0) {
				await db
					.update(komodoTable)
					.set({ url, key, secret, updatedAt: new Date() })
					.limit(1);
			} else {
				await db.insert(komodoTable).values({ name, url, key, secret });
			}

			// Reinicializar cliente
			await this.initialize();
			logger.info(`✅ Komodo credentials updated for: ${name}`);
		} catch (error) {
			logger.error("❌ Failed to update Komodo credentials:", error);
			throw error;
		}
	}

	async listCredentials() {
		try {
			return await db.select().from(komodoTable);
		} catch (error) {
			logger.error("❌ Failed to list Komodo credentials:", error);
			throw error;
		}
	}

	async listAllStacks() {
		const client = this.ensureClient();
		try {
			const stacks = (await client.read(
				"ListStacks",
				{},
			)) as Types.StackListItem[];
			return stacks;
		} catch (error) {
			logger.error("❌ Failed to list stacks:", error);
			throw error;
		}
	}

	async deleteCredentials(name: string) {
		try {
			await db.delete(komodoTable).where(eq(komodoTable.name, name));
			this.client = null;
			this.activeCredentials = null;
			logger.info(`✅ Komodo credentials deleted for: ${name}`);
		} catch (error) {
			logger.error("❌ Failed to delete Komodo credentials:", error);
			throw error;
		}
	}
}

export const komodoService = new KomodoService();
