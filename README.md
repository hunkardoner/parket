# Parket!

İstanbul'daki İSPARK otoparklarının gerçek zamanlı doluluk durumunu, çalışma saatlerini ve fiyat bilgisini gösteren Expo mobil uygulaması.

## Teknik temel

- Expo SDK 56 beta (`expo@~56.0.0-preview.9`)
- Expo Router native tabs
- Supabase Auth: Google OAuth ve iOS Apple Sign in
- Supabase backend: sokak park yeri bildirimleri için `street_parking_reports`
- İSPARK API: `https://api.ibb.gov.tr/ispark/Park`
- İSPARK detay/fiyat API: `https://api.ibb.gov.tr/ispark/ParkDetay?parkID=<id>`
- Expo Location, Image Picker, Notifications ve React Native Maps

## Özellikler

- İstanbul otopark doluluk oranları, kapasite ve çalışma saatleri
- Otopark kartında fiyat tarifesi ve aylık abonman detayı
- Konuma göre yakın otopark sıralama
- Otopark veya sokak park konumunu "Aracım" olarak kaydetme
- Araca geri dönmek için yürüme rotasını Apple/Google Maps ile açma
- Sokakta park edilen yerin fotoğrafını çekme
- "Yanımda boş yer var" bildirimi
- "Sokakta park yeri arıyorum" görünümü
- Park kaydı için Expo local notification

## Kurulum

```bash
npm install
cp .env.example .env
npx expo start
```

Supabase kullanmadan da uygulama açılır; auth demo modda görünür ve sokak park bildirimleri cihazda yerel tutulur.

## Supabase ayarları

`.env` içine:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Supabase SQL editörde [supabase/schema.sql](/Users/hunkar/Projects/parket/supabase/schema.sql) dosyasındaki tablo ve RLS politikalarını çalıştır.

Google OAuth için Supabase Dashboard içinde Google provider'ı aç. Redirect URL olarak Expo scheme için `parket://auth/callback` ve geliştirme ortamındaki Expo redirect URL'lerini ekle. Apple Sign in için iOS bundle id `com.parket.app`.

## Komutlar

```bash
npm run ios
npm run android
npm run web
npx tsc --noEmit
```
# parket
