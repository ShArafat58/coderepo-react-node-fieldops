import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { connectDatabase, disconnectDatabase } from "../shared/config/database.js";
import { initConfig } from "../shared/config/index.js";
import { User } from "../features/auth/user.model.js";
import { Technician } from "../features/technicians/technician.model.js";

dotenv.config({ quiet: true });

const DEMO_PASSWORD = "password123";

async function seed() {
	const config = initConfig();
	await connectDatabase(config.mongodbUri);

	console.log("=".repeat(40));
	console.log("Database Seeding");
	console.log("=".repeat(40));
	console.log("");

	console.log("Clearing existing collections...");
	await Promise.all([User.deleteMany({}), Technician.deleteMany({})]);

	console.log("Seeding users...");
	const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
	const admin = await User.create({ name: "Alex Morgan", email: "admin@fieldops.com", passwordHash, role: "admin" });
	const technicianUsers = await User.insertMany([
		{ name: "Jordan Smith", email: "jordan.smith@fieldops.com", passwordHash, role: "technician" },
		{ name: "Taylor Johnson", email: "taylor.johnson@fieldops.com", passwordHash, role: "technician" },
		{ name: "Riley Parker", email: "riley.parker@fieldops.com", passwordHash, role: "technician" },
	]);
	console.log(`  Created ${1 + technicianUsers.length} users`);

	console.log("Seeding technician profiles...");
	await Technician.insertMany(
		technicianUsers.map((user, index) => ({
			userId: user._id,
			skills: index === 0 ? ["General Pest Control", "Termite Treatment"] : index === 1 ? ["General Pest Control"] : ["Termite Treatment", "Rodent Control"],
			workingHours: { daysOfWeek: [1, 2, 3, 4, 5], startTime: "09:00", endTime: "17:00" },
		})),
	);
	console.log(`  Created ${technicianUsers.length} technician profiles`);

	console.log("");
	console.log("=".repeat(40));
	console.log("Seeding completed successfully!");
	console.log("=".repeat(40));
	console.log("");
	console.log("Demo accounts:");
	console.log(`  Admin: ${admin.email} | Password: ${DEMO_PASSWORD}`);
	for (const user of technicianUsers) console.log(`  Technician: ${user.email} | Password: ${DEMO_PASSWORD}`);
	console.log("");
	console.log("=".repeat(40));

	await disconnectDatabase();
}

seed().catch((error) => {
	console.error(error);
	process.exit(1);
});