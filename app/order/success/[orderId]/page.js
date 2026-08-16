import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { getAuth } from "@/lib/auth/server";
import { bootstrapDatabase } from "@/lib/database/register";
import { OrderModel } from "@/lib/database/models";
import { ServerSuccessView } from "@/components/shop/ShoppingViews";

export async function generateMetadata({ params }) {
  const { orderId } = await params;
  return {
    title: `Order Confirmed — Beyond Buttons`,
    description: `Your order ${orderId} has been placed successfully.`,
  };
}

/**
 * Server-rendered order confirmation page.
 * Fetches the order from the database directly so the page works even
 * if the customer refreshes or shares the link — no reliance on client
 * localStorage lastOrder state.
 */
export default async function OrderSuccessPage({ params }) {
  const { orderId } = await params;

  // Require authenticated session — order belongs to a customer account.
  const requestHeaders = await headers();
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session?.user) {
    redirect(`/login?next=/order/success/${orderId}`);
  }

  await bootstrapDatabase();

  const order = await OrderModel.findOne({
    id: orderId,
    customerId: session.user.id,
  })
    .lean()
    .exec();

  if (!order) {
    notFound();
  }

  // Serialize for the client component — lean() returns plain objects but
  // dates and ObjectIds need to be converted to strings.
  const serialized = JSON.parse(JSON.stringify(order));

  return <ServerSuccessView order={serialized} />;
}
