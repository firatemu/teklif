# AzemTeklif — Logo Teklif ve Fiyat Yönetim Portalı

**AzemTeklif**, Azem Yazılım Bilişim ve Teknolojileri Ltd. Şti. için geliştirilmiş; ürün kataloğunu veritabanında yöneten, iki farklı formatta (Klasik ve Plan Karşılaştırmalı) kurumsal teklifler oluşturan ve bunları kurumsal PDF formatında dışa aktaran tek kullanıcılı iç web uygulamasıdır.

---

## 🛠 Teknoloji Yığını

- **Framework**: Next.js 16 (App Router, TypeScript Strict Mode, Turbopack)
- **Veritabanı & ORM**: SQLite (`prisma/dev.db`) + Prisma ORM
- **Stil & Tasarım**: Tailwind CSS, Lucide React Icons
- **Kimlik Doğrulama**: Jose tabanlı HTTP-only güvenli JWT session cookie + Bcrypt
- **PDF Üretimi**: Puppeteer (Headless Chromium, A4 dikey pixel-perfect şablonlar)
- **Excel İçe Aktarımı**: SheetJS (`xlsx`)

---

## 🚀 Kurulum ve Çalıştırma

### 1. Bağımlılıkları Yükleyin
```bash
npm install
```

### 2. Ortam Değişkenlerini Yapılandırın
Kök dizinde `.env` dosyasını oluşturun:
```env
DATABASE_URL="file:./dev.db"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD_HASH="$2b$10$ZZdQ7pgrNEJi4x5ATSGhMOo14VVPP7rU5l6dIStaCQYANUYlAxLpy"
AUTH_SECRET="azemteklif-super-secret-jwt-key-2026-very-secure"
```
> **Varsayılan Giriş Bilgileri**:
> - Kullanıcı Adı: `admin`
> - Şifre: `admin123`

### 3. Veritabanı Migrasyonu ve Excel Seed
Veritabanını oluşturun ve `logo-edge-t-series-basic-fiyat-listesi.xlsx` dosyasındaki ürün kataloğunu aktarın:
```bash
npx prisma migrate dev
npx prisma db seed
```

### 4. Geliştirme Sunucusunu Başlatın
```bash
npm run dev
```
Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açarak giriş yapabilirsiniz.

### 5. Üretim Derlemesi (Production Build)
```bash
npm run build
npm run start
```

---

## 📋 Temel Özellikler

1. **Teklif Listesi & Yönetimi (`/`)**:
   - Tüm kayıtlı tekliflerin listesi, arama ve teklif türüne göre filtreleme.
   - Tek tıkla teklifi inceleme, düzenleme, çoğaltma (yeni numara ve güncel tarih ile taslak oluşturma), PDF indirme ve silme.
   - Yeni teklif oluşturma modalı (Klasik ve Plan Karşılaştırmalı seçimli).

2. **Ürün Kataloğu Yönetimi (`/products`)**:
   - Kategori ve alt kategori bazlı akordeon listeleme.
   - Ürün adı ve kategoriye göre canlı arama.
   - Yeni ürün ekleme ve mevcut ürünleri düzenleme modalı.
   - Tekliflerde kullanılan ürünlerin veri tutarlılığını bozmamak adına silme koruması ve aktif/pasif durumu.

3. **Klasik Teklif (Tür 1) Oluşturucu & Düzenleyici**:
   - Müşteri bilgileri (Unvan, V.D., V.No, İletişim).
   - Katalogdan veya manuel serbest ürün/hizmet ekleme.
   - Planlı ürünlerde Plan 1/2/3 ve İlk Yıl/Yenileme seçimleri (açıklamaya otomatik snapshot eklenir).
   - Satır bazlı ve genel iskontolar (% veya Tutar).
   - Canlı hesaplanan Ara Toplam, Net Tutar, KDV (%20) ve Ödenecek Toplam.

4. **Plan Karşılaştırmalı Teklif (Tür 2) Oluşturucu & Düzenleyici**:
   - Plan 1, Plan 2 ve Plan 3 alternatiflerinin İlk Yıl ve Yenileme fiyatlarını (6 kolon) yan yana sunan kıyaslama tablosu.
   - Sabit fiyatlı ürünlerin her 3 planın İlk Yıl sütununa otomatik yansıtılması.
   - 6 sütunun bağımsız dikey toplamları.
   - Madde işaretli Teklif Notları alanı.

5. **Kurumsal PDF Çıktıları (`/api/quotes/[id]/pdf`)**:
   - `proforma azem.pdf` ve `3 kullanıcılı+sql.pdf.pdf` örneklerine sadık kalınarak tasarlanmış pixel-perfect HTML/CSS şablonları.
   - Puppeteer ile sunucu tarafında oluşturulan A4 dikey PDF indirme/görüntüleme desteği.
   - `src/config/company.ts` üzerinden merkezi firma bilgileri yönetimi.

---

## 📁 Proje Dizin Yapısı

```
azemteklif/
├── prisma/
│   ├── schema.prisma       # Veri modeli tanımları
│   └── seed.ts             # Excel dosyasını parse edip içe aktaran betik
├── src/
│   ├── app/                # Next.js App Router sayfaları ve API rotaları
│   │   ├── api/            # auth, products, quotes, pdf endpoint'leri
│   │   ├── login/          # Giriş sayfası
│   │   ├── products/       # Ürün kataloğu yönetim sayfası
│   │   ├── quotes/         # Teklif oluşturma, düzenleme ve detay sayfaları
│   │   └── page.tsx        # Ana teklif listesi sayfası
│   ├── components/         # Navbar, LogoutButton vb. UI bileşenleri
│   ├── config/
│   │   └── company.ts      # Merkezi şirket ve marka bilgileri
│   ├── lib/
│   │   ├── auth.ts         # JWT session oluşturma ve doğrulama
│   │   ├── calculations.ts # İskonto, KDV ve teklif hesaplama motoru
│   │   ├── db.ts           # Prisma istemcisi singleton örneği
│   │   ├── formatters.ts   # Para birimi (₺) ve tarih biçimlendiricileri
│   │   └── pdf/            # Puppeteer generator ve HTML/CSS şablonları
│   └── middleware.ts       # Yetkisiz erişimleri login sayfasına yönlendiren filtre
├── DECISIONS.md            # Tasarım ve mimari kararlar dokümantasyonu
├── PLAN.md                 # Uygulama planı
└── README.md
```
