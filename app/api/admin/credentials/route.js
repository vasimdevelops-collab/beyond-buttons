import { NextResponse } from "next/server";

import { getAdminEmail, updateAdminCredentials } from "@/lib/admin/credentials";
import { requireAdmin } from "@/lib/admin/session";

/**
 * GET  /api/admin/credentials — current admin email
 * PUT  /api/admin/credentials — update admin email / password (needs current password)
 */
export async function GET(request) {
  const guard = requireAdmin(request);
  if (guard.error) return NextResponse.json(guard.error, { status: guard.status });

  try {
    return NextResponse.json({ email: await getAdminEmail() });
  } catch (error) {
    console.error("[admin/credentials] GET failed:", error?.message || error);
    return NextResponse.json({ error: "Unable to load admin credentials." }, { status: 500 });
  }
}

export async function PUT(request) {
  const guard = requireAdmin(request);
  if (guard.error) return NextResponse.json(guard.error, { status: guard.status });

  try {
    const body = await request.json().catch(() => ({}));
    const result = await updateAdminCredentials(body);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }
    return NextResponse.json({ success: true, email: result.email });
  } catch (error) {
    console.error("[admin/credentials] PUT failed:", error?.message || error);
    return NextResponse.json({ error: "Unable to update admin credentials." }, { status: 500 });
  }
}