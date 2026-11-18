import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  subtitle: string;
  leadingContent?: ReactNode;
  actions?: ReactNode;
};

export default function PageHeader({ title, subtitle, leadingContent, actions }: PageHeaderProps) {
  if (leadingContent || actions) {
    return (
      <header className="page-header-surface mb-5 border-b border-slate-200 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              {leadingContent}
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
            </div>
            <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
          </div>
          {actions && (
            <div className="flex w-full shrink-0 flex-wrap justify-end gap-2 sm:w-auto">
              {actions}
            </div>
          )}
        </div>
      </header>
    );
  }

  return (
    <header className="page-header-surface mb-5 border-b border-slate-200">
      <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
      <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
    </header>
  );
}
