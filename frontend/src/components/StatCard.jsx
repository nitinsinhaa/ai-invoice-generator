const StatCard = ({ title, value, icon: Icon, trend, trendValue, color = 'primary' }) => {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400',
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/40 dark:text-green-400',
    yellow: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/40 dark:text-red-400',
  };

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-heading mb-2">{value}</h3>
          {trend && (
            <div className="flex items-center gap-1">
              <span className={`text-sm ${trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {trend === 'up' ? '↑' : '↓'} {trendValue}
              </span>
              <span className="text-xs text-muted">vs last month</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
