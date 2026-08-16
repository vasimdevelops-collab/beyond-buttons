import "./studio.css";

/**
 * Outer Studio shell — wraps /studio.admins/login (public) and every protected
 * module route. Authentication + role enforcement live in
 * app/(studio)/studio.admins/(protected)/layout.js, a server component that
 * verifies the session before rendering any protected page.
 */
export default function StudioLayout({ children }) {
  return children;
}
