"use client";

import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { HistoryBackLink } from "@/components/HistoryBackLink";

const backButtonClassName =
  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

type SharedProps = {
  label: string;
  className?: string;
};

type BackButtonProps = SharedProps & (
  | { fallbackHref: string; onClick?: never; disabled?: never }
  | { onClick: () => void; fallbackHref?: never; disabled?: boolean }
);

export default function BackButton(props: BackButtonProps) {
  const { label, className = "" } = props;
  const classes = `${backButtonClassName} ${className}`.trim();
  const icon = <ChevronLeftIcon aria-hidden="true" className="h-5 w-5" />;

  if ("onClick" in props && props.onClick) {
    return (
      <button
        type="button"
        onClick={props.onClick}
        disabled={props.disabled}
        aria-label={label}
        title={label}
        className={classes}
      >
        {icon}
      </button>
    );
  }

  if (!("fallbackHref" in props) || !props.fallbackHref) {
    throw new Error("BackButton requires either a fallbackHref or an onClick handler.");
  }

  return (
    <HistoryBackLink
      fallbackHref={props.fallbackHref}
      aria-label={label}
      title={label}
      className={classes}
    >
      {icon}
    </HistoryBackLink>
  );
}
