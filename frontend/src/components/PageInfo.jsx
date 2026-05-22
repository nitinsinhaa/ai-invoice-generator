import { Info } from 'lucide-react';

const PageInfo = ({ title, children }) => (
  <div className="mb-6 flex gap-3 rounded-lg border border-primary-200 bg-primary-50 p-4 dark:border-primary-900/50 dark:bg-primary-950/30">
    <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary-600 dark:text-primary-400" />
    <div>
      {title && <p className="mb-1 text-sm font-semibold text-heading">{title}</p>}
      <p className="text-sm text-muted leading-relaxed">{children}</p>
    </div>
  </div>
);

export default PageInfo;
