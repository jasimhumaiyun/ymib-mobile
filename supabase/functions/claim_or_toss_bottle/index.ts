import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const { id, password, message, photoUrl, lat, lon, finderName, tosserName } = await req.json();
    
    // Process bottle claim or toss request
    
    if (!id || !password || lat === undefined || lon === undefined) {
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

    // Case 1: Bottle doesn't exist - create new one (Toss flow)
    if (!bottle) {
      const { data, error } = await client
        .from("bottles")
        .insert({
          password_hash: password,
          message: message || "Hello from YMIB!",
          photo_url: photoUrl,
          lat, 
          lon,
          status: "adrift",
          creator_name: tosserName || 'Anonymous',
          tosser_name: tosserName || 'Anonymous'
        })
        .select()
        .single();

      if (error) {
        console.error("Insert error:", error);
        return new Response(`Insert error: ${error.message}`, { status: 500 });
      }
      
      // Create cast_away event
      const { error: eventError } = await client.from("bottle_events").insert({
        bottle_id: data.id, 
        event_type: "cast_away", 
        lat, 
        lon,
        message: message || "Hello from YMIB!",
        photo_url: photoUrl,
        tosser_name: tosserName || 'Anonymous'
      });
      
      if (eventError) {
        console.error('Failed to create bottle_events:', eventError);
      }
      
      return Response.json({ 
        success: true, 
        message: "Bottle tossed successfully",
        bottle: data,
        id: data.id,
        password: password
      });
    }

    // Case 2: Bottle exists - check password and update (Found flow)
    if (bottle.password_hash !== password) {
      return new Response("Invalid password", { status: 401 });
    }

    // Determine if this is a "mark as found" vs "re-toss" action
    // Check if message starts with "REPLY:" - that means it's a found event with reply
    // If message is provided but doesn't start with "REPLY:", it's a re-toss
    const isReply = message && message.startsWith("REPLY:");
    const isReToss = message !== undefined && !isReply;
    const newStatus = isReToss ? "adrift" : "found";
    const eventType = isReToss ? "cast_away" : "found";

    // Determined action type and event type

    // Update the bottle with new message/photo and location
    const updateData: any = {
      lat,
      lon,
      status: newStatus,
      found_at: new Date().toISOString()
    };

    // Only update message and photo for re-toss
    if (isReToss) {
      updateData.message = message || "Continuing the journey...";
      updateData.tosser_name = tosserName || finderName || 'Anonymous';
      if (photoUrl) {
        updateData.photo_url = photoUrl;
      }
    }

    const { data, error } = await client
      .from("bottles")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();
      
    if (error) {
      console.error("Update error:", error);
      return new Response(error.message, { status: 500 });
    }
    
    // Create appropriate event
    const eventData: any = {
      bottle_id: id, 
      event_type: eventType, 
      lat,
      lon,
      message: isReToss ? (message || "Continuing the journey...") : message,
      photo_url: photoUrl || bottle.photo_url
    };

    // Add appropriate name field based on event type
    if (eventType === "found") {
      eventData.finder_name = finderName || 'Anonymous';
    } else if (eventType === "cast_away") {
      eventData.tosser_name = tosserName || finderName || 'Anonymous';
    }

    const { error: eventError } = await client.from("bottle_events").insert(eventData);
    
    if (eventError) {
      console.error('Failed to create event:', eventError);
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