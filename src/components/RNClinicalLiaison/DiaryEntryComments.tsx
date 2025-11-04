import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface Comment {
  id: string;
  comment_text: string;
  created_by: string;
  created_at: string;
  profiles?: {
    display_name?: string;
  } | null;
}

interface DiaryEntryCommentsProps {
  entryId: string;
}

export function DiaryEntryComments({ entryId }: DiaryEntryCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadComments();
  }, [entryId]);

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from("rn_diary_entry_comments")
        .select("*")
        .eq("entry_id", entryId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Fetch user profiles separately
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(c => c.created_by))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", userIds);

        const enrichedComments = data.map(comment => ({
          ...comment,
          profiles: profiles?.find(p => p.user_id === comment.created_by) || null
        }));
        
        setComments(enrichedComments as any);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error("Error loading comments:", error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to add comments");
        return;
      }

      const { error } = await supabase
        .from("rn_diary_entry_comments")
        .insert({
          entry_id: entryId,
          comment_text: newComment,
          created_by: user.id,
        });

      if (error) throw error;

      toast.success("Comment added");
      setNewComment("");
      loadComments();
    } catch (error: any) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5" />
          Quick Comments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Comment */}
        <div className="flex gap-2">
          <Textarea
            placeholder="Add a follow-up comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px]"
            maxLength={1000}
          />
          <Button
            onClick={handleAddComment}
            disabled={loading || !newComment.trim()}
            className="self-start"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Comments List */}
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No comments yet
            </p>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className="p-3 bg-muted rounded-lg space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm flex-1">{comment.comment_text}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    {format(new Date(comment.created_at), "MMM d, yyyy 'at' h:mm a")}
                  </span>
                  {comment.profiles?.display_name && (
                    <>
                      <span>•</span>
                      <span>{comment.profiles.display_name}</span>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
