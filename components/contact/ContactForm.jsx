"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

const INITIAL_STATE = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

const SUBJECT_OPTIONS = [
  { value: "general", label: "General Inquiry" },
  { value: "order", label: "Order Related" },
  { value: "wholesale", label: "Wholesale / B2B" },
  { value: "styling", label: "Styling Advice" },
  { value: "other", label: "Other" },
];

export default function ContactForm() {
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");
  const [submitMessage, setSubmitMessage] = useState("");

  function validate(field, value) {
    switch (field) {
      case "name":
        return value.trim().length < 2 ? "Name must be at least 2 characters" : "";
      case "email":
        return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "Enter a valid email address" : "";
      case "phone":
        return value && !/^[\d\s\-\+\(\)]{10,}$/.test(value) ? "Enter a valid phone number" : "";
      case "subject":
        return !value ? "Please select a subject" : "";
      case "message":
        return value.trim().length < 10 ? "Message must be at least 10 characters" : "";
      default:
        return "";
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    const error = validate(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  }

  function handleBlur(event) {
    const { name, value } = event.target;
    const error = validate(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const newErrors = {};
    let hasErrors = false;
    Object.keys(formData).forEach((key) => {
      const error = validate(key, formData[key]);
      if (error) {
        newErrors[key] = error;
        hasErrors = true;
      }
    });

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    setStatus("submitting");
    setSubmitMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      setStatus("success");
      setSubmitMessage(data.message || "Thanks! We'll get back to you within 72 hours.");
      setFormData(INITIAL_STATE);
    } catch (err) {
      setStatus("error");
      setSubmitMessage(err.message);
    }
  }

  const inputClass = "contact-form__input";

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      <div className="contact-form__grid">
        <div className="contact-form__field">
          <label htmlFor="name" className="contact-form__label">
            Full Name <span className="contact-form__required">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            className={`${inputClass} ${errors.name ? "contact-form__input--error" : ""}`}
            value={formData.name}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            autoComplete="name"
            disabled={status === "submitting"}
          />
          {errors.name && <p className="contact-form__error">{errors.name}</p>}
        </div>

        <div className="contact-form__field">
          <label htmlFor="email" className="contact-form__label">
            Email <span className="contact-form__required">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            className={`${inputClass} ${errors.email ? "contact-form__input--error" : ""}`}
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            autoComplete="email"
            disabled={status === "submitting"}
          />
          {errors.email && <p className="contact-form__error">{errors.email}</p>}
        </div>

        <div className="contact-form__field">
          <label htmlFor="phone" className="contact-form__label">
            Phone (WhatsApp) <span className="contact-form__hint">— for quick assessment</span>
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            className={`${inputClass} ${errors.phone ? "contact-form__input--error" : ""}`}
            value={formData.phone}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="+91 98765 43210"
            autoComplete="tel"
            disabled={status === "submitting"}
          />
          {errors.phone && <p className="contact-form__error">{errors.phone}</p>}
        </div>

        <div className="contact-form__field">
          <label htmlFor="subject" className="contact-form__label">
            Subject <span className="contact-form__required">*</span>
          </label>
          <select
            id="subject"
            name="subject"
            className={`${inputClass} ${errors.subject ? "contact-form__input--error" : ""}`}
            value={formData.subject}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            disabled={status === "submitting"}
          >
            <option value="">Select a topic</option>
            {SUBJECT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {errors.subject && <p className="contact-form__error">{errors.subject}</p>}
        </div>

        <div className="contact-form__field contact-form__field--full">
          <label htmlFor="message" className="contact-form__label">
            Message <span className="contact-form__required">*</span>
          </label>
          <textarea
            id="message"
            name="message"
            className={`${inputClass} ${errors.message ? "contact-form__input--error" : ""}`}
            value={formData.message}
            onChange={handleChange}
            onBlur={handleBlur}
            rows={5}
            required
            disabled={status === "submitting"}
          />
          {errors.message && <p className="contact-form__error">{errors.message}</p>}
        </div>
      </div>

      {status !== "idle" && (
        <div className={`contact-form__status contact-form__status--${status}`} role="alert">
          {status === "submitting" && <Loader2 className="contact-form__spinner" size={20} />}
          {status === "success" && <CheckCircle className="contact-form__icon" size={20} />}
          {status === "error" && <AlertCircle className="contact-form__icon" size={20} />}
          <span>{submitMessage}</span>
        </div>
      )}

      <button
        type="submit"
        className="contact-form__submit"
        disabled={status === "submitting"}
      >
        {status === "submitting" ? (
          <>
            <Loader2 className="contact-form__spinner" size={20} />
            Sending...
          </>
        ) : (
          "Send Message"
        )}
      </button>
    </form>
  );
}