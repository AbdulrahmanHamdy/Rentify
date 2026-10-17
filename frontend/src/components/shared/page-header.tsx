import React from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, action }) => {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-6 mb-6 border-b border-charcoal-200">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-charcoal-900">{title}</h1>
        {description && <p className="text-sm text-charcoal-500 mt-1">{description}</p>}
      </div>
      {action && <div className="flex items-center gap-3 shrink-0">{action}</div>}
    </div>
  );
};
