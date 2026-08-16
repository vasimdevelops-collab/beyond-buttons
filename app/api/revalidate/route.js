import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

/**
 * Revalidation API - Triggers Next.js ISR to update cached pages
 * when admin makes changes
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { path, tag, type = "path" } = body;

    // Revalidate specific path
    if (type === "path" && path) {
      revalidatePath(path);
      return NextResponse.json({ 
        revalidated: true, 
        path,
        message: `Revalidated path: ${path}`,
        now: Date.now() 
      });
    }

    // Revalidate by tag
    if (type === "tag" && tag) {
      revalidateTag(tag);
      return NextResponse.json({ 
        revalidated: true, 
        tag,
        message: `Revalidated tag: ${tag}`,
        now: Date.now() 
      });
    }

    // Default: Revalidate common pages
    const commonPaths = [
      "/",
      "/shop",
      "/about",
      "/contact",
    ];

    commonPaths.forEach((p) => revalidatePath(p));

    return NextResponse.json({
      revalidated: true,
      paths: commonPaths,
      message: "Revalidated all common pages",
      now: Date.now(),
    });
  } catch (error) {
    console.error("[revalidate] Error:", error);
    return NextResponse.json(
      { error: "Failed to revalidate", details: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint to manually trigger revalidation
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");
    const secret = searchParams.get("secret");

    // Optional: Add secret token protection
    if (process.env.REVALIDATE_SECRET && secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
    }

    if (path) {
      revalidatePath(path);
      return NextResponse.json({ 
        revalidated: true, 
        path,
        message: `Revalidated: ${path}` 
      });
    }

    // Revalidate homepage by default
    revalidatePath("/");
    return NextResponse.json({ 
      revalidated: true, 
      path: "/",
      message: "Revalidated homepage" 
    });
  } catch (error) {
    console.error("[revalidate] GET Error:", error);
    return NextResponse.json(
      { error: "Failed to revalidate" },
      { status: 500 }
    );
  }
}
