# AzemTeklif — Detaylı ve Kapsamlı Uygulama Planı

Bu belge, **Azem Yazılım Bilişim ve Teknolojileri Ltd. Şti.** için geliştirilecek olan tek kullanıcılı, bağımsız iç teklif hazırlama web uygulaması **AzemTeklif**'in uçtan uca mimarisini, uygulama adımlarını ve teknik detaylarını içermektedir.

---

## 1. Mimari ve Teknoloji Seçimleri

- **Çalışma Ortamı & Platform**: WSL2 Ubuntu-24.04 üzerinde Node.js LTS, Next.js (App Router, TypeScript Strict Mode).
- **Veritabanı & ORM**: SQLite (`prisma/dev.db`) + Prisma ORM.
- **Stil & Arayüz**: Tailwind CSS, `shadcn/ui` bileşen kütüphanesi (Radix UI tabanlı, Lucide React ikonları).
- **Kimlik Doğrulama (Auth)**: Minimal, hafif ve güvenli session cookie tabanlı Next.js Route Handler / Middleware mimarisi (`iron-session` veya `jose` tabanlı şifreli JWT session cookie) ya da NextAuth.js Credentials provider. Gereksiz harici bağımlılıkları minimize etmek için hafif, HTTP-only cookie kullanan yerel oturum yönetimi.
- **Excel Ayrıştırma**: `xlsx` (SheetJS) kütüphanesi ile `prisma/seed.ts` dosyasında tek seferlik içe aktarma betiği.
- **PDF Üretimi**: Puppeteer (Headless Chromium). Next.js API route (`/api/quotes/[id]/pdf`) üzerinden HTML/CSS render edilerek pixel-perfect A4 dikey PDF çıktısı sunulması.
- **Dil ve Yerelleştirme**: Tüm arayüz ve PDF metinleri Türkçe, para formatı `₺` ile Türk Lirası (`1.234,56 ₺` veya `67.223,19 ₺`), kod ve değişken isimleri İngilizce.

---

## 2. Prisma Şeması & Veri Modeli

`prisma/schema.prisma` dosyası şartnamede belirtilen şemaya birebir sadık kalınarak oluşturulacaktır:

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum ProductType {
  PLAN_BASED
  FIXED
}

enum QuoteType {
  CLASSIC
  PLAN_COMPARISON
}

enum DiscountType {
  PERCENT
  AMOUNT
}

enum PlanChoice {
  PLAN_1
  PLAN_2
  PLAN_3
}

enum PriceBasis {
  FIRST_YEAR
  RENEWAL
}

model Product {
  id            Int         @id @default(autoincrement())
  category      String
  subCategory   String?
  name          String
  productType   ProductType

  plan1FirstYear Float?
  plan1Renewal   Float?
  plan2FirstYear Float?
  plan2Renewal   Float?
  plan3FirstYear Float?
  plan3Renewal   Float?

  fixedPrice     Float?

  isActive      Boolean     @default(true)
  sortOrder     Int         @default(0)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  classicItems        QuoteClassicItem[]
  planComparisonItems QuotePlanComparisonItem[]
}

model Quote {
  id               Int          @id @default(autoincrement())
  quoteNumber      String       @unique
  quoteType        QuoteType
  quoteDate        DateTime     @default(now())

  customerName      String
  customerTaxOffice String?
  customerTaxNumber String?
  customerPhone     String?
  customerEmail     String?

  generalDiscountType  DiscountType?
  generalDiscountValue Float?

  vatRate          Float        @default(20)

  subtotal         Float
  netAfterDiscount Float
  vatAmount        Float
  totalAmount      Float

  notes            String?
  preparedByName   String?

  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt

  classicItems        QuoteClassicItem[]
  planComparisonItems QuotePlanComparisonItem[]
}

model QuoteClassicItem {
  id            Int          @id @default(autoincrement())
  quoteId       Int
  quote         Quote        @relation(fields: [quoteId], references: [id], onDelete: Cascade)

  productId     Int?
  product       Product?     @relation(fields: [productId], references: [id])

  displayName   String
  selectedPlan  PlanChoice?
  priceBasis    PriceBasis?
  unitPrice     Float

  quantity      Float        @default(1)

  lineDiscountType  DiscountType?
  lineDiscountValue Float?

  lineTotal     Float

  sortOrder     Int          @default(0)
}

model QuotePlanComparisonItem {
  id            Int      @id @default(autoincrement())
  quoteId       Int
  quote         Quote    @relation(fields: [quoteId], references: [id], onDelete: Cascade)

  productId     Int
  product       Product  @relation(fields: [productId], references: [id])

  displayName    String
  plan1FirstYear Float
  plan1Renewal   Float
  plan2FirstYear Float
  plan2Renewal   Float
  plan3FirstYear Float
  plan3Renewal   Float

  sortOrder     Int      @default(0)
}
```

---

## 3. Excel İçe Aktarma Algoritması (`prisma/seed.ts`)

`logo-edge-t-series-basic-fiyat-listesi.xlsx` dosyasının okunup `Product` tablosuna aktarılması için kurallar:

1. **Satır 1–3**: Başlık satırları atlanır.
2. **Sütun Haritası**:
   - Kolon A: İsim / Başlık
   - Kolon B: Plan 1 İlk Yıl (veya Sabit Fiyat)
   - Kolon C: Plan 1 Yenileme
   - Kolon D: Plan 2 İlk Yıl
   - Kolon E: Plan 2 Yenileme
   - Kolon F: Plan 3 İlk Yıl
   - Kolon G: Plan 3 Yenileme
3. **Durum Yönetimi & Ayrıştırma Mantığı**:
   - `currentCategory`: Aktif ana kategori adı
   - `currentSubCategory`: Aktif alt kategori adı (null olabilir)
   - `isFixedSection`: `"Logo Finansal Teknolojiler"` başlığı görüldüğünde `true` olur.
4. **Satır Türü Tespiti**:
   - **Boş Satır**: Kolon A boşsa atla.
   - **Başlık Satırı**: Kolon A dolu ve B-G kolonları tamamen boş (veya metin/etiket, örn: "Fiyat"):
     - Başlık metni `─` ile başlıyorsa: `─` ve etrafındaki boşluklar temizlenir, sondaki `(1)(2)` gibi dipnot numaraları Regex ile temizlenir. Bu metin `currentSubCategory` olur.
     - Başlık metni `─` ile başlamıyorsa: Doğrudan temizlenir, `currentCategory` olarak atanır ve `currentSubCategory = null` yapılır.
     - Başlık metni `"Logo Finansal Teknolojiler"` ise: `isFixedSection = true` yapılır.
   - **Ürün Satırı**: Kolon A dolu ve Kolon B sayısal bir değer içeriyorsa:
     - `isFixedSection == false` ise:
       - `productType = PLAN_BASED`
       - B, C, D, E, F, G doğrudan `plan1FirstYear`, `plan1Renewal`, `plan2FirstYear`, `plan2Renewal`, `plan3FirstYear`, `plan3Renewal` olarak kaydedilir.
     - `isFixedSection == true` ise:
       - `productType = FIXED`
       - Kolon B `fixedPrice` olarak kaydedilir. Plan kolonları `null` bırakılır.
     - `name`: Kolon A kırpılmış (trimmed) ham metni.
     - `sortOrder`: Sıralı sayaç değeri.
5. **Doğrulama**: Beklenen kategori hiyerarşisi (`Ana paket`, `Kullanıcı artırımları`, `Opsiyonlar`, `Perakende`, `Yabancı dil paketi`, `E-Çözümler` [ve alt kategorileri], `Ek ürün ve hizmetler`, `Logo Finansal Teknolojiler` [Online Hesap Özeti, Logo e-Tahsilat]) loglanarak test edilecektir.

---

## 4. İş Mantığı ve Hesaplama Motoru (`src/lib/calculations.ts`)

Para birimi kuralları ve yuvarlama mantığı bağımsız saf fonksiyonlar (pure functions) olarak yazılacaktır:

### 4.1 Klasik (Tür 1) Teklif Hesaplamaları:
- `lineSubtotal = quantity * unitPrice`
- `lineDiscountAmount = lineDiscountType === 'PERCENT' ? lineSubtotal * (lineDiscountValue / 100) : (lineDiscountType === 'AMOUNT' ? lineDiscountValue : 0)`
- `lineTotal = round(lineSubtotal - lineDiscountAmount, 2)`
- `subtotal = round(sum(lineTotal), 2)`
- `generalDiscountAmount = generalDiscountType === 'PERCENT' ? subtotal * (generalDiscountValue / 100) : (generalDiscountType === 'AMOUNT' ? generalDiscountValue : 0)`
- `netAfterDiscount = round(subtotal - generalDiscountAmount, 2)`
- `vatAmount = round(netAfterDiscount * (vatRate / 100), 2)`
- `totalAmount = round(netAfterDiscount + vatAmount, 2)`

### 4.2 Plan Karşılaştırmalı (Tür 2) Teklif Hesaplamaları:
- İskonto ve KDV bulunmaz.
- Sabit fiyatlı ürünler (`FIXED`): İlk Yıl sütunlarının her üçüne de `fixedPrice` yazılır, Yenileme sütunlarına `0` yazılır.
- Toplamlar: 6 sütunun her biri dikey olarak bağımsız toplanır (`sum(plan1FirstYear)`, `sum(plan1Renewal)`, `sum(plan2FirstYear)`, `sum(plan2Renewal)`, `sum(plan3FirstYear)`, `sum(plan3Renewal)`).
- `Quote` kaydı üzerindeki `subtotal`, `netAfterDiscount`, `vatAmount`, `totalAmount` değerleri `0` olarak kaydedilir.

### 4.3 Teklif Numaralandırması:
- Format: `AZM-` + 4 basamaklı sıfır dolgulu id (Örn: `AZM-0001`).
- Prisma transaction içerisinde kayıt oluşturulup ID alındıktan hemen sonra `quoteNumber` atanır veya sequence mekanizması simüle edilir.

### 4.4 Türk Lirası & Sayı Biçimlendirme (`src/lib/formatters.ts`):
- `Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })`
- Örnek: `67.223,19 ₺`

---

## 5. Sayfa ve Kullanıcı Deneyimi (UI/UX) Akışı

### 5.1 Kimlik Doğrulama (`/login`)
- Tek admin kullanıcısı (`ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH` veya parola karşılaştırması).
- Giriş formu, hata gösterimi, HTTP-only cookie ile korunan güvenli oturum.
- Next.js Middleware ile yetkisiz erişimlerin `/login`'e yönlendirilmesi.

### 5.2 Teklif Listesi / Ana Sayfa (`/`)
- Özet bilgi kartları (Toplam Teklif, Son Teklifler).
- Teklif Arama & Filtreleme (Müşteri adına göre arama, Tür 1 / Tür 2 filtresi, tarihe göre sıralama).
- Tablo Alanları: Teklif No, Tür ("Klasik" / "Plan Karşılaştırmalı"), Müşteri Adı, Teklif Tarihi, Tutar, Oluşturulma Tarihi.
- İşlemler: İncele, Düzenle, Çoğalt (Duplicate - yeni teklif no ve güncel tarih ile taslak oluşturur), PDF İndir, Sil (onay modalı ile).
- "Yeni Teklif Oluştur" butonu -> Modal üzerinden teklif tipi seçimi (Klasik veya Plan Karşılaştırmalı).

### 5.3 Ürün Kataloğu Yönetimi (`/products`)
- Kategori -> Alt Kategori bazında akordeon/ağaç görünümü.
- Ürün arama (isim ile hızlı filtreleme).
- Yeni ürün ekleme modalı (kategori ve alt kategori otomatik tamamlama, tip seçimi, dinamik fiyat giriş alanları).
- Ürün düzenleme modalı.
- Aktif/Pasif yapma butonu (`isActive = false` -> yeni tekliflerde görünmez, geçmiş teklifleri bozmaz).
- Silme kontrolü: Tekliflerde kullanılmışsa silmeye izin verilmeyip pasife alma önerisi sunulur; kullanılmamışsa güvenli silme.

### 5.4 Klasik Teklif Oluşturucu / Düzenleyici (`/quotes/classic/new`, `/quotes/classic/[id]/edit`)
- Müşteri Bilgileri Formu (Adı [Zorunlu], Vergi Dairesi, Vergi No, Telefon, E-posta, Teklif Tarihi).
- Kalem Ekleme Mekanizması:
  - Kaynak: **Katalog** veya **Manuel**.
  - Katalog ise: Kategori -> Varsa Alt Kategori -> Ürün seçimi.
    - Eğer `PLAN_BASED` ise: Plan Seçimi (Plan 1, Plan 2, Plan 3) ve Fiyat Türü ("İlk Yıl", "Yenileme") seçilir. Birim fiyat otomatik yansır. Ürün adına `(Plan X – İlk Yıl/Yenileme)` ibaresi eklenir.
    - Eğer `FIXED` ise: Fiyat sabittir, plan seçimi gizlenir.
  - Manuel ise: Açıklama ve birim fiyat serbest girilir.
  - Miktar, satır iskontosu (% veya Tutar).
- Canlı Hesaplanan Toplamlar Bölümü (Ara Toplam, Genel İskonto, KDV Hariç Net, KDV Tutarı [%20 varsayılan, düzenlenebilir], Ödenecek Genel Toplam).
- İşlem butonları: "Kaydet", "Kaydet ve PDF İndir".

### 5.5 Plan Karşılaştırmalı Teklif Oluşturucu / Düzenleyici (`/quotes/plan-comparison/new`, `/quotes/plan-comparison/[id]/edit`)
- Başlık Alanları: Müşteri Adı, Teklif Tarihi, Teklif Hazırlayan (Yetkili adı/ünvanı), opsiyonel vergi/iletişim alanları.
- Kalem Ekleme Mekanizması:
  - Sadece **Katalog** ürünleri.
  - Ürün seçildiğinde 6 kolon otomatik dolar (`PLAN_BASED` ise 6 fiyat, `FIXED` ise İlk Yıl kolonlarına sabit fiyat, Yenileme kolonlarına 0).
  - İskonto alanı yoktur.
- Altta 6 kolonun canlı dikey toplamları.
- "Teklif Notları" (Çok satırlı metin alanı, PDF'te madde işaretli listeye dönüşecek).
- İşlem butonları: "Kaydet", "Kaydet ve PDF İndir".

### 5.6 Teklif Detay & Önizleme Sayfası (`/quotes/[id]`)
- A4 oranında PDF'e birebir benzeyen ekran önizlemesi.
- Düzenle, Kopyala, PDF İndir, Sil aksiyon butonları.

---

## 6. PDF Şablonları & Puppeteer Entegrasyonu (`/api/quotes/[id]/pdf`)

### 6.1 Şirket Yapılandırması (`src/config/company.ts`):
```typescript
export const companyConfig = {
  name: "Azem Yazılım Bilişim ve Teknolojileri Ltd. Şti.",
  title: "Logo Yazılım Yetkili Bayi",
  address: "...",
  taxOffice: "...",
  taxNumber: "...",
  phone: "...",
  email: "...",
  website: "..."
};
```

### 6.2 Puppeteer Servisi (`src/lib/pdf/generator.ts`):
- HTML/CSS şablonunu Next.js server ortamında derler.
- Puppeteer Chromium instance açar (`--no-sandbox`, `--disable-setuid-sandbox` WSL2 uyumlu bayraklar ile).
- A4 boyutunda, dikey (portrait), kenar boşlukları ayarlanmış ve arka plan grafikleri aktif (`printBackground: true`) PDF buffer üretir.
- HTTP yanıtı olarak `Content-Type: application/pdf` ve `Content-Disposition: inline; filename="AZM-XXXX.pdf"` döner.

### 6.3 Klasik (Tür 1) PDF Tasarımı (`proforma azem.pdf` referansı):
- Üst Sol: Logo / Şirket Bilgileri (company.ts).
- Üst Sağ: "TEKLİF / PROFORMA", Teklif Numarası, Tarih.
- Müşteri Bilgi Bloğu ("İlgili Firmanın").
- Kalem Tablosu: Sıra No, Açıklama, Miktar, Birim Fiyat, İskonto, Tutar.
- Sağ Hizalı Toplamlar: Ara Toplam, Varsa Genel İskonto, Net Tutar, KDV (%20), Ödenecek Toplam (vurgulu).
- Alt Bilgi: Teşekkür mesajı ("BİZİMLE ÇALIŞTIĞINIZ İÇİN TEŞEKKÜR EDERİZ!").

### 6.4 Plan Karşılaştırmalı (Tür 2) PDF Tasarımı (`3 kullanıcılı+sql.pdf.pdf` referansı):
- Üst Sol: Şirket Bilgileri, "Teklif Hazırlayan" (hazırlayan kişi adı).
- Üst Sağ: Teklif Tarihi, "SAYIN [Müşteri Adı]".
- 3'lü Plan Tablosu:
  - Üst başlık: Ürün/Hizmet | Plan 1 | Plan 2 | Plan 3
  - Alt başlık: İlk Yıl - Yenileme (her plan grubu için)
  - Plan 1, Plan 2 ve Plan 3 sütunları görsel olarak farklı hafif renk tonlarıyla ayrıştırılmış.
  - Satırlar: Ürün isimleri ve ilgili 6 kolon.
  - Alt Satır: "Toplam" satırı ve 6 kolon toplamı.
- "TEKLİF NOTLARI" Bölümü: Girilen notların satır satır madde işaretleriyle sunulduğu alan.

---

## 7. Adım Adım Uygulama Planı

1. **Aşama 1 — Proje Başlatma ve Temel Yapı**:
   - Next.js projesinin TypeScript, Tailwind CSS ve App Router ile oluşturulması.
   - `shadcn/ui` bileşenlerinin kurulması (Button, Input, Select, Dialog, Table, Card, Tabs, Toast vb.).
   - `.env` ve `.env.example` dosyalarının yapılandırılması.
   - `DECISIONS.md` dosyasının oluşturulması.

2. **Aşama 2 — Veritabanı ve Seed Scripti**:
   - `prisma/schema.prisma` dosyasının şartnameye uygun tanımlanması ve ilk migration'ın çalıştırılması.
   - `logo-edge-t-series-basic-fiyat-listesi.xlsx` dosyasını okuyan `prisma/seed.ts` betiğinin yazılması.
   - Excel ayrıştırma kurallarının (4.1 & 4.2) işletilmesi ve doğrulanması.

3. **Aşama 3 — Güvenlik ve Kimlik Doğrulama**:
   - Admin giriş sayfası (`/login`), API oturum yönetimi ve Next.js middleware korumasının tamamlanması.

4. **Aşama 4 — Ürün Kataloğu Yönetimi**:
   - `/products` sayfasının geliştirilmesi (listeleme, arama, filtreleme, ekleme, düzenleme, aktif/pasif yapma, güvenli silme).

5. **Aşama 5 — Teklif Hesaplama Motoru ve API'lar**:
   - `src/lib/calculations.ts` ve `src/lib/formatters.ts` modüllerinin yazılması.
   - Teklif numarası üreteci (`AZM-0001`).
   - Teklif CRUD API Route'larının veya Server Actions'ların hazırlanması.

6. **Aşama 6 — Teklif Oluşturucuları (Klasik & Plan Karşılaştırmalı)**:
   - Klasik Teklif ekranı (`/quotes/classic/new` ve edit).
   - Plan Karşılaştırma ekranı (`/quotes/plan-comparison/new` ve edit).
   - Teklif listesi ana sayfası (`/`) ve arama/filtreleme/çoğaltma işlevleri.
   - Teklif detay & önizleme ekranı (`/quotes/[id]`).

7. **Aşama 7 — PDF Üretimi (Puppeteer)**:
   - WSL2 / Linux ortamında Puppeteer yapılandırması.
   - Klasik ve Plan Karşılaştırmalı HTML/CSS şablonlarının hazırlanması.
   - `/api/quotes/[id]/pdf` indirme uç noktasının bağlanması.

8. **Aşama 8 — Doğrulama ve Belgelendirme**:
   - Tüm uçtan uca senaryoların test edilmesi (Excel import doğruluğu, teklif kaydı, çoğaltma, PDF çıktıları).
   - Kurulum ve çalıştırma talimatlarını içeren `README.md` dosyasının hazırlanması.

---

## Doğrulama Planı

### Otomasyon / Komut Doğrulamaları
- `npx prisma db seed` -> Excel'den tüm ürünlerin ve kategorilerin eksiksiz içe aktarıldığının konsol çıktısı ile doğrulanması.
- `npm run build` -> TypeScript ve Next.js derleme kontrollerinin hatasız geçmesi.

### Manuel Doğrulamalar
- `/login` üzerinden giriş testi.
- Klasik teklif oluşturma: Katalog ve manuel ürün ekleme, iskonto hesaplama, KDV doğrulaması ve PDF indirme.
- Plan Karşılaştırma teklifi oluşturma: 6 sütun hesaplamaları, notlar bölümü ve PDF indirme.
- Teklif çoğaltma (duplicate) ve silme fonksiyonlarının testi.
