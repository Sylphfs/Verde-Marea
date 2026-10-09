"use client";

import { useActionState } from "react";
import { login, type AuthFormState } from "@/app/actions/auth";
import { Alert, Button, Field, cn, inputStyles } from "@/components/ui";

const initialState: AuthFormState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <Alert variant="error">{state.error}</Alert> : null}

      <Field label="Email">
        <input name="email" type="email" required className={cn(inputStyles, "w-full")} />
      </Field>

      <Field label="Пароль">
        <input name="password" type="password" required className={cn(inputStyles, "w-full")} />
      </Field>

      <Button type="submit" loading={pending} className="w-full">
        Войти
      </Button>
    </form>
  );
}
