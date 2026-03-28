"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
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

export default function ApprovalsPage() {
  const [decisions, setDecisions] = useState<DecisionRequest[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [logs, setLogs] = useState<ApprovalLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/decisions").then((r) => r.json()),
      fetch("/api/roles").then((r) => r.json()),
      fetch("/api/approval-logs").then((r) => r.json()),
    ]).then(([decisionsData, rolesData, logsData]) => {
      setDecisions(decisionsData);
      setRoles(rolesData);
      setLogs(logsData);
      setLoading(false);
    });
  }, []);

  function getRoleName(id: string | null) {
    if (!id) return "—";
    const role = roles.find((r) => r.id === id);
    return role ? role.name : "—";
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString();
  }

  function formatCurrency(val: number | null) {
    if (val === null || val === undefined) return "—";
    return `$${val.toLocaleString()}`;
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading decisions...</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Approvals Inbox</h1>
        <p className="text-muted-foreground">
          Review all decision requests. Click a row to view details and take action.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Decisions</CardTitle>
        </CardHeader>
        <CardContent>
          {decisions.length === 0 ? (
            <p className="text-muted-foreground">
              No decisions submitted yet.{" "}
              <Link href="/submit" className="text-primary underline">
                Submit one
              </Link>
              .
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Domain</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Submitted By</TableHead>
                    <TableHead>Routed To</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {decisions.map((d) => (
                    <TableRow key={d.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <Link
                          href={`/approvals/${d.id}`}
                          className="font-medium text-primary underline-offset-4 hover:underline"
                        >
                          {d.title}
                        </Link>
                      </TableCell>
                      <TableCell>{d.domain}</TableCell>
                      <TableCell>{formatCurrency(d.value)}</TableCell>
                      <TableCell>{getRoleName(d.submitted_by_role_id)}</TableCell>
                      <TableCell>{getRoleName(d.routed_to_role_id)}</TableCell>
                      <TableCell>
                        <StatusBadge status={d.status} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(d.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Audit Log</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-muted-foreground">No audit log entries yet.</p>
          ) : (
            <div className="overflow-x-auto">
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
                      <TableCell className="max-w-[300px] truncate">
                        {log.notes || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(log.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
