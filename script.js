// Import Firebase SDK modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// Konfigurasi Firebase kamu
const firebaseConfig = {
  apiKey: "AIzaSyBO4xXx97CAp4Q0ysF878BtQnkc0mhIhhg",
  authDomain: "relay4ku.firebaseapp.com",
  projectId: "relay4ku",
  storageBucket: "relay4ku.firebasestorage.app",
  messagingSenderId: "880113714870",
  appId: "1:880113714870:web:cbce43843cd22f1cc94817",
  measurementId: "G-F5EQKHG9NC",
  databaseURL: "https://relay4ku-default-rtdb.firebaseio.com/"
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

  onValue(relayRef, (snapshot) => {
    const state = snapshot.val();
    button.textContent = state;
    button.style.background = (state === "ON") ? "#39ff14" : "#00f7ff";
  });

  // Event click untuk toggle
  button.addEventListener("click", () => {
    const current = button.textContent === "ON" ? "OFF" : "ON";
    set(relayRef, current);
  });
});

// Tampilkan waktu dari Firebase
const clockRef = ref(database, "iot_dashboard/ntp_time");
onValue(clockRef, (snapshot) => {
  const data = snapshot.val();
  if (data) {
    const jam = String(data.hour).padStart(2, '0');
    const menit = String(data.minute).padStart(2, '0');
    const detik = String(data.second).padStart(2, '0');
    document.getElementById("clock").textContent = `${jam}:${menit}:${detik}`;
  }
});
