import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const { id, password, lat, lon } = await req.json();

    if (!id || !password || lat === undefined || lon === undefined) {
      return new Response("Missing required fields: id, password, lat, lon", { status: 400 });
    }

    const client = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Get auth user if any
    const authHeader = req.headers.get('Authorization');
    let finder_id = null;
    
    if (authHeader) {
      const { data: { user } } = await client.auth.getUser(authHeader.replace('Bearer ', ''));
      finder_id = user?.id ?? null;
    }

    // Try to fetch existing bottle
    const { data: bottle } = await client
      .from("bottles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    // Bottle doesn't exist
    if (!bottle) {
      return new Response("Bottle not found", { status: 404 });
    }

    // Password mismatch
    if (bottle.password_hash !== password) {
      return new Response("Bad password", { status: 401 });
    }

    // Already found
    if (bottle.status === "found") {
      return Response.json({ status: "already_found", bottle });
    }

    // Mark as found
    const { data, error } = await client
      .from("bottles")
      .update({
        status: "found",
      })
      .eq("id", id)
      .select()
      .single();
      
    if (error) {
      console.error("Update error:", error);
      return new Response(error.message, { status: 500 });
    }
    
    // Create found event
    await client.from("bottle_events").insert({
      bottle_id: id, 
      event_type: "found", 
      lat, 
      lon,
    });
    
    return Response.json({ status: "found", bottle: data });
    
  } catch (error) {
    console.error("Function error:", error);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}); 