import { z } from "zod";
import { propertyService } from "./property.service.js";

const updatePropertySchema = z.object({
	address: z.string().trim().min(1).max(250),
	propertyType: z.enum(["residential", "commercial"]),
	notes: z.string().max(1000),
}).partial().refine((value) => Object.keys(value).length > 0, "Provide at least one field to update.");

export async function updateProperty(request, response, next) {
	try { response.json({ data: await propertyService.update(request.params.propertyId, updatePropertySchema.parse(request.body)) }); } catch (error) { next(error); }
}
export async function deleteProperty(request, response, next) {
	try { await propertyService.remove(request.params.propertyId); response.status(204).send(); } catch (error) { next(error); }
}
