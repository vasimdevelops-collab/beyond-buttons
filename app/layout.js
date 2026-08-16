import "./globals.css";
import "../styles/theme.css";

import { Montserrat, Cormorant_Garamond } from "next/font/google";

import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ThemeInit } from "@/components/theme/ThemeInit";
import { ShopProvider } from "@/lib/shop/ShopContext";
import { CartProvider } from "@/lib/shop/commerce";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-body",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-heading",
});

export const metadata = {
  title: "Beyond Buttons",
  description: "Luxury Solid Shirt Brand",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body
        className={`${montserrat.variable} ${cormorant.variable}`}
      >
        <ThemeInit />
        <CartProvider>
          <ShopProvider>
            <ThemeProvider>{children}</ThemeProvider>
          </ShopProvider>
        </CartProvider>
      </body>
    </html>
  );
}