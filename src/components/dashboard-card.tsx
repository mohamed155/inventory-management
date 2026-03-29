function DashboardCard(
	{title, value, count}: { title: string, value?: string | number, count?: number }
) {
	return (
		<div className="flex justify-between bg-white rounded-lg shadow-md p-4">
			<div>
				<h3 className="text-muted mb-2">{title}</h3>
				<p>${value} {count ? `(${count})` : ''}</p>
			</div>
			<div>
				<h3 className="text-lg font-semibold mb-2">New Customers</h3>
				<p className="text-2xl font-bold">123</p>
			</div>
		</div>
	);
}

export default DashboardCard;
