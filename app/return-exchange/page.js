import LegalPage from "@/components/legal/LegalPage";
import { meta, sections } from "@/data/legal/returns";

export const metadata = {
  title: "Return & Exchange Policy — Beyond Buttons",
  description:
    "Beyond Buttons returns and size exchanges within 7 calendar days of delivery, prepaid-only ordering, and our inspection process.",
};

export default function ReturnExchangePage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title={meta.title}
      lead="We want you to be completely confident in what you purchase. This policy explains when and how you can request a return or exchange, what condition the product must be in, and how our inspection process works."
      updated={meta.effectiveDate}
      sections={sections}
      toc
    />
  );
}