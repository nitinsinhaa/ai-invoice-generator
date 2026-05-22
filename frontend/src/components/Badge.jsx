const Badge = ({ status, text }) => {
  const statusColors = {
    paid: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    invoice: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
    overdue: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    active: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    income: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    expense: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}`}>
      {text || status}
    </span>
  );
};

export default Badge;
