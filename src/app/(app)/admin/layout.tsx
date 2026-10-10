import type { Metadata } from "next";
import { Suspense } from "react";
import { requireStaff } from "@/lib/auth";
import { Skeleton } from "@/components/ui";
import { AdminTabs } from "./tabs";

export const metadata: Metadata = { title: { template: "%s · Admin · MedPrep", default: "Admin · MedPrep" } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <StaffOnly>
        <AdminTabs />
        {children}
      </StaffOnly>
    </Suspense>
  );
}

// Reviewers and admins only; everyone else sees "not found".
async function StaffOnly({ children }: { children: React.ReactNode }) {
  await requireStaff();
  return children;
}
