import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    title: "Roles",
    description: "Manage organizational roles and reporting structure",
    href: "/roles",
    detail: "Define CEO, CFO, COO, Regional MDs, and their hierarchy.",
  },
  {
    title: "DoA Matrix",
    description: "Configure Delegation of Authority rules",
    href: "/doa",
    detail: "Set approval thresholds, domains, and co-sign requirements.",
  },
  {
    title: "Submit Decision",
    description: "Submit a decision for AI-powered routing",
    href: "/submit",
    detail: "The AI agent reads the DoA matrix and routes to the right approver.",
  },
  {
    title: "Approvals Inbox",
    description: "Review, approve, or reject routed decisions",
    href: "/approvals",
    detail: "Full audit trail of every action from submission to approval.",
  },
  {
    title: "Meetings",
    description: "Paste notes or upload audio for AI-powered analysis",
    href: "/meetings",
    detail: "Extract action items, resolutions, and summaries from meeting transcripts.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Corporate Governance Decision Routing
        </h1>
        <p className="text-muted-foreground text-lg">
          An AI-powered system that reads your Delegation of Authority matrix, identifies
          the correct approver, and routes decisions — with a full audit trail.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {features.map((feature) => (
          <Card key={feature.href} className="flex flex-col">
            <CardHeader>
              <CardTitle>{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-between gap-4">
              <p className="text-sm text-muted-foreground">{feature.detail}</p>
              <Link
                href={feature.href}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors w-fit"
              >
                Go to {feature.title}
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
