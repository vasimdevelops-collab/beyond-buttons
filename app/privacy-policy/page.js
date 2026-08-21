import LegalPage from "@/components/legal/LegalPage";
import { meta, sections } from "@/data/legal/privacy";

export const metadata = {
  title: "Privacy Policy — Beyond Buttons",
  description:
    "How Beyond Buttons collects, uses, stores and protects your personal data when you visit or shop on our website.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title={meta.title}
      lead="This Privacy Policy explains how Beyond Buttons collects, uses, stores and protects your personal data when you visit, browse or shop on our website."
      updated={meta.effectiveDate}
      sections={sections}
      toc
    />
  );
}