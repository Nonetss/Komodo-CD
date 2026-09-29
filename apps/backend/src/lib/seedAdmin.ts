import { auth } from "@/core/auth";

export const seedAdmin = async () => {
	const { user, token } = await auth.api.signUpEmail({
		body: {
			email: process.env.SEED_ADMIN_EMAIL!,
			name: process.env.SEED_ADMIN_NAME!,
			password: process.env.SEED_ADMIN_PASSWORD!,
		},
	});

	console.log({ user, token });
};

seedAdmin();
