"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ShieldAlert, MapPin, Phone, Users, Loader2, CheckCircle2, ExternalLink, Copy } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchContacts, resetSos, triggerSos } from "@/store/slices/sosSlice";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";

/** Wraps the callback-style geolocation API so the thunk can await it. */
function currentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("This browser cannot share your location."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15_000,
      maximumAge: 30_000
    });
  });
}

export default function SosPage() {
  const dispatch = useAppDispatch();
  const trips = useAppSelector((s) => s.trips.trips);
  const contacts = useAppSelector((s) => s.sos.contacts);
  const contactsStatus = useAppSelector((s) => s.sos.contactsStatus);
  const sending = useAppSelector((s) => s.sos.sending);
  const dispatched = useAppSelector((s) => s.sos.lastDispatch);
  const [locating, setLocating] = React.useState(false);

  // The trip whose itinerary is attached to the alert: the soonest upcoming one.
  const activeTrip = React.useMemo(
    () => trips.find((trip) => trip.status === "upcoming") ?? trips[0],
    [trips]
  );

  React.useEffect(() => {
    if (contactsStatus === "idle") dispatch(fetchContacts());
  }, [contactsStatus, dispatch]);

  const busy = locating || sending;
  const status = dispatched ? "sent" : busy ? "sending" : "idle";

  const handleTrigger = async () => {
    setLocating(true);
    let position: GeolocationPosition;
    try {
      position = await currentPosition();
    } catch {
      setLocating(false);
      toast({
        title: "Location unavailable",
        description: "Allow location access in your browser, then try again.",
        variant: "error"
      });
      return;
    }
    setLocating(false);

    const result = await dispatch(
      triggerSos({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        tripId: activeTrip ? Number(activeTrip.id) : null
      })
    );

    if (triggerSos.fulfilled.match(result)) {
      const notified = result.payload.notifiedContacts.length;
      toast({
        title: "SOS sent",
        description: notified
          ? `Your location and itinerary were shared with ${notified} emergency contact${notified > 1 ? "s" : ""}.`
          : "Your alert was logged. Add an emergency contact so we can notify someone next time.",
        variant: "success"
      });
    } else {
      toast({
        title: "SOS failed",
        description: result.payload ?? "Could not send your SOS. Call 1122 directly.",
        variant: "error"
      });
    }
  };

  const copyMessage = async () => {
    if (!dispatched) return;
    try {
      await navigator.clipboard.writeText(dispatched.prefilledMessage);
      toast({ title: "Message copied", description: "Paste it into WhatsApp or SMS.", variant: "success" });
    } catch {
      toast({ title: "Could not copy", description: "Select the message text manually.", variant: "error" });
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="mt-4 text-2xl font-bold">Emergency SOS</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          One tap shares your live location and trip itinerary with your emergency contact and local guide network.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">What will be shared</p>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <MapPin className="h-4 w-4 text-primary" /> Live GPS location
          </div>
          <div className="flex items-center gap-3">
            <Users className="h-4 w-4 text-primary" /> Active itinerary — {activeTrip?.destination ?? "No active trip"}
          </div>
          <div className="flex items-start gap-3">
            <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            {contactsStatus === "loading" ? (
              <span className="text-muted-foreground">Loading your emergency contacts...</span>
            ) : contacts.length ? (
              <span>
                Emergency contact —{" "}
                {contacts.map((contact) => `${contact.name} (${contact.phoneNumber})`).join(", ")}
              </span>
            ) : (
              <span className="text-muted-foreground">
                Emergency contact — none saved yet. Add one in{" "}
                <a href="/settings" className="font-medium text-primary underline-offset-2 hover:underline">
                  Settings
                </a>
                .
              </span>
            )}
          </div>
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleTrigger}
        disabled={status !== "idle"}
        className="relative mx-auto flex h-40 w-40 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-xl shadow-destructive/30 transition-transform hover:scale-105 disabled:opacity-90"
      >
        {status === "idle" && (
          <>
            <span className="absolute inset-0 animate-ping rounded-full bg-destructive/40" />
            <span className="relative flex flex-col items-center gap-1">
              <ShieldAlert className="h-8 w-8" />
              <span className="text-sm font-bold">SEND SOS</span>
            </span>
          </>
        )}
        {status === "sending" && (
          <span className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="text-xs font-semibold">{locating ? "Locating..." : "Sending..."}</span>
          </span>
        )}
        {status === "sent" && (
          <span className="flex flex-col items-center gap-2">
            <CheckCircle2 className="h-8 w-8" />
            <span className="text-xs font-semibold">Sent</span>
          </span>
        )}
      </motion.button>

      {dispatched && (
        <div className="space-y-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Share this with anyone who can help
          </p>
          <p
            className="whitespace-pre-wrap rounded-lg border border-border bg-card p-3 text-sm"
            data-localization-skip
          >
            {dispatched.prefilledMessage}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={copyMessage}>
              <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy message
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={dispatched.mapsLink} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Open location in Maps
              </a>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => dispatch(resetSos())}>
              Reset
            </Button>
          </div>
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">
        For life-threatening emergencies, always call local emergency services (1122) directly in addition to using this feature.
      </p>
    </div>
  );
}
