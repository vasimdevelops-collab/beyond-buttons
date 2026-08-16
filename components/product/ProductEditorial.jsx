"use client";

import { useRef } from "react";

import SignatureDetails from "./SignatureDetails";
import EditorialCraft from "./EditorialCraft";
import EditorialFabric from "./EditorialFabric";
import useEditorialTimeline from "@/lib/animations/useEditorialTimeline";
import "./product-editorial.css";

export default function ProductEditorial({
  slug = "",
  name = "",
  signatureDetails = [],
  story = "",
  gallery = [],
  fabric = null,
}) {
  const rootRef = useRef(null);
  useEditorialTimeline(rootRef, slug);

  return (
    <div
      ref={rootRef}
      className="product-editorial"
      aria-label={`${name} editorial`}
    >
      <SignatureDetails details={signatureDetails} />
      <EditorialCraft story={story} gallery={gallery} productName={name} />
      <EditorialFabric fabric={fabric} />
    </div>
  );
}
