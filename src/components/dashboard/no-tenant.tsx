import { Store } from "lucide-react";
import { EmptyState } from "@/components/ui/empty";
import { ButtonLink } from "@/components/ui/button";

export function NoTenant() {
  return (
    <EmptyState
      title="No dealership connected to this account"
      body="Dealership dashboards are tenant-scoped. Register a dealership or ask the owner to invite you from their team page."
      icon={<Store className="h-8 w-8" />}
      action={<ButtonLink href="/pricing">See dealership plans</ButtonLink>}
    />
  );
}
