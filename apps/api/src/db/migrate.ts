import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString =
  process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/windows_explorer";

const migrationClient = postgres(connectionString, { max: 1 });

async function main() {
  await migrate(drizzle(migrationClient), { migrationsFolder: "./drizzle" });
  console.log("Migrations applied.");
  await migrationClient.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
