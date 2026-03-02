# JLPT Tracker 🇯🇵

Aplikasi pemantau status pendaftaran JLPT Indonesia secara otomatis.

## Fitur

- ✅ Auto-check status setiap 5 menit
- 📱 Push notification saat pendaftaran dibuka
- 🌐 PWA - bisa di-install di HP
- 🎨 UI modern dengan tema Jepang

## Cara Deploy

### Option 1: Render (Recommended)

1. **Push code ke GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Buat Web Service di Render**
   - Buka [render.com](https://render.com)
   - Klik "New +" → "Web Service"
   - Connect repository GitHub kamu
   - Render akan otomatis mendeteksi konfigurasi dari `render.yaml`

3. **Set Environment Variables**
   - `PUBLIC_VAPID_KEY`: Key dari `.env` kamu
   - `PRIVATE_VAPID_KEY`: Key dari `.env` kamu

4. **Selesai!** App akan auto-deploy.

### Option 2: Railway

1. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Login dan deploy:
   ```bash
   railway login
   railway init
   railway up
   ```

3. Set variables di dashboard Railway:
   - `PUBLIC_VAPID_KEY`
   - `PRIVATE_VAPID_KEY`

### Generate VAPID Keys (jika belum punya)

Buat file `generate-keys.js`:
```javascript
const webpush = require('web-push');
const vapid = webpush.generateVAPIDKeys();
console.log('PUBLIC_VAPID_KEY=' + vapid.publicKey);
console.log('PRIVATE_VAPID_KEY=' + vapid.privateKey);
```

Jalankan:
```bash
node generate-keys.js
```

## Jalankan Lokal

```bash
npm install
node server.js
```

Buka http://localhost:3000

## Catatan

- Free tier Render/Railway bisa "sleep" jika tidak ada traffic
- Push notification tetap akan dikirim saat server bangun
- Untuk prod, gunakan paid plan agar server 24/7
