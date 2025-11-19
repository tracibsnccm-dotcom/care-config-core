// src/components/AttorneyCommLog.tsx

import * as React from "react";
import {
  CaseCommunicationEntry,
  CommunicationChannel,
  CommunicationDirection,
  CommunicationConfidentiality,
} from "../domain/caseTimeline";
import { mockCommunicationEntries } from "../mock/mockTimeline";

// Adjust these imports if your ui components live in a different folder
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";

type Filter =
  | "ALL"
  | CommunicationChannel
  | "OPEN_FOLLOWUP"
  | CommunicationConfidentiality;

interface AttorneyCommLogProps {
  caseId: string;
  isCaseLegalLocked?: boolean;
}

export const AttorneyCommLog: React.FC<AttorneyCommLogProps> = ({
  caseId,
  isCaseLegalLocked,
}) => {
  const [filter, setFilter] = React.useState<Filter>("ALL");
  const [search, setSearch] = React.useState("");

  const commsForCase = React.useMemo(
    () => mockCommunicationEntries.filter((c) => c.caseId === caseId),
    [caseId]
  );

  const filtered = React.useMemo(() => {
    let list: CaseCommunicationEntry[] = commsForCase;

    if (filter === "OPEN_FOLLOWUP") {
      list = list.filter((c) => c.followUpStatus === "OPEN");
    } else if (
      filter === "STANDARD" ||
      filter === "SENSITIVE" ||
      filter === "PRIVILEGED"
    ) {
      list = list.filter((c) => c.confidentiality === filter);
    } else if (filter !== "ALL") {
      // channel filter
      list = list.filter((c) => c.channel === filter);
    }

    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.subject.toLowerCase().includes(s) ||
          (c.bodyPreview ?? "").toLowerCase().includes(s) ||
          c.participants.some((p) => p.toLowerCase().includes(s))
      );
    }

    return [...list].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [commsForCase, filter, search]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base">
              Communications Log (Attorney)
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Privileged communications, client touchpoints, and follow-up tasks.
            </p>
          </div>
          {isCaseLegalLocked && (
            <Badge variant="outline" className="text-[11px]">
              ⚖️ Legal Hold Active
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="Search subject, preview, participants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-xs max-w-xs"
          />
          <Button
            size="xs"
            variant={filter === "ALL" ? "default" : "outline"}
            onClick={() => setFilter("ALL")}
          >
            All
          </Button>
          <Button
            size="xs"
            variant={filter === "PHONE" ? "default" : "outline"}
            onClick={() => setFilter("PHONE")}
          >
            Phone
          </Button>
          <Button
            size="xs"
            variant={filter === "EMAIL" ? "default" : "outline"}
            onClick={() => setFilter("EMAIL")}
          >
            Email
          </Button>
          <Button
            size="xs"
            variant={filter === "PORTAL_MESSAGE" ? "default" : "outline"}
            onClick={() => setFilter("PORTAL_MESSAGE")}
          >
            Portal
          </Button>
          <Button
            size="xs"
            variant={filter === "OPEN_FOLLOWUP" ? "default" : "outline"}
            onClick={() => setFilter("OPEN_FOLLOWUP")}
          >
            Follow-up Open
          </Button>
          <Button
            size="xs"
            variant={filter === "PRIVILEGED" ? "default" : "outline"}
            onClick={() => setFilter("PRIVILEGED")}
          >
            Privileged
          </Button>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[420px]">
          <div className="px-4 py-3 space-y-2">
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No communication entries yet for this case.
              </p>
            )}

            {filtered.map((entry) => (
              <CommRow key={entry.id} entry={entry} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

interface CommRowProps {
  entry: CaseCommunicationEntry;
}

const CommRow: React.FC<CommRowProps> = ({ entry }) => {
  const [expanded, setExpanded] = React.useState(false);

  const createdDate = new Date(entry.createdAt);

  const channelLabel = (() => {
    switch (entry.channel) {
      case "PHONE":
        return "Phone";
      case "EMAIL":
        return "Email";
      case "PORTAL_MESSAGE":
        return "Portal";
      case "VIDEO_VISIT":
        return "Video visit";
      case "TEXT":
        return "Text";
      case "IN_PERSON":
        return "In person";
      default:
        return "Other";
    }
  })();

  const directionLabel: string =
    entry.direction === "INBOUND"
      ? "Inbound"
      : entry.direction === "OUTBOUND"
      ? "Outbound"
      : "Internal";

  return (
    <div className="border rounded-md px-3 py-2 text-xs space-y-1">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="font-semibold text-[12px]">{entry.subject}</div>
          <div className="flex flex-wrap gap-1 items-center">
            <Badge variant="outline" className="text-[10px]">
              {channelLabel}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {directionLabel}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {entry.confidentiality}
            </Badge>
            {entry.isLegalHold && (
              <Badge className="text-[10px]">Legal Hold</Badge>
            )}
            {entry.followUpStatus === "OPEN" && (
              <Badge variant="outline" className="text-[10px]">
                Follow-up open
                {entry.followUpDueAt &&
                  ` • due ${new Date(
                    entry.followUpDueAt
                  ).toLocaleDateString()}`}
              </Badge>
            )}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {createdDate.toLocaleDateString()} •{" "}
            {createdDate.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            • {entry.createdByName ?? entry.createdByRole}
          </div>
          <div className="text-[11px] text-muted-foreground">
            Participants: {entry.participants.join(", ")}
          </div>
          {expanded && (
            <div className="mt-1 space-y-1 text-[11px] text-muted-foreground">
              {entry.bodyPreview && <p>{entry.bodyPreview}</p>}
              {entry.followUpOwnerName && (
                <p>
                  Follow-up owner: <strong>{entry.followUpOwnerName}</strong>
                </p>
              )}
              {entry.attachmentsCount && entry.attachmentsCount > 0 && (
                <p>Attachments: {entry.attachmentsCount}</p>
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
