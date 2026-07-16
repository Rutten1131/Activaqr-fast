import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import { Viewport } from 'next'
import "./globals.css";
import Script from "next/script";
import PWARegistration from "@/components/PWARegistration";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { HeaderWrapper, FooterWrapper, WhatsAppWidgetWrapper } from "@/components/LayoutWrapper";

export const viewport: Viewport = {
  themeColor: '#002B49',
  width: 'device-width',
  initialScale: 1,
}

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["800"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.activaqr.com'),
  title: "ActivaQR - Tu Contacto Profesional en 1 Clic",
  description: "Deja de perder trabajos porque olviden cómo te registraron. Configuramos tu contacto estratégico para que siempre aparezcas primero.",
  openGraph: {
    title: "ActivaQR - Tu Contacto Profesional en 1 Clic",
    description: "Deja de ser un número anónimo. Asegura que tus clientes siempre te encuentren con tu foto y profesión.",
    url: "https://www.activaqr.com",
    siteName: "ActivaQR",
    locale: "es_EC",
    type: "website",
    images: [
      {
        url: '/images/og-preview.jpg',
        width: 1200,
        height: 630,
        alt: 'ActivaQR Preview',
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ActivaQR - Tu Contacto Profesional en 1 Clic",
    description: "Deja de perder trabajos porque olviden cómo te registraron.",
    images: ['/images/og-preview.jpg'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/images/logo.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ActivaQR',
  },
  formatDetection: {
    telephone: false,
  },
  alternates: {
    canonical: 'https://www.activaqr.com',
  },
  verification: {
    google: "C2O4fJj326ms7H7Tl3_lsdfGcTvbGomwgR84STld7bI",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${montserrat.variable} font-sans antialiased bg-background text-foreground`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "ActivaQR",
              "url": "https://www.activaqr.com",
              "applicationCategory": "BusinessApplication",
              "offers": {
                "@type": "Offer",
                "price": "35",
                "priceCurrency": "USD"
              },
              "description": "Tu contacto profesional en 1 clic. Siempre aparece primero en el teléfono de tus clientes.",
              "operatingSystem": "Web",
              "brand": {
                "@type": "Brand",
                "name": "ActivaQR"
              }
            })
          }}
        />
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}');
            `,
          }}
        />
        <PWARegistration />
        <HeaderWrapper />
        {children}
        <FooterWrapper />

        <WhatsAppWidgetWrapper />
      </body>
    </html>
  );
}
