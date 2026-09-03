"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Download, Loader2, RefreshCw } from "lucide-react";
import { Trip } from "@/types/trip";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { toErrorMessage, tripsApi } from "@/lib/api";
import { useAppDispatch } from "@/store/hooks";
import { regenerateAdvisory } from "@/store/slices/tripsSlice";
import { formatDateRange } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

export function SafetyAdvisoryCard({ trip }: { trip: Trip }) {
  const dispatch = useAppDispatch();
  const { language } = useLanguage();
  const [downloading, setDownloading] = React.useState(false);
  const [regenerating, setRegenerating] = React.useState(false);

  const advisory = trip.advisory;
  // The server generates both languages up front; pick the one in use.
  const advisoryText =
    language === "ur" && advisory?.safetyTextUr ? advisory.safetyTextUr : advisory?.safetyText;

  /** Saves GET /trips/{id}/offline-pack as a JSON file for offline use. */
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const pack = await tripsApi.offlinePack(Number(trip.id));
      const blob = new Blob([JSON.stringify(pack, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `raahnuma-trip-${trip.id}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast({ title: "Offline pack saved", description: "Keep it on your device for no-signal areas.", variant: "success" });
    } catch (error) {
      toast({ title: "Download failed", description: toErrorMessage(error), variant: "error" });
    } finally {
      setDownloading(false);
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    const result = await dispatch(regenerateAdvisory(trip.id));
    setRegenerating(false);

    if (regenerateAdvisory.fulfilled.match(result)) {
      toast({ title: "Advisory refreshed", description: "Generated from the latest weather data.", variant: "success" });
      return;
    }
    toast({
      title: "Could not refresh the advisory",
      description: result.payload ?? "Please try again.",
      variant: "error"
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Your {trip.destination} trip · {formatDateRange(trip.startDate, trip.endDate)}</span>
        </div>
        <span className="text-xs font-medium capitalize text-muted-foreground">
          {trip.experienceLevel}
          {trip.activitiesCount > 0 && ` · ${trip.activitiesCount} in your group`}
        </span>
      </div>

      <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {advisory ? `AI TRIP PACK · READY (${advisory.confidence.toUpperCase()})` : "AI TRIP PACK · GENERATING"}
          </span>
          <h1 className="mt-3 text-2xl font-bold sm:text-3xl">Your {trip.destination} safety advisory</h1>
          <p
            className="mt-1.5 max-w-xl whitespace-pre-line text-sm text-muted-foreground"
            dir={language === "ur" && advisory?.safetyTextUr ? "rtl" : "ltr"}
          >
            {advisoryText ||
              "Your advisory is still being generated from live weather data. Refresh in a moment."}
          </p>
        </div>

        <div className="flex flex-col gap-2 self-start sm:flex-row sm:self-end">
          <Button variant="outline" className="gap-2" onClick={handleRegenerate} disabled={regenerating}>
            {regenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {regenerating ? "Refreshing..." : "Refresh advisory"}
          </Button>
          <Button className="gap-2" onClick={handleDownload} disabled={downloading}>
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {downloading ? "Preparing..." : "Download offline pack"}
          </Button>
        </div>
      </div>

      {advisory?.disclaimer && (
        <p className="mt-4 text-xs text-muted-foreground">{advisory.disclaimer}</p>
      )}
      {trip.weatherStale && (
        <p className="mt-2 text-xs text-accent">
          Showing the last cached weather reading — the live feed is unavailable right now.
        </p>
      )}
    </motion.div>
  );
}
