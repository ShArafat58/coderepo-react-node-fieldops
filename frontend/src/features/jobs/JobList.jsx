import { useCallback, useEffect, useState } from "react";
import { customerApi } from "../customers/customer.api.js";
import { serviceTypeApi } from "../service-catalog/service-type.api.js";
import { technicianApi } from "../technicians/technician.api.js";
import { jobApi } from "./job.api.js";
import { savedViewApi } from "./saved-view.api.js";
import { useEscapeKey } from "../../shared/hooks/useEscapeKey.js";

const STATUS_LABELS = { requested: "Requested", scheduled: "Scheduled", en_route: "En route", in_progress: "In progress", completed: "Completed", invoiced: "Invoiced", cancelled: "Cancelled" };
const NEXT_STATUS = { requested: ["scheduled", "cancelled"], scheduled: ["en_route", "cancelled"], en_route: ["in_progress", "cancelled"], in_progress: ["completed", "cancelled"], completed: ["invoiced"], invoiced: [], cancelled: [] };
const EMPTY_FILTERS = { status: "", technicianId: "", customerId: "", dateFrom: "", dateTo: "" };

function toLocalInputValue(date) {
	if (!date) return "";
	const value = new Date(date);
	const offset = value.getTimezoneOffset();
	return new Date(value.getTime() - offset * 60000).toISOString().slice(0, 16);
}

function JobForm({ onCancel, onSave }) {
	const [customers, setCustomers] = useState([]);
	const [serviceTypes, setServiceTypes] = useState([]);
	const [customerId, setCustomerId] = useState("");
	const [properties, setProperties] = useState([]);
	const [propertiesLoading, setPropertiesLoading] = useState(false);
	const [propertyId, setPropertyId] = useState("");
	const [serviceTypeId, setServiceTypeId] = useState("");
	const [scheduledStartAt, setScheduledStartAt] = useState("");
	const [scheduledEndAt, setScheduledEndAt] = useState("");
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	useEscapeKey(onCancel);

	useEffect(() => {
		customerApi.list().then(setCustomers).catch(() => {});
		serviceTypeApi.list().then(setServiceTypes).catch(() => {});
	}, []);

	useEffect(() => {
		if (!customerId) {
			setProperties([]);
			return;
		}
		let active = true;
		setPropertiesLoading(true);
		customerApi.get(customerId).then((customer) => {
			if (active) setProperties(customer.properties || []);
		}).catch(() => {
			if (active) setProperties([]);
		}).finally(() => {
			if (active) setPropertiesLoading(false);
		});
		return () => { active = false; };
	}, [customerId]);

	const selectedService = serviceTypes.find((serviceType) => serviceType._id === serviceTypeId);

	useEffect(() => {
		if (scheduledStartAt && selectedService && !scheduledEndAt) {
			const start = new Date(scheduledStartAt);
			const end = new Date(start.getTime() + selectedService.estimatedDurationMinutes * 60000);
			setScheduledEndAt(toLocalInputValue(end));
		}
	}, [scheduledStartAt, selectedService]);

	const handleSubmit = async (event) => {
		event.preventDefault();
		try {
			setSaving(true);
			setError("");
			await onSave({
				customerId,
				propertyId,
				serviceTypeId,
				scheduledStartAt: scheduledStartAt ? new Date(scheduledStartAt).toISOString() : null,
				scheduledEndAt: scheduledEndAt ? new Date(scheduledEndAt).toISOString() : null,
			});
		} catch (requestError) {
			setError(requestError.message);
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="modal-overlay" onClick={onCancel} role="presentation">
			<form className="modal-card" onClick={(event) => event.stopPropagation()} onSubmit={handleSubmit}>
				<h2>New job</h2>
				{error && <div className="login-error" role="alert">{error}</div>}
				<label className="login-field">
					<span>Customer</span>
					<select onChange={(event) => { setCustomerId(event.target.value); setPropertyId(""); }} required value={customerId}>
						<option value="">Select a customer…</option>
						{customers.map((customer) => <option key={customer._id} value={customer._id}>{customer.name}</option>)}
					</select>
				</label>
				<label className="login-field">
					<span>Property</span>
					<select disabled={!customerId || propertiesLoading} onChange={(event) => setPropertyId(event.target.value)} required value={propertyId}>
						<option value="">Select a property…</option>
						{properties.map((property) => <option key={property._id} value={property._id}>{property.address}</option>)}
					</select>
					{propertiesLoading && <span className="hint-text">Loading properties…</span>}
					{customerId && !propertiesLoading && properties.length === 0 && <span className="hint-text">This customer has no properties on file.</span>}
				</label>
				<label className="login-field">
					<span>Service type</span>
					<select onChange={(event) => setServiceTypeId(event.target.value)} required value={serviceTypeId}>
						<option value="">Select a service…</option>
						{serviceTypes.filter((serviceType) => serviceType.active).map((serviceType) => <option key={serviceType._id} value={serviceType._id}>{serviceType.name} — ${serviceType.basePrice.toFixed(2)}</option>)}
					</select>
				</label>
				<label className="login-field">
					<span>Scheduled start (optional)</span>
					<input onChange={(event) => setScheduledStartAt(event.target.value)} type="datetime-local" value={scheduledStartAt} />
				</label>
				<label className="login-field">
					<span>Scheduled end (optional)</span>
					<input onChange={(event) => setScheduledEndAt(event.target.value)} type="datetime-local" value={scheduledEndAt} />
				</label>
				<div className="modal-actions">
					<button onClick={onCancel} type="button">Cancel</button>
					<button className="primary-button" disabled={saving} type="submit">{saving ? "Creating…" : "Create job"}</button>
				</div>
			</form>
		</div>
	);
}

function AssignModal({ job, onCancel, onConfirm }) {
	const [technicians, setTechnicians] = useState([]);
	const [technicianId, setTechnicianId] = useState("");
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	useEscapeKey(onCancel);

	useEffect(() => { technicianApi.list().then(setTechnicians).catch(() => {}); }, []);

	const selectedTechnician = technicians.find((technician) => technician._id === technicianId);
	const skillMismatch = selectedTechnician && job.serviceTypeId?.name && !selectedTechnician.skills.includes(job.serviceTypeId.name);
	const missingSchedule = !job.scheduledStartAt || !job.scheduledEndAt;

	const handleSubmit = async (event) => {
		event.preventDefault();
		try {
			setSaving(true);
			setError("");
			await onConfirm(technicianId);
		} catch (requestError) {
			setError(requestError.message);
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="modal-overlay" onClick={onCancel} role="presentation">
			<form className="modal-card" onClick={(event) => event.stopPropagation()} onSubmit={handleSubmit}>
				<h2>Assign technician</h2>
				{error && <div className="login-error" role="alert">{error}</div>}
				{missingSchedule && <div className="login-error" role="alert">Set a scheduled start and end time on this job before assigning a technician.</div>}
				<label className="login-field">
					<span>Technician</span>
					<select disabled={missingSchedule} onChange={(event) => setTechnicianId(event.target.value)} required value={technicianId}>
						<option value="">Select a technician…</option>
						{technicians.filter((technician) => technician.userId.active).map((technician) => <option key={technician._id} value={technician._id}>{technician.userId.name}</option>)}
					</select>
				</label>
				{skillMismatch && <div className="warning-banner">Note: {selectedTechnician.userId.name} doesn't list "{job.serviceTypeId.name}" as a skill. You can still assign them.</div>}
				<div className="modal-actions">
					<button onClick={onCancel} type="button">Cancel</button>
					<button className="primary-button" disabled={saving || missingSchedule} type="submit">{saving ? "Assigning…" : "Assign"}</button>
				</div>
			</form>
		</div>
	);
}

function CompletionModal({ onCancel, onConfirm }) {
	const [note, setNote] = useState("");
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	useEscapeKey(onCancel);

	const handleSubmit = async (event) => {
		event.preventDefault();
		try {
			setSaving(true);
			setError("");
			await onConfirm(note.trim());
		} catch (requestError) {
			setError(requestError.message);
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="modal-overlay" onClick={onCancel} role="presentation">
			<form className="modal-card" onClick={(event) => event.stopPropagation()} onSubmit={handleSubmit}>
				<h2>Complete job</h2>
				{error && <div className="login-error" role="alert">{error}</div>}
				<label className="login-field">
					<span>Completion notes</span>
					<textarea onChange={(event) => setNote(event.target.value)} required rows={4} value={note} />
				</label>
				<div className="modal-actions">
					<button onClick={onCancel} type="button">Cancel</button>
					<button className="primary-button" disabled={saving} type="submit">{saving ? "Saving…" : "Mark completed"}</button>
				</div>
			</form>
		</div>
	);
}

function HistoryModal({ jobId, onCancel }) {
	const [job, setJob] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEscapeKey(onCancel);

	useEffect(() => {
		let active = true;
		jobApi.get(jobId).then((result) => {
			if (active) setJob(result);
		}).catch((requestError) => {
			if (active) setError(requestError.message);
		}).finally(() => {
			if (active) setLoading(false);
		});
		return () => { active = false; };
	}, [jobId]);

	return (
		<div className="modal-overlay" onClick={onCancel} role="presentation">
			<div className="modal-card history-modal" onClick={(event) => event.stopPropagation()}>
				<h2>Job history</h2>
				{loading && <p className="detail-loading">Loading history…</p>}
				{error && <div className="login-error" role="alert">{error}</div>}
				{job && (
					<ul className="history-timeline">
						{job.history.map((entry) => (
							<li className="history-entry" key={entry._id}>
								<div className="history-dot" />
								<div className="history-content">
									<div className="history-line">
										<strong>{entry.fromStatus ? `${STATUS_LABELS[entry.fromStatus]} → ${STATUS_LABELS[entry.toStatus]}` : `Job ${STATUS_LABELS[entry.toStatus]}`}</strong>
										<span className="history-time">{new Date(entry.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
									</div>
									<p className="history-meta">by {entry.changedBy?.name || "System"}</p>
									{entry.note && <p className="history-note">{entry.note}</p>}
								</div>
							</li>
						))}
					</ul>
				)}
				<div className="modal-actions">
					<button onClick={onCancel} type="button">Close</button>
				</div>
			</div>
		</div>
	);
}

function SaveViewModal({ onCancel, onConfirm }) {
	const [name, setName] = useState("");
	const [saving, setSaving] = useState(false);

	useEscapeKey(onCancel);

	const handleSubmit = async (event) => {
		event.preventDefault();
		setSaving(true);
		await onConfirm(name.trim());
		setSaving(false);
	};

	return (
		<div className="modal-overlay" onClick={onCancel} role="presentation">
			<form className="modal-card" onClick={(event) => event.stopPropagation()} onSubmit={handleSubmit}>
				<h2>Save current filters</h2>
				<label className="login-field">
					<span>View name</span>
					<input onChange={(event) => setName(event.target.value)} placeholder="e.g. My jobs today" required type="text" value={name} />
				</label>
				<div className="modal-actions">
					<button onClick={onCancel} type="button">Cancel</button>
					<button className="primary-button" disabled={saving} type="submit">{saving ? "Saving…" : "Save view"}</button>
				</div>
			</form>
		</div>
	);
}

function formatSchedule(job) {
	if (!job.scheduledStartAt) return "Not scheduled";
	const start = new Date(job.scheduledStartAt);
	const end = job.scheduledEndAt ? new Date(job.scheduledEndAt) : null;
	const dateLabel = start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
	const startLabel = start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
	const endLabel = end ? end.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) : "";
	return `${dateLabel} · ${startLabel}${endLabel ? `–${endLabel}` : ""}`;
}

export function JobList({ canCreate }) {
	const [jobs, setJobs] = useState([]);
	const [nextCursor, setNextCursor] = useState(null);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [error, setError] = useState("");
	const [formOpen, setFormOpen] = useState(false);
	const [assigningJob, setAssigningJob] = useState(null);
	const [completingJob, setCompletingJob] = useState(null);
	const [historyJobId, setHistoryJobId] = useState(null);
	const [filters, setFilters] = useState(EMPTY_FILTERS);
	const [technicians, setTechnicians] = useState([]);
	const [savedViews, setSavedViews] = useState([]);
	const [saveViewOpen, setSaveViewOpen] = useState(false);

	useEffect(() => {
		technicianApi.list().then(setTechnicians).catch(() => {});
		savedViewApi.list().then(setSavedViews).catch(() => {});
	}, []);

	const load = useCallback(async (activeFilters) => {
		try {
			setLoading(true);
			setError("");
			const result = await jobApi.list(activeFilters);
			setJobs(result.items);
			setNextCursor(result.nextCursor);
		} catch (requestError) {
			setError(requestError.message);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => { load(filters); }, [filters, load]);

	const loadMore = async () => {
		try {
			setLoadingMore(true);
			const result = await jobApi.list({ ...filters, cursor: nextCursor });
			setJobs((items) => [...items, ...result.items]);
			setNextCursor(result.nextCursor);
		} finally {
			setLoadingMore(false);
		}
	};

	const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));
	const clearFilters = () => setFilters(EMPTY_FILTERS);
	const applySavedView = (view) => setFilters({ ...EMPTY_FILTERS, ...view.filters });
	const saveCurrentView = async (name) => {
		const created = await savedViewApi.create({ name, filters });
		setSavedViews((views) => [...views, created]);
		setSaveViewOpen(false);
	};
	const removeSavedView = async (view) => {
		await savedViewApi.remove(view._id);
		setSavedViews((views) => views.filter((item) => item._id !== view._id));
	};

	const createJob = async (payload) => {
		await jobApi.create(payload);
		setFormOpen(false);
		await load(filters);
	};

	const confirmAssign = async (technicianId) => {
		await jobApi.assign(assigningJob._id, technicianId);
		setAssigningJob(null);
		await load(filters);
	};

	const changeStatus = async (job, status) => {
		if (status === "completed") {
			setCompletingJob(job);
			return;
		}
		await jobApi.updateStatus(job._id, status);
		await load(filters);
	};

	const confirmCompletion = async (note) => {
		await jobApi.updateStatus(completingJob._id, "completed", note);
		setCompletingJob(null);
		await load(filters);
	};

	const hasActiveFilters = Object.values(filters).some(Boolean);

	return (
		<div className="customers-view">
			<div className="customers-toolbar">
				<h2 className="section-title">Jobs</h2>
				{canCreate && <button className="primary-button" onClick={() => setFormOpen(true)} type="button">+ New job</button>}
			</div>
			{savedViews.length > 0 && (
				<div className="saved-views-row">
					{savedViews.map((view) => (
						<div className="saved-view-chip" key={view._id}>
							<button onClick={() => applySavedView(view)} type="button">{view.name}</button>
							<button aria-label={`Remove ${view.name}`} className="saved-view-remove" onClick={() => removeSavedView(view)} type="button">✕</button>
						</div>
					))}
				</div>
			)}
			<div className="job-filters">
				<select onChange={(event) => updateFilter("status", event.target.value)} value={filters.status}>
					<option value="">All statuses</option>
					{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
				</select>
				<select onChange={(event) => updateFilter("technicianId", event.target.value)} value={filters.technicianId}>
					<option value="">All technicians</option>
					{technicians.map((technician) => <option key={technician._id} value={technician._id}>{technician.userId.name}</option>)}
				</select>
				<input onChange={(event) => updateFilter("dateFrom", event.target.value)} type="date" value={filters.dateFrom} />
				<input onChange={(event) => updateFilter("dateTo", event.target.value)} type="date" value={filters.dateTo} />
				{hasActiveFilters && <button onClick={clearFilters} type="button">Clear</button>}
				{hasActiveFilters && <button onClick={() => setSaveViewOpen(true)} type="button">Save view</button>}
			</div>
			{error && <div className="service-error" role="alert"><span>{error}</span><button onClick={() => load(filters)} type="button">Retry</button></div>}
			{loading ? (
				<div className="customers-loading" aria-label="Loading jobs" role="status">
					{Array.from({ length: 4 }, (_, index) => <div className="customers-loading-row" key={index} />)}
				</div>
			) : jobs.length === 0 ? (
				<div className="empty-state">
					<h2>No jobs found</h2>
					<p>{hasActiveFilters ? "Try adjusting or clearing your filters." : canCreate ? "Create your first job to get started." : "No jobs have been assigned to you yet."}</p>
				</div>
			) : (
				<>
					<ul className="job-cards">
						{jobs.map((job) => (
							<li className="job-card" key={job._id}>
								<div className="job-card-main">
									<div className="job-card-title">
										<strong>{job.serviceTypeId?.name || "Unknown service"}</strong>
										<span className={`status-pill status-${job.status}`}>{STATUS_LABELS[job.status]}</span>
									</div>
									<p className="job-card-detail">{job.customerId?.name} · {job.propertyId?.address}</p>
									<p className="job-card-detail">{formatSchedule(job)}</p>
									<p className="job-card-detail">Technician: {job.technicianId?.userId?.name || "Unassigned"}</p>
									{job.completionNotes && <p className="job-card-notes">"{job.completionNotes}"</p>}
								</div>
								<div className="job-card-actions">
									<button onClick={() => setHistoryJobId(job._id)} type="button">View history</button>
									{canCreate && !job.technicianId && ["requested", "scheduled"].includes(job.status) && (
										<button onClick={() => setAssigningJob(job)} type="button">Assign technician</button>
									)}
									{NEXT_STATUS[job.status]?.map((nextStatus) => (
										<button className={nextStatus === "cancelled" ? "danger-link" : ""} key={nextStatus} onClick={() => changeStatus(job, nextStatus)} type="button">
											{STATUS_LABELS[nextStatus]}
										</button>
									))}
								</div>
							</li>
						))}
					</ul>
					{nextCursor && (
						<div className="load-more-row">
							<button disabled={loadingMore} onClick={loadMore} type="button">{loadingMore ? "Loading…" : "Load more"}</button>
						</div>
					)}
				</>
			)}
			{formOpen && <JobForm onCancel={() => setFormOpen(false)} onSave={createJob} />}
			{assigningJob && <AssignModal job={assigningJob} onCancel={() => setAssigningJob(null)} onConfirm={confirmAssign} />}
			{completingJob && <CompletionModal onCancel={() => setCompletingJob(null)} onConfirm={confirmCompletion} />}
			{historyJobId && <HistoryModal jobId={historyJobId} onCancel={() => setHistoryJobId(null)} />}
			{saveViewOpen && <SaveViewModal onCancel={() => setSaveViewOpen(false)} onConfirm={saveCurrentView} />}
		</div>
	);
}
