-- Remove the notification trigger since we're calling the edge function from React
DROP TRIGGER IF EXISTS on_notification_insert ON notifications;
DROP FUNCTION IF EXISTS send_buy_now_email();
