import { useState } from "react";
import { toast } from "sonner";
import { AWS_REGIONS } from "../lib/api";
import type { Logger, LoggerInput } from "../lib/types";
import { LogGroupCombobox } from "./LogGroupCombobox";
import { Modal } from "./Modal";
import { Button, Input, Select } from "./ui";

export function LoggerForm({
  open,
  onClose,
  onSubmit,
  profiles,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: LoggerInput) => Promise<unknown>;
  profiles: string[];
  initial?: Logger;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [profile, setProfile] = useState(
    initial?.profile ?? profiles[0] ?? "default",
  );
  const [region, setRegion] = useState(initial?.region ?? "us-east-1");
  const [logGroup, setLogGroup] = useState(initial?.logGroup ?? "");
  const [saving, setSaving] = useState(false);

  const valid = name.trim() && logGroup.trim() && region.trim() && profile.trim();

  async function handleSubmit() {
    if (!valid) return;
    setSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        logGroup: logGroup.trim(),
        region: region.trim(),
        profile: profile.trim(),
      });
      toast.success(initial ? "Logger updated" : "Logger saved");
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save logger");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Edit logger" : "Add logger"}
    >
      <div className="space-y-4">
        <Field label="Name" hint="A label for this logger">
          <Input
            value={name}
            autoFocus
            placeholder="prod-api"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && valid) handleSubmit();
            }}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Profile">
            <Select value={profile} onChange={(e) => setProfile(e.target.value)}>
              {profiles.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Region">
            <Select value={region} onChange={(e) => setRegion(e.target.value)}>
              {AWS_REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Log group" hint="Pick from the list or type the full name">
          <LogGroupCombobox
            profile={profile}
            region={region}
            value={logGroup}
            onChange={setLogGroup}
          />
        </Field>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!valid || saving}
          >
            {saving ? "Saving…" : initial ? "Save changes" : "Add logger"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-xs font-medium text-fg-muted">{label}</span>
        {hint && <span className="text-[10px] text-fg-subtle">{hint}</span>}
      </div>
      {children}
    </label>
  );
}
