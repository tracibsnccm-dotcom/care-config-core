-- Enable realtime for concerns table
ALTER TABLE public.concerns REPLICA IDENTITY FULL;

-- Enable realtime for complaints table  
ALTER TABLE public.complaints REPLICA IDENTITY FULL;

-- Add concerns to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.concerns;

-- Add complaints to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.complaints;