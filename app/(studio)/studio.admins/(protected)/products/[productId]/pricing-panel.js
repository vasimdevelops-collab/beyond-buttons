"use client";

const SIZE_KEYS = ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "Other"];

const EMPTY_PRICING = {
  globalPrice: "",
  comparePrice: "",
  differentPriceForColors: false,
  differentPriceForSizes: false,
  colorPrices: {},
  sizePrices: {},
};

export function createEmptyPricing() {
  return {
    ...EMPTY_PRICING,
    colorPrices: {},
    sizePrices: Object.fromEntries(SIZE_KEYS.map((size) => [size, ""])),
  };
}

/**
 * Pricing architecture — global + optional color/size overrides.
 * Local UI only; no persistence.
 */
export default function PricingPanel({ pricing, colors, onChange }) {
  function patch(partial) {
    onChange({ ...pricing, ...partial });
  }

  function setColorPrice(colorId, value) {
    patch({
      colorPrices: {
        ...pricing.colorPrices,
        [colorId]: value,
      },
    });
  }

  function setSizePrice(size, value) {
    patch({
      sizePrices: {
        ...pricing.sizePrices,
        [size]: value,
      },
    });
  }

  return (
    <section
      className="studio-section"
      data-section="pricing"
      id="editor-panel-pricing"
    >
      <header className="studio-section__header">
        <h2 id="product-pricing-title" className="studio-section__title">
          Pricing
        </h2>
        <p className="studio-section__copy">
          Set the price customers see. Per-color prices are optional extras for
          special cases.
        </p>
      </header>

      <div className="studio-section__fields">
        <label className="studio-field">
          <span className="studio-field__label">Price (₹)</span>
          <input
            type="text"
            inputMode="decimal"
            name="globalPrice"
            value={pricing.globalPrice ?? ""}
            onChange={(event) => patch({ globalPrice: event.target.value })}
            placeholder="0.00"
            autoComplete="off"
          />
        </label>

        <label className="studio-field">
          <span className="studio-field__label">Compare-at Price (₹)</span>
          <input
            type="text"
            inputMode="decimal"
            name="comparePrice"
            value={pricing.comparePrice ?? ""}
            onChange={(event) => patch({ comparePrice: event.target.value })}
            placeholder="0.00"
            autoComplete="off"
          />
          <span className="studio-field__hint">
            Optional — shows a strikethrough original price, like{" "}
            <s>₹1,799</s> ₹1,299. Leave blank for no discount.
          </span>
        </label>

        <label className="studio-field studio-field--check studio-field--full">
          <input
            type="checkbox"
            name="differentPriceForColors"
            checked={Boolean(pricing.differentPriceForColors)}
            onChange={(event) =>
              patch({ differentPriceForColors: event.target.checked })
            }
          />
          <span>
            <span className="studio-field__label">Different price for colors</span>
            <span className="studio-field__hint">
              When enabled, each color can carry its own price.
            </span>
          </span>
        </label>

        {pricing.differentPriceForColors ? (
          <div className="studio-pricing-list studio-field--full" data-kind="colors">
            {colors.length === 0 ? (
              <p className="studio-pricing-list__empty">
                Add colors in &ldquo;Colors &amp; Sizes&rdquo; above to set per-color prices.
              </p>
            ) : (
              colors.map((color) => (
                <label className="studio-field studio-pricing-row" key={color.id}>
                  <span className="studio-pricing-row__label">
                    <span
                      className="studio-color-card__swatch studio-color-card__swatch--sm"
                      style={{ background: color.hex || "#000000" }}
                      aria-hidden="true"
                    />
                    <span>{color.name.trim() || "Untitled color"}</span>
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    name={`color-price-${color.id}`}
                    value={pricing.colorPrices?.[color.id] || ""}
                    onChange={(event) =>
                      setColorPrice(color.id, event.target.value)
                    }
                    placeholder="0.00"
                    autoComplete="off"
                  />
                </label>
              ))
            )}
          </div>
        ) : null}

        <label className="studio-field studio-field--check studio-field--full">
          <input
            type="checkbox"
            name="differentPriceForSizes"
            checked={Boolean(pricing.differentPriceForSizes)}
            onChange={(event) =>
              patch({ differentPriceForSizes: event.target.checked })
            }
          />
          <span>
            <span className="studio-field__label">Different price for sizes</span>
            <span className="studio-field__hint">
              When enabled, each size can carry its own price.
            </span>
          </span>
        </label>

        {pricing.differentPriceForSizes ? (
          <div className="studio-pricing-list studio-field--full" data-kind="sizes">
            {SIZE_KEYS.map((size) => (
              <label className="studio-field studio-pricing-row" key={size}>
                <span className="studio-pricing-row__label">{size}</span>
                <input
                  type="text"
                  inputMode="decimal"
                  name={`size-price-${size}`}
                  value={pricing.sizePrices?.[size] || ""}
                  onChange={(event) => setSizePrice(size, event.target.value)}
                  placeholder="0.00"
                  autoComplete="off"
                />
              </label>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export { SIZE_KEYS };
