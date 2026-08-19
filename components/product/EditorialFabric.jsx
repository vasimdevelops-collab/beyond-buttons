"use client";

const FABRIC_FIELDS = ["material", "gsm", "finish", "origin"];

function hasValue(value) {
  return value != null && String(value).trim() !== "";
}

function formatLabel(value) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function EditorialFabric({ fabric }) {
  const metrics = FABRIC_FIELDS.map((key) => ({
    key,
    label: formatLabel(key),
    value: fabric?.[key],
  })).filter((metric) => hasValue(metric.value));

  if (!metrics.length) return null;

  return (
    <section
      className="product-editorial__section editorial-fabric"
      aria-labelledby="editorial-fabric-title"
      data-editorial-section
    >
      <header className="product-editorial__header editorial-fabric__header">
        <span className="product-editorial__eyebrow" data-editorial-reveal>
          Composition
        </span>
        <h2 id="editorial-fabric-title" data-editorial-reveal>
          The Fabric
        </h2>
      </header>

      <dl className="editorial-fabric__metrics">
        {metrics.map((metric, index) => (
          <div
            className="editorial-fabric__metric"
            key={metric.key}
            data-editorial-reveal
          >
            <dt>{metric.label}</dt>
            <dd>{String(metric.value)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
