// src/components/RNCaseTimeline.tsx

import * as React from "react";
import {
  CaseTimelineEvent,
  CaseEventCategory,
  TenVsSnapshot,
} from "../domain/caseTimeline";
import { mockTimelineEvents } from "../mock/mockTimeline";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";

import {
  computeTenVsFromEvents,
  describeBand,
} from "../domain/tenVsEngine";

type Filter = "ALL" | CaseEventCategory | "CRITICAL" | "LEGAL_LOCK";

interface RNCaseTimelineProps {
  caseId: string;
  isCaseLegalLocked?: boolean;
}

export const RNCaseTimeline: React.FC<RNCaseTimelineProps> = ({
  caseId,
  isCaseLegalLocked,
}) => {
  const [filter, setFilter] = React.useState<Filter>("ALL");

  const eventsForCase = React.useMemo(
    () => mockTimelineEvents.filter((e) => e.caseId === caseId),
    [caseId]
  );

  const filteredEvents = React.useMemo(() => {
    switch (filter) {
      case "CRITICAL":
        return eventsForCase.filter((e) => e.isCritical);
      case "LEGAL_LOCK":
        return eventsForCase.filter((e) => e.isLegalLocked);
      case "CLINICAL":
      case "LEGAL":
      case "WORKLOAD":
      case "SYSTEM":
      case "COMMUNICATION":
      case "OTHER":
        return eventsForCase.filter((e) => e.category === filter);
      case "ALL":
      default:
        return eventsForCase;
    }
  }, [eventsForCase, filter]);

  // Group by date (YYYY-MM-DD)
  const groupedByDate = React.useMemo(() => {
    const map = new Map<string, CaseTimelineEvent[]>();
    for (const evt of filteredEvents) {
      const dateKey = evt.createdAt.slice(0, 10);
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(evt);
    }
    // sort events within each date (newest first)
    for (const [key, list] of map.entries()) {
      list.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      map.set(key, list);
    }
    // sort dates (newest first)
    return Array.from(map.entries()).sort(
      (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()
    );
  }, [filteredEvents]);

  // --- 10-Vs derived view for this case -------------------------------------

  const tenVsSnapshot: TenVsSnapshot = React.useMemo(
    () => computeTenVsFromEvents(eventsForCase),
    [eventsForCase]
  );

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base">Case Timeline (RN)</CardTitle>
            <p className="text-xs text-muted-foreground">
              Clinical, legal, and system events for this case, with live 10-Vs
              context.
            </p>
          </div>

          <div className="flex flex-wrap gap-1">
            <Button
              variant={filter === "ALL" ? "default" : "outline"}
              size="xs"
              onClick={() => setFilter("ALL")}
            >
              All
            </Button>
            <Button
              variant={filter === "CLINICAL" ? "default" : "outline"}
              size="xs"
              onClick={() => setFilter("CLINICAL")}
            >
              Clinical
            </Button>
            <Button
              variant={filter === "LEGAL" ? "default" : "outline"}
              size="xs"
              onClick={() => setFilter("LEGAL")}
            >
              Legal
            </Button>
            <Button
              variant={filter === "CRITICAL" ? "default" : "outline"}
              size="xs"
              onClick={() => setFilter("CRITICAL")}
            >
              Critical
            </Button>
            <Button
              variant={filter === "LEGAL_LOCK" ? "default" : "outline"}
              size="xs"
              onClick={() => setFilter("LEGAL_LOCK")}
            >
              Legal Lock
            </Button>
          </div>
        </div>

        {isCaseLegalLocked && (
          <div className="text-[11px] text-amber-700">
            ⚖️ Legal lock-down is active. Editing of certain entries may be
            restricted.
          </div>
        )}

        {/* 10-Vs mini dashboard */}
        <TenVsSummaryBar snapshot={tenVsSnapshot} />
      </CardHeader>

      <Separator />

      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[420px]">
          <div className="px-4 py-3 space-y-6">
            {groupedByDate.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No timeline events available for this case yet.
              </p>
            )}

            {groupedByDate.map(([dateKey, events]) => (
              <div key={dateKey} className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">
                  {new Date(dateKey).toLocaleDateString()}
                </div>
                <div className="space-y-2">
                  {events.map((evt) => (
                    <TimelineRow key={evt.id} event={evt} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

// --- 10-Vs summary bar ------------------------------------------------------

interface TenVsSummaryBarProps {
  snapshot: TenVsSnapshot;
}

const TenVsSummaryBar: React.FC<TenVsSummaryBarProps> = ({ snapshot }) => {
  const items: { key: keyof TenVsSnapshot; label: string }[] = [
    { key: "v1PainSignal", label: "V1 Pain" },
    { key: "v2FunctionalLoss", label: "V2 Function" },
    { key: "v3VitalityReserve", label: "V3 Vitality" },
    { key: "v4VigilanceRisk", label: "V4 Vigilance" },
    { key: "v10ViabilityTrajectory", label: "V10 Viability" },
  ];

  return (
    <div className="rounded-md border bg-muted/40 px-2 py-2">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="text-[11px] font-medium text-muted-foreground">
          10-Vs Snapshot (0–3 band)
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {items.map((item) => {
          const value = snapshot[item.key];
          const { label, tone } = describeBand(value);
          const toneClass =
            tone === "stable"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : tone === "watch"
              ? "border-sky-200 bg-sky-50 text-sky-700"
              : tone === "concern"
              ? "border-amber-200 bg-amber-50 text-amber-800"
              : "border-red-200 bg-red-50 text-red-800";

          return (
            <Badge
              key={item.key}
              variant="outline"
              className={`text-[10px] font-medium px-2 py-1 ${toneClass}`}
            >
              {item.label}: {value} • {label}
            </Badge>
          );
        })}
      </div>
    </div>
  );
};

// --- Timeline rows ----------------------------------------------------------

interface TimelineRowProps {
  event: CaseTimelineEvent;
}

const TimelineRow: React.FC<TimelineRowProps> = ({ event }) => {
  const [expanded, setExpanded] = React.useState(false);

  const time = new Date(event.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const roleLabel = event.actorRole === "SYSTEM" ? "System" : event.actorRole;

  return (
    <div className="relative pl-6">
      {/* Vertical line */}
      <div className="absolute left-1 top-0 bottom-0 w-px bg-border" />

      {/* Dot */}
      <div className="absolute left-0 top-2 h-2 w-2 rounded-full bg-foreground" />

      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold">{time}</span>
            <Badge variant="outline" className="capitalize">
              {event.category.toLowerCase()}
            </Badge>
            {event.isCritical && (
              <Badge className="text-xs font-semibold">Critical</Badge>
            )}
            {event.isLegalLocked && (
              <Badge variant="outline" className="text-[10px]">
                Legal Lock
              </Badge>
            )}
            {event.requiresAudit && (
              <Badge
                variant={
                  event.auditStatus === "FLAGGED" ? "default" : "outline"
                }
                className="text-[10px]"
              >
                Audit: {event.auditStatus ?? "PENDING"}
              </Badge>
            )}
          </div>
          <div className="text-xs font-medium">{event.summary}</div>
          <div className="text-[11px] text-muted-foreground">
            {roleLabel}
            {event.actorName ? ` • ${event.actorName}` : ""}
          </div>

          {expanded && (
            <div className="mt-1 space-y-1 text-[11px] text-muted-foreground">
              {event.details && <p>{event.details}</p>}
              {event.fourPsSummary && (
                <p>
                  <span className="font-semibold">4Ps:</span>{" "}
                  {event.fourPsSummary}
                </p>
              )}
              {event.tenVsSnapshot && (
                <p>
                  <span className="font-semibold">10-Vs snapshot set here.</span>
                </p>
              )}
              {event.tenVsDelta && (
                <p>
                  <span className="font-semibold">10-Vs delta applied.</span>
                </p>
              )}
              {event.tags && event.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {event.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="text-[10px]"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <Button
          size="xs"
          variant="ghost"
          className="text-[11px]"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Hide" : "Details"}
        </Button>
      </div>
    </div>
  );
};
