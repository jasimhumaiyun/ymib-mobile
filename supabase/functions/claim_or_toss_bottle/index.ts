import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const { id, password, message, photoUrl, lat, lon, finderName, tosserName, action } = await req.json();
    
    console.log('🔍 Edge Function called with:', { id, password: '***', message: message?.substring(0, 50), tosserName, finderName, action });
    
    // Process bottle claim or toss request
    
    if (!id || lat === undefined || lon === undefined) {
      return new Response("Missing required fields: id, lat, lon", { status: 400 });
    }

    const client = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Get user info from multiple sources
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    let userProfile = null;
    let authenticatedUserName = 'Anonymous';
    
    // Try to get user from Supabase Auth first
    if (authHeader && authHeader !== `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`) {
      try {
        const { data: { user }, error: userError } = await client.auth.getUser(authHeader.replace('Bearer ', ''));
        if (user && !userError) {
          userId = user.id;
          
          // Get user profile for name
          const { data: profile } = await client
            .from('user_profiles')
            .select('id, username')
            .eq('id', userId)
            .single();
          
          if (profile) {
            userProfile = profile;
            authenticatedUserName = profile.username;
            console.log('✅ Found auth user profile:', authenticatedUserName);
          }
        }
      } catch (authError) {
        console.log('Auth lookup failed (probably direct database user):', authError);
      }
    }

    // If no auth user found, try to find user by tosser/finder name in database
    if (!userProfile && (tosserName || finderName)) {
      const searchName = tosserName || finderName;
      console.log('🔍 Looking for user by name:', searchName);
      
      const { data: directUser, error: userLookupError } = await client
        .from('user_profiles')
        .select('id, username')
        .eq('username', searchName)
        .single();
      
      if (directUser && !userLookupError) {
        userId = directUser.id;
        userProfile = directUser;
        authenticatedUserName = directUser.username;
        console.log('✅ Found direct database user:', searchName, 'with ID:', userId);
      } else {
        console.log('❌ User lookup failed:', userLookupError);
      }
    }

    // Use provided names or fallback to authenticated user name
    const actualTosserName = tosserName || authenticatedUserName;
    const actualFinderName = finderName || authenticatedUserName;

    console.log('👤 Final user info:', { userId, actualTosserName, actualFinderName });

    // Try to fetch existing bottle
    const { data: bottle, error: fetchError } = await client
      .from("bottles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    console.log('🍾 Bottle lookup result:', { exists: !!bottle, error: fetchError });

    // Case 1: Bottle doesn't exist - create new one (Toss flow)
    if (!bottle) {
      console.log('🆕 Creating new bottle');
      
      const insertData = {
        id: id, // Use provided ID from QR code
        message: message || "Hello from YMIB!",
        photo_url: photoUrl,
        lat, 
        lon,
        status: "adrift",
        creator_name: actualTosserName,
        tosser_name: actualTosserName,
        password_hash: 'simple123', // Add password_hash field for database compatibility
        user_profile_id: userId // Link to user_profiles table instead of auth.users
      };

      console.log('📝 Inserting bottle with data:', insertData);

      const { data, error } = await client
        .from("bottles")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error("❌ Insert error:", error);
        return new Response(`Insert error: ${error.message}`, { status: 500 });
      }
      
      console.log('✅ Bottle created successfully:', data.id);
      
      // Create cast_away event
      const eventData = {
        bottle_id: data.id, 
        event_type: "cast_away", 
        lat, 
        lon,
        message: message || "Hello from YMIB!",
        photo_url: photoUrl,
        tosser_name: actualTosserName,
        user_profile_id: userId // Link event to user_profiles table instead of auth.users
      };
      
      console.log('📝 Creating cast_away event:', eventData);
      
      const { error: eventError } = await client.from("bottle_events").insert(eventData);
      
      if (eventError) {
        console.error('❌ Failed to create bottle_events:', eventError);
      } else {
        console.log('✅ Event created successfully');
      }
      
      // Update user profile stats for bottle creation
      if (userId) {
        console.log('📊 Updating user stats for creation, userId:', userId);
        
        try {
          const { error: statsError } = await client.rpc('increment_user_bottle_stat', {
            user_profile_id: userId,
            stat_type: 'created'
          });
          
          if (statsError) {
            console.error('❌ Failed to update user stats for creation:', statsError);
          } else {
            console.log('✅ User stats updated for creation');
          }
        } catch (statsErr) {
          console.error('❌ Stats update failed (non-critical):', statsErr);
        }
      } else {
        console.log('⚠️ No userId found, skipping stats update');
      }
      
      return Response.json({ 
        success: true, 
        message: "Bottle tossed successfully",
        bottle: data,
        id: data.id
      });
    }

    // Case 2: Bottle exists - check password and update (Found flow)
    console.log('🔍 Bottle exists, processing found/retoss flow');
    
    // Allow replies without password verification if it's clearly a reply
    const isReply = message && message.startsWith("REPLY:");
    
    // No password validation needed - just check if bottle exists

    // Determine if this is a "mark as found" vs "re-toss" action
    const isReToss = message !== undefined && !isReply;
    const isMarkAsFound = action === 'found' || isReply;

    console.log('🎯 Action type:', { isReToss, isMarkAsFound, isReply });

    // Check retoss authorization (simplified - anyone who found the bottle can retoss)
    if (isReToss) {
      console.log('🔐 Checking retoss authorization for tosser:', actualTosserName);
      
      // Get the last event for this bottle to see who found it
      const { data: lastEvent, error: lastEventError } = await client
        .from('bottle_events')
        .select('event_type, finder_name, tosser_name, user_profile_id')
        .eq('bottle_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (lastEventError && lastEventError.code !== 'PGRST116') {
        console.error('❌ Error checking last event:', lastEventError);
        return new Response("Error checking bottle history", { status: 500 });
      }

      console.log('📋 Last event:', lastEvent);

      // If there's a last event and it was a 'found' event, check if this user found it
      if (lastEvent && lastEvent.event_type === 'found') {
        // Allow retoss if the current tosser is the same as the finder
        const canRetoss = lastEvent.finder_name === actualTosserName || 
                         (userId && lastEvent.user_profile_id === userId);
        
        console.log('🔐 Authorization check:', { 
          canRetoss, 
          lastFinder: lastEvent.finder_name, 
          currentTosser: actualTosserName,
          userIdMatch: userId && lastEvent.user_profile_id === userId
        });
        
        if (!canRetoss) {
          return new Response(`Only ${lastEvent.finder_name} (who found this bottle) can retoss it`, { status: 403 });
        }
        
        console.log('✅ Retoss authorization granted');
      } else {
        console.log('📝 No found event found, allowing retoss (bottle may be in initial state)');
      }
    }

    const newStatus = isReToss ? "adrift" : "found";
    const eventType = isReToss ? "cast_away" : "found";

    console.log('📝 Updating bottle status to:', newStatus);

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
      updateData.tosser_name = actualTosserName;
      updateData.user_profile_id = userId; // Update user ownership for retoss (can be null)
      if (photoUrl) {
        updateData.photo_url = photoUrl;
      }
      console.log('🔄 RETOSS: Updating tosser_name to:', actualTosserName);
    } else {
      console.log('✅ FOUND: Keeping existing tosser_name unchanged');
    }

    console.log('📝 Update data being sent to database:', updateData);

    const { data, error } = await client
      .from("bottles")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();
      
    if (error) {
      console.error("❌ Update error:", error);
      return new Response(error.message, { status: 500 });
    }
    
    console.log('✅ Bottle updated successfully');
    
    // Create appropriate event
    const eventData: any = {
      bottle_id: id, 
      event_type: eventType, 
      lat,
      lon,
      message: isReToss ? (message || "Continuing the journey...") : message,
      photo_url: photoUrl || bottle.photo_url,
      user_profile_id: userId // Link event to user if available (can be null)
    };

    // Add appropriate name field based on event type
    if (eventType === "found") {
      eventData.finder_name = actualFinderName;
    } else if (eventType === "cast_away") {
      eventData.tosser_name = actualTosserName;
    }

    console.log('📝 Creating event:', { ...eventData, message: eventData.message?.substring(0, 50) });

    const { error: eventError } = await client.from("bottle_events").insert(eventData);
    
    if (eventError) {
      console.error('❌ Failed to create event:', eventError);
      // Don't fail the whole operation for event logging
    } else {
      console.log('✅ Event created successfully');
    }
    
    // Update user profile stats based on event type
    if (userId) {
      let statType: string | null = null;
      
      if (eventType === "found") {
        statType = 'found';
      } else if (eventType === "cast_away" && isReToss) {
        statType = 'retossed';
      }
      
      if (statType) {
        console.log('📊 Updating user stats for:', statType, 'userId:', userId);
        
        try {
          const { error: statsError } = await client.rpc('increment_user_bottle_stat', {
            user_profile_id: userId,
            stat_type: statType
          });
          
          if (statsError) {
            console.error(`❌ Failed to update user stats for ${statType}:`, statsError);
          } else {
            console.log(`✅ User stats updated for ${statType}`);
          }
        } catch (statsErr) {
          console.error(`❌ Stats update failed for ${statType}:`, statsErr);
        }
      }
    } else {
      console.log('⚠️ No userId found, skipping stats update');
    }
    
    return Response.json({ 
      success: true, 
      message: "Bottle updated successfully",
      bottle: data 
    });

  } catch (error) {
    console.error("❌ Function error:", error);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}); 