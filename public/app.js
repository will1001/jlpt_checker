const publicVapidKey = ""; // Will be fetched from server
const statusPill = document.getElementById("status-text");
const checkBtn = document.getElementById("check-now-btn");
const subscribeBtn = document.getElementById("subscribe-btn");
const testNotifBtn = document.getElementById("test-notif-btn");

// Utility function to convert base64 to Uint8Array for VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Fetch current status from server
async function fetchStatus() {
  try {
    statusPill.textContent = "Memuat Status...";
    statusPill.className = "status-pill loading";

    const res = await fetch("/status");
    const data = await res.json();

    updateUIStatus(data.status);
  } catch (err) {
    console.error("Error fetching status", err);
    statusPill.textContent = "Gagal Memuat";
    statusPill.className = "status-pill closed";
  }
}

// Force server to check jlpt site now
async function forceCheck() {
  try {
    statusPill.textContent = "Mengecek...";
    statusPill.className = "status-pill loading";
    checkBtn.disabled = true;

    const res = await fetch("/check-status");
    const data = await res.json();

    updateUIStatus(data.currentStatus);
  } catch (err) {
    console.error("Error checking status", err);
    statusPill.textContent = "Gagal Mengecek";
    statusPill.className = "status-pill closed";
  } finally {
    checkBtn.disabled = false;
  }
}

function updateUIStatus(statusText) {
  statusPill.textContent = statusText;
  if (statusText === "PENDAFTARAN BELUM DIBUKA") {
    statusPill.className = "status-pill closed";
  } else {
    statusPill.className = "status-pill open";
    // Give it some flair if it opens
    document.querySelector(".background-overlay").style.background =
      "radial-gradient(circle at top right, rgba(46, 125, 50, 0.4) 0%, transparent 40%), radial-gradient(circle at bottom left, rgba(46, 125, 50, 0.2) 0%, transparent 40%)";
  }
}

// Register Service Worker and Request Notification Permission
async function subscribeUser() {
  if (!("serviceWorker" in navigator)) {
    alert("Browser tidak mendukung Service Worker");
    return;
  }
  if (!("PushManager" in window)) {
    alert("Browser tidak mendukung Push Notifications");
    return;
  }

  try {
    subscribeBtn.disabled = true;
    subscribeBtn.textContent = "Memproses...";

    // 1. Fetch public VAPID key
    const keyResponse = await fetch("/public-key");
    const vapidPublicKey = await keyResponse.text();

    // 2. Register Service Worker
    const register = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    console.log("Service Worker terdaftar.");

    // 3. Request Notification Permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      throw new Error("Izin notifikasi ditolak");
    }

    // 4. Subscribe to PushManager
    const subscription = await register.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    // 5. Send subscription to our backend
    await fetch("/subscribe", {
      method: "POST",
      body: JSON.stringify(subscription),
      headers: {
        "Content-Type": "application/json",
      },
    });

    subscribeBtn.textContent = "Notifikasi Aktif / Berlangganan";
    subscribeBtn.classList.replace("primary", "outline");
    alert(
      "Berhasil mengaktifkan notifikasi! Anda akan menerima push notif saat status berubah.",
    );
  } catch (err) {
    console.error("Gagal subscribe:", err);
    alert("Gagal mengaktifkan notifikasi: " + err.message);
    subscribeBtn.textContent = "Aktifkan Notifikasi";
    subscribeBtn.disabled = false;
  }
}

// Test Notification API
async function testNotification() {
  const btn = document.getElementById("test-notif-btn");
  const originalText = btn.innerHTML;

  try {
    btn.disabled = true;
    btn.innerHTML = "⏳ Mengirim...";

    // Show local notification as immediate feedback
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("JLPT Tracker - Tes Notifikasi", {
        body: "Notifikasi berhasil aktif! 🎉",
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
      });
    }

    // Also trigger push notification from server
    const res = await fetch("/test-notification", { method: "POST" });
    if (res.ok) {
      btn.innerHTML = "✅ Terkirim!";
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
      }, 2000);
    } else {
      throw new Error("Gagal mengirim");
    }
  } catch (err) {
    console.error("Test notif error:", err);
    btn.innerHTML = "❌ Gagal";
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }, 2000);
  }
}

// Check initial status on load
document.addEventListener("DOMContentLoaded", () => {
  fetchStatus();
  checkBtn.addEventListener("click", forceCheck);
  subscribeBtn.addEventListener("click", subscribeUser);
  testNotifBtn.addEventListener("click", testNotification);

  // Check if already subscribed to update button UI
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        if (sub) {
          subscribeBtn.textContent = "Notifikasi Terhubung";
          subscribeBtn.classList.replace("primary", "outline");
          subscribeBtn.disabled = true; // Still give them feedback that it's on
        }
      });
    });
  }
});
