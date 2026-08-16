import { isValidObjectId } from "mongoose";
import { requireAdmin } from "@/lib/admin/session";
import { bootstrapDatabase } from "@/lib/database/register";
import { ContactModel } from "@/lib/database/models";

const CONTACT_STATUSES = new Set(["unread", "read", "replied", "archived"]);

function serializeContact(doc) {
  if (!doc) return null;
  return {
    id: doc._id?.toString() || doc.id,
    name: doc.name || "",
    email: doc.email || "",
    phone: doc.phone || "",
    subject: doc.subject || "",
    message: doc.message || "",
    status: doc.status || "unread",
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function GET(request) {
  const guard = requireAdmin(request);
  if (guard.error) return Response.json(guard.error, { status: guard.status });
  try {
    await bootstrapDatabase();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const contact = await ContactModel.findById(id).lean().exec();
      if (!contact) {
        return Response.json({ error: "Contact not found" }, { status: 404 });
      }
      return Response.json(serializeContact(contact));
    }

    const contacts = await ContactModel.find().sort({ createdAt: -1 }).lean().exec();
    return Response.json(contacts.map(serializeContact).filter(Boolean));
  } catch (err) {
    console.error("[admin-contacts] GET Error:", err);
    return Response.json({ error: "Failed to fetch contacts" }, { status: 500 });
  }
}

export async function PATCH(request) {
  const guard = requireAdmin(request);
  if (guard.error) return Response.json(guard.error, { status: guard.status });
  try {
    await bootstrapDatabase();
    const body = await request.json();
    const id = body.id || body._id || body.contactId;
    const status = String(body.status || "").toLowerCase();

    if (!id) {
      return Response.json({ error: "Contact ID is required" }, { status: 400 });
    }

    if (!CONTACT_STATUSES.has(status)) {
      return Response.json(
        { error: `Invalid status. Expected one of: ${[...CONTACT_STATUSES].join(", ")}` },
        { status: 400 }
      );
    }

    let contact;
    if (isValidObjectId(id)) {
      contact = await ContactModel.findByIdAndUpdate(id, { status }, { returnDocument: "after" });
    } else {
      contact = await ContactModel.findOneAndUpdate({ id }, { status }, { returnDocument: "after" });
    }

    if (!contact) {
      return Response.json({ error: "Contact not found" }, { status: 404 });
    }

    return Response.json(serializeContact(contact));
  } catch (err) {
    console.error("[admin-contacts] PATCH Error:", err);
    return Response.json({ error: "Failed to update contact" }, { status: 500 });
  }
}

export async function DELETE(request) {
  const guard = requireAdmin(request);
  if (guard.error) return Response.json(guard.error, { status: guard.status });
  try {
    await bootstrapDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json({ error: "ID is required" }, { status: 400 });
    }

    await ContactModel.findByIdAndDelete(id);
    return Response.json({ message: "Contact deleted successfully" });
  } catch (err) {
    console.error("[admin-contacts] DELETE Error:", err);
    return Response.json({ error: "Failed to delete contact" }, { status: 500 });
  }
}
