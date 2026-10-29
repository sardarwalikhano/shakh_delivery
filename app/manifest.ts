import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Shakh Delivery",
    short_name: "Shakh",
    description: "خواردن، سوپەرمارکێت، سەوزە و میوە بە ئاسانی داوا بکە.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#fcfaff",
    theme_color: "#7c3aed",
    lang: "ckb",
    dir: "rtl",
    categories: ["food", "shopping"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }
    ]
  };
}
