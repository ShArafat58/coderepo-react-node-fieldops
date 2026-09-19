import { useEffect, useState } from "react";

export function BarChart({ data, valueFormatter, valueKey = "value", labelKey = "label", colors }) {
	const [animated, setAnimated] = useState(false);
	useEffect(() => {
		const timer = requestAnimationFrame(() => setAnimated(true));
		return () => cancelAnimationFrame(timer);
	}, []);
	const max = Math.max(1, ...data.map((item) => item[valueKey]));
	const palette = colors || ["#4285f4", "#34a853", "#fbbc04", "#ea4335", "#a142f4", "#24c1e0"];

	return (
		<div className="bar-chart">
			{data.map((item, index) => (
				<div className="bar-chart-row" key={item[labelKey]}>
					<span className="bar-chart-label">{item[labelKey]}</span>
					<div className="bar-chart-track">
						<div
							className="bar-chart-fill"
							style={{
								width: animated ? `${(item[valueKey] / max) * 100}%` : "0%",
								background: `linear-gradient(90deg, ${palette[index % palette.length]}, ${palette[index % palette.length]}cc)`,
								transitionDelay: `${index * 60}ms`,
							}}
						/>
					</div>
					<span className="bar-chart-value">{valueFormatter ? valueFormatter(item[valueKey]) : item[valueKey]}</span>
				</div>
			))}
		</div>
	);
}
