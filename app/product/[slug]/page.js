import { notFound } from "next/navigation";

import Navbar from "@/components/layout/Navbar";
import ProductDetails from "@/components/product/ProductDetails";
import ProductEditorial from "@/components/product/ProductEditorial";
import QuickHighlights from "@/components/product/QuickHighlights";
import InteractiveFit from "@/components/product/InteractiveFit";
import {
  getProductBySlugServer,
  getProductPageModelServer,
  getProductsServer,
  getSettingsServer,
} from "@/lib/data";

export async function generateStaticParams() {
  const products = await getProductsServer();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await getProductPageModelServer(slug);
  const settings = await getSettingsServer();

  return {
    title: product
      ? `${product.name} — ${settings.brandName || "Beyond Buttons"}`
      : `${settings.metaTitle || "Product"}`,
    description: product?.lead || settings.metaDescription,
  };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const product = await getProductPageModelServer(slug);
  const source = await getProductBySlugServer(slug);

  if (!product || !source) {
    notFound();
  }

  const fit = source.fit || source.interactiveFit || null;

  return (
    <>
      <Navbar />
      <main>
        <ProductDetails product={product} />
        <ProductEditorial
          slug={product.slug}
          name={product.name}
          signatureDetails={product.signatureDetails}
          story={product.story || source.storyText || source.brandStatement || ""}
          gallery={product.gallery}
          fabric={product.fabric}
        />
        <QuickHighlights
          fabric={source.fabric}
          highlights={source.highlights}
          fit={fit}
        />
        <InteractiveFit fit={fit} productName={product.name} />
      </main>
    </>
  );
}
