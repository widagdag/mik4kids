import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center text-neutral-950 antialiased">
      <BrandLogo className="size-10 text-neutral-950" />
      <h1 className="mt-8 text-3xl font-semibold tracking-tight sm:text-4xl">
        Page not found.
      </h1>
      <p className="mt-3 max-w-md text-base leading-7 text-neutral-500">
        The page you're looking for doesn't exist — but the Quran is still
        waiting for you.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button asChild className="rounded-md px-8">
          <Link to="/dashboard">Go to your dashboard</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-md px-8">
          <Link to="/catalog">Browse the catalog</Link>
        </Button>
      </div>
    </main>
  );
}
