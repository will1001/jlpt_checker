self.addEventListener("push", function (event) {
  console.log("[Service Worker] Push Received.");
  let data = {
    title: "JLPT Update",
    body: "Status changed!",
    url: "https://jlptonline.or.id/",
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const title = data.title || "JLPT Tracker";
  const options = {
    body: data.body,
    icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 fill=%22%23ffffff%22></rect><circle cx=%2250%22 cy=%2250%22 r=%2230%22 fill=%22%23d9383e%22></circle></svg>",
    badge:
      "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 fill=%22%23ffffff%22></rect><circle cx=%2250%22 cy=%2250%22 r=%2230%22 fill=%22%23d9383e%22></circle></svg>",
    data: { url: data.url || "https://jlptonline.or.id/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  console.log("[Service Worker] Notification click Received.");
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
