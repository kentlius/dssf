"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-220 px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">問題が発生しました / Something went wrong</h1>
      <p className="mt-2 text-zinc-500">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-xl bg-sky-600 px-6 py-2.5 text-white"
      >
        もう一度試す / Try again
      </button>
    </main>
  );
}
