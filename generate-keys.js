const webpush = require("web-push");
const vapid = webpush.generateVAPIDKeys();

console.log("=== VAPID Keys Generated ===\n");
console.log("PUBLIC_VAPID_KEY=" + vapid.publicKey);
console.log("PRIVATE_VAPID_KEY=" + vapid.privateKey);
console.log("\nCopy keys ini ke .env atau environment variables di Render/Railway");
