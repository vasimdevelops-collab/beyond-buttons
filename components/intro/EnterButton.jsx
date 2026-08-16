"use client";

export default function EnterButton({ onClick, className = "" }) {
  return (
    <button
      type="button"
      className={`intro-enter-btn ${className}`.trim()}
      onClick={onClick}
    >
      <span className="intro-enter-btn__label">ENTER NOW</span>
      <span className="intro-enter-btn__shine" aria-hidden="true" />
    </button>
  );
}
