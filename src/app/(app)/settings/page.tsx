import type { Metadata } from "next";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { Card, PageHeader, Skeleton } from "@/components/ui";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="max-w-2xl">
      <PageHeader eyebrow="Account" title="Settings" description="Your profile and study preferences." />
      <Card className="p-6 sm:p-8">
        <Suspense fallback={<Skeleton className="h-96" />}>
          <Profile />
        </Suspense>
      </Card>
    </div>
  );
}

async function Profile() {
  const { displayName, email, showRussian, targetExamDate } = await getCurrentUser();
  // Pass only what the form needs to the browser.
  return <ProfileForm user={{ displayName, email, showRussian, targetExamDate }} />;
}
