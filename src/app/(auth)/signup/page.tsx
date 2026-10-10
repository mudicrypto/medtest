import type { Metadata } from "next";
import { Card } from "@/components/ui";
import { SignUpForm } from "./form";

export const metadata: Metadata = { title: "Create account" };

export default function SignUpPage() {
  return (
    <Card className="p-6 sm:p-8">
      <SignUpForm />
    </Card>
  );
}
