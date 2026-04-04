import {useTranslation} from "react-i18next";
import DashboardCard from "@/components/dashboard-card.tsx";

function Dashboard() {
	const {t} = useTranslation();

	return <div>
		<div className="flex justify-between items-center mb-4">
			<h2 className="text-xl font-semibold pb-2">{t('Dashboard')}</h2>
		</div>
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			<DashboardCard title={t('Total Revenue')} value={12345} />
			<DashboardCard title={t('Total Customers')} value={678} />
			<DashboardCard title={t('Total Orders')} value={90} />
			<DashboardCard title={t('Total Products')} value={45} />
		</div>
	</div>;
}

export default Dashboard;
