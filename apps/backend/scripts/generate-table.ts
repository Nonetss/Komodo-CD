import { existsSync } from "node:fs";
import * as path from "node:path";

const tableName = Bun.argv[2];

if (!tableName) {
	console.error("Usage: bun run scripts/generate-table.ts <table_name>");
	process.exit(1);
}

const camelCase = (s: string) =>
	s.replace(/([-_][a-z])/gi, ($1) =>
		$1.toUpperCase().replace("-", "").replace("_", ""),
	);
const tableVariableName = `${camelCase(tableName)}Table`;
const fileName = `${tableName.replace(/_/g, "-")}.table.ts`;
const targetPath = path.join(process.cwd(), "src", "db", "models", fileName);

if (existsSync(targetPath)) {
	console.error(`Table file ${fileName} already exists.`);
	process.exit(1);
}

// 1. Crear el archivo de la tabla
const tableContent = `import { pgTable, integer, varchar } from "drizzle-orm/pg-core";

export const ${tableVariableName} = pgTable("${tableName}", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
});
`;

await Bun.write(targetPath, tableContent);
console.log(`✅ Table file created: src/db/models/${fileName}`);

// 2. Actualizar src/db/index.ts
const dbIndexPath = path.join(process.cwd(), "src", "db", "index.ts");
if (existsSync(dbIndexPath)) {
	let indexContent = await Bun.file(dbIndexPath).text();

	// Añadir importación
	const importLine = `import { ${tableVariableName} } from "@/db/models/${fileName.replace(".ts", "")}";\n`;
	if (!indexContent.includes(importLine)) {
		// Encontrar la última importación o meterlo arriba
		indexContent = importLine + indexContent;
	}

	// Añadir al export
	if (indexContent.includes("export {")) {
		if (!indexContent.includes(tableVariableName)) {
			indexContent = indexContent.replace(
				"export {",
				`export { ${tableVariableName},`,
			);
		}
	} else {
		indexContent += `\nexport { ${tableVariableName} };\n`;
	}

	await Bun.write(dbIndexPath, indexContent);
	console.log(`✅ Table ${tableVariableName} exported from src/db/index.ts`);
}
