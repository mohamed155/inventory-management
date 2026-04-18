function DashboardCard({
  title,
  value,
  count,
  // icon,
  // color,
}: {
  title: string;
  value?: string | number;
  count?: number;
  // icon?: string;
  // color?: string;
}) {
  return (
    <div className="flex justify-between bg-white rounded-lg p-4 border border-solid border-1">
      <div>
        <h3 className="font-light text-gray-800 mb-2">{title}</h3>
        <p className="text-lg">
          ${value} {count ? `(${count})` : ''}
        </p>
      </div>
    </div>
  );
}

export default DashboardCard;
