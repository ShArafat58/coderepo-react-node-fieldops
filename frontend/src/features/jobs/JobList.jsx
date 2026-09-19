import { useCallback, useEffect, useState } from "react";
import { customerApi } from "../customers/customer.api.js";
import { serviceTypeApi } from "../service-catalog/service-type.api.js";
import { technicianApi } from "../technicians/technician.api.js";
import { jobApi } from "./job.api.js";

const STATUS_LABELS = { requested: "Requested", scheduled: "Scheduled", en_route: "En route", in_progress: "In progress", completed: "Completed", invoiced: "Invoiced", cancelled: "Cancelled" };
const NEXT_STATUS = { requested: ["scheduled", "cancelled"], scheduled: ["en_route", "cancelled"], en_route: ["in_progress", "cancelled"], in_progress: ["completed", "cancelled"], completed: ["invoiced"], invoiced: [], cancelled: [] };

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
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [formOpen, setFormOpen] = useState(false);
	const [assigningJob, setAssigningJob] = useState(null);
	const [completingJob, setCompletingJob] = useState(null);

	const load = useCallback(async () => {
		try {
			setLoading(true);
			setError("");
			setJobs(await jobApi.list());
		} catch (requestError) {
			setError(requestError.message);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => { load(); }, [load]);

	const createJob = async (payload) => {
		await jobApi.create(payload);
		setFormOpen(false);
		await load();
	};

	const confirmAssign = async (technicianId) => {
		await jobApi.assign(assigningJob._id, technicianId);
		setAssigningJob(null);
		await load();
	};

	const changeStatus = async (job, status) => {
		if (status === "completed") {
			setCompletingJob(job);
			return;
		}
		await jobApi.updateStatus(job._id, status);
		await load();
	};

	const confirmCompletion = async (note) => {
		await jobApi.updateStatus(completingJob._id, "completed", note);
		setCompletingJob(null);
		await load();
	};

	return (
		<div className="customers-view">
			<div className="customers-toolbar">
				<h2 className="section-title">Jobs</h2>
				{canCreate && <button className="primary-button" onClick={() => setFormOpen(true)} type="button">+ New job</button>}
			</div>
			{error && <div className="service-error" role="alert"><span>{error}</span><button onClick={load} type="button">Retry</button></div>}
			{loading ? (
				<div className="customers-loading" aria-label="Loading jobs" role="status">
					{Array.from({ length: 4 }, (_, index) => <div className="customers-loading-row" key={index} />)}
				</div>
			) : jobs.length === 0 ? (
				<div className="empty-state">
					<h2>No jobs yet</h2>
					<p>{canCreate ? "Create your first job to get started." : "No jobs have been assigned to you yet."}</p>
				</div>
			) : (
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
			)}
			{formOpen && <JobForm onCancel={() => setFormOpen(false)} onSave={createJob} />}
			{assigningJob && <AssignModal job={assigningJob} onCancel={() => setAssigningJob(null)} onConfirm={confirmAssign} />}
			{completingJob && <CompletionModal onCancel={() => setCompletingJob(null)} onConfirm={confirmCompletion} />}
		</div>
	);
}
