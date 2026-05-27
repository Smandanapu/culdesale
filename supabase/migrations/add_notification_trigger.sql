-- Create trigger function to send email on buy_now notification
CREATE OR REPLACE FUNCTION send_buy_now_email()
RETURNS TRIGGER AS $$
DECLARE
  v_supabase_url TEXT;
  v_supabase_anon_key TEXT;
BEGIN
  IF NEW.type = 'buy_now' THEN
    -- Get Supabase URL and anon key from settings
    v_supabase_url := current_setting('app.supabase_url', true) || '/functions/v1/send-buy-now-notification';
    v_supabase_anon_key := current_setting('app.supabase_anon_key', true);
    
    -- Call the edge function via HTTP
    PERFORM
      net.http_post(
        url := v_supabase_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || v_supabase_anon_key
        ),
        body := jsonb_build_object(
          'record', row_to_json(NEW)
        )
      );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS on_notification_insert ON notifications;
CREATE TRIGGER on_notification_insert
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION send_buy_now_email();
