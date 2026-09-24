import { Link, useNavigate } from "react-router";
import { LogOut } from "lucide-react";

import { Brand } from "@/components/brand";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", key: "dashboard" },
  { to: "/catalog", label: "Catalog", key: "catalog" },
  { to: "/my-content", label: "My recordings", key: "recordings" },
] as const;

export function AppHeader({ current }: { current?: string }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="border-b border-neutral-200">
      <div className="mx-auto flex h-16 max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-6">
        <Link to="/dashboard" aria-label="MIK for Kids dashboard">
          <Brand />
        </Link>
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <Button
              key={item.key}
              asChild
              variant={current === item.key ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "text-neutral-600",
                current === item.key && "text-neutral-950",
              )}
            >
              <Link to={item.to}>{item.label}</Link>
            </Button>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5 text-neutral-600"
            onClick={handleSignOut}
          >
            <LogOut className="size-4" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </nav>
      </div>
    </header>
  );
}

export { buttonVariants };
