import { useState, type ReactNode } from "react";

export function Accordion({
  summary,
  defaultOpen = false,
  children,
}: {
  summary: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="my-1.5 w-full min-w-0 overflow-hidden rounded-xl border border-zinc-200">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-11 w-full min-w-0 cursor-pointer items-center bg-slate-50 px-3 text-left text-sm font-bold"
      >
        <span
          aria-hidden
          className={`mr-2 inline-block shrink-0 transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] ${
            open ? "rotate-90" : ""
          }`}
        >
          ›
        </span>
        <span className="min-w-0 flex-1 wrap-break-word">{summary}</span>
      </button>
      <div className="acc-panel" data-open={open}>
        <div className="acc-inner">{children}</div>
      </div>
    </div>
  );
}
