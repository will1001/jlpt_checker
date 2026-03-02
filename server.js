require("dotenv").config();
const express = require("express");
const webpush = require("web-push");
const cors = require("cors");
const fs = require("fs");
const axios = require("axios");
const cheerio = require("cheerio");
const cron = require("node-cron");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

webpush.setVapidDetails(
  "mailto:test@example.com",
  process.env.PUBLIC_VAPID_KEY,
  process.env.PRIVATE_VAPID_KEY,
);

let subscriptions = [];

// Load subscriptions initially
try {
  if (fs.existsSync("subs.json")) {
    const data = fs.readFileSync("subs.json", "utf8");
    subscriptions = JSON.parse(data);
  }
} catch (e) {
  console.error("Error reading subs.json:", e);
}

// Save subscription utility
const saveSubscriptions = () => {
  fs.writeFileSync("subs.json", JSON.stringify(subscriptions, null, 2));
};

app.post("/subscribe", (req, res) => {
  const subscription = req.body;

  // Check if subscription already exists
  const exists = subscriptions.find(
    (sub) => sub.endpoint === subscription.endpoint,
  );
  if (!exists) {
    subscriptions.push(subscription);
    saveSubscriptions();
  }

  res.status(201).json({});
});

app.get("/public-key", (req, res) => {
  res.send(process.env.PUBLIC_VAPID_KEY);
});

// Mock notification endpoint for testing
app.post("/test-notification", async (req, res) => {
  try {
    await notifyAll("Status JLPT Berubah!", "Cek jlptonline.or.id sekarang!");
    res.status(200).send("Notification sent!");
  } catch (e) {
    res.status(500).send("Failed to send: " + e.message);
  }
});

// Trigger scraping manually
app.get("/check-status", async (req, res) => {
  const changed = await checkJLPTStatus();
  res.send({ changed, currentStatus: lastStatus });
});

let lastStatus = "PENDAFTARAN BELUM DIBUKA"; // default assume closed

app.get("/status", (req, res) => {
  res.json({ status: lastStatus });
});

async function notifyAll(title, body) {
  const payload = JSON.stringify({
    title,
    body,
    url: "https://jlptonline.or.id/",
  });
  console.log(`Sending push to ${subscriptions.length} subscribers...`);
  const promises = subscriptions.map((sub) => {
    return webpush.sendNotification(sub, payload).catch((err) => {
      if (err.statusCode === 410 || err.statusCode === 404) {
        // Subscription has expired or is no longer valid
        return sub.endpoint;
      }
    });
  });

  const results = await Promise.all(promises);
  const invalidEndpoints = results.filter((res) => res !== undefined);

  if (invalidEndpoints.length > 0) {
    subscriptions = subscriptions.filter(
      (sub) => !invalidEndpoints.includes(sub.endpoint),
    );
    saveSubscriptions();
  }
}

async function checkJLPTStatus() {
  try {
    const { data } = await axios.get("https://jlptonline.or.id/");
    const $ = cheerio.load(data);

    // Scraping strategy: search for the specific text "PENDAFTARAN BELUM DIBUKA"
    // If it's missing, it implies something changed (maybe opened)
    // Adjust logic based on actual site behavior.
    const pageText = $("body").text().toUpperCase();

    let currentStatus = "DIBUKA";
    if (pageText.includes("PENDAFTARAN BELUM DIBUKA")) {
      currentStatus = "PENDAFTARAN BELUM DIBUKA";
    }

    if (
      currentStatus !== lastStatus &&
      lastStatus === "PENDAFTARAN BELUM DIBUKA" &&
      currentStatus === "DIBUKA"
    ) {
      // State changed from Closed to Open!
      console.log(
        "Status indicates registration OPEN! Sending notifications...",
      );
      await notifyAll(
        "PENDAFTARAN JLPT DIBUKA!",
        "Segera daftar di jlptonline.or.id",
      );
      lastStatus = currentStatus;
      return true;
    } else if (currentStatus === "PENDAFTARAN BELUM DIBUKA") {
      // Still closed, do nothing. Reset lastStatus just in case.
      lastStatus = currentStatus;
      return false;
    }
  } catch (err) {
    console.error("Error scraping JLPT site:", err.message);
    return false;
  }
}

// Run cron every 5 minutes
cron.schedule("*/5 * * * *", () => {
  console.log(`[${new Date().toISOString()}] Checking JLPT Status...`);
  checkJLPTStatus();
});

app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});
