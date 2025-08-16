export const translations = {
  en: {
    title: 'QR Code Generator',
    subtitle: 'Generate customizable QR codes for links, text, and Wi-Fi networks',
    inputType: 'Input Type',
    link: 'Link',
    text: 'Text',
    wifi: 'Wi-Fi',
    content: 'Content',
    linkPlaceholder: 'Enter URL (e.g., https://example.com)',
    textPlaceholder: 'Enter your text content',
    ssid: 'Network Name (SSID)',
    ssidPlaceholder: 'Enter Wi-Fi network name',
    password: 'Password',
    passwordPlaceholder: 'Enter Wi-Fi password',
    security: 'Security Type',
    hiddenNetwork: 'Hidden Network',
    customization: 'Customization',
    size: 'Size (pixels)',
    foregroundColor: 'Foreground Color',
    backgroundColor: 'Background Color',
    errorCorrection: 'Error Correction',
    margin: 'Margin',
    preview: 'Preview',
    download: 'Download',
    filename: 'Filename',
    filenamePlaceholder: 'qrcode',
    generateQR: 'Generate QR Code',
    downloadPNG: 'Download PNG',
    downloadSVG: 'Download SVG',
    language: 'Language',
    errorCorrectionLevels: {
      L: 'Low (~7%)',
      M: 'Medium (~15%)',
      Q: 'Quartile (~25%)',
      H: 'High (~30%)'
    },
    securityTypes: {
      WPA: 'WPA/WPA2',
      WEP: 'WEP',
      nopass: 'Open Network'
    }
  },
  fa: {
    title: 'تولیدکننده کیو آر کد',
    subtitle: 'تولید کیو آر کدهای قابل تنظیم برای لینک‌ها، متن و شبکه‌های وای‌فای',
    inputType: 'نوع ورودی',
    link: 'لینک',
    text: 'متن',
    wifi: 'وای‌فای',
    content: 'محتوا',
    linkPlaceholder: 'آدرس وب سایت را وارد کنید (مثال: https://example.com)',
    textPlaceholder: 'متن خود را وارد کنید',
    ssid: 'نام شبکه (SSID)',
    ssidPlaceholder: 'نام شبکه وای‌فای را وارد کنید',
    password: 'رمز عبور',
    passwordPlaceholder: 'رمز عبور وای‌فای را وارد کنید',
    security: 'نوع امنیت',
    hiddenNetwork: 'شبکه مخفی',
    customization: 'سفارشی‌سازی',
    size: 'اندازه (پیکسل)',
    foregroundColor: 'رنگ پیش‌زمینه',
    backgroundColor: 'رنگ پس‌زمینه',
    errorCorrection: 'تصحیح خطا',
    margin: 'حاشیه',
    preview: 'پیش‌نمایش',
    download: 'دانلود',
    filename: 'نام فایل',
    filenamePlaceholder: 'qrcode',
    generateQR: 'تولید کیو آر کد',
    downloadPNG: 'دانلود PNG',
    downloadSVG: 'دانلود SVG',
    language: 'زبان',
    errorCorrectionLevels: {
      L: 'پایین (~۷٪)',
      M: 'متوسط (~۱۵٪)',
      Q: 'ربع (~۲۵٪)',
      H: 'بالا (~۳۰٪)'
    },
    securityTypes: {
      WPA: 'WPA/WPA2',
      WEP: 'WEP',
      nopass: 'شبکه باز'
    }
  }
};

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en;