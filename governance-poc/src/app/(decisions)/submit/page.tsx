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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Role, DecisionRequest } from "@/types/decisions";

export default function SubmitPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<DecisionRequest | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [domain, setDomain] = useState("");
  const [actionType, setActionType] = useState("");
  const [value, setValue] = useState("");
  const [submittedByRoleId, setSubmittedByRoleId] = useState("");

  useEffect(() => {
    fetch("/api/roles")
      .then((res) => res.json())
      .then((data) => {
        setRoles(data);
        setLoading(false);
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          domain,
          action_type: actionType,
          value: value ? parseFloat(value) : null,
          submitted_by_role_id: submittedByRoleId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit decision");
      }

      const decision = await res.json();
      setResult(decision);

      setTitle("");
      setDescription("");
      setDomain("");
      setActionType("");
      setValue("");
      setSubmittedByRoleId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  function getRoleName(id: string | null) {
    if (!id) return "None";
    const role = roles.find((r) => r.id === id);
    return role ? `${role.name} (${role.designation})` : "Unknown";
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Submit Decision</h1>
        <p className="text-muted-foreground">
          Submit a decision request for AI-powered routing based on the DoA matrix.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Decision Request</CardTitle>
          <CardDescription>
            Fill in the details. The AI agent will determine the correct approver.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading roles...</p>
          ) : (
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g. Vendor payment approval"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the decision request in detail..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Select value={domain} onValueChange={(v) => setDomain(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select domain" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                    <SelectItem value="IT">IT</SelectItem>
                    <SelectItem value="Legal">Legal</SelectItem>
                  </SelectContent>
                </Select>
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
                <Label htmlFor="value">Value ($)</Label>
                <Input
                  id="value"
                  type="number"
                  placeholder="e.g. 340000"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="submitted_by">Submitted By</Label>
                <Select value={submittedByRoleId} onValueChange={(v) => setSubmittedByRoleId(v ?? "")}>
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
              <div className="sm:col-span-2">
                <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                  {submitting ? "Routing decision..." : "Submit Decision"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive font-medium">Error: {error}</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card className="border-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Routing Result
              <Badge variant="outline" className="text-green-600 border-green-500">
                Routed
              </Badge>
            </CardTitle>
            <CardDescription>{result.title}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Routed To</p>
                <p className="text-lg font-semibold">
                  {getRoleName(result.routed_to_role_id)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Co-sign Required
                </p>
                <p className="text-lg font-semibold">
                  {result.cosign_role_id
                    ? getRoleName(result.cosign_role_id)
                    : "None"}
                </p>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Agent Reasoning
              </p>
              <p className="text-sm bg-muted p-3 rounded-md">
                {result.agent_reasoning}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
