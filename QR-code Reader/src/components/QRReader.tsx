import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Camera,
  Upload,
  Scan,
  Copy,
  ExternalLink,
  Wifi,
  Type,
  Link as LinkIcon,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  CreditCard,
  X,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Download,
  Languages,
} from "lucide-react";
import jsQR from "jsqr";
import {
  readerTranslations,
  type ReaderLanguage,
} from "../constants/readerTranslations";

interface QRResult {
  data: string;
  type:
    | "url"
    | "text"
    | "wifi"
    | "email"
    | "phone"
    | "sms"
    | "geo"
    | "vcard"
    | "event"
    | "unknown";
  parsed?: any;
}

interface WiFiData {
  ssid: string;
  password: string;
  security: string;
  hidden: boolean;
}

const QRReader: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<QRResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [scanMode, setScanMode] = useState<"camera" | "file">("camera");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [language, setLanguage] = useState<ReaderLanguage>("en");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number>();

  const t = readerTranslations[language];
  const isRTL = language === "fa";

  // Get available cameras
  useEffect(() => {
    const getDevices = async () => {
      try {
        const deviceList = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = deviceList.filter(
          (device) => device.kind === "videoinput"
        );
        setDevices(videoDevices);
        if (videoDevices.length > 0 && !selectedDevice) {
          setSelectedDevice(videoDevices[0].deviceId);
        }
      } catch (err) {
        console.error("Error getting devices:", err);
      }
    };

    getDevices();
  }, [selectedDevice]);

  // Parse QR code data to determine type and extract information
  const parseQRData = useCallback((data: string): QRResult => {
    const lowerData = data.toLowerCase();

    // URL detection
    if (data.match(/^https?:\/\//i) || data.match(/^www\./i)) {
      return { data, type: "url" };
    }

    // WiFi detection
    if (data.startsWith("WIFI:")) {
      const wifiMatch = data.match(
        /WIFI:T:([^;]*);S:([^;]*);P:([^;]*);H:([^;]*);/
      );
      if (wifiMatch) {
        const parsed: WiFiData = {
          security: wifiMatch[1] || "nopass",
          ssid: wifiMatch[2] || "",
          password: wifiMatch[3] || "",
          hidden: wifiMatch[4] === "true",
        };
        return { data, type: "wifi", parsed };
      }
    }

    // Email detection
    if (
      data.startsWith("mailto:") ||
      data.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    ) {
      return { data, type: "email" };
    }

    // Phone detection
    if (data.startsWith("tel:") || data.match(/^[\+]?[0-9\-\(\)\s]+$/)) {
      return { data, type: "phone" };
    }

    // SMS detection
    if (data.startsWith("sms:") || data.startsWith("smsto:")) {
      return { data, type: "sms" };
    }

    // Geo location detection
    if (data.startsWith("geo:")) {
      return { data, type: "geo" };
    }

    // vCard detection
    if (data.startsWith("BEGIN:VCARD")) {
      return { data, type: "vcard" };
    }

    // Calendar event detection
    if (data.startsWith("BEGIN:VEVENT")) {
      return { data, type: "event" };
    }

    // Default to text
    return { data, type: "text" };
  }, []);

  // Start camera scanning
  const startScanning = useCallback(async () => {
  try {
    setError(null);
    setResult(null);

    const constraints = {
      video: {
        deviceId: selectedDevice ? { exact: selectedDevice } : undefined,
        facingMode: selectedDevice ? undefined : { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    streamRef.current = stream;

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setIsScanning(true);

      const scanFrame = () => {
        if (!isScanning) return; // بررسی وضعیت اسکن

        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth > 0 && video.videoHeight > 0) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          // استفاده از inversionAttempts: "attemptBoth" برای بهتر خواندن QR تار یا معکوس
          const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "attemptBoth" });

          if (code) {
            const parsedResult = parseQRData(code.data);
            setResult(parsedResult);

            // توقف اسکن و حلقه
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            stopScanning();
            return;
          }
        }

        animationRef.current = requestAnimationFrame(scanFrame);
      };

      scanFrame();
    }
  } catch (err) {
    setError(t.cameraError);
    console.error('Camera access error:', err);
  }
}, [selectedDevice, parseQRData]); // حذف isScanning از وابستگی

// Stop camera scanning
const stopScanning = useCallback(() => {
  setIsScanning(false);

  if (animationRef.current) {
    cancelAnimationFrame(animationRef.current);
    animationRef.current = null;
  }

  if (streamRef.current) {
    streamRef.current.getTracks().forEach(track => track.stop());
    streamRef.current = null;
  }

  if (videoRef.current) {
    videoRef.current.srcObject = null;
  }
}, []);

  // Handle file upload
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current;
          if (!canvas) return;

          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code) {
            const parsedResult = parseQRData(code.data);
            setResult(parsedResult);
            setError(null);
          } else {
            setError(t.qrNotFound);
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    },
    [parseQRData]
  );

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Get icon for QR type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "url":
        return <LinkIcon size={20} className="text-blue-500" />;
      case "wifi":
        return <Wifi size={20} className="text-green-500" />;
      case "email":
        return <Mail size={20} className="text-red-500" />;
      case "phone":
        return <Phone size={20} className="text-purple-500" />;
      case "sms":
        return <Phone size={20} className="text-orange-500" />;
      case "geo":
        return <MapPin size={20} className="text-teal-500" />;
      case "vcard":
        return <User size={20} className="text-indigo-500" />;
      case "event":
        return <Calendar size={20} className="text-pink-500" />;
      default:
        return <Type size={20} className="text-gray-500" />;
    }
  };

  // Get type label
  const getTypeLabel = (type: string) => {
    return (
      t.typeLabels[type as keyof typeof t.typeLabels] || t.typeLabels.unknown
    );
  };

  // Render result content
  const renderResult = () => {
    if (!result) return null;

    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {getTypeIcon(result.type)}
            <h3 className="text-lg font-semibold text-gray-900">
              {getTypeLabel(result.type)}
            </h3>
          </div>
          <button
            onClick={() => setResult(null)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {result.type === "wifi" && result.parsed ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.networkName}
                </label>
                <div className="p-3 bg-gray-50 rounded-lg font-mono text-sm">
                  {result.parsed.ssid}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.securityType}
                </label>
                <div className="p-3 bg-gray-50 rounded-lg text-sm">
                  {result.parsed.security || t.open_network}
                </div>
              </div>
            </div>
            {result.parsed.password && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.password}
                </label>
                <div className="p-3 bg-gray-50 rounded-lg font-mono text-sm break-all">
                  {result.parsed.password}
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{t.hiddenNetwork}:</span>
              <span
                className={`px-2 py-1 rounded-full text-xs ${
                  result.parsed.hidden
                    ? "bg-red-100 text-red-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {result.parsed.hidden ? t.yes : t.no}
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.content}
              </label>
              <div className="p-4 bg-gray-50 rounded-lg font-mono text-sm break-all max-h-40 overflow-y-auto scrollbar-thin">
                {result.data}
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => copyToClipboard(result.data)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus-ring"
          >
            {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
            {copied ? t.copied : t.copy}
          </button>

          {result.type === "url" && (
            <button
              onClick={() => window.open(result.data, "_blank")}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors focus-ring"
            >
              <ExternalLink size={16} />
              {t.open}
            </button>
          )}

          {result.type === "email" && (
            <button
              onClick={() =>
                (window.location.href = result.data.startsWith("mailto:")
                  ? result.data
                  : `mailto:${result.data}`)
              }
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors focus-ring"
            >
              <Mail size={16} />
              {t.sendEmail}
            </button>
          )}

          {result.type === "phone" && (
            <button
              onClick={() =>
                (window.location.href = result.data.startsWith("tel:")
                  ? result.data
                  : `tel:${result.data}`)
              }
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors focus-ring"
            >
              <Phone size={16} />
              {t.call}
            </button>
          )}
        </div>
      </div>
    );
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 ${
        isRTL ? "rtl" : ""
      }`}
    >
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{t.title}</h1>
          <p className="text-gray-600 text-lg">{t.subtitle}</p>
        </div>

        {/* Language Toggle */}
        <div className="flex justify-center mb-6" dir="ltr">
          <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 p-1">
            <button
              onClick={() => setLanguage("en")}
              className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
                language === "en"
                  ? "bg-purple-500 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage("fa")}
              className={`px-4 py-2 rounded-md flex items-center  justify-center transition-all ${
                language === "fa"
                  ? "bg-purple-500 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              فارسی
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Mode Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t.scanMethod}
            </h2>
            <div dir="ltr" className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setScanMode("camera")}
                className={`p-4 rounded-lg border-2 transition-all focus-ring ${
                  scanMode === "camera"
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Camera size={32} className="mx-auto mb-2" />
                <div className="font-medium">{t.camera}</div>
                <div className="text-sm text-gray-500 mt-1">{t.cameraDesc}</div>
              </button>

              <button
                onClick={() => setScanMode("file")}
                className={`p-4 rounded-lg border-2 transition-all focus-ring ${
                  scanMode === "file"
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Upload size={32} className="mx-auto mb-2" />
                <div className="font-medium">{t.fileUpload}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {t.fileUploadDesc}
                </div>
              </button>
            </div>
          </div>

          {/* Camera Mode */}
          {scanMode === "camera" && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              {devices.length > 1 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.selectCamera}
                  </label>
                  <select
                    value={selectedDevice}
                    onChange={(e) => setSelectedDevice(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus-ring"
                  >
                    {devices.map((device, index) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `${t.camera} ${index + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full max-w-md mx-auto rounded-lg border border-gray-300"
                  style={{ display: isScanning ? "block" : "none" }}
                  playsInline
                  muted
                />

                {!isScanning && (
                  <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="text-center">
                      <Scan size={48} className="mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500 mb-4">
                        {language === "fa"
                          ? "برای شروع اسکن دکمه زیر را فشار دهید"
                          : "Press the button below to start scanning"}
                      </p>
                    </div>
                  </div>
                )}

                {isScanning && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-4 border-2 border-purple-500 rounded-lg">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-purple-500"></div>
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-purple-500"></div>
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-purple-500"></div>
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-purple-500"></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-center mt-4">
                {!isScanning ? (
                  <button
                    onClick={startScanning}
                    className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors focus-ring"
                  >
                    <Camera size={20} />
                    {t.startScan}
                  </button>
                ) : (
                  <button
                    onClick={stopScanning}
                    className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors focus-ring"
                  >
                    <X size={20} />
                    {t.stopScan}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* File Upload Mode */}
          {scanMode === "file" && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors cursor-pointer"
              >
                <Upload size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">{t.selectImage}</p>
                <p className="text-sm text-gray-500">{t.fileFormats}</p>
                <button className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors focus-ring">
                  {t.selectFile}
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <AlertCircle size={20} className="text-red-500" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Result Display */}
          {result && renderResult()}

          {/* Hidden Canvas */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    </div>
  );
};

export default QRReader;
