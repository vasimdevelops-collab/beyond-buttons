import { sendTransactionalEmail } from "@/lib/email/smtp";
import { bootstrapDatabase } from "@/lib/database/register";
import { ContactModel } from "@/lib/database/models";

const REQUIRED_FIELDS = ["name", "email", "subject", "message"];

export async function POST(request) {
  try {
    const body = await request.json();

    for (const field of REQUIRED_FIELDS) {
      if (!body[field] || !String(body[field]).trim()) {
        return Response.json(
          { error: `${field.charAt(0).toUpperCase() + field.slice(1)} is required` },
          { status: 400 }
        );
      }
    }

    if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return Response.json({ error: "Invalid email format" }, { status: 400 });
    }

    await bootstrapDatabase();

    // Save to MongoDB
    const contact = await ContactModel.create({
      name: body.name,
      email: body.email,
      phone: body.phone,
      subject: body.subject,
      message: body.message,
    });

    const subjectMap = {
      general: "General Inquiry",
      order: "Order Related",
      wholesale: "Wholesale / B2B",
      styling: "Styling Advice",
      other: "Other",
    };

    const subjectLabel = subjectMap[body.subject] || body.subject;

    const emailHtml = `
      <h2 style="margin:0 0 16px;font-size:20px;color:#111;">New Contact Form Submission</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px 0;font-weight:600;color:#555;width:120px;">Name:</td><td style="padding:8px 0;color:#111;">${escapeHtml(body.name)}</td></tr>
        <tr><td style="padding:8px 0;font-weight:600;color:#555;">Email:</td><td style="padding:8px 0;color:#111;">${escapeHtml(body.email)}</td></tr>
        <tr><td style="padding:8px 0;font-weight:600;color:#555;">Phone:</td><td style="padding:8px 0;color:#111;">${escapeHtml(body.phone || "—")}</td></tr>
        <tr><td style="padding:8px 0;font-weight:600;color:#555;">Subject:</td><td style="padding:8px 0;color:#111;">${escapeHtml(subjectLabel)}</td></tr>
      </table>
      <div style="margin-top:24px;padding:16px;background:#fafafa;border-radius:8px;border:1px solid #e5e5e5;">
        <p style="margin:0 0 8px;font-weight:600;color:#555;">Message:</p>
        <p style="margin:0;color:#111;white-space:pre-wrap;">${escapeHtml(body.message)}</p>
      </div>
    `;

    try {
      await sendTransactionalEmail({
        to: "hello@beyondbuttons.in",
        subject: `[Beyond Buttons Contact] ${subjectLabel} — ${body.name}`,
        html: emailHtml,
        text: `New contact form submission\n\nName: ${body.name}\nEmail: ${body.email}\nPhone: ${body.phone || "—"}\nSubject: ${subjectLabel}\n\nMessage:\n${body.message}`,
      });
    } catch (emailErr) {
      console.error("[contact] Email sending failed but data was saved:", emailErr);
      // We still return success because it was saved to DB
    }

    return Response.json({ 
      message: "Thanks! We'll get back to you within 24 hours.",
      id: contact._id 
    });
  } catch (err) {
    console.error("[contact] Error:", err);
    return Response.json({ error: "Failed to send message. Please try again later." }, { status: 500 });
  }
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}