export interface CompanyConfig {
  name: string;
  shortName: string;
  tagline: string;
  address: string;
  taxOffice: string;
  taxNumber: string;
  phone: string;
  email: string;
  website: string;
  city: string;
}

export const companyConfig: CompanyConfig = {
  name: "Azem Yazılım Bilişim ve Teknolojileri Ltd. Şti.",
  shortName: "Azem Yazılım",
  tagline: "Logo Yazılım Yetkili İş Ortağı",
  address: "Üniversite Mah. Civan Sok. Allure Tower No: 1 Kat: 13 D: 147 Avcılar / İSTANBUL",
  taxOffice: "Avcılar V.D.",
  taxNumber: "1234567890",
  phone: "0 (212) 999 00 00 / 0 (532) 000 00 00",
  email: "info@azemyazilim.com",
  website: "www.azemyazilim.com",
  city: "İstanbul",
};
