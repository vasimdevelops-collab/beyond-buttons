"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

import { toast } from "@/components/toast/toast-store";

export default function StudioLoginPage() {
  return (
    <Suspense fallback={null}>
      <StudioLoginForm />
    </Suspense>
  );
}

function StudioLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const denied = searchParams.get("denied") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || "Invalid email or password.");
        toast.error(data?.error || "Invalid email or password");
        setSubmitting(false);
        return;
      }

      toast.success("Welcome back");
      router.replace("/studio.admins");
      router.refresh();
    } catch {
      setError("Unable to sign in. Please try again.");
      toast.error("Unable to sign in. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <main className="studio-login" aria-label="Beyond Buttons CMS sign in">
      <section className="studio-login__card">
        <Image
          className="studio-login__logo"
          src="/images/logo.png"
          alt="Beyond Buttons"
          width={577}
          height={433}
          sizes="96px"
          priority
        />
        <p className="studio-login__eyebrow">Studio</p>
        <h1 className="studio-login__title">Beyond Buttons CMS</h1>
        <p className="studio-login__copy">
          Secure access for catalog, orders, and brand control. One admin
          account only.
        </p>

        {denied ? (
          <p className="studio-login__note" role="alert">
            Sign in with the admin account to continue.
          </p>
        ) : null}

        <form
          className="studio-login__form"
          onSubmit={handleSubmit}
          aria-describedby="studio-auth-note"
        >
          <div className="studio-login__field">
            <label htmlFor="studio-email">Email</label>
            <input
              id="studio-email"
              name="email"
              type="email"
              autoComplete="username"
              placeholder="admin@beyondbuttons.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={submitting}
              required
            />
          </div>
          <div className="studio-login__field">
            <label htmlFor="studio-password">Password</label>
            <input
              id="studio-password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={submitting}
              required
            />
          </div>
          {error ? (
            <p className="studio-login__note" role="alert">
              {error}
            </p>
          ) : null}
          <button className="studio-login__submit" type="submit" disabled={submitting}>
            {submitting ? "Signing In…" : "Sign In"}
          </button>
        </form>

        <p id="studio-auth-note" className="studio-login__note">
          The Studio is accessible only with the single admin account. Contact
          the site owner if you need access.
        </p>
      </section>
    </main>
  );
}