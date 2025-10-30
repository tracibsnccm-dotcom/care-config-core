-- Create policy_acceptances table
CREATE TABLE IF NOT EXISTS public.policy_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attorney_id UUID NOT NULL REFERENCES auth.users(id),
  attorney_name TEXT NOT NULL,
  firm TEXT,
  title TEXT,
  accepted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  signature_type TEXT NOT NULL CHECK (signature_type IN ('typed', 'drawn')),
  typed_signature_text TEXT,
  signature_blob TEXT,
  policy_version TEXT NOT NULL DEFAULT '2025-10-30',
  checksum TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.policy_acceptances ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Attorneys can view own policy acceptances"
  ON public.policy_acceptances FOR SELECT
  USING (attorney_id = auth.uid());

CREATE POLICY "Attorneys can insert own policy acceptances"
  ON public.policy_acceptances FOR INSERT
  WITH CHECK (attorney_id = auth.uid());

CREATE POLICY "Staff can view all policy acceptances"
  ON public.policy_acceptances FOR SELECT
  USING (has_role('STAFF') OR has_role('SUPER_USER') OR has_role('SUPER_ADMIN'));

-- Create attorney_wallet table
CREATE TABLE IF NOT EXISTS public.attorney_wallet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attorney_id UUID NOT NULL UNIQUE REFERENCES auth.users(id),
  balance NUMERIC NOT NULL DEFAULT 0 CHECK (balance >= 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.attorney_wallet ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Attorneys can view own wallet"
  ON public.attorney_wallet FOR SELECT
  USING (attorney_id = auth.uid());

CREATE POLICY "Attorneys can update own wallet"
  ON public.attorney_wallet FOR UPDATE
  USING (attorney_id = auth.uid());

CREATE POLICY "Attorneys can insert own wallet"
  ON public.attorney_wallet FOR INSERT
  WITH CHECK (attorney_id = auth.uid());

CREATE POLICY "Staff can view all wallets"
  ON public.attorney_wallet FOR SELECT
  USING (has_role('STAFF') OR has_role('SUPER_USER') OR has_role('SUPER_ADMIN'));

-- Create wallet_transactions table
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attorney_id UUID NOT NULL REFERENCES auth.users(id),
  case_id UUID REFERENCES public.cases(id),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'deduction', 'refund_credit')),
  amount NUMERIC NOT NULL,
  processing_fee NUMERIC NOT NULL DEFAULT 0,
  tax NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  payment_method TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Attorneys can view own transactions"
  ON public.wallet_transactions FOR SELECT
  USING (attorney_id = auth.uid());

CREATE POLICY "System can insert transactions"
  ON public.wallet_transactions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Staff can view all transactions"
  ON public.wallet_transactions FOR SELECT
  USING (has_role('STAFF') OR has_role('SUPER_USER') OR has_role('SUPER_ADMIN'));

-- Create wallet_acknowledgments table
CREATE TABLE IF NOT EXISTS public.wallet_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attorney_id UUID NOT NULL REFERENCES auth.users(id),
  ip_address TEXT,
  user_agent TEXT,
  message_hash TEXT NOT NULL,
  acknowledged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wallet_acknowledgments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Attorneys can view own acknowledgments"
  ON public.wallet_acknowledgments FOR SELECT
  USING (attorney_id = auth.uid());

CREATE POLICY "Attorneys can insert own acknowledgments"
  ON public.wallet_acknowledgments FOR INSERT
  WITH CHECK (attorney_id = auth.uid());

-- Add tier column to attorney_metadata if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'attorney_metadata' 
    AND column_name = 'tier'
  ) THEN
    ALTER TABLE public.attorney_metadata 
    ADD COLUMN tier TEXT NOT NULL DEFAULT 'Basic' CHECK (tier IN ('Basic', 'Clinical', 'Premium'));
  END IF;
END $$;

-- Add plan_price column to attorney_metadata if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'attorney_metadata' 
    AND column_name = 'plan_price'
  ) THEN
    ALTER TABLE public.attorney_metadata 
    ADD COLUMN plan_price NUMERIC;
  END IF;
END $$;

-- Add renewal_date column to attorney_metadata if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'attorney_metadata' 
    AND column_name = 'renewal_date'
  ) THEN
    ALTER TABLE public.attorney_metadata 
    ADD COLUMN renewal_date TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Create updated_at trigger for attorney_wallet
CREATE OR REPLACE FUNCTION update_attorney_wallet_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_attorney_wallet_updated_at
  BEFORE UPDATE ON public.attorney_wallet
  FOR EACH ROW
  EXECUTE FUNCTION update_attorney_wallet_updated_at();

-- Function to get latest policy acceptance for attorney
CREATE OR REPLACE FUNCTION public.get_latest_policy_acceptance(p_attorney_id UUID)
RETURNS TABLE (
  id UUID,
  policy_version TEXT,
  accepted_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT pa.id, pa.policy_version, pa.accepted_at
  FROM public.policy_acceptances pa
  WHERE pa.attorney_id = p_attorney_id
  ORDER BY pa.accepted_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;