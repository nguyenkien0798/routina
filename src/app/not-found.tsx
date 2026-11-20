import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <p className="text-sm font-medium text-muted">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-1 text-sm text-muted">That route is not part of Routina.</p>
      <Link
        href="/"
        className="mt-5 inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        Back to today
      </Link>
    </div>
  );
}
