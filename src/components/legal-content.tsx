import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ParkingPalette } from '@/constants/brand';
import { Spacing } from '@/constants/theme';

export type LegalKind = 'terms' | 'privacy';

const content = {
  terms: {
    title: 'Kullanım Şartları',
    updatedAt: 'Demo metin - Mayıs 2026',
    sections: [
      {
        title: 'Hizmet kapsamı',
        body: 'Parket!, İstanbul içindeki otopark ve sokak park deneyimini kolaylaştırmak için tasarlanmış demo bir mobil uygulamadır. İSPARK doluluk verileri, kullanıcı konumu ve kullanıcı bildirimleri bilgilendirme amacıyla gösterilir.',
      },
      {
        title: 'Veri doğruluğu',
        body: 'Otopark kapasitesi, çalışma saati ve ücret bilgileri ilgili veri kaynaklarından alınır. Gerçek saha koşulları değişebileceğinden, uygulamadaki bilgiler kesin yer garantisi olarak yorumlanmamalıdır.',
      },
      {
        title: 'Kullanıcı sorumluluğu',
        body: 'Araç park ederken trafik kurallarına, otopark işletme koşullarına ve yerel düzenlemelere uymak kullanıcının sorumluluğundadır. Sokak park bildirimi paylaşırken yanıltıcı veya zararlı içerik gönderilmemelidir.',
      },
      {
        title: 'Hesap ve erişim',
        body: 'Google, Apple veya e-posta ile oluşturulan hesaplar uygulama deneyimini kişiselleştirmek için kullanılır. Demo ortamında hesap işlemleri üretim servisi yerine test akışıyla simüle edilebilir.',
      },
    ],
  },
  privacy: {
    title: 'Gizlilik Politikası',
    updatedAt: 'Demo metin - Mayıs 2026',
    sections: [
      {
        title: 'Toplanan bilgiler',
        body: 'Parket!, otoparkları yakınlığa göre sıralamak ve aracına dönüş rotası oluşturmak için konum bilgisini kullanır. Kamera yalnızca kullanıcı park yerini fotoğraflamak istediğinde izin ister.',
      },
      {
        title: 'Konum kullanımı',
        body: 'Konum verisi yakındaki otoparkları bulmak, sokak park bildirimi oluşturmak ve araca geri dönüş rotası açmak için işlenir. Kullanıcı onayı olmadan arka planda sürekli konum takibi yapılmaz.',
      },
      {
        title: 'Fotoğraflar',
        body: 'Park yeri fotoğrafları kullanıcının cihazında saklanabilir ve kullanıcı boş yer bildirimi yaparsa bildirimle ilişkilendirilebilir. Kamera izni uygulama açılışında değil, fotoğraf çekme anında istenir.',
      },
      {
        title: 'Üçüncü taraf servisler',
        body: 'Kimlik doğrulama için Supabase, harici hesap sağlayıcıları ve harita yönlendirmeleri kullanılabilir. Bu servislerin kendi gizlilik politikaları ayrıca geçerlidir.',
      },
    ],
  },
} satisfies Record<LegalKind, { title: string; updatedAt: string; sections: { title: string; body: string }[] }>;

export function LegalContent({ kind }: { kind: LegalKind }) {
  const page = content[kind];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="subtitle" style={styles.title}>
          {page.title}
        </ThemedText>
        <ThemedText type="small" style={styles.updatedAt}>
          {page.updatedAt}
        </ThemedText>
      </View>

      {page.sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <ThemedText type="smallBold" style={styles.sectionTitle}>
            {section.title}
          </ThemedText>
          <ThemedText type="small" style={styles.body}>
            {section.body}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
  },
  header: {
    gap: Spacing.one,
  },
  title: {
    color: ParkingPalette.ink,
  },
  updatedAt: {
    color: '#6c7881',
  },
  section: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ParkingPalette.line,
    backgroundColor: '#ffffff',
    padding: Spacing.three,
    gap: Spacing.one,
  },
  sectionTitle: {
    color: ParkingPalette.violet,
  },
  body: {
    color: '#4d5963',
  },
});
