import { useEffect, useState } from "react";

const STATUS_ORDER = ["requested", "scheduled", "en_route", "in_progress", "completed", "invoiced", "cancelled"];
const STATUS_COLORS = { requested: "#9aa0a6", scheduled: "#4285f4", en_route: "#fbbc04", in_progress: "#fb8c00", completed: "#34a853", invoiced: "#0f9d58", cancelled: "#ea4335" };
const STATUS_LABELS = { requested: "Requested", scheduled: "Scheduled", en_route: "En route", in_progress: "In progress", completed: "Completed", invoiced: "Invoiced", cancelled: "Cancelled" };

function polarPoint(cx, cy, radius, angleDegrees) {
	const angleRad = ((angleDegrees - 90) * Math.PI) / 180;
	return { x: cx + radius * Math.cos(angleRad), y: cy + radius * Math.sin(angleRad) };
}

function wedgePath(cx, cy, radius, startAngle, endAngle) {
	const start = polarPoint(cx, cy, radius, endAngle);
	const end = polarPoint(cx, cy, radius, startAngle);
	const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
	return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
}

export function StatusDonut({ statusCounts, total }) {
	const [animated, setAnimated] = useState(false);
	const [hovered, setHovered] = useState(null);
	useEffect(() => {
		const timer = requestAnimationFrame(() => setAnimated(true));
		return () => cancelAnimationFrame(timer);
	}, []);

	const radius = 92;
	const center = 100;
	let angle = 0;
	const segments = STATUS_ORDER.map((status) => {
		const count = statusCounts[status] || 0;
		const fraction = total > 0 ? count / total : 0;
		const sweep = fraction * 360;
		const segment = { status, count, startAngle: angle, endAngle: angle + sweep };
		angle += sweep;
		return segment;
	}).filter((segment) => segment.count > 0);

	return (
		<div className="status-pie-layout">
			<svg height="200" viewBox="0 0 200 200" width="200">
				<defs>
					<filter height="160%" id="pieShadow" width="160%">
						<feDropShadow dx="0" dy="2" floodOpacity="0.35" stdDeviation="2.5" />
					</filter>
				</defs>
				{total === 0 ? (
					<circle cx={center} cy={center} fill="var(--divider)" r={radius} />
				) : (
					segments.map((segment, index) => {
						const isHovered = hovered === segment.status;
						const midAngle = (segment.startAngle + segment.endAngle) / 2;
						const pushOut = isHovered ? polarPoint(0, 0, 6, midAngle) : { x: 0, y: 0 };
						return (
							<path
								d={wedgePath(center, center, radius, segment.startAngle, segment.endAngle)}
								fill={STATUS_COLORS[segment.status]}
								filter="url(#pieShadow)"
								key={segment.status}
								onMouseEnter={() => setHovered(segment.status)}
								onMouseLeave={() => setHovered(null)}
								opacity={hovered && !isHovered ? 0.5 : 1}
								stroke="var(--surface)"
								strokeWidth="2"
								style={{
									cursor: "pointer",
									opacity: animated ? undefined : 0,
									transform: animated ? `translate(${pushOut.x}px, ${pushOut.y}px) scale(1)` : "scale(0.7)",
									transformOrigin: `${center}px ${center}px`,
									transition: `opacity 400ms ease ${index * 60}ms, transform 250ms ease`,
								}}
							/>
						);
					})
				)}
				<circle cx={center} cy={center} fill="var(--surface)" r="36" style={{ opacity: animated ? 1 : 0, transition: "opacity 400ms ease 300ms" }} />
				<text fill="var(--ink-strong)" fontSize="26" fontWeight="700" textAnchor="middle" x={center} y={center - 3}>{hovered ? statusCounts[hovered] || 0 : total}</text>
				<text fill="var(--muted)" fontSize="10" textAnchor="middle" x={center} y={center + 13}>{hovered ? STATUS_LABELS[hovered] : "total jobs"}</text>
			</svg>
			<ul className="pie-legend-list">
				{STATUS_ORDER.filter((status) => statusCounts[status]).map((status) => {
					const percent = total > 0 ? Math.round(((statusCounts[status] || 0) / total) * 100) : 0;
					return (
						<li
							className={hovered === status ? "pie-legend-active" : ""}
							key={status}
							onMouseEnter={() => setHovered(status)}
							onMouseLeave={() => setHovered(null)}
						>
							<span className="legend-dot" style={{ background: STATUS_COLORS[status] }} />
							<span className="legend-label">{STATUS_LABELS[status]}</span>
							<span className="legend-percent">{percent}%</span>
							<span className="legend-count">{statusCounts[status]}</span>
						</li>
					);
				})}
			</ul>
		</div>
	);
}