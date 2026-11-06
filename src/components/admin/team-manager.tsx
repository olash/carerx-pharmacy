"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus01 } from "@untitledui/icons";
import { setRole } from "@/actions/admin/settings";
import { useToast } from "@/components/providers/toast";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { AppRole, Profile } from "@/lib/types";

export function TeamManager({ staff, currentId }: { staff: Profile[]; currentId: string }) {
  const [email, setEmail] = useState("");
  const [role, setNewRole] = useState<AppRole>("pharmacist");
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();

  const run = (e: string, r: AppRole, after?: () => void) =>
    start(async () => {
      const res = await setRole(e, r);
      toast(res.ok ? { tone: "success", title: res.message ?? "Saved" } : { tone: "error", title: res.error });
      if (res.ok) after?.();
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900">Add a team member</h2>
        <p className="mt-1 text-sm text-gray-600">They must first create an account on the website with this email. Then grant them access here.</p>
        <form
          className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            run(email, role, () => setEmail(""));
          }}
        >
          <Input label="Email" name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="pharmacist@example.com" wrapperClassName="flex-1" />
          <Select label="Role" name="role" value={role} onChange={(e) => setNewRole(e.target.value as AppRole)} wrapperClassName="sm:w-44">
            <option value="pharmacist">Pharmacist</option>
            <option value="admin">Admin</option>
          </Select>
          <Button type="submit" iconLeading={UserPlus01} loading={pending}>Grant access</Button>
        </form>
      </Card>
      <Card className="overflow-hidden">
        <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
          <h2 className="text-lg font-semibold text-gray-900">Team</h2>
          <p className="mt-1 text-sm text-gray-600">Pharmacists can manage inventory, requests and consultations. Admins can also manage the team.</p>
        </div>
        <ul className="divide-y divide-gray-200">
          {staff.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-4 px-4 py-4 sm:px-6">
              <Avatar name={s.full_name ?? s.email} size="md" />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  {s.full_name ?? "—"} {s.id === currentId && <Badge color="gray">You</Badge>}
                </p>
                <p className="truncate text-sm text-gray-600">{s.email}</p>
              </div>
              <Badge color={s.role === "admin" ? "brand" : "blue"}>{s.role === "admin" ? "Admin" : "Pharmacist"}</Badge>
              {s.id !== currentId && (
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(s.email!, s.role === "admin" ? "pharmacist" : "admin")}>
                    Make {s.role === "admin" ? "pharmacist" : "admin"}
                  </Button>
                  <Button size="sm" variant="destructive-secondary" disabled={pending} onClick={() => run(s.email!, "patient")}>
                    Remove
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
