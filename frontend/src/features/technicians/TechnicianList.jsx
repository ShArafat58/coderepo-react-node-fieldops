import { useCallback, useEffect, useState } from "react";
import { technicianApi } from "./technician.api.js";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function TechnicianForm({ onCancel, onSave }) {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [skillsText, setSkillsText] = useState("");
	const [daysOfWeek, setDaysOfWeek] = useState([1, 2, 3, 4, 5]);
	const [startTime, setStartTime] = useState("09:00");
	const [endTime, setEndTime] = useState("17:00");
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	const toggleDay = (day) => setDaysOfWeek((days) => days.includes(day) ? days.filter((item) => item !== day) : [...days, day].sort());

	const handleSubmit = async (event) => {
		event.preventDefault();
		try {
			setSaving(true);
			setError("");
			const skills = skillsText.split(",").map((skill) => skill.trim()).filter(Boolean);
			await onSave({ name: name.trim(), email: email.trim(), password, skills, workingHours: { daysOfWeek, startTime, endTime } });
		} catch (requestError) {
			setError(requestError.message);
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="modal-overlay" onClick={onCancel} role="presentation">
			<form className="modal-card" onClick={(event) => event.stopPropagation()} onSubmit={handleSubmit}>
				<h2>New technician</h2>
				{error && <div className="login-error" role="alert">{error}</div>}
				<label className="login-field">
					<span>Name</span>
					<input onChange={(event) => setName(event.target.value)} required type="text" value={name} />
				</label>
				<label className="login-field">
					<span>Email</span>
					<input onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
				</label>
				<label className="login-field">
					<span>Temporary password</span>
					<input minLength={8} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
				</label>
				<label className="login-field">
					<span>Skills (comma separated)</span>
					<input onChange={(event) => setSkillsText(event.target.value)} placeholder="General Pest Control, Termite Treatment" type="text" value={skillsText} />
				</label>
				<div className="login-field">
					<span>Working days</span>
					<div className="day-picker">
						{DAY_LABELS.map((label, day) => (
							<button className={daysOfWeek.includes(day) ? "active" : ""} key={day} onClick={() => toggleDay(day)} type="button">{label}</button>
						))}
					</div>
				</div>
				<label className="login-field">
					<span>Start time</span>
					<input onChange={(event) => setStartTime(event.target.value)} required type="time" value={startTime} />
				</label>
				<label className="login-field">
					<span>End time</span>
					<input onChange={(event) => setEndTime(event.target.value)} required type="time" value={endTime} />
				</label>
				<div className="modal-actions">
					<button onClick={onCancel} type="button">Cancel</button>
					<button className="primary-button" disabled={saving} type="submit">{saving ? "Saving…" : "Save"}</button>
				</div>
			</form>
		</div>
	);
}

export function TechnicianList({ canManage }) {
	const [technicians, setTechnicians] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [formOpen, setFormOpen] = useState(false);

	const load = useCallback(async () => {
		try {
			setLoading(true);
			setError("");
			setTechnicians(await technicianApi.list());
		} catch (requestError) {
			setError(requestError.message);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => { load(); }, [load]);

	const save = async (payload) => {
		await technicianApi.create(payload);
		setFormOpen(false);
		await load();
	};

	const toggleActive = async (technician) => {
		await technicianApi.update(technician._id, { active: !technician.userId.active });
		await load();
	};

	return (
		<div className="customers-view">
			<div className="customers-toolbar">
				<h2 className="section-title">Technicians</h2>
				{canManage && <button className="primary-button" onClick={() => setFormOpen(true)} type="button">+ New technician</button>}
			</div>
			{error && <div className="service-error" role="alert"><span>{error}</span><button onClick={load} type="button">Retry</button></div>}
			{loading ? (
				<div className="customers-loading" aria-label="Loading technicians" role="status">
					{Array.from({ length: 3 }, (_, index) => <div className="customers-loading-row" key={index} />)}
				</div>
			) : technicians.length === 0 ? (
				<div className="empty-state">
					<h2>No technicians yet</h2>
					<p>Add your first technician to start assigning jobs.</p>
				</div>
			) : (
				<table className="customers-table">
					<thead>
						<tr>
							<th>Name</th>
							<th>Email</th>
							<th>Skills</th>
							<th>Working hours</th>
							<th>Status</th>
							{canManage && <th aria-label="Actions" />}
						</tr>
					</thead>
					<tbody>
						{technicians.map((technician) => (
							<tr className={technician.userId.active ? "" : "inactive-row"} key={technician._id}>
								<td><strong>{technician.userId.name}</strong></td>
								<td>{technician.userId.email}</td>
								<td>{technician.skills.join(", ") || "—"}</td>
								<td>{technician.workingHours.daysOfWeek.map((day) => DAY_LABELS[day]).join(" ")} · {technician.workingHours.startTime}–{technician.workingHours.endTime}</td>
								<td><span className={`status-pill ${technician.userId.active ? "active" : "inactive"}`}>{technician.userId.active ? "Active" : "Inactive"}</span></td>
								{canManage && (
									<td className="row-actions">
										<button onClick={() => toggleActive(technician)} type="button">{technician.userId.active ? "Deactivate" : "Activate"}</button>
									</td>
								)}
							</tr>
						))}
					</tbody>
				</table>
			)}
			{formOpen && <TechnicianForm onCancel={() => setFormOpen(false)} onSave={save} />}
		</div>
	);
}
