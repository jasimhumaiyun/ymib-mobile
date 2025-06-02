import { View, Text, ActivityIndicator } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePingSupabase } from './src/hooks/usePingSupabase';

const qc = new QueryClient();

export default function App() {
  const { healthy, error } = usePingSupabase();

  return (
    <QueryClientProvider client={qc}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {healthy === null && <ActivityIndicator size="large" />}
        {healthy && <Text style={{ fontSize: 24 }}>✅ Supabase OK</Text>}
        {error && <Text style={{ color: 'red' }}>❌ {error}</Text>}
      </View>
    </QueryClientProvider>
  );
}
