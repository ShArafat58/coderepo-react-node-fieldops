import { useState } from "react";
import { customerApi } from "./customer.api.js";

export function PropertyList({ canManage, customerId, onChange, properties }) {
	const [adding, setAdding] = useState(false);
	const [address, setAddress] = useState("");
	const [propertyType, setPropertyType] = useState("residential");
	const [notes, setNotes] = useState("");
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	const resetForm = () => { setAdding(false); setAddress(""); setPropertyType("residential"); setNotes(""); setError(""); };

	const handleAdd = async (event) => {
		event.preventDefault();
		try {
			setSaving(true);
			setError("");
			await customerApi.createProperty(customerId, { address: address.trim(), propertyType, notes: notes.trim() });
			resetForm();
			onChange();
		} catch (requestError) {
			setError(requestError.message);
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async (property) => {
		if (!window.confirm(`Remove ${property.address}?`)) return;
		await customerApi.removeProperty(property._id);
		onChange();
	};

	return (
		<div className="property-list">
			<div className="property-list-header">
				<h3>Properties</h3>
				{canManage && !adding && <button onClick={() => setAdding(true)} type="button">+ Add property</button>}
			</div>
			{properties.length === 0 && !adding && <p className="detail-empty">No properties on file yet.</p>}
			<ul className="property-items">
				{properties.map((property) => (
					<li key={property._id}>
						<div>
							<strong>{property.address}</strong>
							<span className="property-type">{property.propertyType}</span>
							{property.notes && <p className="property-notes">{property.notes}</p>}
						</div>
						{canManage && <button className="danger-link" onClick={() => handleDelete(property)} type="button">Remove</button>}
					</li>
				))}
			</ul>
			{adding && (
				<form className="property-add-form" onSubmit={handleAdd}>
					{error && <div className="login-error" role="alert">{error}</div>}
					<label className="login-field">
						<span>Address</span>
						<input onChange={(event) => setAddress(event.target.value)} required type="text" value={address} />
					</label>
					<label className="login-field">
						<span>Type</span>
						<select onChange={(event) => setPropertyType(event.target.value)} value={propertyType}>
							<option value="residential">Residential</option>
							<option value="commercial">Commercial</option>
						</select>
					</label>
					<label className="login-field">
						<span>Notes</span>
						<textarea onChange={(event) => setNotes(event.target.value)} rows={2} value={notes} />
					</label>
					<div className="modal-actions">
						<button onClick={resetForm} type="button">Cancel</button>
						<button className="primary-button" disabled={saving} type="submit">{saving ? "Saving…" : "Add"}</button>
					</div>
				</form>
			)}
		</div>
	);
}
