import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const drizzleDir = path.join(__dirname, "../drizzle");
const outputFile = path.join(__dirname, "../src/generated/migrations.ts");
const allowEmpty = process.argv.includes("--allow-empty");

function writeEmptyMigrationsFile() {
  fs.writeFileSync(
    outputFile,
    `import type { Migration } from "../run-migrations.js";\n\nexport const migrations: Migration[] = [];\n`,
  );
}

function getMigrationFolders() {
  if (!fs.existsSync(drizzleDir)) {
    return [];
  }

  return fs
    .readdirSync(drizzleDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({
      tag: entry.name,
      sqlPath: path.join(drizzleDir, entry.name, "migration.sql"),
    }))
    .filter((entry) => fs.existsSync(entry.sqlPath))
    .sort((a, b) => a.tag.localeCompare(b.tag));
}

const migrations = getMigrationFolders();

if (migrations.length === 0) {
  writeEmptyMigrationsFile();

  if (allowEmpty) {
    console.warn("No migrations found. Generated empty migrations array.");
    process.exit(0);
  }

  console.error("No Drizzle migrations found. Run `npm run db:generate` first.");
  process.exit(1);
}

let output = `// AUTO-GENERATED FILE - DO NOT EDIT\n`;
output += `import type { Migration } from "../run-migrations.js";\n\n`;
output += `export const migrations: Migration[] = [\n`;

for (const migration of migrations) {
  const sql = fs.readFileSync(migration.sqlPath, "utf-8");

  output += `  {\n`;
  output += `    tag: ${JSON.stringify(migration.tag)},\n`;
  output += `    sql: ${JSON.stringify(sql)}\n`;
  output += `  },\n`;
}

output += `];\n`;

fs.writeFileSync(outputFile, output);
console.log(`Bundled ${migrations.length} Drizzle migrations into pure JS.`);
