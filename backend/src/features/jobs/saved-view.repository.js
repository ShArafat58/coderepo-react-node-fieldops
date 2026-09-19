import { SavedView } from "./saved-view.model.js";

export const savedViewRepository = {
	findByUserId: (userId) => SavedView.find({ userId }).sort({ createdAt: 1 }).lean(),
	create: (input) => SavedView.create(input),
	remove: (id, userId) => SavedView.findOneAndDelete({ _id: id, userId }).lean(),
};
