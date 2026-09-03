"use client";

import * as React from "react";
import { User, Mail, Phone, Globe, Gauge, Trash2, Plus, Loader2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { saveProfile } from "@/store/slices/authSlice";
import { addContact, fetchContacts, removeContact } from "@/store/slices/sosSlice";
import { toast } from "@/components/ui/toaster";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { initials, cn } from "@/lib/utils";
import type { ExperienceLevel, LanguagePreference } from "@/types/user";

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const saving = useAppSelector((s) => s.auth.savingProfile);
  const contacts = useAppSelector((s) => s.sos.contacts);
  const contactsStatus = useAppSelector((s) => s.sos.contactsStatus);

  const [form, setForm] = React.useState({
    fullName: user?.fullName ?? "",
    phone: user?.phone ?? "",
    preferredLanguage: (user?.preferredLanguage ?? "en") as LanguagePreference,
    experienceLevel: (user?.experienceLevel ?? "beginner") as ExperienceLevel
  });

  // The user object arrives after hydration, so seed the form once it exists.
  React.useEffect(() => {
    if (!user) return;
    setForm({
      fullName: user.fullName,
      phone: user.phone,
      preferredLanguage: user.preferredLanguage,
      experienceLevel: user.experienceLevel
    });
  }, [user]);

  React.useEffect(() => {
    if (contactsStatus === "idle") dispatch(fetchContacts());
  }, [contactsStatus, dispatch]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(saveProfile(form));
    if (saveProfile.fulfilled.match(result)) {
      toast({ title: "Profile updated", description: "Your changes have been saved.", variant: "success" });
    } else {
      toast({ title: "Could not save", description: result.payload ?? "Please try again.", variant: "error" });
    }
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your profile and trip preferences.</p>
      </div>

      <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
          {initials(user.fullName)}
        </div>
        <div>
          <p className="font-semibold">{user.fullName}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5 rounded-2xl border border-border bg-card p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Full name</Label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="fullName" className="pl-10" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="phone" className="pl-10" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Email</Label>
          <Input value={user.email} disabled />
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> Preferred language</Label>
          <div className="grid grid-cols-2 gap-2">
            {(["en", "ur"] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setForm((f) => ({ ...f, preferredLanguage: lang }))}
                className={cn(
                  "h-10 rounded-lg border text-sm font-medium transition-colors",
                  form.preferredLanguage === lang ? "border-primary bg-primary/10 text-primary" : "border-input text-muted-foreground hover:bg-secondary"
                )}
              >
                {lang === "en" ? "English" : "اردو"}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Your AI safety advisories are generated in this language.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5"><Gauge className="h-3.5 w-3.5" /> Experience level</Label>
          <div className="grid grid-cols-3 gap-2">
            {(["beginner", "intermediate", "expert"] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setForm((f) => ({ ...f, experienceLevel: level }))}
                className={cn(
                  "h-10 rounded-lg border text-xs font-medium capitalize transition-colors",
                  form.experienceLevel === level ? "border-primary bg-primary/10 text-primary" : "border-input text-muted-foreground hover:bg-secondary"
                )}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
      </form>

      <EmergencyContactsCard
        contacts={contacts}
        loading={contactsStatus === "loading"}
        onAdd={async (name, phoneNumber) => {
          const result = await dispatch(addContact({ name, phoneNumber }));
          if (addContact.fulfilled.match(result)) {
            toast({ title: "Contact added", description: `${name} will be alerted on SOS.`, variant: "success" });
            return true;
          }
          toast({ title: "Could not add contact", description: result.payload ?? "Please try again.", variant: "error" });
          return false;
        }}
        onRemove={async (id, name) => {
          const result = await dispatch(removeContact(id));
          if (removeContact.fulfilled.match(result)) {
            toast({ title: "Contact removed", description: `${name} will no longer be alerted.`, variant: "success" });
          } else {
            toast({ title: "Could not remove contact", description: result.payload ?? "Please try again.", variant: "error" });
          }
        }}
      />
    </div>
  );
}

interface EmergencyContactsCardProps {
  contacts: { id: string; name: string; phoneNumber: string }[];
  loading: boolean;
  onAdd: (name: string, phoneNumber: string) => Promise<boolean>;
  onRemove: (id: string, name: string) => Promise<void>;
}

function EmergencyContactsCard({ contacts, loading, onAdd, onRemove }: EmergencyContactsCardProps) {
  const [draft, setDraft] = React.useState({ name: "", phoneNumber: "" });
  const [adding, setAdding] = React.useState(false);
  const canAdd = draft.name.trim().length > 0 && draft.phoneNumber.trim().length > 0;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdd || adding) return;
    setAdding(true);
    const ok = await onAdd(draft.name, draft.phoneNumber);
    if (ok) setDraft({ name: "", phoneNumber: "" });
    setAdding(false);
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
      <div>
        <h2 className="flex items-center gap-1.5 text-sm font-semibold">
          <Phone className="h-3.5 w-3.5 text-primary" /> Emergency contacts
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          These are the people notified when you send an SOS.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading contacts...
        </div>
      ) : contacts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No contacts yet. Add at least one so an SOS can reach someone.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {contacts.map((contact) => (
            <li key={contact.id} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{contact.name}</p>
                <p className="truncate text-xs text-muted-foreground">{contact.phoneNumber}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove ${contact.name}`}
                onClick={() => onRemove(contact.id, contact.name)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <Input
          aria-label="Contact name"
          placeholder="Contact name"
          value={draft.name}
          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
        />
        <Input
          aria-label="Contact phone number"
          placeholder="+92 300 0000000"
          inputMode="tel"
          value={draft.phoneNumber}
          onChange={(e) => setDraft((d) => ({ ...d, phoneNumber: e.target.value }))}
        />
        <Button type="submit" variant="outline" disabled={!canAdd || adding}>
          {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="mr-1.5 h-4 w-4" /> Add</>}
        </Button>
      </form>
    </div>
  );
}
