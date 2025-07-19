// Import Firebase SDK modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, set, onValue, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// Konfigurasi Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBO4xXx97CAp4Q0ysF878BtQnkc0mhIhhg",
  authDomain: "relay4ku.firebaseapp.com",
  projectId: "relay4ku",
  storageBucket: "relay4ku.firebasestorage.app",
  messagingSenderId: "880113714870",
  appId: "1:880113714870:web:cbce43843cd22f1cc94817",
  measurementId: "G-F5EQKHG9NC",
  databaseURL: "https://relay4ku-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Path relay Firebase
const relays = ["relay1", "relay2", "relay3", "relay4"];

// Update tombol berdasarkan data Firebase
relays.forEach(relayId => {
  const relayRef = ref(database, `iot_dashboard/relays/${relayId}/state`);
  const button = document.querySelector(`#${relayId} button`);
  
  if (!button) {
    console.warn(`Button for ${relayId} not found!`);
    return;
  }

  // Listen untuk perubahan state dari Firebase
  onValue(relayRef, (snapshot) => {
    const state = snapshot.val() || "OFF"; // Default OFF jika null
    
    // Update tampilan button
    button.textContent = state;
    button.style.background = (state === "ON") ? "#39ff14" : "#00f7ff";
    button.style.color = "#000";
    button.style.fontWeight = "bold";
    
    // Add status indicator
    const statusDot = button.querySelector('.status-dot');
    if (statusDot) {
      statusDot.style.backgroundColor = (state === "ON") ? "#00ff00" : "#ff0000";
    }
    
    console.log(`${relayId} state updated: ${state}`);
  }, (error) => {
    console.error(`Error reading ${relayId}:`, error);
  });

  // Event click untuk toggle relay
  button.addEventListener("click", () => {
    const current = button.textContent === "ON" ? "OFF" : "ON";
    
    // Disable button temporarily
    button.disabled = true;
    button.style.opacity = "0.6";
    
    // Update Firebase
    set(relayRef, current)
      .then(() => {
        console.log(`${relayId} updated to ${current}`);
        // Log user action
        const actionRef = ref(database, `iot_dashboard/logs/relay_actions`);
        const timestamp = new Date().toISOString();
        set(ref(database, `iot_dashboard/logs/relay_actions/${Date.now()}`), {
          relay: relayId,
          action: current,
          timestamp: timestamp,
          source: "web_dashboard"
        });
      })
      .catch((error) => {
        console.error(`Error updating ${relayId}:`, error);
      })
      .finally(() => {
        // Re-enable button
        setTimeout(() => {
          button.disabled = false;
          button.style.opacity = "1";
        }, 300);
      });
  });
});

// Tampilkan waktu dari Firebase NTP
const clockRef = ref(database, "iot_dashboard/ntp_time");
onValue(clockRef, (snapshot) => {
  const data = snapshot.val();
  if (data && data.hour !== undefined && data.minute !== undefined && data.second !== undefined) {
    const jam = String(data.hour).padStart(2, '0');
    const menit = String(data.minute).padStart(2, '0');
    const detik = String(data.second).padStart(2, '0');
    
    const timeString = `${jam}:${menit}:${detik}`;
    const clockElement = document.getElementById("clock");
    
    if (clockElement) {
      clockElement.textContent = timeString;
      clockElement.title = `Last update: ${data.formatted_time || timeString}`;
    }
  }
}, (error) => {
  console.error("Error reading time:", error);
});

// Monitor device connection status
const deviceStatusRef = ref(database, "iot_dashboard/device_status");
onValue(deviceStatusRef, (snapshot) => {
  const status = snapshot.val();
  const statusElement = document.getElementById("device-status");
  
  if (statusElement && status) {
    const isOnline = status.connection === "online";
    const lastSeen = status.last_seen || "Unknown";
    
    statusElement.innerHTML = `
      <span class="status-dot ${isOnline ? 'online' : 'offline'}"></span>
      Device: ${isOnline ? 'Online' : 'Offline'}
      <small>Last seen: ${lastSeen}</small>
    `;
    
    statusElement.className = `device-status ${isOnline ? 'online' : 'offline'}`;
  }
});

// Check device connection (heartbeat)
setInterval(() => {
  const deviceStatusRef = ref(database, "iot_dashboard/device_status/last_seen");
  onValue(deviceStatusRef, (snapshot) => {
    const lastSeen = snapshot.val();
    if (lastSeen) {
      const lastSeenTime = new Date(lastSeen);
      const now = new Date();
      const diffMinutes = Math.floor((now - lastSeenTime) / 60000);
      
      // If no update for more than 2 minutes, mark as offline
      if (diffMinutes > 2) {
        set(ref(database, "iot_dashboard/device_status/connection"), "offline");
      }
    }
  }, { onlyOnce: true });
}, 30000); // Check every 30 seconds

// Add error handling for network issues
window.addEventListener('online', () => {
  console.log('Network connection restored');
});

window.addEventListener('offline', () => {
  console.log('Network connection lost');
});

console.log('Firebase Dashboard initialized successfully!');
