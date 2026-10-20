import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Create an account", robots: { index: false } };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; email?: string; type?: string }>;
}) {
  const { next, email, type } = await searchParams;
  const initialType = type === "DEALER" || type === "SELLER" ? type : undefined;

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-950">Create your account</h1>
      <p className="mt-1 text-sm text-ink-500">Buy, sell and request evidence-based vehicle reports.</p>
      <div className="mt-6">
        <RegisterForm next={next} initialEmail={email} initialType={initialType} />
      </div>
    </div>
  );
}
