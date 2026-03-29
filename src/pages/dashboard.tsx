import {useTranslation} from "react-i18next";

function Dashboard() {
	const {t} = useTranslation();

	return <div>
		<h2 className="text-xl font-semibold pb-2">{t('Dashboard')}</h2>
	</div>;
}

export default Dashboard;
