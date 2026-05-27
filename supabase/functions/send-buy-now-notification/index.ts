import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // Read the request body as text first
    const bodyText = await req.text()
    console.log("Request body text:", bodyText)

    if (!bodyText) {
      console.log("Empty request body")
      return new Response(JSON.stringify({ error: "Empty request body" }), { 
        status: 400,
        headers: corsHeaders
      })
    }

    let body
    try {
      body = JSON.parse(bodyText)
    } catch (parseError) {
      console.log("Failed to parse JSON:", parseError.message)
      return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), { 
        status: 400,
        headers: corsHeaders
      })
    }

    console.log("Buy Now notification webhook received:", JSON.stringify(body))

    const record = body.record
    if (!record || record.type !== 'buy_now') {
      console.log("Not a buy_now notification, record:", record)
      return new Response(JSON.stringify({ error: "Not a buy_now notification" }), { 
        status: 400,
        headers: corsHeaders
      })
    }

    console.log("Processing buy_now notification")
    console.log("Message:", record.message)
    console.log("Listing ID:", record.listing_id)

    // Extract seller email from the message or use a placeholder
    // In production, you'd fetch this from the database
    const sellerEmail = record.seller_email || "seller@example.com"
    
    console.log("Sending email to:", sellerEmail)
    console.log("RESEND_API_KEY available:", !!RESEND_API_KEY)

    // Send email via Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
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
              ${record.message}
            </p>

            <p style="color: #8B8FA8; margin-bottom: 24px;">
              Please check your listing and arrange pickup with the buyer.
            </p>

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

    console.log("Email API response status:", emailResponse.status)
    
    const emailData = await emailResponse.json()
    console.log("Resend response:", JSON.stringify(emailData))

    if (!emailResponse.ok) {
      console.error("Email sending failed:", emailData)
      return new Response(JSON.stringify({ 
        success: false,
        error: "Email sending failed",
        details: emailData
      }), { 
        status: emailResponse.status,
        headers: corsHeaders
      })
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Email sent successfully",
      emailId: emailData.id
    }), { 
      status: 200,
      headers: corsHeaders
    })

  } catch (error: any) {
    console.log("Fatal error:", error.message)
    console.log("Error stack:", error.stack)
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: corsHeaders
    })
  }
})
