-- Create a trigger to send emails when notifications are created
CREATE OR REPLACE FUNCTION notify_seller_on_buy_now()
RETURNS TRIGGER AS $$
DECLARE
  v_seller_email TEXT;
  v_seller_username TEXT;
  v_buyer_username TEXT;
BEGIN
  IF NEW.type = 'buy_now' THEN
    -- Get seller email and username
    SELECT email, username INTO v_seller_email, v_seller_username
    FROM profiles
    WHERE id = NEW.user_id;
    
    -- Get buyer username
    SELECT username INTO v_buyer_username
    FROM profiles
    WHERE id = NEW.related_user_id;
    
    -- Log for debugging
    RAISE NOTICE 'Sending email to % for buy_now notification', v_seller_email;
    
    -- Call the edge function via HTTP
    PERFORM net.http_post(
      url := 'https://yjggtkvloyohgntxkwoq.supabase.co/functions/v1/send-buy-now-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqZ2d0a3Zsb3lvaG5ndHhrd29xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk4MzI0NzcsImV4cCI6MjAyNTQwODQ3N30.cQtXFjCrwp7ARiBBI2zR2A_Pmk9bTvo'
      ),
      body := jsonb_build_object(
        'record', jsonb_build_object(
          'type', NEW.type,
          'message', NEW.message,
          'listing_id', NEW.listing_id,
          'seller_email', v_seller_email,
          'seller_username', v_seller_username,
          'buyer_username', v_buyer_username
        )
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_buy_now_notification ON notifications;

-- Create the trigger
CREATE TRIGGER on_buy_now_notification
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION notify_seller_on_buy_now();
