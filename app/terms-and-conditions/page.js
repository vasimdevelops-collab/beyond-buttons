import LegalPage from "@/components/legal/LegalPage";
import { meta, sections } from "@/data/legal/terms";

export const metadata = {
  title: "Terms & Conditions — Beyond Buttons",
  description:
    "The terms that govern your use of the Beyond Buttons platform and your purchases from our store.",
};

export default function TermsAndConditionsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title={meta.title}
      lead="By accessing, browsing, registering on, purchasing from, or otherwise using the Beyond Buttons platform, you agree to these Terms & Conditions, together with our Privacy Policy and Return & Exchange Policy."
      updated={meta.effectiveDate}
      sections={sections}
      toc
    />
  );
}