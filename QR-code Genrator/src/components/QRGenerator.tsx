import React, { useState, useEffect, useCallback } from 'react';
import { 
  Link, 
  Type, 
  Wifi, 
  Download, 
  Settings, 
  Languages,
  Eye,
  EyeOff,
  Palette
} from 'lucide-react';
import { generateQRCodePNG, generateQRCodeSVG, validateQRContent, validateURL, normalizeURL, type ErrorCorrectionLevel, type QRCodeOptions } from '../utils/qrcode';
import { generateWiFiPayload, validateWiFiConfig, type WiFiConfig } from '../utils/wifi';
import { downloadPNG, downloadSVG, sanitizeFilename } from '../utils/download';
import { translations, type Language } from '../constants/translations';

type InputType = 'link' | 'text' | 'wifi';
type SecurityType = 'WPA' | 'WEP' | 'nopass';

interface QRState {
  inputType: InputType;
  link: string;
  text: string;
  wifi: WiFiConfig;
  options: QRCodeOptions;
  filename: string;
  language: Language;
  qrCodePNG: string | null;
  qrCodeSVG: string | null;
  isGenerating: boolean;
  showPassword: boolean;
}

const QRGenerator: React.FC = () => {
  const [state, setState] = useState<QRState>({
    inputType: 'link',
    link: '',
    text: '',
    wifi: {
      ssid: '',
      password: '',
      security: 'WPA',
      hidden: false
    },
    options: {
      size: 256,
      foregroundColor: '#000000',
      backgroundColor: '#ffffff',
      errorCorrectionLevel: 'M',
      margin: 2
    },
    filename: 'qrcode',
    language: 'en',
    qrCodePNG: null,
    qrCodeSVG: null,
    isGenerating: false,
    showPassword: false
  });

  const t = translations[state.language];
  const isRTL = state.language === 'fa';

  const getCurrentContent = useCallback((): string => {
    switch (state.inputType) {
      case 'link':
        return state.link ? normalizeURL(state.link) : '';
      case 'text':
        return state.text;
      case 'wifi':
        return generateWiFiPayload(state.wifi);
      default:
        return '';
    }
  }, [state.inputType, state.link, state.text, state.wifi]);

  const generateQRCode = useCallback(async () => {
    const content = getCurrentContent();
    
    if (!content) {
      setState(prev => ({ ...prev, qrCodePNG: null, qrCodeSVG: null }));
      return;
    }

    const validation = validateQRContent(content);
    if (!validation.isValid) {
      console.warn('Invalid QR content:', validation.errors);
      return;
    }

    if (state.inputType === 'link' && !validateURL(content)) {
      console.warn('Invalid URL format');
      return;
    }

    if (state.inputType === 'wifi') {
      const wifiValidation = validateWiFiConfig(state.wifi);
      if (!wifiValidation.isValid) {
        console.warn('Invalid Wi-Fi config:', wifiValidation.errors);
        return;
      }
    }

    setState(prev => ({ ...prev, isGenerating: true }));

    try {
      const [pngDataUrl, svgContent] = await Promise.all([
        generateQRCodePNG(content, state.options),
        generateQRCodeSVG(content, state.options)
      ]);

      setState(prev => ({
        ...prev,
        qrCodePNG: pngDataUrl,
        qrCodeSVG: svgContent,
        isGenerating: false
      }));
    } catch (error) {
      console.error('Error generating QR code:', error);
      setState(prev => ({ ...prev, isGenerating: false }));
    }
  }, [getCurrentContent, state.inputType, state.options, state.wifi]);

  // Auto-generate QR code when content or options change
  useEffect(() => {
    const timeoutId = setTimeout(generateQRCode, 300);
    return () => clearTimeout(timeoutId);
  }, [generateQRCode]);

  const handleDownloadPNG = () => {
    if (state.qrCodePNG) {
      const filename = sanitizeFilename(state.filename || 'qrcode');
      downloadPNG(state.qrCodePNG, filename);
    }
  };

  const handleDownloadSVG = () => {
    if (state.qrCodeSVG) {
      const filename = sanitizeFilename(state.filename || 'qrcode');
      downloadSVG(state.qrCodeSVG, filename);
    }
  };

  const updateState = (updates: Partial<QRState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const updateWiFi = (updates: Partial<WiFiConfig>) => {
    setState(prev => ({
      ...prev,
      wifi: { ...prev.wifi, ...updates }
    }));
  };

  const updateOptions = (updates: Partial<QRCodeOptions>) => {
    setState(prev => ({
      ...prev,
      options: { ...prev.options, ...updates }
    }));
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 ${isRTL ? 'rtl' : ''}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{t.title}</h1>
          <p className="text-gray-600 text-lg">{t.subtitle}</p>
        </div>

        {/* Language Toggle */}
        <div className="flex justify-center mb-6 " dir='ltr'>
          <div className="flex  md:flex-col  bg-white rounded-lg shadow-sm border border-gray-200 p-1">
            <button
              onClick={() => updateState({ language: 'en' })}
              className={`px-4 py-2 rounded-md flex items-center w-full gap-2 transition-all ${
                state.language === 'en'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              
              English
            </button>
            <button
              onClick={() => updateState({ language: 'fa' })}
              className={`px-4 py-2 rounded-md flex items-center justify-center  transition-all ${
                state.language === 'fa'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              
              فارسی
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Panel - Configuration */}
          <div className="space-y-6">
            {/* Input Type Selection */}
            <div  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t.inputType}</h2>
              <div dir='ltr' className="grid grid-cols-3 gap-2">
                {[
                  { type: 'link' as const, icon: Link, label: t.link },
                  { type: 'text' as const, icon: Type, label: t.text },
                  { type: 'wifi' as const, icon: Wifi, label: t.wifi }
                ].map(({ type, icon: Icon, label }) => (
                  <button
                    key={type}
                    onClick={() => updateState({ inputType: type })}
                    className={`p-4 rounded-lg border-2 transition-all focus-ring ${
                      state.inputType === type
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={24} className="mx-auto mb-2" />
                    <div className="text-sm font-medium">{label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Content Input */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t.content}</h2>
              
              {state.inputType === 'link' && (
                <div >
                  <label htmlFor="link" className="block text-sm font-medium text-gray-700 mb-2">
                    {t.link}
                  </label>
                  <input
                    type="url"
                    id="link"
                    value={state.link}
                    onChange={(e) => updateState({ link: e.target.value })}
                    placeholder={t.linkPlaceholder}
                    className=" w-full px-4 py-3 border border-gray-300 rounded-lg focus-ring "
                  />
                </div>
              )}

              {state.inputType === 'text' && (
                <div>
                  <label htmlFor="text" className="block text-sm font-medium text-gray-700 mb-2">
                    {t.text}
                  </label>
                  <textarea
                    id="text"
                    value={state.text}
                    onChange={(e) => updateState({ text: e.target.value })}
                    placeholder={t.textPlaceholder}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus-ring resize-none"
                  />
                </div>
              )}

              {state.inputType === 'wifi' && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="ssid" className="block text-sm font-medium text-gray-700 mb-2">
                      {t.ssid}
                    </label>
                    <input
                      type="text"
                      id="ssid"
                      value={state.wifi.ssid}
                      onChange={(e) => updateWiFi({ ssid: e.target.value })}
                      placeholder={t.ssidPlaceholder}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus-ring"
                      maxLength={32}
                    />
                  </div>

                  <div>
                    <label htmlFor="security" className="block text-sm font-medium text-gray-700 mb-2">
                      {t.security}
                    </label>
                    <select
                      id="security"
                      value={state.wifi.security}
                      onChange={(e) => updateWiFi({ security: e.target.value as SecurityType })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus-ring"
                    >
                      {Object.entries(t.securityTypes).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>

                  {state.wifi.security !== 'nopass' && (
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                        {t.password}
                      </label>
                      <div className="relative">
                        <input
                          type={state.showPassword ? 'text' : 'password'}
                          id="password"
                          value={state.wifi.password}
                          onChange={(e) => updateWiFi({ password: e.target.value })}
                          placeholder={t.passwordPlaceholder}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus-ring ltr"
                          maxLength={63}
                        />
                        <button
                          type="button"
                          onClick={() => updateState({ showPassword: !state.showPassword })}
                          className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700`}
                        >
                          {state.showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="hidden"
                      checked={state.wifi.hidden}
                      onChange={(e) => updateWiFi({ hidden: e.target.checked })}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus-ring"
                    />
                    <label htmlFor="hidden" className={`${isRTL ? 'mr-3' : 'ml-3'} text-sm font-medium text-gray-700`}>
                      {t.hiddenNetwork}
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Customization Options */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Settings size={20} />
                {t.customization}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-2">
                    {t.size}
                  </label>
                  <input
                    type="range"
                    id="size"
                    min="128"
                    max="1024"
                    step="32"
                    value={state.options.size}
                    onChange={(e) => updateOptions({ size: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <div className="text-center text-sm text-gray-500 mt-1">
                    {state.options.size}px
                  </div>
                </div>

                <div>
                  <label htmlFor="margin" className="block text-sm font-medium text-gray-700 mb-2">
                    {t.margin}
                  </label>
                  <input
                    type="range"
                    id="margin"
                    min="0"
                    max="10"
                    step="1"
                    value={state.options.margin}
                    onChange={(e) => updateOptions({ margin: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <div className="text-center text-sm text-gray-500 mt-1">
                    {state.options.margin}
                  </div>
                </div>

                <div>
                  <label htmlFor="foreground" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Palette size={16} />
                    {t.foregroundColor}
                  </label>
                  <input
                    type="color"
                    id="foreground"
                    value={state.options.foregroundColor}
                    onChange={(e) => updateOptions({ foregroundColor: e.target.value })}
                    className="w-full h-12 focus-ring"
                  />
                </div>

                <div>
                  <label htmlFor="background" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Palette size={16} />
                    {t.backgroundColor}
                  </label>
                  <input
                    type="color"
                    id="background"
                    value={state.options.backgroundColor}
                    onChange={(e) => updateOptions({ backgroundColor: e.target.value })}
                    className="w-full h-12 focus-ring"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="errorCorrection" className="block text-sm font-medium text-gray-700 mb-2">
                    {t.errorCorrection}
                  </label>
                  <select
                    id="errorCorrection"
                    value={state.options.errorCorrectionLevel}
                    onChange={(e) => updateOptions({ errorCorrectionLevel: e.target.value as ErrorCorrectionLevel })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus-ring"
                  >
                    {Object.entries(t.errorCorrectionLevels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Preview & Download */}
          <div className="space-y-6">
            {/* Preview */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t.preview}</h2>
              <div className="flex justify-center">
                <div className="relative">
                  {state.isGenerating ? (
                    <div className="flex items-center justify-center w-64 h-64 border-2 border-dashed border-gray-300 rounded-lg">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : state.qrCodePNG ? (
                    <img
                      src={state.qrCodePNG}
                      alt="Generated QR Code"
                      className="max-w-full h-auto border border-gray-200 rounded-lg shadow-sm"
                      style={{ maxWidth: '300px', maxHeight: '300px' }}
                    />
                  ) : (
                    <div className="flex items-center justify-center w-64 h-64 border-2 border-dashed border-gray-300 rounded-lg text-gray-500">
                      {getCurrentContent() ? (state.language!='fa'?'Generating...':"در حال ساخت ...")  : (state.language=='fa'?'ابتدا محتویات خود را وارد کنید':"Enter content to generate QR code") }
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Download Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Download size={20} />
                {t.download}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="filename" className="block text-sm font-medium text-gray-700 mb-2">
                    {t.filename}
                  </label>
                  <input
                    type="text"
                    id="filename"
                    value={state.filename}
                    onChange={(e) => updateState({ filename: e.target.value })}
                    placeholder={t.filenamePlaceholder}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus-ring ltr"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleDownloadPNG}
                    disabled={!state.qrCodePNG}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors focus-ring"
                  >
                    <Download size={20} />
                    {t.downloadPNG}
                  </button>
                  
                  <button
                    onClick={handleDownloadSVG}
                    disabled={!state.qrCodeSVG}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-emerald-700 transition-colors focus-ring"
                  >
                    <Download size={20} />
                    {t.downloadSVG}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRGenerator;