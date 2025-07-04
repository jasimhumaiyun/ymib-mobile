const fs = require('fs');
const path = require('path');

// Read .env file manually with better parsing and encoding handling
const envPath = path.resolve(__dirname, '.env');
let envVars = {};

if (fs.existsSync(envPath)) {
  try {
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Remove BOM if present
    if (envContent.charCodeAt(0) === 0xFEFF) {
      envContent = envContent.slice(1);
    }
    
    // Clean up any null bytes or weird characters
    envContent = envContent.replace(/\0/g, '');
    
    envContent.split('\n').forEach(line => {
      // Skip empty lines and comments
      line = line.trim();
      if (!line || line.startsWith('#')) return;
      
      const equalIndex = line.indexOf('=');
      if (equalIndex === -1) return;
      
      const key = line.substring(0, equalIndex).trim();
      let value = line.substring(equalIndex + 1).trim();
      
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      if (key && value) {
        envVars[key] = value;
      }
    });
  } catch (error) {
    console.error('Error reading .env file:', error);
  }
}

// Environment variables loaded successfully

export default {
  expo: {
    name: "YMIB",
    slug: "ymib-mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    scheme: "ymib",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    plugins: [
      "expo-router",
      "expo-barcode-scanner"
    ],
    ios: {
      supportsTablet: true,
      config: { 
        googleMapsApiKey: envVars.IOS_GOOGLE_MAPS_KEY || '' 
      },
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "Shows your toss location",
        NSPhotoLibraryUsageDescription: "Choose a photo for your bottle",
        NSCameraUsageDescription: "Scan QR codes on bottles",
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      config: { 
        googleMaps: { 
          apiKey: envVars.ANDROID_GOOGLE_MAPS_KEY || '' 
        } 
      },
      permissions: [ 
        "ACCESS_FINE_LOCATION", 
        "READ_MEDIA_IMAGES",
        "CAMERA"
      ],
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      EXPO_PUBLIC_SUPABASE_URL: envVars.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: envVars.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    }
  }
}; 