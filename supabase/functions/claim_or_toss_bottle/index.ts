import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const { id, password, message, photoUrl, lat, lon } = await req.json();
    
    console.log('Received request:', { id, password, message, photoUrl, lat, lon });
    
    if (!id || !password || lat === undefined || lon === undefined) {
      console.log('Missing required fields');
      return new Response("Missing required fields: id, password, lat, lon", { status: 400 });
    }

    const client = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Try to fetch existing bottle
    const { data: bottle, error: fetchError } = await client
      .from("bottles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    console.log('Fetch result:', { bottle, fetchError });

    // Case 1: Bottle doesn't exist - create new one (Toss flow)
    if (!bottle) {
      console.log('Creating new bottle');
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
        })
        .select()
        .single();

      if (error) {
        console.error("Insert error:", error);
        return new Response(`Insert error: ${error.message}`, { status: 500 });
      }
      
      // Create cast_away event
      const { error: eventError } = await client.from("bottle_events").insert({
        bottle_id: id, 
        event_type: "cast_away", 
        lat, 
        lon,
        message: message || "Hello from YMIB!",
        photo_url: photoUrl
      });
      
      if (eventError) {
        console.error('Failed to create bottle_events:', eventError);
      }
      
      return Response.json({ 
        success: true, 
        message: "Bottle tossed successfully",
        bottle: data 
      });
    }

    // Case 2: Bottle exists - check password and update (Found flow)
    if (bottle.password_hash !== password) {
      return new Response("Invalid password", { status: 401 });
    }

    // Determine if this is a "mark as found" vs "re-toss" action
    // If NO message parameter provided, it's just marking as found
    // If message parameter provided (even if empty string), it's a re-toss
    const isReToss = message !== undefined;
    const newStatus = isReToss ? "adrift" : "found";
    const eventType = isReToss ? "cast_away" : "found";

    console.log('Action type:', { isReToss, newStatus, eventType, messageProvided: message !== undefined, message });

    // Update the bottle with new message/photo and location
    const { data, error } = await client
      .from("bottles")
      .update({
        message: isReToss ? (message || "Continuing the journey...") : bottle.message,
        photo_url: photoUrl || bottle.photo_url,
        lat,
        lon,
        status: newStatus,
        found_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();
      
    if (error) {
      console.error("Update error:", error);
      return new Response(error.message, { status: 500 });
    }
    
    // Create appropriate event
    const { error: eventError } = await client.from("bottle_events").insert({
      bottle_id: id, 
      event_type: eventType, 
      lat,
      lon,
      message: isReToss ? (message || "Continuing the journey...") : bottle.message,
      photo_url: photoUrl || bottle.photo_url
    });
    
    if (eventError) {
      console.error('Failed to create bottle_events:', eventError);
      // Don't fail the whole operation for event logging
    }
    
    return Response.json({ 
      success: true, 
      message: "Bottle updated successfully",
      bottle: data 
    });

  } catch (error) {
    console.error("Function error:", error);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}); 