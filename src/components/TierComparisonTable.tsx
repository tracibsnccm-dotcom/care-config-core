import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { TIER_COMPARISON, TierName } from "@/data/tierComparison";

interface TierComparisonTableProps {
  currentTier?: string | null;
}

export function TierComparisonTable({ currentTier = "Basic" }: TierComparisonTableProps) {
  const normalizedCurrentTier = currentTier || "Basic";

  const renderValue = (value: boolean | string) => {
    if (typeof value === "boolean") {
      return value ? (
        <Check className="h-5 w-5 mx-auto" style={{ color: "#b09837" }} />
      ) : (
        <X className="h-5 w-5 mx-auto" style={{ color: "#b00000" }} />
      );
    }
    return (
      <div className="text-sm leading-relaxed whitespace-pre-line">
        <span className="font-semibold">{value.split("\n")[0]}</span>
        {value.split("\n")[1] && (
          <span className="block italic text-muted-foreground mt-1">
            {value.split("\n")[1]}
          </span>
        )}
      </div>
    );
  };

  return (
    <Card className="border-[#e9e9e9] shadow-lg">
      <CardHeader className="bg-[#0f2a6a] text-white rounded-t-2xl">
        <CardTitle>Compare Service Tiers</CardTitle>
        <p className="text-sm text-white/90 mt-2">
          Select the level of coordination, clinical insight, and advocacy that fits your
          firm's caseload and depth of involvement.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#0f2a6a] hover:bg-[#0f2a6a]">
                <TableHead className="font-bold text-white w-1/4" scope="col">
                  Feature
                </TableHead>
                {TIER_COMPARISON.tiers.map((tier) => (
                  <TableHead
                    key={tier.id}
                    className="text-center font-bold text-white border-l-2 border-[#b09837]"
                    scope="col"
                  >
                    <div className="flex flex-col items-center gap-2 py-2">
                      <span>{tier.name}</span>
                      <span className="text-lg font-bold">
                        ${tier.price.toLocaleString()} / month
                      </span>
                      {tier.id === normalizedCurrentTier && (
                        <Badge className="bg-[#b09837] hover:bg-[#b09837] text-black text-xs">
                          Your Plan
                        </Badge>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {TIER_COMPARISON.features.map((feature, idx) => (
                <TableRow
                  key={feature.id}
                  className={`transition-colors hover:bg-muted/50 ${
                    idx % 2 === 0 ? "bg-white" : "bg-[#f7f7f7]"
                  }`}
                >
                  <TableCell className="font-medium" scope="row">
                    <div className="space-y-1">
                      <span className="text-foreground font-semibold">{feature.label}</span>
                      {feature.desc && (
                        <p className="text-sm text-muted-foreground">{feature.desc}</p>
                      )}
                    </div>
                  </TableCell>
                  {TIER_COMPARISON.tiers.map((tier) => (
                    <TableCell
                      key={tier.id}
                      className="text-center border-l-2 border-[#eaeaea] align-middle"
                    >
                      {renderValue(feature[tier.id as TierName])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Accordion View */}
        <div className="md:hidden p-4">
          <Accordion type="single" collapsible className="w-full space-y-2">
            {TIER_COMPARISON.features.map((feature) => (
              <AccordionItem key={feature.id} value={feature.id} className="border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="text-left">
                    <span className="font-semibold text-foreground">{feature.label}</span>
                    {feature.desc && (
                      <p className="text-sm text-muted-foreground mt-1">{feature.desc}</p>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-3 pt-2">
                    {TIER_COMPARISON.tiers.map((tier) => (
                      <div
                        key={tier.id}
                        className="flex justify-between items-center p-3 bg-[#f7f7f7] rounded-lg"
                      >
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#0f2a6a]">{tier.name}</span>
                            {tier.id === normalizedCurrentTier && (
                              <Badge className="bg-[#b09837] hover:bg-[#b09837] text-black text-xs">
                                Your Plan
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            ${tier.price.toLocaleString()}/mo
                          </span>
                        </div>
                        <div className="flex-shrink-0 ml-2">
                          {renderValue(feature[tier.id as TierName])}
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </CardContent>
    </Card>
  );
}
