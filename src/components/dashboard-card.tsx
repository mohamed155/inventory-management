function DashboardCard(
	{title, value, count, icon, color}: { title: string, value?: string | number, count?: number, icon?: string, color?: string }
) {
	return (
		<div className="flex justify-between bg-white rounded-lg shadow-md p-4">
			<div>
				<h3 className="text-muted mb-2">{title}</h3>
				<p className="text-2xl font-bold">${value} {count ? `(${count})` : ''}</p>
			</div>
		</div>
	);
}

export default DashboardCard;
