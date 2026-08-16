"use client";

function hasValue(value) {
  if (value == null || value === "") return false;
  if (Array.isArray(value)) return value.some(hasValue);
  if (typeof value === "object") return Object.values(value).some(hasValue);
  return true;
}

function formatLabel(value) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatValue(value) {
  if (Array.isArray(value)) return value.filter(hasValue).join(" · ");
  if (typeof value === "object" && value) {
    return Object.values(value).filter(hasValue).join(" · ");
  }
  return String(value);
}

function DetailCard({ detail, index }) {
  if (typeof detail !== "object" || detail == null) {
    return (
      <article className="signature-card" data-editorial-reveal>
        <span className="signature-card__index">
          {String(index + 1).padStart(2, "0")}
        </span>
        <strong className="signature-card__value">{String(detail)}</strong>
      </article>
    );
  }

  const entries = Object.entries(detail).filter(([, value]) => hasValue(value));
  if (!entries.length) return null;

  return (
    <article className="signature-card" data-editorial-reveal>
      <span className="signature-card__index">
        {String(index + 1).padStart(2, "0")}
      </span>
      <dl className="signature-card__data">
        {entries.map(([key, value]) => (
          <div key={key}>
            <dt>{formatLabel(key)}</dt>
            <dd>{formatValue(value)}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

export default function SignatureDetails({ details = [] }) {
  const visibleDetails = details.filter(hasValue);
  if (!visibleDetails.length) return null;

  return (
    <section
      className="product-editorial__section signature-details"
      aria-labelledby="signature-details-title"
      data-editorial-section
    >
      <header className="product-editorial__header">
        <span className="product-editorial__eyebrow" data-editorial-reveal>
          Signature
        </span>
        <h2 id="signature-details-title" data-editorial-reveal>
          Signature Details
        </h2>
      </header>

      <div className="signature-details__grid">
        {visibleDetails.map((detail, index) => (
          <DetailCard
            key={
              typeof detail === "object"
                ? `${index}-${Object.keys(detail).join("-")}`
                : `${index}-${detail}`
            }
            detail={detail}
            index={index}
          />
        ))}
      </div>
    </section>
  );
}
