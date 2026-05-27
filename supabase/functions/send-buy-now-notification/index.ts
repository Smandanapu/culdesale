import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

serve(async (req) => {
  console.log("Function called with method:", req.method)
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight")
    return new Response("ok", { 
      status: 200,
      headers: corsHeaders 
    })
  }

  try {
    console.log("Processing POST request")
    
    // Read the request body as text first
    const bodyText = await req.text()
    console.log("Request body received, length:", bodyText.length)

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
      console.log("JSON parsed successfully")
    } catch (parseError) {
      console.log("Failed to parse JSON:", parseError.message)
      return new Response(JSON.stringify({ error: "Invalid JSON" }), { 
        status: 400,
        headers: corsHeaders
      })
    }

    const record = body.record
    console.log("Record type:", record?.type)
    
    if (!record || record.type !== 'buy_now') {
      console.log("Not a buy_now notification")
      return new Response(JSON.stringify({ error: "Not a buy_now notification" }), { 
        status: 400,
        headers: corsHeaders
      })
    }

    console.log("Processing buy_now notification")
    console.log("Seller email:", record.seller_email)
    console.log("Message:", record.message)

    // For now, just return success
    // Email sending will be implemented after we verify the function works
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Notification received",
      record: {
        type: record.type,
        message: record.message,
        seller_email: record.seller_email
      }
    }), { 
      status: 200,
      headers: corsHeaders
    })

  } catch (error: any) {
    console.log("Fatal error:", error.message)
    console.log("Error type:", error.constructor.name)
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: corsHeaders
    })
  }
})
