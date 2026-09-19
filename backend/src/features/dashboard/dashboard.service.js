import { Job } from "../jobs/job.model.js";
import { ServiceType } from "../service-catalog/service-type.model.js";
import { Technician } from "../technicians/technician.model.js";

const REVENUE_STATUSES = ["completed", "invoiced"];

function startOfToday() {
	const now = new Date();
	return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), -6, 0, 0));
}
function endOfToday() {
	const start = startOfToday();
	return new Date(start.getTime() + 24 * 60 * 60000);
}
function startOfWeek() {
	const start = startOfToday();
	const day = start.getUTCDay();
	return new Date(start.getTime() - day * 24 * 60 * 60000);
}

export const dashboardService = {
	async summary() {
		const [statusCounts, todayCount, unscheduledCount, revenueRows, technicians] = await Promise.all([
			Job.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
			Job.countDocuments({ scheduledStartAt: { $gte: startOfToday(), $lt: endOfToday() } }),
			Job.countDocuments({ status: "requested", technicianId: null }),
			Job.aggregate([
				{ $match: { status: { $in: REVENUE_STATUSES } } },
				{ $group: { _id: "$serviceTypeId", revenue: { $sum: "$price" }, count: { $sum: 1 } } },
			]),
			Technician.find().populate("userId", "name active").lean(),
		]);

		const serviceTypes = await ServiceType.find().lean();
		const serviceTypeById = new Map(serviceTypes.map((serviceType) => [String(serviceType._id), serviceType]));
		const revenueByService = revenueRows.map((row) => ({
			name: serviceTypeById.get(String(row._id))?.name || "Unknown",
			revenue: row.revenue || 0,
			count: row.count,
		})).sort((a, b) => b.revenue - a.revenue);

		const weekStart = startOfWeek();
		const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60000);
		const weekJobs = await Job.find({
			technicianId: { $ne: null },
			scheduledStartAt: { $gte: weekStart, $lt: weekEnd },
			status: { $ne: "cancelled" },
		}).lean();

		const utilization = technicians.filter((technician) => technician.userId.active).map((technician) => {
			const technicianJobs = weekJobs.filter((job) => String(job.technicianId) === String(technician._id));
			const bookedMinutes = technicianJobs.reduce((total, job) => {
				if (!job.scheduledStartAt || !job.scheduledEndAt) return total;
				return total + (new Date(job.scheduledEndAt) - new Date(job.scheduledStartAt)) / 60000;
			}, 0);
			const dailyMinutes = (() => {
				const [startHour, startMinute] = technician.workingHours.startTime.split(":").map(Number);
				const [endHour, endMinute] = technician.workingHours.endTime.split(":").map(Number);
				return (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
			})();
			const weeklyCapacity = dailyMinutes * technician.workingHours.daysOfWeek.length;
			const utilizationPercent = weeklyCapacity > 0 ? Math.round((bookedMinutes / weeklyCapacity) * 100) : 0;
			return { name: technician.userId.name, utilizationPercent: Math.min(utilizationPercent, 100) };
		});

		const statusCountMap = Object.fromEntries(statusCounts.map((row) => [row._id, row.count]));
		const totalJobs = statusCounts.reduce((total, row) => total + row.count, 0);

		return {
			totalJobs,
			todayCount,
			unscheduledCount,
			statusCounts: statusCountMap,
			revenueByService,
			utilization,
		};
	},
};
