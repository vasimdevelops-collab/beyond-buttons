import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAuth } from "@/lib/auth/server";
import { CartProvider } from "@/lib/shop/commerce";
import { CheckoutView } from "@/components/shop/ShoppingViews";

export const metadata = {
  title: "Checkout — Beyond Buttons",
  description: "Complete your order details and place your order.",
};

// Checkout requires an authenticated customer session.
export default async function CheckoutPage() {
  const requestHeaders = await headers();
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session?.user) {
    redirect("/login?next=/checkout");
  }

  return (
    <CartProvider>
      <CheckoutView />
    </CartProvider>
  );
}
