"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@/components/ui/card";

const starterContents = [
  {
    value: "83",
    label: "public registry entries",
    detail: "Every supported UI and product component is already copied in.",
  },
  {
    value: "104",
    label: "registry source files",
    detail: "UI, animation, shader, chart, and supporting component files.",
  },
  {
    value: "11",
    label: "style modules",
    detail: "HonestUI colors, type, spacing, radii, effects, and primitives.",
  },
] as const;

export function StarterHome({
  framework,
  command = "pnpm dev",
}: {
  framework: string;
  command?: string;
}) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col justify-center gap-10 px-5 py-16 sm:px-8 lg:px-12">
      <header className="max-w-2xl space-y-5">
        <Badge variant="success">Ready to build</Badge>
        <div className="space-y-3">
          <h1>HonestUI for {framework}</h1>
          <p className="max-w-xl text-base leading-7 text-muted-foreground">
            A clean {framework} starting point with HonestUI&apos;s public
            registry, design tokens, local fonts, and compatible dependencies
            already in place.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button render={<a href="https://honestui.com/docs" />}>
            Read the HonestUI docs
          </Button>
          <code className="rounded-md bg-muted px-3 py-2 text-sm">
            {command}
          </code>
        </div>
      </header>

      <section aria-labelledby="starter-contents" className="space-y-4">
        <h2 id="starter-contents" className="text-xl">
          Included in this starter
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {starterContents.map((item) => (
            <Card key={item.label} variant="outline" className="h-full">
              <CardHeader>
                <CardTitle className="text-3xl tabular-nums">
                  {item.value}
                </CardTitle>
                <CardDescription>{item.label}</CardDescription>
              </CardHeader>
              <CardPanel className="text-sm leading-6 text-muted-foreground">
                {item.detail}
              </CardPanel>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
