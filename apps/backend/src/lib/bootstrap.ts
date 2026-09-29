// Script de inicialización del backend

import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/libsql/migrator";
import { auth } from "@/core/auth";
import { client, db } from "@/core/config";
import { user } from "@/db/models/auth-schema";
import { komodoService } from "@/services/komodo";

/**
 * Crea el usuario admin si no existe
 */
async function ensureAdminUser() {
	const adminEmail = process.env.SEED_ADMIN_EMAIL;

	if (!adminEmail) {
		console.log("⚠️  SEED_ADMIN_EMAIL no definido, omitiendo creación de admin");
		return;
	}

	try {
		const existingAdmin = await db
			.select()
			.from(user)
			.where(eq(user.email, adminEmail))
			.limit(1);

		if (existingAdmin.length > 0) {
			console.log("✅ Usuario admin ya existe");
			return;
		}

		const { user: newUser } = await auth.api.signUpEmail({
			body: {
				groups: ["admin"],
				email: process.env.SEED_ADMIN_EMAIL!,
				name: process.env.SEED_ADMIN_NAME!,
				password: process.env.SEED_ADMIN_PASSWORD!,
			},
		});

		console.log("✅ Usuario admin creado:", newUser?.email);
	} catch (error) {
		console.error("❌ Error creando usuario admin:", error);
	}
}

/**
 * Aplica las migraciones de la base de datos
 */
async function runMigrations() {
	try {
		console.log("📦 Aplicando migraciones...");
		await migrate(db, { migrationsFolder: "./drizzle" });
		console.log("✅ Migraciones aplicadas exitosamente");
	} catch (error) {
		console.error("❌ Error aplicando migraciones:", error);
		throw error;
	}
}

/**
 * Función principal de bootstrap que se ejecuta al iniciar el backend
 */
export async function bootstrap() {
	console.log("🚀 Iniciando bootstrap...");

	await runMigrations();
	await ensureAdminUser();
	await komodoService.initialize();

	console.log("✅ Bootstrap completado");
}
