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
    <div className="my-1.5 overflow-hidden rounded-xl border border-zinc-200">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-11 w-full cursor-pointer items-center bg-slate-50 px-3 text-left text-sm font-bold"
      >
        <span
          aria-hidden
          className={`mr-2 inline-block transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] ${
            open ? "rotate-90" : ""
          }`}
        >
          ›
        </span>
        <span className="flex-1">{summary}</span>
      </button>
      <div className="acc-panel" data-open={open}>
        <div className="acc-inner">{children}</div>
      </div>
    </div>
  );
}
