import { peso } from "./shared/format";

type Props = {
  totalOutstanding: number;
  sssCount: number;
  pagibigCount: number;
  activeCount: number;
  fullyPaidCount: number;
  /** Render cards stacked vertically (for narrow side panels). */
  vertical?: boolean;
};

export default function LoanSummaryCards(props: Props) {
  const cards = [
    { label: "Total Outstanding", value: peso(props.totalOutstanding) },
    { label: "SSS Loans", value: String(props.sssCount) },
    { label: "Pag-IBIG Loans", value: String(props.pagibigCount) },
    { label: "Active", value: String(props.activeCount) },
    { label: "Fully Paid", value: String(props.fullyPaidCount) },
  ];
  const cardClass = "rounded-xl border border-slate-200 bg-white p-4 shadow-sm";
  return (
    <section
      aria-label="Loan summary"
      className={props.vertical ? "grid gap-3" : "grid gap-4 sm:grid-cols-3 lg:grid-cols-5"}
    >
      {cards.map((card) => (
        <div key={card.label} className={cardClass}>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
          <p className={props.vertical ? "mt-1 text-xl font-bold tabular-nums text-slate-900" : "mt-2 text-2xl font-bold tabular-nums text-slate-900"}>{card.value}</p>
        </div>
      ))}
    </section>
  );
}
