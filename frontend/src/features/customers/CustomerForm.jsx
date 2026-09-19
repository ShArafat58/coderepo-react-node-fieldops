import { useState } from "react";

export function CustomerForm({ customer, onCancel, onSave }) {
	const [name, setName] = useState(customer?.name || "");
	const [phone, setPhone] = useState(customer?.phone || "");
	const [email, setEmail] = useState(customer?.email || "");
	const [notes, setNotes] = useState(customer?.notes || "");
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async (event) => {
		event.preventDefault();
		try {
			setSaving(true);
			setError("");
			await onSave({ name: name.trim(), phone: phone.trim(), email: email.trim(), notes: notes.trim() });
		} catch (requestError) {
			setError(requestError.message);
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="modal-overlay" onClick={onCancel} role="presentation">
			<form className="modal-card" onClick={(event) => event.stopPropagation()} onSubmit={handleSubmit}>
				<h2>{customer ? "Edit customer" : "New customer"}</h2>
				{error && <div className="login-error" role="alert">{error}</div>}
				<label className="login-field">
					<span>Name</span>
					<input onChange={(event) => setName(event.target.value)} required type="text" value={name} />
				</label>
				<label className="login-field">
					<span>Phone</span>
					<input onChange={(event) => setPhone(event.target.value)} required type="tel" value={phone} />
				</label>
				<label className="login-field">
					<span>Email</span>
					<input onChange={(event) => setEmail(event.target.value)} type="email" value={email} />
				</label>
				<label className="login-field">
					<span>Notes</span>
					<textarea onChange={(event) => setNotes(event.target.value)} rows={3} value={notes} />
				</label>
				<div className="modal-actions">
					<button onClick={onCancel} type="button">Cancel</button>
					<button className="primary-button" disabled={saving} type="submit">{saving ? "Saving…" : "Save"}</button>
				</div>
			</form>
		</div>
	);
}
