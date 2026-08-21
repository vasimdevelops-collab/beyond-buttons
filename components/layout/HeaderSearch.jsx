"use client";

import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

export default function HeaderSearch() {
  const router = useRouter();

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const query = formData.get("q")?.toString().trim() || "";
    if (query) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <form className="header-search" onSubmit={handleSubmit}>
      <div className="header-search__input">
        <Search aria-hidden="true" size={16} strokeWidth={1.5} />
        <input
          type="search"
          name="q"
          placeholder="Search products"
          aria-label="Search products"
          autoComplete="off"
        />
      </div>
    </form>
  );
}