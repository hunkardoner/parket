# Parket!

İstanbul'daki İSPARK otoparklarının gerçek zamanlı doluluk durumunu, çalışma saatlerini ve fiyat bilgisini gösteren Expo mobil uygulaması.

## Teknik temel

- Expo SDK 56 beta (`expo@~56.0.0-preview.10`)
- Expo Router native tabs
- Expo Maps: Android'de Google Maps, iOS'ta Apple Maps ile uygulama içi harita
- Supabase Auth: Google OAuth ve iOS Apple Sign in
- Supabase backend: sokak park yeri bildirimleri için `street_parking_reports`
- İSPARK API: `https://api.ibb.gov.tr/ispark/Park`
- İSPARK detay/fiyat API: `https://api.ibb.gov.tr/ispark/ParkDetay?parkID=<id>`
- Expo Location, Image Picker, Notifications ve Expo Maps

## Özellikler

- Login-first açılış: e-posta login, register, şifre sıfırlama, Google ve Apple Sign in
- Onboarding: uygulama girişinde konum izni ister; kamera izni yalnızca fotoğraf çekme anında istenir
- Statik Türkçe demo Kullanım Şartları ve Gizlilik Politikası ekranları
- İstanbul otopark doluluk oranları, kapasite ve çalışma saatleri
- Konuma göre en yakın 3 İSPARK otoparkı
- Otopark arıyorum tabı: 300 m, 500 m, 1 km, 2 km ve 5 km aralığında arama
- Otopark kartında fiyat tarifesi ve aylık abonman detayı
- Otopark veya sokak park konumunu "Aracım" olarak kaydetme
- Araca geri dönmek için park konumunu uygulama içi haritada gösterme
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

Expo Maps Expo Go içinde çalışmaz; iOS/Android için development build gerekir. Android build'de Google Maps SDK for Android etkinleştirilmiş bir API key `android.config.googleMaps.apiKey` üzerinden verilmelidir.

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
