import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { useCaseReviews } from "@/hooks/useCaseReviews";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import ReviewFormDialog from "./ReviewFormDialog";

export default function ReviewsOverview() {
  const { reviews, isLoading } = useCaseReviews();
  const [dialogOpen, setDialogOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-success/10 text-success";
      case "approved": return "bg-primary/10 text-primary";
      case "pending": return "bg-warning/10 text-warning";
      case "in_progress": return "bg-info/10 text-info";
      case "requires_action": return "bg-destructive/10 text-destructive";
      default: return "bg-muted";
    }
  };

  const pendingReviews = reviews.filter(r => r.status === "pending").length;
  const requiresActionReviews = reviews.filter(r => r.status === "requires_action").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Case Reviews</h3>
          <p className="text-sm text-muted-foreground">Quality assurance and peer reviews</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Review
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <FileText className="h-8 w-8 text-muted-foreground" />
            <div className="text-right">
              <p className="text-2xl font-bold">{reviews.length}</p>
              <p className="text-xs text-muted-foreground">Total Reviews</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <AlertCircle className="h-8 w-8 text-warning" />
            <div className="text-right">
              <p className="text-2xl font-bold">{pendingReviews}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <div className="text-right">
              <p className="text-2xl font-bold">{requiresActionReviews}</p>
              <p className="text-xs text-muted-foreground">Requires Action</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <CheckCircle className="h-8 w-8 text-success" />
            <div className="text-right">
              <p className="text-2xl font-bold">{reviews.filter(r => r.status === "completed").length}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case</TableHead>
                <TableHead>Review Type</TableHead>
                <TableHead>Reviewer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Quality Score</TableHead>
                <TableHead>Review Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((review: any) => (
                <TableRow key={review.id}>
                  <TableCell className="font-medium">{review.cases?.client_label || "N/A"}</TableCell>
                  <TableCell>{review.review_type}</TableCell>
                  <TableCell>{review.profiles?.display_name || "Unknown"}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(review.status)}>{review.status}</Badge>
                  </TableCell>
                  <TableCell>{review.quality_score ? `${review.quality_score}/5` : "N/A"}</TableCell>
                  <TableCell>{format(new Date(review.review_date), "MM/dd/yyyy")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <ReviewFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
