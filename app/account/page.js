import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { CustomerAuth } from "@/components/auth/CustomerAuth";
import { getAuth } from "@/lib/auth/server";

async function requireCustomerSession(currentPath) {
  const requestHeaders = await headers();
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session?.user) {
    redirect(`/login?next=${encodeURIComponent(currentPath)}`);
  }

  return session;
}

export default async function AccountPage() {
  await requireCustomerSession("/account");
  return <CustomerAuth view="account" />;
}
