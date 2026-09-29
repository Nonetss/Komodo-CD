import { apiKey } from "@better-auth/api-key";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/core/config";
import {
	account,
	apikey,
	session,
	user as userTable,
	verification,
} from "@/db/models/auth-schema";

export const auth = betterAuth({
	trustedOrigins: [process.env.BETTER_AUTH_URL!],
	trustedProxies: ["127.0.0.1", "::1", "172.16.0.0/12", "10.0.0.0/8"],
	database: drizzleAdapter(db, {
		provider: "sqlite",
		schema: {
			user: userTable,
			session: session,
			account: account,
			verification: verification,
			apikey: apikey,
		},
	}),
	emailAndPassword: {
		enabled: true,
	},
	plugins: [apiKey({ rateLimit: { enabled: false } })],
});
