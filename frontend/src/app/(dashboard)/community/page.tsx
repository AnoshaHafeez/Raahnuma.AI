"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, MessageSquareOff, RefreshCw } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchReports } from "@/store/slices/communitySlice";
import { ReportCard } from "@/components/community/ReportCard";
import { NewReportModal } from "@/components/community/NewReportModal";
import { Button } from "@/components/ui/button";

export default function CommunityPage() {
  const dispatch = useAppDispatch();
  const reports = useAppSelector((s) => s.community.reports);
  const status = useAppSelector((s) => s.community.status);
  const error = useAppSelector((s) => s.community.error);
  const searchParams = useSearchParams();

  // Deep-link support: a trip's checklist sends the user here with
  // ?destination=...&place=...&open=1 so the report modal opens pre-filled.
  const initialDestinationId = React.useMemo(() => {
    const raw = searchParams.get("destination");
    if (!raw) return undefined;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }, [searchParams]);

  const initialPlaceId = React.useMemo(() => {
    const raw = searchParams.get("place");
    if (!raw) return undefined;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }, [searchParams]);

  const initiallyOpen = searchParams.get("open") === "1";

  React.useEffect(() => {
    if (status === "idle") dispatch(fetchReports());
  }, [status, dispatch]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Community Trail Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time, crowdsourced updates from travelers on the ground.
          </p>
        </div>
        <NewReportModal
          initialDestinationId={initialDestinationId}
          initialPlaceId={initialPlaceId}
          initiallyOpen={initiallyOpen}
        />
      </div>

      {status === "loading" && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {status === "failed" && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm font-medium">Could not load trail reports</p>
          <p className="mt-1 text-xs text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => dispatch(fetchReports())}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Try again
          </Button>
        </div>
      )}

      {status === "ready" && reports.length === 0 && (
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <MessageSquareOff className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">No trail reports yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Be the first to tell other travelers what the route looks like.
          </p>
        </div>
      )}

      {reports.length > 0 && (
        <div className="space-y-4">
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
}
