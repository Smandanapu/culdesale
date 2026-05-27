import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

serve(async (req) => {
  try {
    const body = await req.json()
    console.log("Webhook received:", JSON.stringify(body))

    const record = body.record
    if (!record) {
      console.log("No record found in body")
      return new Response("No record", { status: 400 })
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!)

    // Get conversation
    const { data: conv, error: convError } = await supabase
      .from("conversations")
      .select(`
        id,
        listing_id,
        seller_id,
        buyer_id,
        listings(title),
        seller:profiles!conversations_seller_id_fkey(username),
        buyer:profiles!conversations_buyer_id_fkey(username)
      `)
      .eq("id", record.conversation_id)
      .single()

    if (convError || !conv) {
      console.log("Conv error:", convError)
      return new Response("Conversation not found", { status: 404 })
    }

    console.log("Conversation found:", conv.id)

    // Determine recipient
    const isBuyerSending = record.sender_id === conv.buyer_id
    const recipientId = isBuyerSending ? conv.seller_id : conv.buyer_id
    const recipientName = isBuyerSending 
      ? conv.seller?.username 
      : conv.buyer?.username
    const senderName = isBuyerSending 
      ? conv.buyer?.username 
      : conv.seller?.username

    // Get recipient email from auth.users via admin API
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(recipientId)

    if (userError || !userData?.user?.email) {
      console.log("User error:", userError)
      return new Response("User not found", { status: 404 })
    }

    const recipientEmail = userData.user.email
    console.log("Sending to:", recipientEmail)

    // Count total unread for recipient
    const { data: convIds } = await supabase
      .from("conversations")
      .select("id")
      .or(`seller_id.eq.${recipientId},buyer_id.eq.${recipientId}`)

    let unreadCount = 0
    if (convIds && convIds.length > 0) {
      const ids = convIds.map((c: any) => c.id)
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact" })
        .in("conversation_id", ids)
        .eq("is_read", false)
        .neq("sender_id", recipientId)
      unreadCount = count || 0
    }

    console.log("Unread count:", unreadCount)

    // Send email
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "CulDeSale <notifications@culdesale.com>",
        to: [recipientEmail],
        subject: `New message from ${senderName} on CulDeSale`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0F1117; color: #F0F0F0; padding: 32px; border-radius: 16px;">
            <div style="margin-bottom: 24px;">
              <span style="font-size: 22px; font-weight: 800; color: #FF6B35;">🏘️ CulDeSale</span>
            </div>

            <h2 style="color: #F0F0F0; margin-bottom: 8px;">
              Hey ${recipientName}, you have a new message!
            </h2>

            <p style="color: #8B8FA8; margin-bottom: 24px;">
              <strong style="color: #FF6B35;">${senderName}</strong> sent you a message about 
              <strong style="color: #F0F0F0;">${conv.listings?.title}</strong>
            </p>

            <div style="background: #1A1D27; border: 1px solid #2A2D3E; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
              <p style="color: #F0F0F0; margin: 0; font-size: 16px;">
                "${record.content}"
              </p>
            </div>

            ${unreadCount > 1 ? `
            <p style="color: #8B8FA8; margin-bottom: 24px;">
              You have <strong style="color: #FF6B35;">${unreadCount} unread messages</strong> in total.
            </p>
            ` : ""}

            <a href="https://culdesale.com/inbox" 
               style="display: inline-block; background: #FF6B35; color: white; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px;">
              View Message →
            </a>

            <p style="color: #555870; font-size: 12px; margin-top: 32px;">
              You received this because someone messaged you on CulDeSale.
            </p>
          </div>
        `,
      }),
    })

    const emailData = await emailRes.json()
    console.log("Resend response:", JSON.stringify(emailData))

    return new Response(JSON.stringify(emailData), { status: 200 })

  } catch (error: any) {
    console.log("Fatal error:", error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})