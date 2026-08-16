"use client";

function normalizeImage(item) {
  if (typeof item === "string") {
    return { src: item, alt: "" };
  }
  return {
    src: item?.src || "",
    alt: item?.alt || "",
  };
}

export default function EditorialCraft({
  story = "",
  gallery = [],
  productName = "",
}) {
  const narrative = typeof story === "string" ? story.trim() : "";
  if (!narrative) return null;

  const images = gallery.map(normalizeImage).filter((image) => image.src);
  const supportingImage =
    images[1] || images[0] || { src: "/images/homeback.jpeg", alt: "Beyond Buttons" };

  return (
    <section
      className="product-editorial__section editorial-craft"
      aria-labelledby="editorial-craft-title"
      data-editorial-section
    >
      <header className="product-editorial__header editorial-craft__header">
        <span className="product-editorial__eyebrow" data-editorial-reveal>
          Story
        </span>
        <h2 id="editorial-craft-title" data-editorial-reveal>
          The Craft
        </h2>
      </header>

      <div className="editorial-craft__composition">
        <blockquote className="editorial-craft__quote" data-editorial-reveal>
          {narrative}
        </blockquote>

        {supportingImage ? (
          <figure className="editorial-craft__media" data-editorial-media>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={supportingImage.src}
              alt={supportingImage.alt || productName}
            />
            {productName ? <figcaption>{productName}</figcaption> : null}
          </figure>
        ) : null}
      </div>
    </section>
  );
}
