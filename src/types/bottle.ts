export interface BottleTrailMarker {
  id: string; // Unique ID for this marker (bottle_id + event_id)
  bottleId: string; // Original bottle ID
  actionType: 'created' | 'found' | 'retossed'; // Type of action
  status: 'adrift' | 'found'; // Current bottle status (for reference)
  lat: number;
  lon: number;
  message: string;
  photo_url?: string;
  created_at: string;
  event_id?: string; // For database event tracking
  tosser_name?: string;
  finder_name?: string;
}

export interface Bottle {
  id: string;
  status: 'adrift' | 'found';
  message: string;
  photo_url?: string;
  created_at: string;
  lat: number;
  lon: number;
  password_hash: string;
  creator_name?: string;
}

export interface BottleEvent {
  id: string;
  bottle_id: string;
  event_type: 'cast_away' | 'found';
  lat: number;
  lon: number;
  message?: string;
  photo_url?: string;
  created_at: string;
  tosser_name?: string;
  finder_name?: string;
} 