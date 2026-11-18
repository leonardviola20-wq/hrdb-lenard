import type { ReactNode } from "react";

type Props = {
  ariaLabel: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  footer?: ReactNode;
  header?: ReactNode;
  rowsClassName?: string;
};

export default function ScrollableListTable({
  ariaLabel,
  children,
  className = "",
  contentClassName = "",
  footer,
  header,
  rowsClassName = "",
}: Props) {
  return (
    <div className={`list-card-table-scroll flex ${className}`}>
      <div role="table" aria-label={ariaLabel} className={`list-card-table-content ${contentClassName}`}>
        {header && <div role="rowgroup" className="list-card-table-header">{header}</div>}
        <div role="rowgroup" aria-label={`${ariaLabel} rows`} className={`list-card-table-rows ${rowsClassName}`}>
          {children}
        </div>
        {footer && <div role="rowgroup" className="list-card-table-footer">{footer}</div>}
      </div>
    </div>
  );
}
