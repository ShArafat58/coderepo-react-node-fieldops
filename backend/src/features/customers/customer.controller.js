import { z } from "zod";
import { customerService } from "./customer.service.js";
import { propertyService } from "./property.service.js";

const customerFields = {
	name: z.string().trim().min(1).max(120),
	phone: z.string().trim().min(1).max(30),
	email: z.union([z.email().max(254), z.literal("")]),
	notes: z.string().max(1000),
};
const createCustomerSchema = z.object({ ...customerFields, email: customerFields.email.default(""), notes: customerFields.notes.default("") });
const updateCustomerSchema = z.object(customerFields).partial().refine((value) => Object.keys(value).length > 0, "Provide at least one field to update.");
const propertyFields = {
	address: z.string().trim().min(1).max(250),
	propertyType: z.enum(["residential", "commercial"]),
	notes: z.string().max(1000),
};
const createPropertySchema = z.object({ ...propertyFields, notes: propertyFields.notes.default("") });

export async function listCustomers(request, response, next) {
	try { response.json({ data: await customerService.list() }); } catch (error) { next(error); }
}
export async function getCustomer(request, response, next) {
	try { response.json({ data: await customerService.getById(request.params.customerId) }); } catch (error) { next(error); }
}
export async function createCustomer(request, response, next) {
	try { response.status(201).json({ data: await customerService.create(createCustomerSchema.parse(request.body)) }); } catch (error) { next(error); }
}
export async function updateCustomer(request, response, next) {
	try { response.json({ data: await customerService.update(request.params.customerId, updateCustomerSchema.parse(request.body)) }); } catch (error) { next(error); }
}
export async function deleteCustomer(request, response, next) {
	try { await customerService.remove(request.params.customerId); response.status(204).send(); } catch (error) { next(error); }
}
export async function createProperty(request, response, next) {
	try { response.status(201).json({ data: await propertyService.create(request.params.customerId, createPropertySchema.parse(request.body)) }); } catch (error) { next(error); }
}
