import { useCallback, useEffect, useState } from "react";
import { customerApi } from "./customer.api.js";
import { CustomerForm } from "./CustomerForm.jsx";
import { PropertyList } from "./PropertyList.jsx";

export function CustomerList({ canManage }) {
	const [customers, setCustomers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [query, setQuery] = useState("");
	const [formOpen, setFormOpen] = useState(false);
	const [editingCustomer, setEditingCustomer] = useState(null);
	const [selectedId, setSelectedId] = useState(null);
	const [selectedCustomer, setSelectedCustomer] = useState(null);
	const [detailLoading, setDetailLoading] = useState(false);
	const [detailError, setDetailError] = useState("");

	const loadCustomers = useCallback(async () => {
		try {
			setLoading(true);
			setError("");
			setCustomers(await customerApi.list());
		} catch (requestError) {
			setError(requestError.message);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => { loadCustomers(); }, [loadCustomers]);

	const loadDetail = useCallback(async (id) => {
		try {
			setDetailLoading(true);
			setDetailError("");
			setSelectedCustomer(await customerApi.get(id));
		} catch (requestError) {
			setDetailError(requestError.message);
		} finally {
			setDetailLoading(false);
		}
	}, []);

	useEffect(() => {
		if (selectedId) loadDetail(selectedId);
		else setSelectedCustomer(null);
	}, [selectedId, loadDetail]);

	const filtered = customers.filter((customer) => {
		const term = query.trim().toLowerCase();
		if (!term) return true;
		return customer.name.toLowerCase().includes(term) || customer.phone.includes(term) || (customer.email || "").toLowerCase().includes(term);
	});

	const openCreate = () => { setEditingCustomer(null); setFormOpen(true); };
	const openEdit = (customer) => { setEditingCustomer(customer); setFormOpen(true); };
	const closeForm = () => { setFormOpen(false); setEditingCustomer(null); };

	const saveCustomer = async (payload) => {
		if (editingCustomer) await customerApi.update(editingCustomer._id, payload);
		else await customerApi.create(payload);
		closeForm();
		await loadCustomers();
		if (editingCustomer && selectedId === editingCustomer._id) await loadDetail(selectedId);
	};

	const removeCustomer = async (customer) => {
		if (!window.confirm(`Delete ${customer.name}? This also removes their properties.`)) return;
		await customerApi.remove(customer._id);
		if (selectedId === customer._id) setSelectedId(null);
		await loadCustomers();
	};

	return (
		<div className="customers-view">
			<div className="customers-toolbar">
				<input className="customers-search" onChange={(event) => setQuery(event.target.value)} placeholder="Search customers…" type="search" value={query} />
				{canManage && <button className="primary-button" onClick={openCreate} type="button">+ New customer</button>}
			</div>
			{error && <div className="service-error" role="alert"><span>{error}</span><button onClick={loadCustomers} type="button">Retry</button></div>}
			{loading ? (
				<div className="customers-loading" aria-label="Loading customers" role="status">
					{Array.from({ length: 4 }, (_, index) => <div className="customers-loading-row" key={index} />)}
				</div>
			) : filtered.length === 0 ? (
				<div className="empty-state">
					<h2>{customers.length === 0 ? "No customers yet" : "No matches"}</h2>
					<p>{customers.length === 0 ? "Add your first customer to get started." : "Try a different search term."}</p>
				</div>
			) : (
				<div className="customers-table-wrap">
					<table className="customers-table">
						<thead>
							<tr>
								<th>Name</th>
								<th>Phone</th>
								<th>Email</th>
								{canManage && <th aria-label="Actions" />}
							</tr>
						</thead>
						<tbody>
							{filtered.map((customer) => (
								<tr className={selectedId === customer._id ? "selected" : ""} key={customer._id}>
									<td><button className="row-link" onClick={() => setSelectedId(customer._id)} type="button">{customer.name}</button></td>
									<td>{customer.phone}</td>
									<td>{customer.email || "—"}</td>
									{canManage && (
										<td className="row-actions">
											<button onClick={() => openEdit(customer)} type="button">Edit</button>
											<button className="danger-link" onClick={() => removeCustomer(customer)} type="button">Delete</button>
										</td>
									)}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
			{selectedId && (
				<div className="customer-detail" role="region" aria-label="Customer detail">
					<div className="customer-detail-header">
						<h2>{selectedCustomer?.name || "Loading…"}</h2>
						<button aria-label="Close" className="icon-button" onClick={() => setSelectedId(null)} type="button">✕</button>
					</div>
					{detailError && <div className="service-error" role="alert"><span>{detailError}</span><button onClick={() => loadDetail(selectedId)} type="button">Retry</button></div>}
					{detailLoading || !selectedCustomer ? (
						<p className="detail-loading">Loading properties…</p>
					) : (
						<PropertyList canManage={canManage} customerId={selectedCustomer._id} onChange={() => loadDetail(selectedId)} properties={selectedCustomer.properties} />
					)}
				</div>
			)}
			{formOpen && <CustomerForm customer={editingCustomer} onCancel={closeForm} onSave={saveCustomer} />}
		</div>
	);
}