-- RLS Policies for comments
CREATE POLICY "Users can view comments on entries they can access"
  ON public.rn_diary_entry_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.rn_diary_entries e
      WHERE e.id = entry_id AND e.rn_id = auth.uid()
    )
  );

CREATE POLICY "Users can create comments on accessible entries"
  ON public.rn_diary_entry_comments FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can update their own comments"
  ON public.rn_diary_entry_comments FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid());

CREATE POLICY "Users can delete their own comments"
  ON public.rn_diary_entry_comments FOR DELETE
  TO authenticated
  USING (author_id = auth.uid());

-- RLS Policies for mentions
CREATE POLICY "Users can view mentions they are part of"
  ON public.rn_diary_comment_mentions FOR SELECT
  TO authenticated
  USING (
    mentioned_user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.rn_diary_entry_comments c
      WHERE c.id = comment_id AND c.author_id = auth.uid()
    )
  );

CREATE POLICY "Users can create mentions"
  ON public.rn_diary_comment_mentions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.rn_notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON public.rn_notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON public.rn_notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for attachments
CREATE POLICY "Users can view attachments on their entries"
  ON public.rn_diary_attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.rn_diary_entries e
      WHERE e.id = entry_id AND e.rn_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload attachments to their entries"
  ON public.rn_diary_attachments FOR INSERT
  TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can delete their own attachments"
  ON public.rn_diary_attachments FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid());

-- RLS Policies for read receipts
CREATE POLICY "Users can view read receipts on their entries"
  ON public.rn_diary_read_receipts FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.rn_diary_entries e
      WHERE e.id = entry_id AND e.rn_id = auth.uid()
    )
  );

CREATE POLICY "Users can create read receipts"
  ON public.rn_diary_read_receipts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for version history
CREATE POLICY "Users can view version history of their entries"
  ON public.rn_diary_entry_versions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.rn_diary_entries e
      WHERE e.id = entry_id AND e.rn_id = auth.uid()
    )
  );

CREATE POLICY "System can create version history"
  ON public.rn_diary_entry_versions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Trigger to track entry changes as versions
CREATE OR REPLACE FUNCTION public.track_diary_entry_version()
RETURNS TRIGGER AS $$
DECLARE
  v_version_number INTEGER;
  v_changes JSONB;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1 
  INTO v_version_number
  FROM public.rn_diary_entry_versions
  WHERE entry_id = NEW.id;

  v_changes := jsonb_build_object(
    'title_changed', OLD.title IS DISTINCT FROM NEW.title,
    'description_changed', OLD.description IS DISTINCT FROM NEW.description,
    'status_changed', OLD.completion_status IS DISTINCT FROM NEW.completion_status,
    'scheduled_changed', OLD.scheduled_date IS DISTINCT FROM NEW.scheduled_date OR OLD.scheduled_time IS DISTINCT FROM NEW.scheduled_time,
    'priority_changed', OLD.priority IS DISTINCT FROM NEW.priority
  );

  INSERT INTO public.rn_diary_entry_versions (
    entry_id,
    version_number,
    changed_by,
    changes,
    previous_data
  ) VALUES (
    NEW.id,
    v_version_number,
    auth.uid(),
    v_changes,
    to_jsonb(OLD)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS track_diary_entry_changes ON public.rn_diary_entries;

CREATE TRIGGER track_diary_entry_changes
  AFTER UPDATE ON public.rn_diary_entries
  FOR EACH ROW
  WHEN (
    OLD.title IS DISTINCT FROM NEW.title OR
    OLD.description IS DISTINCT FROM NEW.description OR
    OLD.completion_status IS DISTINCT FROM NEW.completion_status OR
    OLD.scheduled_date IS DISTINCT FROM NEW.scheduled_date OR
    OLD.scheduled_time IS DISTINCT FROM NEW.scheduled_time OR
    OLD.priority IS DISTINCT FROM NEW.priority
  )
  EXECUTE FUNCTION public.track_diary_entry_version();

-- Function to create notification for mentions
CREATE OR REPLACE FUNCTION public.notify_mentioned_users()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.rn_notifications (
    user_id,
    title,
    message,
    type,
    link,
    metadata
  )
  SELECT 
    NEW.mentioned_user_id,
    'You were mentioned',
    'You were mentioned in a diary entry comment',
    'mention',
    '/rn-diary?entry=' || (
      SELECT c.entry_id FROM public.rn_diary_entry_comments c WHERE c.id = NEW.comment_id
    )::text,
    jsonb_build_object('comment_id', NEW.comment_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS notify_on_mention ON public.rn_diary_comment_mentions;

CREATE TRIGGER notify_on_mention
  AFTER INSERT ON public.rn_diary_comment_mentions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_mentioned_users();