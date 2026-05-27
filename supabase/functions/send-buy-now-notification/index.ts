import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

serve(async (req) => {
  try {
    const body = await req.json()
    console.log("Buy Now notification webhook received:", JSON.stringify(body))

    const record = body.record
    if (!record || record.type !== 'buy_now') {
      console.log("Not a buy_now notification")
      return new Response("Not a buy_now notification", { status: 400 })
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!)

    // Get seller email from auth.users
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(record.user_id)

    if (userError || !userData?.user?.email) {
      console.log("User error:", userError)
      return new Response("User not found", { status: 404 })
    }

    const sellerEmail = userData.user.email
    console.log("Sending to:", sellerEmail)

    // Send email
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "CulDeSale <notifications@culdesale.com>",
        to: [sellerEmail],
        subject: "Someone bought your listed item!",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0F1117; color: #F0F0F0; padding: 32px; border-radius: 16px;">
            <div style="margin-bottom: 24px;">
              <span style="font-size: 22px; font-weight: 800; color: #FF6B35;">🏘️ CulDeSale</span>
            </div>

            <h2 style="color: #F0F0F0; margin-bottom: 8px;">
              Your item sold!
            </h2>

            <p style="color: #8B8FA8; margin-bottom: 24px;">
              Someone brought your listed item with Buy Now option. Please check your listing and arrange pickup with the buyer.
            </p>

            <div style="background: #1A1D27; border: 1px solid #2A2D3E; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
              <p style="color: #F0F0F0; margin: 8px 0;"><strong>Message:</strong> ${record.message}</p>
            </div>

            <a href="https://culdesale.com/listing/${record.listing_id}" 
               style="display: inline-block; background: #FF6B35; color: white; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px;">
              View Listing →
            </a>

            <p style="color: #555870; font-size: 12px; margin-top: 32px;">
              You received this because someone bought your item on CulDeSale.
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
