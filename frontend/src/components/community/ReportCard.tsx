"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { MapPin, ThumbsUp, Clock, Loader2 } from "lucide-react";
import { TrailReport } from "@/types/community";
import { useAppDispatch } from "@/store/hooks";
import { upvoteReport } from "@/store/slices/communitySlice";
import { toast } from "@/components/ui/toaster";
import { initials, cn } from "@/lib/utils";

const conditionStyles = {
  clear: "bg-primary/10 text-primary border-primary/20",
  caution: "bg-accent/15 text-accent border-accent/30",
  closed: "bg-destructive/10 text-destructive border-destructive/20"
};

const conditionLabel = { clear: "Clear", caution: "Use caution", closed: "Closed" };

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function ReportCard({ report }: { report: TrailReport }) {
  const dispatch = useAppDispatch();
  const [voting, setVoting] = React.useState(false);

  const handleUpvote = async () => {
    if (voting) return;
    setVoting(true);
    const result = await dispatch(upvoteReport(report.id));
    setVoting(false);
    if (upvoteReport.rejected.match(result)) {
      toast({
        title: "Could not mark helpful",
        description: result.payload ?? "Please try again.",
        variant: "error"
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl border border-border bg-card p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {initials(report.authorName)}
          </div>
          <div>
            <p className="text-sm font-semibold">{report.authorName}</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" /> {report.destination}
              {report.placeName && (
                <>
                  <span className="text-muted-foreground/50">·</span>
                  <span className="text-primary">{report.placeName}</span>
                </>
              )}
            </p>
          </div>
        </div>
        <span className={cn("rounded-full border px-2.5 py-1 text-xs font-medium", conditionStyles[report.condition])}>
          {conditionLabel[report.condition]}
        </span>
      </div>

      <p className="mt-3 text-sm text-foreground/90">{report.description}</p>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {timeAgo(report.postedAt)}
          </span>
        </div>
        <button
          onClick={handleUpvote}
          disabled={voting}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-60"
        >
          {voting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ThumbsUp className="h-3.5 w-3.5" />}
          Helpful ({report.helpfulCount})
        </button>
      </div>
    </motion.div>
  );
}