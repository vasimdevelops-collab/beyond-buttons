/**
 * Customer auth — client-side form paths & validation helpers.
 * Session/sign-in/sign-out are handled by the Better Auth client
 * (see @/lib/auth/client). This module intentionally has no server logic.
 */

export const AUTH_PATHS = Object.freeze({
  login: "/login",
  register: "/register",
  account: "/account",
  forgotPassword: "/forgot-password",
});

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email) {
  const value = String(email || "").trim();
  if (!value) return "Email is required.";
  if (!EMAIL_PATTERN.test(value)) return "Enter a valid email address.";
  return "";
}

export function validatePassword(password, { min = 8 } = {}) {
  const value = String(password || "");
  if (!value) return "Password is required.";
  if (value.length < min) return `Password must be at least ${min} characters.`;
  return "";
}

export function validateName(name) {
  const value = String(name || "").trim();
  if (!value) return "Name is required.";
  if (value.length < 2) return "Enter your full name.";
  return "";
}

export function validateLoginForm({ email, password }) {
  return {
    email: validateEmail(email),
    password: validatePassword(password),
  };
}

export function validateRegisterForm({ name, email, password, confirmPassword }) {
  const errors = {
    name: validateName(name),
    email: validateEmail(email),
    password: validatePassword(password),
    confirmPassword: "",
  };

  if (!errors.password && password !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  } else if (!confirmPassword) {
    errors.confirmPassword = "Confirm your password.";
  }

  return errors;
}

export function validateForgotPasswordForm({ email }) {
  return { email: validateEmail(email) };
}

export function hasFormErrors(errors) {
  return Object.values(errors).some(Boolean);
}
