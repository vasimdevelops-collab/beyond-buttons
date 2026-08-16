/**
 * Fallback for /order/success (no orderId).
 * The client-side cart state still has lastOrder stored in localStorage,
 * so we render the SuccessView which reads from it. This also catches
 * older redirects that pointed to /order/success without an ID.
 */
import { CartProvider } from "@/lib/shop/commerce";
import { SuccessView } from "@/components/shop/ShoppingViews";

export const metadata = {
  title: "Order Confirmed — Beyond Buttons",
  description: "Thank you for your order.",
};

export default function OrderSuccessFallbackPage() {
  return (
    <CartProvider>
      <SuccessView />
    </CartProvider>
  );
}
