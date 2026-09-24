import { LoaderCircle } from "lucide-react";

import { cn } from "@/lib/utils";

function Spinner({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="spinner"
      role="status"
      aria-label="Loading"
      className={cn("animate-spin", className)}
      {...props}
    >
      <LoaderCircle className={cn("size-4")} />
    </div>
  );
}

export { Spinner };
