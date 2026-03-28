"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Textarea } from "@/components/ui/textarea";
import type { Role, DoARule } from "@/types/decisions";

export default function DoAPage() {
  const [rules, setRules] = useState<DoARule[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [domain, setDomain] = useState("");
  const [actionType, setActionType] = useState("");
  const [minThreshold, setMinThreshold] = useState("");
  const [maxThreshold, setMaxThreshold] = useState("");
  const [approvingRoleId, setApprovingRoleId] = useState("");
  const [cosignRoleId, setCosignRoleId] = useState("");
  const [notes, setNotes] = useState("");

  async function fetchData() {
    const [rulesRes, rolesRes] = await Promise.all([
      fetch("/api/doa"),
      fetch("/api/roles"),
    ]);
    const [rulesData, rolesData] = await Promise.all([
      rulesRes.json(),
      rolesRes.json(),
    ]);
    setRules(rulesData);
    setRoles(rolesData);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    await fetch("/api/doa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        domain,
        action_type: actionType,
        min_threshold: parseFloat(minThreshold) || 0,
        max_threshold: maxThreshold ? parseFloat(maxThreshold) : null,
        approving_role_id: approvingRoleId,
        cosign_role_id: cosignRoleId || null,
        notes: notes || null,
      }),
    });

    setDomain("");
    setActionType("");
    setMinThreshold("");
    setMaxThreshold("");
    setApprovingRoleId("");
    setCosignRoleId("");
    setNotes("");
    setSubmitting(false);
    fetchData();
  }

  function getRoleName(id: string | null) {
    if (!id) return "—";
    const role = roles.find((r) => r.id === id);
    return role ? role.name : "—";
  }

  function formatCurrency(val: number | null) {
    if (val === null || val === undefined) return "No limit";
    return `$${val.toLocaleString()}`;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Delegation of Authority Matrix
        </h1>
        <p className="text-muted-foreground">
          Configure approval rules — who can approve what, up to which threshold.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Rule</CardTitle>
          <CardDescription>Create a new DoA rule.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="domain">Domain</Label>
              <Input
                id="domain"
                placeholder="e.g. Finance"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="action_type">Action Type</Label>
              <Input
                id="action_type"
                placeholder="e.g. Approve Expense"
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="min_threshold">Min Threshold ($)</Label>
              <Input
                id="min_threshold"
                type="number"
                placeholder="0"
                value={minThreshold}
                onChange={(e) => setMinThreshold(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_threshold">Max Threshold ($)</Label>
              <Input
                id="max_threshold"
                type="number"
                placeholder="Leave empty for no limit"
                value={maxThreshold}
                onChange={(e) => setMaxThreshold(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="approving_role">Approving Role</Label>
              <Select value={approvingRoleId} onValueChange={(v) => setApprovingRoleId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
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
              <Label htmlFor="cosign_role">Co-sign Role (optional)</Label>
              <Select value={cosignRoleId} onValueChange={(v) => setCosignRoleId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name} ({role.designation})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2 lg:col-span-3">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Optional notes about this rule"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Adding..." : "Add Rule"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Rules</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading rules...</p>
          ) : rules.length === 0 ? (
            <p className="text-muted-foreground">No rules found. Add one above.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Domain</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Min</TableHead>
                    <TableHead>Max</TableHead>
                    <TableHead>Approver</TableHead>
                    <TableHead>Co-sign</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.domain}</TableCell>
                      <TableCell>{rule.action_type}</TableCell>
                      <TableCell>{formatCurrency(rule.min_threshold)}</TableCell>
                      <TableCell>{formatCurrency(rule.max_threshold)}</TableCell>
                      <TableCell>{getRoleName(rule.approving_role_id)}</TableCell>
                      <TableCell>{getRoleName(rule.cosign_role_id)}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {rule.notes || "—"}
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
