import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Routina",
    short_name: "Routina",
    description: "Make every day count. A personal habit tracker that stays on your device.",
    start_url: "/",
    display: "standalone",
    background_color: "#F7F8F5",
    theme_color: "#43865A",
  };
}
