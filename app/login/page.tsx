import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";
import { PageHeader } from "@/components/ui";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/account");

  return (
    <div className="mx-auto max-w-md">
      <PageHeader title="Вход" subtitle="Войдите, чтобы управлять своими бронированиями" />
      <LoginForm />
    </div>
  );
}
