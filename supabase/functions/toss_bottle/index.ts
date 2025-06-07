// deno run --allow-env --allow-net
import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    console.log("Toss bottle function called");
    
    const body = await req.json();
    console.log("Request body:", body);
    
    const { message, photoUrl, lat, lon } = body;
    
    if (!message || lat === undefined || lon === undefined) {
      console.log("Bad request - missing required fields");
      return new Response("Bad request: message, lat, and lon are required", { status: 400 });
    }
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !serviceKey) {
      console.log("Missing environment variables");
      return new Response("Server configuration error", { status: 500 });
    }
    
    const client = createClient(supabaseUrl, serviceKey);
    
    const password = crypto.randomUUID().slice(0, 6);
    console.log("Generated password:", password);
    
    // Insert bottle
    const { data: bottle, error: bottleError } = await client
      .from("bottles")
      .insert({
        message,
        photo_url: photoUrl,
        lat,
        lon,
        status: "adrift",
        password_hash: password,
      })
      .select()
      .single();
      
    if (bottleError) {
      console.log("Bottle insert error:", bottleError);
      throw new Error(`Failed to create bottle: ${bottleError.message}`);
    }
    
    console.log("Bottle created:", bottle);

    // Insert bottle event
    const { error: eventError } = await client.from("bottle_events").insert({
      bottle_id: bottle.id,
      event_type: "cast_away",
      lat,
      lon,
      message: message,
      photo_url: photoUrl,
    });
    
    if (eventError) {
      console.log("Event insert error:", eventError);
      // Don't fail the whole request if event fails
      console.warn("Failed to create bottle event, but bottle was created successfully");
    }

    console.log("Success! Returning bottle data");
    return Response.json({ id: bottle.id, password });
    
  } catch (e) {
    console.error("Function error:", e);
    return new Response(`Error: ${e.message}`, { status: 500 });
  }
}); 