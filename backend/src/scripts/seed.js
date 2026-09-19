import dotenv from "dotenv";
import { connectDatabase, disconnectDatabase } from "../shared/config/database.js";
import { initConfig } from "../shared/config/index.js";

dotenv.config({ quiet: true });

async function seed() {
    const config = initConfig();
    await connectDatabase(config.mongodbUri);

    console.log("=".repeat(40));
    console.log("Database Seeding");
    console.log("=".repeat(40));
    console.log("");
    console.log("No models defined yet. Seed logic will be added once domain models are built.");
    console.log("");
    console.log("=".repeat(40));
    console.log("FieldOps setup complete");
    console.log("=".repeat(40));

    await disconnectDatabase();
}

seed().catch((error) => {
    console.error(error);
    process.exit(1);
});