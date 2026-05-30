DROP POLICY IF EXISTS "Users can insert conversations" ON public.conversations;
CREATE POLICY "Users can insert conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);
