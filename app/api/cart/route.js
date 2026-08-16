import { NextResponse } from "next/server";

import { getAuth } from "@/lib/auth/server";
import { bootstrapDatabase } from "@/lib/database/register";
import { CartModel } from "@/lib/database/models";

function getGuestCartId(request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/bb-guest-cart=([^;]+)/);
  return match ? match[1] : null;
}

function generateGuestCartId() {
  return `guest_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function buildCartResponse(cart, guestCartId) {
  const headers = new Headers();
  if (guestCartId) {
    headers.set("Set-Cookie", `bb-guest-cart=${guestCartId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`);
  }
  return NextResponse.json({ cart }, { headers });
}

export async function GET(request) {
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: request.headers });

    await bootstrapDatabase();

    if (session?.user) {
      let cart = await CartModel.findOne({ customerId: session.user.id }).lean().exec();

      if (!cart) {
        cart = await CartModel.create({
          customerId: session.user.id,
          items: [],
          updatedAt: new Date().toISOString(),
        });
      }

      return buildCartResponse(cart, null);
    }

    const guestCartId = getGuestCartId(request) || generateGuestCartId();
    let cart = await CartModel.findOne({ guestId: guestCartId }).lean().exec();

    if (!cart) {
      cart = await CartModel.create({
        guestId: guestCartId,
        items: [],
        updatedAt: new Date().toISOString(),
      });
    }

    return buildCartResponse(cart, guestCartId);
  } catch (error) {
    console.error("[cart] GET failed:", error);
    return NextResponse.json({ error: "Unable to load cart" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: request.headers });

    const body = await request.json();
    const { productId, slug, color, size, quantity = 1, image } = body;

    if (!productId && !slug) {
      return NextResponse.json({ error: "productId or slug is required" }, { status: 400 });
    }

    await bootstrapDatabase();

    if (session?.user) {
      let cart = await CartModel.findOne({ customerId: session.user.id });

      if (!cart) {
        cart = await CartModel.create({
          customerId: session.user.id,
          items: [],
          updatedAt: new Date().toISOString(),
        });
      }

      const lineKey = `${productId || slug}::${color || ""}::${size || ""}`;
      const existingIndex = cart.items.findIndex((item) => item.lineKey === lineKey);

      if (existingIndex >= 0) {
        cart.items[existingIndex].quantity += Number(quantity) || 1;
      } else {
        cart.items.push({
          lineKey,
          productId: productId || slug,
          slug,
          color: color || "",
          size: size || "",
          quantity: Number(quantity) || 1,
          image: image || "",
        });
      }

      cart.updatedAt = new Date().toISOString();
      await cart.save();

      return buildCartResponse(cart, null);
    }

    const guestCartId = getGuestCartId(request) || generateGuestCartId();
    let cart = await CartModel.findOne({ guestId: guestCartId });

    if (!cart) {
      cart = await CartModel.create({
        guestId: guestCartId,
        items: [],
        updatedAt: new Date().toISOString(),
      });
    }

    const lineKey = `${productId || slug}::${color || ""}::${size || ""}`;
    const existingIndex = cart.items.findIndex((item) => item.lineKey === lineKey);

    if (existingIndex >= 0) {
      cart.items[existingIndex].quantity += Number(quantity) || 1;
    } else {
      cart.items.push({
        lineKey,
        productId: productId || slug,
        slug,
        color: color || "",
        size: size || "",
        quantity: Number(quantity) || 1,
        image: image || "",
      });
    }

    cart.updatedAt = new Date().toISOString();
    await cart.save();

    return buildCartResponse(cart, guestCartId);
  } catch (error) {
    console.error("[cart] POST failed:", error);
    return NextResponse.json({ error: "Unable to add to cart" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: request.headers });

    const body = await request.json();
    const { lineKey, quantity } = body;

    if (!lineKey) {
      return NextResponse.json({ error: "lineKey is required" }, { status: 400 });
    }

    await bootstrapDatabase();

    if (session?.user) {
      const cart = await CartModel.findOne({ customerId: session.user.id });

      if (!cart) {
        return NextResponse.json({ error: "Cart not found" }, { status: 404 });
      }

      const itemIndex = cart.items.findIndex((item) => item.lineKey === lineKey);

      if (itemIndex === -1) {
        return NextResponse.json({ error: "Item not found in cart" }, { status: 404 });
      }

      const qty = Number(quantity) || 0;
      if (qty < 1) {
        cart.items.splice(itemIndex, 1);
      } else {
        cart.items[itemIndex].quantity = qty;
      }

      cart.updatedAt = new Date().toISOString();
      await cart.save();

      return buildCartResponse(cart, null);
    }

    const guestCartId = getGuestCartId(request);

    if (!guestCartId) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 });
    }

    const cart = await CartModel.findOne({ guestId: guestCartId });

    if (!cart) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 });
    }

    const itemIndex = cart.items.findIndex((item) => item.lineKey === lineKey);

    if (itemIndex === -1) {
      return NextResponse.json({ error: "Item not found in cart" }, { status: 404 });
    }

    const qty = Number(quantity) || 0;
    if (qty < 1) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = qty;
    }

    cart.updatedAt = new Date().toISOString();
    await cart.save();

    return buildCartResponse(cart, guestCartId);
  } catch (error) {
    console.error("[cart] PATCH failed:", error);
    return NextResponse.json({ error: "Unable to update cart" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: request.headers });

    const { searchParams } = new URL(request.url);
    const lineKey = searchParams.get("lineKey");

    await bootstrapDatabase();

    if (session?.user) {
      const cart = await CartModel.findOne({ customerId: session.user.id });

      if (!cart) {
        return NextResponse.json({ success: true });
      }

      if (lineKey) {
        cart.items = cart.items.filter((item) => item.lineKey !== lineKey);
      } else {
        cart.items = [];
      }

      cart.updatedAt = new Date().toISOString();
      await cart.save();

      return buildCartResponse(cart, null);
    }

    const guestCartId = getGuestCartId(request);

    if (!guestCartId) {
      return NextResponse.json({ success: true });
    }

    const cart = await CartModel.findOne({ guestId: guestCartId });

    if (!cart) {
      return NextResponse.json({ success: true });
    }

    if (lineKey) {
      cart.items = cart.items.filter((item) => item.lineKey !== lineKey);
    } else {
      cart.items = [];
    }

    cart.updatedAt = new Date().toISOString();
    await cart.save();

    return buildCartResponse(cart, guestCartId);
  } catch (error) {
    console.error("[cart] DELETE failed:", error);
    return NextResponse.json({ error: "Unable to clear cart" }, { status: 500 });
  }
}