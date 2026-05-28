import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    console.log("Buy it now webhook received:", JSON.stringify(body))

    const record = body.record
    const oldRecord = body.old_record

    // Fire when status changes to 'sold' or 'reserved'
    const isReserved = record.status === 'reserved' && oldRecord?.status !== 'reserved'
    const isSold = record.status === 'sold' && oldRecord?.status !== 'sold'

    if (!record || (!isReserved && !isSold)) {
      return new Response("Not a relevant status change", { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "text/plain" } 
      })
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!)

    // Get seller profile
    const { data: seller } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", record.seller_id)
      .single()

    // Get seller email from auth
    const { data: userData } = await supabase.auth.admin.getUserById(record.seller_id)

    if (!userData?.user?.email) {
      console.log("Seller email not found")
      return new Response("Seller not found", { 
        status: 404, 
        headers: { ...corsHeaders, "Content-Type": "text/plain" } 
      })
    }

    const sellerEmail = userData.user.email
    const sellerName = seller?.username || "there"

    console.log("Sending buy it now email to:", sellerEmail)

    const subject = isReserved 
      ? `Someone reserved your item on CulDeSale!` 
      : `Your item got sold on CulDeSale!`

    const headline = isReserved 
      ? `⏳ Reservation Pending!` 
      : `🎉 Your item got sold!`

    const headlineColor = isReserved ? `#F59E0B` : `#22C55E`
    
    const nextSteps = isReserved
      ? `A buyer has reserved this item. Please log in to confirm or reject the sale within 24 hours.`
      : `The buyer will reach out to arrange pickup. Check your messages on CulDeSale.`

    const badgeText = isReserved
      ? `⏳ Reserved for 24h`
      : `⚡ Sold via Buy It Now`

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
        subject: subject,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0F1117; color: #F0F0F0; padding: 32px; border-radius: 16px;">
            <div style="margin-bottom: 24px;">
              <span style="font-size: 22px; font-weight: 800; color: #FF6B35;">🏘️ CulDeSale</span>
            </div>

            <h2 style="color: ${headlineColor}; margin-bottom: 8px;">
              ${headline}
            </h2>

            <p style="color: #8B8FA8; margin-bottom: 24px;">
              Hey <strong style="color: #F0F0F0;">${sellerName}</strong>, great news!
            </p>

            <div style="background: #1A1D27; border: 1px solid #2A2D3E; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <div style="font-size: 13px; color: #8B8FA8; margin-bottom: 6px;">Item</div>
              <div style="font-size: 20px; font-weight: 700; color: #F0F0F0; margin-bottom: 12px;">${record.title}</div>
              <div style="font-size: 13px; color: #8B8FA8; margin-bottom: 6px;">Buy It Now Price</div>
              <div style="font-size: 28px; font-weight: 800; color: ${headlineColor};">$${record.buy_now_price}</div>
              <div style="margin-top: 12px; background: ${headlineColor}20; border: 1px solid ${headlineColor}40; border-radius: 8px; padding: 10px; color: ${headlineColor}; font-size: 13px; font-weight: 600;">
                ${badgeText}
              </div>
            </div>

            <p style="color: #8B8FA8; margin-bottom: 24px;">
              ${nextSteps}
            </p>

            <a href="https://culdesale.com/listing/${record.id}" 
               style="display: inline-block; background: #22C55E; color: white; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px; margin-bottom: 12px;">
              View Your Listing →
            </a>

            <br />

            <a href="https://culdesale.com/inbox" 
               style="display: inline-block; background: #FF6B35; color: white; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px; margin-top: 8px;">
              Check Messages →
            </a>

            <p style="color: #555870; font-size: 12px; margin-top: 32px;">
              You received this because your item was sold on CulDeSale.
            </p>
          </div>
        `,
      }),
    })

    const emailData = await emailRes.json()
    console.log("Resend response:", JSON.stringify(emailData))

    return new Response(JSON.stringify(emailData), { 
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })

  } catch (error: any) {
    console.log("Fatal error:", error.message)
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }
})