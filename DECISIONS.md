# AzemTeklif — Mimari & Tasarım Kararları (DECISIONS.md)

Bu belge, **AzemTeklif** projesinin geliştirilmesi sürecinde şartnameye sadık kalınarak alınan tasarım, mimari ve kütüphane kararlarını belgeler.

---

### 1. Kimlik Doğrulama & Oturum Yönetimi (Session Auth)
- **Karar**: `jose` kütüphanesi kullanılarak HS256 imzalı JWT ve HTTP-only `azemteklif_session` çerezi (cookie) mimarisi uygulandı.
- **Gerekçe**: Şartnamede tek kullanıcılı iç araç için minimal bağımlılık önerilmişti. Harici ağır auth servisleri yerine doğrudan Next.js App Router ve Route Handler / Middleware ile tam uyumlu, 7 günlük güvenli HTTP-only session cookie kuruldu. Parola doğrulaması için standart `bcryptjs` kullanıldı.

### 2. Excel İçe Aktarma Mantığı (`prisma/seed.ts`)
- **Karar**: `xlsx` (SheetJS) ile ilk 3 satır başlık olarak atlandı.
- **Kategori Hiyerarşisi**: Şartname 4.2 uyarınca `─ Ana paket`, `─ Kullanıcı artırımları`, `─ Opsiyonlar`, `─ Perakende`, `─ Yabancı dil paketi` satırlarındaki tire işaretleri temizlenerek ana kategori olarak tanımlandı. `E-Çözümler` altındaki `─ e-Fatura` vb. satırlar alt kategori (`subCategory`) olarak eşleştirildi.
- **Sabit Fiyat Bölümü**: `"Logo Finansal Teknolojiler"` başlığı tespit edildiğinde `isFixedSection = true` yapıldı. Bu bölümdeki ürünler `ProductType.FIXED` olarak ve B sütunundaki değer doğrudan `fixedPrice` olarak kaydedildi. Şartnameye uygun olarak `Online Hesap Özeti` ve `Logo e-Tahsilat` alt kategorileri oluşturuldu.

### 3. Fiyat Formatı ve Para Birimi Standartları
- **Karar**: Tüm para gösterimlerinde `Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })` standardı kullanılarak sayının ardına ` ₺` eklendi (Örn: `67.223,19 ₺`).
- **Yuvarlama**: İskonto, net, KDV ve toplam hesaplamalarında `Math.round((val + Number.EPSILON) * 100) / 100` ile kuruş bazında 2 ondalık basamağa kesin yuvarlama yapıldı.

### 4. Teklif Numaralandırması
- **Karar**: Otomatik artan ID'ye dayalı `AZM-` + 4 basamaklı sıfır dolgulu format (`AZM-0001`, `AZM-0002` vb.).
- **Gerekçe**: Yarış durumlarını (race condition) ve sayaç tutarsızlıklarını önlemek amacıyla Prisma transaction içerisinde kayıt ID'si alınıp kalıcı teklif numarası atandı. Teklif düzenlendiğinde bu numara sabit kalmaktadır.

### 5. PDF Üretim Mimarisi (Puppeteer)
- **Karar**: WSL2 Ubuntu-24.04 ortamında Puppeteer Chromium kullanılarak HTML/CSS şablonları derlendi ve A4 dikey (portrait) formatında PDF çıktısı üretildi.
- **Optimizasyon**: WSL2 ortamında headless Chromium çalışması için `--no-sandbox`, `--disable-setuid-sandbox`, `--disable-dev-shm-usage`, `--disable-gpu` bayrakları tanımlandı. Şablonlarda şirket iletişim ve marka bilgileri `src/config/company.ts` üzerinden dinamik sağlandı.

### 6. Ürün Kataloğu ve Geçmiş Teklif Güvenliği
- **Karar**: Teklif kalemlerinde ürün fiyat ve isimleri anlık snapshot olarak saklandı (`displayName`, `unitPrice`, 6 kolon fiyatları).
- **Ürün Silme Koruması**: Mevcut herhangi bir teklifte kullanılmış ürünlerin veritabanından kalıcı olarak silinmesi engellendi ve kullanıcıya ürünü "Pasif" duruma getirmesi önerildi. Böylece geçmiş tekliflerin bütünlüğü korundu.
