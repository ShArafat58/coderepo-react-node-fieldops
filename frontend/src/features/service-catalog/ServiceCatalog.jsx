import { useCallback, useEffect, useState } from "react";
import { serviceTypeApi } from "./service-type.api.js";

function ServiceTypeForm({ onCancel, onSave, serviceType }) {
	const [name, setName] = useState(serviceType?.name || "");
	const [description, setDescription] = useState(serviceType?.description || "");
	const [estimatedDurationMinutes, setEstimatedDurationMinutes] = useState(serviceType?.estimatedDurationMinutes || 60);
	const [basePrice, setBasePrice] = useState(serviceType?.basePrice ?? 0);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async (event) => {
		event.preventDefault();
		try {
			setSaving(true);
			setError("");
			await onSave({ name: name.trim(), description: description.trim(), estimatedDurationMinutes: Number(estimatedDurationMinutes), basePrice: Number(basePrice) });
		} catch (requestError) {
			setError(requestError.message);
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="modal-overlay" onClick={onCancel} role="presentation">
			<form className="modal-card" onClick={(event) => event.stopPropagation()} onSubmit={handleSubmit}>
				<h2>{serviceType ? "Edit service" : "New service"}</h2>
				{error && <div className="login-error" role="alert">{error}</div>}
				<label className="login-field">
					<span>Name</span>
					<input onChange={(event) => setName(event.target.value)} required type="text" value={name} />
				</label>
				<label className="login-field">
					<span>Description</span>
					<textarea onChange={(event) => setDescription(event.target.value)} rows={2} value={description} />
				</label>
				<label className="login-field">
					<span>Estimated duration (minutes)</span>
					<input min={5} max={1440} onChange={(event) => setEstimatedDurationMinutes(event.target.value)} required type="number" value={estimatedDurationMinutes} />
				</label>
				<label className="login-field">
					<span>Base price (USD)</span>
					<input min={0} onChange={(event) => setBasePrice(event.target.value)} required step="0.01" type="number" value={basePrice} />
				</label>
				<div className="modal-actions">
					<button onClick={onCancel} type="button">Cancel</button>
					<button className="primary-button" disabled={saving} type="submit">{saving ? "Saving…" : "Save"}</button>
				</div>
			</form>
		</div>
	);
}

export function ServiceCatalog({ canManage }) {
	const [serviceTypes, setServiceTypes] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [formOpen, setFormOpen] = useState(false);
	const [editing, setEditing] = useState(null);

	const load = useCallback(async () => {
		try {
			setLoading(true);
			setError("");
			setServiceTypes(await serviceTypeApi.list());
		} catch (requestError) {
			setError(requestError.message);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => { load(); }, [load]);

	const openCreate = () => { setEditing(null); setFormOpen(true); };
	const openEdit = (serviceType) => { setEditing(serviceType); setFormOpen(true); };
	const closeForm = () => { setFormOpen(false); setEditing(null); };

	const save = async (payload) => {
		if (editing) await serviceTypeApi.update(editing._id, payload);
		else await serviceTypeApi.create(payload);
		closeForm();
		await load();
	};

	const toggleActive = async (serviceType) => {
		await serviceTypeApi.update(serviceType._id, { active: !serviceType.active });
		await load();
	};

	const remove = async (serviceType) => {
		if (!window.confirm(`Delete ${serviceType.name}?`)) return;
		await serviceTypeApi.remove(serviceType._id);
		await load();
	};

	return (
		<div className="customers-view">
			<div className="customers-toolbar">
				<h2 className="section-title">Service catalog</h2>
				{canManage && <button className="primary-button" onClick={openCreate} type="button">+ New service</button>}
			</div>
			{error && <div className="service-error" role="alert"><span>{error}</span><button onClick={load} type="button">Retry</button></div>}
			{loading ? (
				<div className="customers-loading" aria-label="Loading service catalog" role="status">
					{Array.from({ length: 4 }, (_, index) => <div className="customers-loading-row" key={index} />)}
				</div>
			) : serviceTypes.length === 0 ? (
				<div className="empty-state">
					<h2>No services yet</h2>
					<p>Add your first service type to build the catalog.</p>
				</div>
			) : (
				<table className="customers-table">
					<thead>
						<tr>
							<th>Name</th>
							<th>Duration</th>
							<th>Base price</th>
							<th>Status</th>
							{canManage && <th aria-label="Actions" />}
						</tr>
					</thead>
					<tbody>
						{serviceTypes.map((serviceType) => (
							<tr className={serviceType.active ? "" : "inactive-row"} key={serviceType._id}>
								<td>
									<strong>{serviceType.name}</strong>
									{serviceType.description && <p className="property-notes">{serviceType.description}</p>}
								</td>
								<td>{serviceType.estimatedDurationMinutes} min</td>
								<td>${serviceType.basePrice.toFixed(2)}</td>
								<td><span className={`status-pill ${serviceType.active ? "active" : "inactive"}`}>{serviceType.active ? "Active" : "Inactive"}</span></td>
								{canManage && (
									<td className="row-actions">
										<button onClick={() => openEdit(serviceType)} type="button">Edit</button>
										<button onClick={() => toggleActive(serviceType)} type="button">{serviceType.active ? "Deactivate" : "Activate"}</button>
										<button className="danger-link" onClick={() => remove(serviceType)} type="button">Delete</button>
									</td>
								)}
							</tr>
						))}
					</tbody>
				</table>
			)}
			{formOpen && <ServiceTypeForm onCancel={closeForm} onSave={save} serviceType={editing} />}
		</div>
	);
}
