-- Create only the missing tables

-- Mentions in comments
CREATE TABLE public.rn_diary_comment_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES public.rn_diary_entry_comments(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Notifications system
CREATE TABLE public.rn_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  link TEXT,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Document attachments
CREATE TABLE public.rn_diary_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES public.rn_diary_entries(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Entry read receipts
CREATE TABLE public.rn_diary_read_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES public.rn_diary_entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(entry_id, user_id)
);

-- Entry version history
CREATE TABLE public.rn_diary_entry_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES public.rn_diary_entries(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  changed_by UUID NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  changes JSONB NOT NULL,
  previous_data JSONB NOT NULL
);

-- Add missing columns to existing tables
ALTER TABLE public.rn_diary_entry_comments
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT false;

-- Rename created_by to author_id for consistency
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'rn_diary_entry_comments' 
             AND column_name = 'created_by') 
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'rn_diary_entry_comments' 
                 AND column_name = 'author_id') THEN
    ALTER TABLE public.rn_diary_entry_comments RENAME COLUMN created_by TO author_id;
  END IF;
END $$;

-- Add approval workflow fields
ALTER TABLE public.rn_diary_entries
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS approved_by UUID,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Enable RLS
ALTER TABLE public.rn_diary_entry_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rn_diary_comment_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rn_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rn_diary_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rn_diary_read_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rn_diary_entry_versions ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_comments_entry_id ON public.rn_diary_entry_comments(entry_id);
CREATE INDEX IF NOT EXISTS idx_mentions_mentioned_user ON public.rn_diary_comment_mentions(mentioned_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.rn_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_attachments_entry_id ON public.rn_diary_attachments(entry_id);
CREATE INDEX IF NOT EXISTS idx_read_receipts_entry ON public.rn_diary_read_receipts(entry_id);
CREATE INDEX IF NOT EXISTS idx_versions_entry_id ON public.rn_diary_entry_versions(entry_id);