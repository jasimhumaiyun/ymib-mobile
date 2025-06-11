// Quick test script to verify direct database user creation
// Run with: node test-direct-user.js

const { createClient } = require('@supabase/supabase-js');

// You'll need to replace these with your actual Supabase credentials
const SUPABASE_URL = 'your-supabase-url';
const SUPABASE_SERVICE_KEY = 'your-service-role-key'; // NOT anon key

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Generate a UUID v4
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

async function testDirectUserCreation() {
  try {
    const testUsername = `TestUser${Math.floor(Math.random() * 1000)}`;
    const userId = generateUUID();
    
    console.log('🧪 Testing direct user creation...');
    console.log('Username:', testUsername);
    console.log('User ID:', userId);
    
    // Insert directly into user_profiles table (bypassing Supabase Auth)
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        username: testUsername,
        is_anonymous: false,
        device_id: 'test_device_123',
        email: `${testUsername.toLowerCase()}@test.ymib.local`,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log('✅ Success! User created directly in database:');
    console.log(data);
    
    // Verify we can query it back
    const { data: queryData, error: queryError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('username', testUsername)
      .single();
      
    if (queryError) {
      console.error('❌ Query error:', queryError);
      return;
    }
    
    console.log('✅ Query verification successful:');
    console.log(queryData);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDirectUserCreation(); 