import localFont from "next/font/local";

export const helveticaNeue = localFont({
  src: [
    {
      path: "../public/helvetica-neue-55-cdnfonts/HelveticaNeue-Roman.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/helvetica-neue-55-cdnfonts/HelveticaNeueItalic.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../public/helvetica-neue-55-cdnfonts/HelveticaNeueMedium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/helvetica-neue-55-cdnfonts/HelveticaNeueBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/helvetica-neue-55-cdnfonts/HelveticaNeueBold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/helvetica-neue-55-cdnfonts/HelveticaNeueBoldItalic.ttf",
      weight: "700",
      style: "italic",
    },
    {
      path: "../public/helvetica-neue-55-cdnfonts/HelveticaNeue-Heavy.otf",
      weight: "800",
      style: "normal",
    },
    {
      path: "../public/helvetica-neue-55-cdnfonts/HelveticaNeue-Black.otf",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-helvetica",
  display: "swap",
});
