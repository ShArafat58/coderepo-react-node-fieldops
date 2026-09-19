import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { connectDatabase, disconnectDatabase } from "../shared/config/database.js";
import { initConfig } from "../shared/config/index.js";
import { User } from "../features/auth/user.model.js";
import { Technician } from "../features/technicians/technician.model.js";
import { Customer } from "../features/customers/customer.model.js";
import { Property } from "../features/customers/property.model.js";

dotenv.config({ quiet: true });

const DEMO_PASSWORD = "password123";

const customersSeed = [
	{ name: "Dana Whitfield", phone: "555-0101", email: "dana.whitfield@example.com", notes: "Prefers morning appointments." },
	{ name: "Marcus Webb", phone: "555-0102", email: "marcus.webb@example.com", notes: "" },
	{ name: "Priya Chandra", phone: "555-0103", email: "priya.chandra@example.com", notes: "Has a dog on the property." },
	{ name: "Oliver Grant", phone: "555-0104", email: "", notes: "" },
	{ name: "Sofia Reyes", phone: "555-0105", email: "sofia.reyes@example.com", notes: "Commercial account, invoice to office." },
];

const propertiesSeed = [
	[{ address: "482 Birchwood Lane, Springfield", propertyType: "residential", notes: "Side gate code 4521." }],
	[{ address: "17 Commerce Park Drive, Springfield", propertyType: "commercial", notes: "" }],
	[
		{ address: "930 Maple Ridge Court, Springfield", propertyType: "residential", notes: "" },
		{ address: "12 Lakeview Cottage Rd, Springfield", propertyType: "residential", notes: "Vacation rental." },
	],
	[{ address: "56 Ashgrove Street, Springfield", propertyType: "residential", notes: "" }],
	[
		{ address: "200 Industrial Pkwy Suite 4, Springfield", propertyType: "commercial", notes: "Front desk has a spare key." },
		{ address: "204 Industrial Pkwy Suite 6, Springfield", propertyType: "commercial", notes: "" },
	],
];

async function seed() {
	const config = initConfig();
	await connectDatabase(config.mongodbUri);

	console.log("=".repeat(40));
	console.log("Database Seeding");
	console.log("=".repeat(40));
	console.log("");

	console.log("Clearing existing collections...");
	await Promise.all([User.deleteMany({}), Technician.deleteMany({}), Customer.deleteMany({}), Property.deleteMany({})]);

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

	console.log("Seeding customers and properties...");
	let propertyCount = 0;
	for (let index = 0; index < customersSeed.length; index += 1) {
		const customer = await Customer.create(customersSeed[index]);
		const properties = propertiesSeed[index].map((property) => ({ ...property, customerId: customer._id }));
		await Property.insertMany(properties);
		propertyCount += properties.length;
	}
	console.log(`  Created ${customersSeed.length} customers and ${propertyCount} properties`);

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