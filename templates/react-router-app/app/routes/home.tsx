import { StarterHome } from "@/components/starter-home";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "HonestUI React Router Starter" },
    {
      name: "description",
      content: "A React Router starter preloaded with the HonestUI registry.",
    },
  ];
}

export default function Home() {
  return <StarterHome framework="React Router" />;
}
