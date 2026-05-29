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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    console.log("Outbid webhook received:", JSON.stringify(body))

    const { outbidUserId, newBidAmount, listingId, listingTitle } = body

    if (!outbidUserId || !newBidAmount || !listingId) {
      return new Response("Missing required fields", { status: 400, headers: corsHeaders })
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!)

    // Get outbid user's profile
    const { data: outbidProfile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", outbidUserId)
      .single()

    // Get outbid user's email from auth
    const { data: userData } = await supabase.auth.admin.getUserById(outbidUserId)

    if (!userData?.user?.email) {
      console.log("Outbid user email not found")
      return new Response("User not found", { status: 404, headers: corsHeaders })
    }

    const outbidEmail = userData.user.email
    const outbidName = outbidProfile?.username || "there"

    console.log("Sending outbid email to:", outbidEmail)

    // Send email
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "CulDeSale <notifications@culdesale.com>",
        to: [outbidEmail],
        subject: `You've been outbid on CulDeSale!`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0F1117; color: #F0F0F0; padding: 32px; border-radius: 16px;">
            <div style="margin-bottom: 24px;">
              <span style="font-size: 22px; font-weight: 800; color: #FF6B35;">🏘️ CulDeSale</span>
            </div>

            <h2 style="color: #FF6B35; margin-bottom: 8px;">
              ⚠️ You've been outbid!
            </h2>

            <p style="color: #8B8FA8; margin-bottom: 24px;">
              Hey <strong style="color: #F0F0F0;">${outbidName}</strong>, another neighbor just placed a higher bid.
            </p>

            <div style="background: #1A1D27; border: 1px solid #2A2D3E; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <div style="font-size: 13px; color: #8B8FA8; margin-bottom: 6px;">Item</div>
              <div style="font-size: 20px; font-weight: 700; color: #F0F0F0; margin-bottom: 12px;">${listingTitle}</div>
              <div style="font-size: 13px; color: #8B8FA8; margin-bottom: 6px;">New Highest Bid</div>
              <div style="font-size: 28px; font-weight: 800; color: #FF6B35;">$${newBidAmount}</div>
            </div>

            <p style="color: #8B8FA8; margin-bottom: 24px;">
              Don't lose out! You can still place a counter-bid before the auction ends.
            </p>

            <a href="https://culdesale.com/listing/${listingId}" 
               style="display: inline-block; background: #FF6B35; color: white; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px; margin-bottom: 12px;">
              Place a Higher Bid →
            </a>

            <p style="color: #555870; font-size: 12px; margin-top: 32px;">
              You received this because you were previously the highest bidder on this item.
            </p>
          </div>
        `,
      }),
    })

    const emailData = await emailRes.json()
    console.log("Resend response:", JSON.stringify(emailData))

    // Insert into notifications table
    const { error: notifError } = await supabase.from('notifications').insert({
      user_id: outbidUserId,
      type: 'outbid',
      title: 'You have been outbid!',
      message: `Someone placed a higher bid of $${newBidAmount} on "${listingTitle}".`,
      listing_id: listingId
    })
    
    if (notifError) console.error("Failed to insert notification:", notifError.message)

    return new Response(JSON.stringify(emailData), { status: 200, headers: corsHeaders })

  } catch (error: any) {
    console.log("Fatal error:", error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }
})
