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

    console.log("Processing buy_now notification for user:", record.user_id)
    console.log("Seller email will be sent to:", record.user_id)
    console.log("Message:", record.message)

    // For now, just log that we received it
    // TODO: Implement actual email sending via Resend
    console.log("Email notification would be sent here")

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Notification received and logged",
      record: record
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
