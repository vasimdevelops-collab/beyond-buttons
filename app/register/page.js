import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { CustomerAuth } from "@/components/auth/CustomerAuth";
import { getAuth } from "@/lib/auth/server";

async function requireGuest() {
  const requestHeaders = await headers();
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (session?.user) {
    redirect("/account");
  }
}

export default async function RegisterPage() {
  await requireGuest();
  return <CustomerAuth view="register" />;
}
