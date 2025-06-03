import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const { id, password, message, photoUrl, lat, lon } = await req.json();

    if (!id || !password || lat === undefined || lon === undefined) {
      return new Response("Missing required fields: id, password, lat, lon", { status: 400 });
    }

    const client = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Get auth user if any
    const authHeader = req.headers.get('Authorization');
    let creator_id = null;
    
    if (authHeader) {
      const { data: { user } } = await client.auth.getUser(authHeader.replace('Bearer ', ''));
      creator_id = user?.id ?? null;
    }

    // Try to fetch existing bottle
    const { data: bottle } = await client
      .from("bottles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    // 1) Never seen before → initial claim + cast_away
    if (!bottle) {
      const { data, error } = await client
        .from("bottles")
        .insert({
          id,
          password_hash: password,
          message: message || "Hello from YMIB!",
          photo_url: photoUrl,
          lat, 
          lon,
          status: "adrift",
          creator_id,
        })
        .select()
        .single();
        
      if (error) {
        console.error("Insert error:", error);
        return new Response(error.message, { status: 500 });
      }
      
      // Create cast_away event
      const { error: eventError } = await client.from("bottle_events").insert({
        bottle_id: id, 
        type: "cast_away", 
        lat, 
        lon,
      });
      
      if (eventError) {
        console.error('Failed to create bottle_events:', eventError);
        return new Response("Failed to create bottle event", { status: 500 });
      }
      
      return Response.json({ status: "new_cast_away", bottle: data });
    }

    // Password mismatch
    if (bottle.password_hash !== password) {
      return new Response("Bad password", { status: 401 });
    }

    // 2) Bottle currently adrift → mark as found
    if (bottle.status === "adrift") {
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
      const { error: eventError } = await client.from("bottle_events").insert({
        bottle_id: id, 
        type: "found", 
        lat, 
        lon,
      });
      
      if (eventError) {
        console.error('Failed to create bottle_events:', eventError);
        return new Response("Failed to create bottle event", { status: 500 });
      }
      
      return Response.json({ status: "found", bottle: data });
    }

    // 3) Bottle currently found → re-toss (with new message/photo if provided)
    if (bottle.status === "found") {
      const { data, error } = await client
        .from("bottles")
        .update({
          status: "adrift",
          message: message || bottle.message,
          photo_url: photoUrl || bottle.photo_url,
          lat, 
          lon,
        })
        .eq("id", id)
        .select()
        .single();
        
      if (error) {
        console.error("Update error:", error);
        return new Response(error.message, { status: 500 });
      }
      
      // Create cast_away event
      const { error: eventError } = await client.from("bottle_events").insert({
        bottle_id: id, 
        type: "cast_away", 
        lat, 
        lon,
      });
      
      if (eventError) {
        console.error('Failed to create bottle_events:', eventError);
        return new Response("Failed to create bottle event", { status: 500 });
      }
      
      return Response.json({ status: "re_toss", bottle: data });
    }

    // This should never happen, but just in case
    return Response.json({ status: "unknown_state", bottle });
    
  } catch (error) {
    console.error("Function error:", error);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}); 