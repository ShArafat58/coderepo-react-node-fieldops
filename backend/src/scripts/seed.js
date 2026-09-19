import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { connectDatabase, disconnectDatabase } from "../shared/config/database.js";
import { initConfig } from "../shared/config/index.js";
import { User } from "../features/auth/user.model.js";
import { Technician } from "../features/technicians/technician.model.js";
import { Customer } from "../features/customers/customer.model.js";
import { Property } from "../features/customers/property.model.js";
import { ServiceType } from "../features/service-catalog/service-type.model.js";
import { Job } from "../features/jobs/job.model.js";
import { JobStatusHistory } from "../features/jobs/job-status-history.model.js";
import { SavedView } from "../features/jobs/saved-view.model.js";

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

const serviceTypesSeed = [
	{ name: "General Pest Control", description: "Routine interior and exterior pest treatment.", estimatedDurationMinutes: 45, basePrice: 89 },
	{ name: "Termite Inspection", description: "Full property inspection for termite activity and damage.", estimatedDurationMinutes: 60, basePrice: 129 },
	{ name: "Termite Treatment", description: "Targeted termite treatment following an inspection.", estimatedDurationMinutes: 120, basePrice: 450 },
	{ name: "Rodent Control", description: "Rodent exclusion, trapping, and follow-up service.", estimatedDurationMinutes: 60, basePrice: 149 },
	{ name: "Mosquito Treatment", description: "Yard treatment to reduce mosquito populations.", estimatedDurationMinutes: 30, basePrice: 79 },
];

function daysAgo(days, hour, minute) {
	const date = new Date();
	date.setUTCDate(date.getUTCDate() - days);
	date.setUTCHours(hour - 6, minute, 0, 0);
	return date;
}

async function seed() {
	const config = initConfig();
	await connectDatabase(config.mongodbUri);

	console.log("=".repeat(40));
	console.log("Database Seeding");
	console.log("=".repeat(40));
	console.log("");

	console.log("Clearing existing collections...");
	await Promise.all([
		User.deleteMany({}), Technician.deleteMany({}), Customer.deleteMany({}), Property.deleteMany({}),
		ServiceType.deleteMany({}), Job.deleteMany({}), JobStatusHistory.deleteMany({}), SavedView.deleteMany({}),
	]);

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
	const technicians = await Technician.insertMany(
		technicianUsers.map((user, index) => ({
			userId: user._id,
			skills: index === 0 ? ["General Pest Control", "Termite Treatment"] : index === 1 ? ["General Pest Control"] : ["Termite Treatment", "Rodent Control"],
			workingHours: { daysOfWeek: [1, 2, 3, 4, 5], startTime: "09:00", endTime: "17:00" },
		})),
	);
	console.log(`  Created ${technicianUsers.length} technician profiles`);

	console.log("Seeding customers and properties...");
	const customers = [];
	const propertiesByCustomer = [];
	let propertyCount = 0;
	for (let index = 0; index < customersSeed.length; index += 1) {
		const customer = await Customer.create(customersSeed[index]);
		const properties = await Property.insertMany(propertiesSeed[index].map((property) => ({ ...property, customerId: customer._id })));
		customers.push(customer);
		propertiesByCustomer.push(properties);
		propertyCount += properties.length;
	}
	console.log(`  Created ${customersSeed.length} customers and ${propertyCount} properties`);

	console.log("Seeding service catalog...");
	const serviceTypes = await ServiceType.insertMany(serviceTypesSeed);
	console.log(`  Created ${serviceTypesSeed.length} service types`);

	console.log("Seeding sample jobs...");
	const jobsSeed = [
		{ c: 0, p: 0, s: 0, tech: 0, status: "requested", daysAgo: -2, hour: 9 },
		{ c: 1, p: 0, s: 0, tech: 1, status: "scheduled", daysAgo: -1, hour: 10 },
		{ c: 2, p: 0, s: 2, tech: 0, status: "en_route", daysAgo: 0, hour: 13 },
		{ c: 3, p: 0, s: 4, tech: null, status: "requested", daysAgo: -3, hour: 11 },
		{ c: 4, p: 0, s: 1, tech: 2, status: "in_progress", daysAgo: 0, hour: 9 },
		{ c: 0, p: 0, s: 3, tech: 2, status: "completed", daysAgo: 3, hour: 14 },
		{ c: 1, p: 0, s: 0, tech: 1, status: "invoiced", daysAgo: 7, hour: 10 },
		{ c: 4, p: 1, s: 2, tech: null, status: "cancelled", daysAgo: 5, hour: 9 },
	];
	let jobCount = 0;
	for (const spec of jobsSeed) {
		const serviceType = serviceTypes[spec.s];
		const scheduledStartAt = daysAgo(-spec.daysAgo, spec.hour, 0);
		const scheduledEndAt = new Date(scheduledStartAt.getTime() + serviceType.estimatedDurationMinutes * 60000);
		const job = await Job.create({
			customerId: customers[spec.c]._id,
			propertyId: propertiesByCustomer[spec.c][spec.p]._id,
			serviceTypeId: serviceType._id,
			technicianId: spec.tech !== null ? technicians[spec.tech]._id : null,
			status: spec.status,
			scheduledStartAt,
			scheduledEndAt,
			price: serviceType.basePrice,
			completionNotes: ["completed", "invoiced"].includes(spec.status) ? "Service completed as requested." : "",
			createdBy: admin._id,
		});
		await JobStatusHistory.create({ jobId: job._id, fromStatus: null, toStatus: "requested", changedBy: admin._id, note: "Job created." });
		if (spec.status !== "requested") {
			await JobStatusHistory.create({ jobId: job._id, fromStatus: "requested", toStatus: spec.status, changedBy: admin._id, note: "" });
		}
		jobCount += 1;
	}
	console.log(`  Created ${jobCount} jobs with history`);

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