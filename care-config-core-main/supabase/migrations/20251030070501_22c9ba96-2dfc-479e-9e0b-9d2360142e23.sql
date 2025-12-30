-- Create enum for assignment offer status
CREATE TYPE assignment_offer_status AS ENUM ('pending', 'accepted', 'declined', 'expired');

-- Create enum for referral acceptance status
CREATE TYPE referral_status AS ENUM ('pending', 'accepted', 'declined', 'settled');

-- Create enum for payment status
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- Create assignment_offers table for tracking attorney assignment workflow
CREATE TABLE public.assignment_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  attorney_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  offered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  status assignment_offer_status NOT NULL DEFAULT 'pending',
  decline_reason TEXT,
  decline_note TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create referrals table for tracking client referrals and billing
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attorney_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  acceptance_status referral_status NOT NULL DEFAULT 'pending',
  settlement_amount NUMERIC(12, 2),
  settlement_date DATE,
  admin_fee_charged NUMERIC(10, 2) NOT NULL DEFAULT 1500.00,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  payment_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  reported_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create billing_transactions table
CREATE TABLE public.billing_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID NOT NULL REFERENCES public.referrals(id) ON DELETE CASCADE,
  attorney_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  processing_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  tax NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(10, 2) NOT NULL,
  payment_method TEXT,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  stripe_payment_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.assignment_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assignment_offers
CREATE POLICY "Attorneys can view their own offers"
ON public.assignment_offers FOR SELECT
USING (attorney_id = auth.uid());

CREATE POLICY "Attorneys can update their own offers"
ON public.assignment_offers FOR UPDATE
USING (attorney_id = auth.uid());

CREATE POLICY "RN CM can create offers"
ON public.assignment_offers FOR INSERT
WITH CHECK (has_role('RN_CCM'::text) OR has_role('STAFF'::text) OR has_role('SUPER_USER'::text) OR has_role('SUPER_ADMIN'::text));

CREATE POLICY "RN CM can view all offers"
ON public.assignment_offers FOR SELECT
USING (has_role('RN_CCM'::text) OR has_role('STAFF'::text) OR has_role('SUPER_USER'::text) OR has_role('SUPER_ADMIN'::text));

-- RLS Policies for referrals
CREATE POLICY "Attorneys can view their own referrals"
ON public.referrals FOR SELECT
USING (attorney_id = auth.uid() OR has_role('SUPER_USER'::text) OR has_role('SUPER_ADMIN'::text));

CREATE POLICY "Attorneys can update their own referrals"
ON public.referrals FOR UPDATE
USING (attorney_id = auth.uid());

CREATE POLICY "Staff can create referrals"
ON public.referrals FOR INSERT
WITH CHECK (has_role('RN_CCM'::text) OR has_role('ATTORNEY'::text) OR has_role('STAFF'::text) OR has_role('SUPER_USER'::text) OR has_role('SUPER_ADMIN'::text));

CREATE POLICY "Staff can view all referrals"
ON public.referrals FOR SELECT
USING (has_role('RN_CCM'::text) OR has_role('STAFF'::text) OR has_role('SUPER_USER'::text) OR has_role('SUPER_ADMIN'::text));

-- RLS Policies for billing_transactions
CREATE POLICY "Attorneys can view their own transactions"
ON public.billing_transactions FOR SELECT
USING (attorney_id = auth.uid() OR has_role('SUPER_USER'::text) OR has_role('SUPER_ADMIN'::text));

CREATE POLICY "System can create transactions"
ON public.billing_transactions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Staff can view all transactions"
ON public.billing_transactions FOR SELECT
USING (has_role('STAFF'::text) OR has_role('SUPER_USER'::text) OR has_role('SUPER_ADMIN'::text));

-- Create triggers for updated_at
CREATE TRIGGER update_assignment_offers_updated_at
BEFORE UPDATE ON public.assignment_offers
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_referrals_updated_at
BEFORE UPDATE ON public.referrals
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create function to auto-expire assignment offers
CREATE OR REPLACE FUNCTION public.expire_assignment_offers()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.assignment_offers
  SET 
    status = 'expired',
    updated_at = now()
  WHERE status = 'pending'
    AND expires_at < now();
END;
$$;

-- Create function to handle assignment acceptance
CREATE OR REPLACE FUNCTION public.accept_assignment_offer(p_offer_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offer record;
  v_attorney_name text;
  v_case_id text;
BEGIN
  -- Get offer details
  SELECT * INTO v_offer
  FROM public.assignment_offers
  WHERE id = p_offer_id
    AND attorney_id = auth.uid()
    AND status = 'pending';
    
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Offer not found or already processed');
  END IF;
  
  -- Check if expired
  IF v_offer.expires_at < now() THEN
    UPDATE public.assignment_offers
    SET status = 'expired', updated_at = now()
    WHERE id = p_offer_id;
    
    RETURN jsonb_build_object('success', false, 'error', 'This offer has expired');
  END IF;
  
  -- Update offer status
  UPDATE public.assignment_offers
  SET 
    status = 'accepted',
    responded_at = now(),
    updated_at = now()
  WHERE id = p_offer_id;
  
  -- Create case assignment
  INSERT INTO public.case_assignments (case_id, user_id, role)
  VALUES (v_offer.case_id, auth.uid(), 'ATTORNEY')
  ON CONFLICT DO NOTHING;
  
  -- Update attorney metadata
  UPDATE public.attorney_metadata
  SET 
    last_assigned_date = now(),
    capacity_available = GREATEST(0, capacity_available - 1),
    updated_at = now()
  WHERE user_id = auth.uid();
  
  -- Update case status
  UPDATE public.cases
  SET status = 'Assigned – Awaiting Legal Review'
  WHERE id = v_offer.case_id;
  
  -- Create audit log
  SELECT display_name INTO v_attorney_name
  FROM public.profiles
  WHERE user_id = auth.uid();
  
  v_case_id := 'RC-' || RIGHT(v_offer.case_id::text, 8);
  
  INSERT INTO public.audit_logs (actor_id, actor_role, action, case_id, meta)
  VALUES (
    auth.uid(),
    'ATTORNEY',
    'attorney_accepted_assignment',
    v_offer.case_id,
    jsonb_build_object(
      'offer_id', p_offer_id,
      'attorney_name', v_attorney_name
    )
  );
  
  -- Notify RN CM
  PERFORM notify_roles(
    ARRAY['RN_CCM', 'STAFF']::text[],
    'Attorney Accepted Client',
    'Attorney ' || COALESCE(v_attorney_name, 'Unknown') || ' accepted client ' || v_case_id,
    'success',
    '/case-detail/' || v_offer.case_id::text
  );
  
  RETURN jsonb_build_object('success', true, 'case_id', v_offer.case_id);
END;
$$;

-- Create function to handle assignment decline
CREATE OR REPLACE FUNCTION public.decline_assignment_offer(
  p_offer_id uuid,
  p_reason text,
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offer record;
  v_attorney_name text;
  v_case_id text;
  v_next_attorney_id uuid;
BEGIN
  -- Get offer details
  SELECT * INTO v_offer
  FROM public.assignment_offers
  WHERE id = p_offer_id
    AND attorney_id = auth.uid()
    AND status = 'pending';
    
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Offer not found or already processed');
  END IF;
  
  -- Update offer status
  UPDATE public.assignment_offers
  SET 
    status = 'declined',
    decline_reason = p_reason,
    decline_note = p_note,
    responded_at = now(),
    updated_at = now()
  WHERE id = p_offer_id;
  
  -- Get attorney name
  SELECT display_name INTO v_attorney_name
  FROM public.profiles
  WHERE user_id = auth.uid();
  
  v_case_id := 'RC-' || RIGHT(v_offer.case_id::text, 8);
  
  -- Create audit log
  INSERT INTO public.audit_logs (actor_id, actor_role, action, case_id, meta)
  VALUES (
    auth.uid(),
    'ATTORNEY',
    'attorney_declined_assignment',
    v_offer.case_id,
    jsonb_build_object(
      'offer_id', p_offer_id,
      'attorney_name', v_attorney_name,
      'reason', p_reason,
      'note', p_note
    )
  );
  
  -- Get next attorney in round robin (excluding current attorney)
  SELECT get_next_round_robin_attorney() INTO v_next_attorney_id;
  
  -- Create new offer for next attorney if found
  IF v_next_attorney_id IS NOT NULL AND v_next_attorney_id != auth.uid() THEN
    INSERT INTO public.assignment_offers (
      case_id,
      attorney_id,
      created_by
    ) VALUES (
      v_offer.case_id,
      v_next_attorney_id,
      v_offer.created_by
    );
  END IF;
  
  -- Notify RN CM
  PERFORM notify_roles(
    ARRAY['RN_CCM', 'STAFF']::text[],
    'Attorney Declined Client',
    'Attorney ' || COALESCE(v_attorney_name, 'Unknown') || ' declined client ' || v_case_id || ' (reason: ' || p_reason || '). Re-queued.',
    'warning',
    '/case-management?filter=declined'
  );
  
  RETURN jsonb_build_object('success', true, 'requeued', v_next_attorney_id IS NOT NULL);
END;
$$;