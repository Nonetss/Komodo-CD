import { spawnSync } from "node:child_process";

const pathArg = Bun.argv[2];

if (!pathArg) {
	console.error("Usage: VERSION_DEV=0.0.1 bun run crud <path>");
	process.exit(1);
}

const methods = ["get", "post", "patch", "delete"];

console.log(`🚀 Generating CRUD for: ${pathArg}...`);

for (const method of methods) {
	const fullPath = `${pathArg}/${method}`;

	const result = spawnSync(
		"bun",
		["run", "scripts/generate-endpoint.ts", method, fullPath],
		{
			stdio: "inherit",
			env: process.env,
		},
	);

	if (result.status !== 0) {
		console.error(`❌ Error generating ${method} for ${fullPath}`);
	}
}

console.log(`\n✅ CRUD generation complete for ${pathArg}!`);
