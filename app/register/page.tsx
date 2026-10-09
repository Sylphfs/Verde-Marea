import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { RegisterForm } from "@/components/register-form";
import { PageHeader } from "@/components/ui";

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/account");

  return (
    <div className="mx-auto max-w-md">
      <PageHeader title="Регистрация" subtitle="Создайте аккаунт, чтобы бронировать столики" />
      <RegisterForm />
    </div>
  );
}
