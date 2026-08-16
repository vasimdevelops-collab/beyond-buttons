import { CartProvider } from "@/lib/shop/commerce";
import { CartView } from "@/components/shop/ShoppingViews";

export const metadata = {
  title: "Cart — Beyond Buttons",
  description: "Review the pieces in your bag before checkout.",
};

export default function CartPage() {
  return (
    <CartProvider>
      <CartView />
    </CartProvider>
  );
}
