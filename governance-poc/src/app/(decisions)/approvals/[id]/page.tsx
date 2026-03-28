"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type { Role, DecisionRequest, ApprovalLog } from "@/types/decisions";

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "approved":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>;
    case "rejected":
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>;
    default:
      return <Badge variant="secondary">Pending</Badge>;
  }
}

export default function DecisionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [decision, setDecision] = useState<DecisionRequest | null>(null);
  const [logs, setLogs] = useState<ApprovalLog[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [actorRoleId, setActorRoleId] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/decisions/${id}`).then((r) => r.json()),
      fetch("/api/roles").then((r) => r.json()),
    ]).then(([decisionData, rolesData]) => {
      setDecision(decisionData.decision);
      setLogs(decisionData.logs || []);
      setRoles(rolesData);
      setLoading(false);
    });
  }, [id]);

  async function handleAction(action: "approved" | "rejected") {
    if (!actorRoleId) return;
    setProcessing(true);

    const res = await fetch(`/api/decisions/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        actor_role_id: actorRoleId,
        notes: notes || null,
      }),
    });

    if (res.ok) {
      const updated = await res.json();
      setDecision(updated);

      const logsRes = await fetch(`/api/decisions/${id}`);
      const logsData = await logsRes.json();
      setLogs(logsData.logs || []);
      setNotes("");
    }

    setProcessing(false);
  }

  function getRoleName(roleId: string | null) {
    if (!roleId) return "—";
    const role = roles.find((r) => r.id === roleId);
    return role ? `${role.name} (${role.designation})` : "—";
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString();
  }

  function formatCurrency(val: number | null) {
    if (val === null || val === undefined) return "—";
    return `$${val.toLocaleString()}`;
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading decision...</p>;
  }

  if (!decision) {
    return <p className="text-destructive">Decision not found.</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.push("/approvals")}>
          &larr; Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{decision.title}</h1>
          <p className="text-muted-foreground">Decision Detail</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Request Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <StatusBadge status={decision.status} />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Domain</span>
              <span className="font-medium">{decision.domain}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Action Type</span>
              <span className="font-medium">{decision.action_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Value</span>
              <span className="font-medium">{formatCurrency(decision.value)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Submitted By</span>
              <span className="font-medium">
                {getRoleName(decision.submitted_by_role_id)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Submitted At</span>
              <span className="text-sm">{formatDate(decision.created_at)}</span>
            </div>
            {decision.description && (
              <>
                <Separator />
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Description</p>
                  <p className="text-sm">{decision.description}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Routing Result</CardTitle>
            <CardDescription>AI agent routing decision</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Routed To</span>
              <span className="font-semibold">
                {getRoleName(decision.routed_to_role_id)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Co-sign</span>
              <span className="font-medium">
                {decision.cosign_role_id
                  ? getRoleName(decision.cosign_role_id)
                  : "None"}
              </span>
            </div>
            <Separator />
            <div>
              <p className="text-muted-foreground text-sm mb-1">Agent Reasoning</p>
              <p className="text-sm bg-muted p-3 rounded-md">
                {decision.agent_reasoning}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {decision.status === "pending" && (
        <Card>
          <CardHeader>
            <CardTitle>Take Action</CardTitle>
            <CardDescription>Approve or reject this decision request.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Acting As</Label>
                <Select value={actorRoleId} onValueChange={(v) => setActorRoleId(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name} ({role.designation})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  placeholder="Add a note about your decision..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => handleAction("approved")}
                disabled={!actorRoleId || processing}
                className="bg-green-600 hover:bg-green-700"
              >
                {processing ? "Processing..." : "Approve"}
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleAction("rejected")}
                disabled={!actorRoleId || processing}
              >
                {processing ? "Processing..." : "Reject"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Audit Log</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-muted-foreground">No audit log entries yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge
                        variant={
                          log.action === "approved"
                            ? "default"
                            : log.action === "rejected"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>{getRoleName(log.actor_role_id)}</TableCell>
                    <TableCell className="max-w-[300px]">
                      {log.notes || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(log.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
