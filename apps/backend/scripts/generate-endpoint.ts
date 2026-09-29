import { existsSync, mkdirSync } from "node:fs";
import * as path from "node:path";

const version = Bun.env.VERSION_DEV || "0.0.0";
const major = version.split(".")[0];
const apiVersion = `v${major}`;

const httpMethod = (Bun.argv[2] || "get").toLowerCase();
const fullEndpointPath = Bun.argv[3];

if (!fullEndpointPath) {
	console.error("Usage: VERSION_DEV=0.0.1 bun run <method> <path>");
	process.exit(1);
}

const parts = fullEndpointPath.split("/");
const action = parts.pop()!;
const resourcePath = parts.join("/");

const targetDir = path.join(
	process.cwd(),
	"src",
	"api",
	apiVersion,
	resourcePath,
	action,
);

if (existsSync(targetDir)) {
	console.error(`Directory ${targetDir} already exists.`);
	process.exit(1);
}

mkdirSync(targetDir, { recursive: true });

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const ActionName = capitalize(action);

// --- 1. GENERAR ARCHIVOS DEL ENDPOINT (ACTION) ---

const schemaContent = `import { z } from "@hono/zod-openapi";

export const ${ActionName}Schema = z.object({
  success: z.boolean().openapi({ example: true }),
  message: z.string().openapi({ example: "Operation successful" }),
});
`;

const routeContent = `import { createRoute } from "@hono/zod-openapi";
import { ${ActionName}Schema } from "./${action}.schema";

export const ${action}Route = createRoute({
  method: "${httpMethod}",
  path: "/",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ${ActionName}Schema,
        },
      },
      description: "${ActionName} ${action}",
    },
  },
});
`;

const handlerContent = `import { Handler, Context } from "hono";

export const ${action}Handler: Handler = async (c: Context) => {
  return c.json({
    success: true,
    message: "${ActionName} executed successfully",
  }, 200);
};
`;

const indexContent = `import { OpenAPIHono } from "@hono/zod-openapi";
import { ${action}Route } from "./${action}.route";
import { ${action}Handler } from "./${action}.handler";

const router = new OpenAPIHono();

router.openapi(${action}Route, ${action}Handler);

export default router;
`;

await Promise.all([
	Bun.write(path.join(targetDir, `${action}.schema.ts`), schemaContent),
	Bun.write(path.join(targetDir, `${action}.route.ts`), routeContent),
	Bun.write(path.join(targetDir, `${action}.handler.ts`), handlerContent),
	Bun.write(path.join(targetDir, `${action}.index.ts`), indexContent),
]);

// --- 2. GESTIÓN RECURSIVA DE INDEX.TS ---

async function updateOrCreateIndex(
	dirPath: string,
	subImportName: string,
	subImportPath: string,
) {
	const folderName = path.basename(dirPath);
	const routePrefix = folderName === "api" ? "api" : folderName;
	const indexPath = path.join(dirPath, "index.ts");
	let content = "";

	if (existsSync(indexPath)) {
		content = await Bun.file(indexPath).text();
		if (content.includes(subImportPath)) return;

		const importLine = `import ${subImportName} from "${subImportPath}";\n`;
		content = importLine + content;

		const routeLine = `app.route("/${routePrefix}", ${subImportName});\n`;
		if (content.includes("const app = new OpenAPIHono();")) {
			content = content.replace(
				"const app = new OpenAPIHono();",
				`const app = new OpenAPIHono();\n${routeLine}`,
			);
		} else {
			content = content.replace(
				"export default",
				`${routeLine}\nexport default`,
			);
		}
	} else {
		content = `import { OpenAPIHono } from "@hono/zod-openapi";
import ${subImportName} from "${subImportPath}";

const app = new OpenAPIHono();

app.route("/${routePrefix}", ${subImportName});

export default app;
`;
	}
	await Bun.write(indexPath, content);
}

const immediateParentDir = path.join(
	process.cwd(),
	"src",
	"api",
	apiVersion,
	resourcePath,
);
await updateOrCreateIndex(
	immediateParentDir,
	`${action}Route`,
	`@/api/${apiVersion}/${resourcePath}/${action}/${action}.index`,
);

let currentPath = immediateParentDir;
const apiRootDir = path.join(process.cwd(), "src", "api");

while (true) {
	const parentDir = path.dirname(currentPath);
	const currentFolder = path.basename(currentPath);

	const relPath = path.relative(path.join(process.cwd(), "src"), currentPath);
	// Cambiado para evitar problemas de escape de regex
	const importAlias = ("@/" + relPath + "/index").replace("/index", "");

	let importName = "";
	if (currentFolder === apiVersion) {
		importName = apiVersion;
	} else {
		importName = `${currentFolder}Route`;
	}

	await updateOrCreateIndex(parentDir, importName, importAlias);

	if (parentDir === apiRootDir) break;
	currentPath = parentDir;
}

console.log(
	`Successfully created and registered ${httpMethod.toUpperCase()} endpoint: ${apiVersion}/${fullEndpointPath}`,
);
