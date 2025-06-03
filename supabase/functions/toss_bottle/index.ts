// deno run --allow-env --allow-net
import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const { message, photoUrl, lat, lon } = await req.json();
    if (!message || lat === undefined || lon === undefined) {
      return new Response("Bad request", { status: 400 });
    }
    
    const client = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    
    const password = crypto.randomUUID().slice(0, 6);
    
    const { data: bottle, error } = await client
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
      
    if (error) throw error;

    await client.from("bottle_events").insert({
      bottle_id: bottle.id,
      type: "cast_away",
      lat,
      lon,
      text: message,
      photo_url: photoUrl,
    });

    return Response.json({ id: bottle.id, password });
  } catch (e) {
    return new Response(e.message, { status: 500 });
  }
}); 