import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { usePrinterStore } from '@/stores/printerStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { t } from '@/lib/i18n';
import {
  Printer,
  Bluetooth,
  Usb,
  Wifi,
  CheckCircle,
  XCircle,
  RefreshCw,
  Settings,
} from 'lucide-react';
import { StandaloneSubPageHeader } from '@/components/standalone/StandaloneSubPageHeader';

export default function StandalonePrinterPage() {
  const {
    isConnected,
    connectedPrinter,
    availablePrinters,
    isScanning,
    scanPrinters,
    connect,
    disconnect,
    testPrint,
    updateSettings,
    paperWidth: storePaperWidth,
  } = usePrinterStore();

  // Local state for printer settings
  const [paperWidth, setPaperWidth] = useState<42 | 48 | 58 | 60 | 80>(storePaperWidth);
  const [autoConnect, setAutoConnect] = useState(connectedPrinter?.autoConnect ?? true);
  useEffect(() => {
    setPaperWidth(storePaperWidth);
  }, [storePaperWidth]);
  const { appSettings } = useSettingsStore();
  const lang = appSettings.language;

  const [isTestPrinting, setIsTestPrinting] = useState(false);

  const handleTestPrint = async () => {
    setIsTestPrinting(true);
    try {
      await testPrint();
    } finally {
      setIsTestPrinting(false);
    }
  };

  const getConnectionIcon = (type: string) => {
    switch (type) {
      case 'bluetooth':
        return <Bluetooth className="w-4 h-4" />;
      case 'usb':
        return <Usb className="w-4 h-4" />;
      case 'network':
        return <Wifi className="w-4 h-4" />;
      default:
        return <Printer className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
      <StandaloneSubPageHeader title={t(lang, 'printer.title')} />

      <div className="flex-1 p-4 space-y-4">
        {/* Connection Status */}
        <div className="bg-white rounded-xl border border-[#E8E2D9] p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#3D405B]">{t(lang, 'printer.connectionStatus')}</h2>
            <span
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                isConnected
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-600'
              }`}
            >
              {isConnected ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  {t(lang, 'printer.connected')}
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4" />
                  {t(lang, 'printer.disconnected')}
                </>
              )}
            </span>
          </div>

          {isConnected && connectedPrinter && (
            <div className="p-4 bg-[#F5F0E8] rounded-xl mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center">
                  {getConnectionIcon(connectedPrinter.type)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-[#3D405B]">{connectedPrinter.name}</p>
                  <p className="text-sm text-[#8D8D9B]">{connectedPrinter.address}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {isConnected ? (
              <>
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={disconnect}
                >
                  {t(lang, 'printer.disconnect')}
                </Button>
                <Button
                  fullWidth
                  onClick={handleTestPrint}
                  isLoading={isTestPrinting}
                >
                  {t(lang, 'printer.testPrint')}
                </Button>
              </>
            ) : (
              <Button
                fullWidth
                onClick={scanPrinters}
                isLoading={isScanning}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
                {isScanning ? t(lang, 'printer.scanning') : t(lang, 'printer.scan')}
              </Button>
            )}
          </div>
        </div>

        {/* Available Printers */}
        {!isConnected && (
          <div className="bg-white rounded-xl border border-[#E8E2D9] p-4">
            <h2 className="font-semibold text-[#3D405B] mb-4">{t(lang, 'printer.availablePrinters')}</h2>

            {availablePrinters.length === 0 ? (
              <div className="text-center py-8">
                <Printer className="w-12 h-12 text-[#E8E2D9] mx-auto mb-3" />
                <p className="text-[#8D8D9B]">{t(lang, 'printer.noPrintersFound')}</p>
                <p className="text-sm text-[#C9B8A8]">{t(lang, 'printer.noPrintersHint')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {availablePrinters.map((printer) => (
                  <button
                    key={printer.id}
                    onClick={() => connect(printer, paperWidth, autoConnect)}
                    className="w-full p-4 rounded-xl border border-[#E8E2D9] flex items-center gap-3 hover:bg-[#F5F0E8] transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#F5F0E8] flex items-center justify-center">
                      {getConnectionIcon(printer.type)}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-[#3D405B]">{printer.name}</p>
                      <p className="text-sm text-[#8D8D9B]">
                        {printer.type === 'bluetooth' && t(lang, 'printer.bluetooth')}
                        {printer.type === 'usb' && t(lang, 'printer.usb')}
                        {printer.type === 'network' && t(lang, 'printer.network')}
                        {printer.paired && ` - ${t(lang, 'printer.paired')}`}
                      </p>
                    </div>
                    <span className="text-sm text-[#E07A5F] font-medium">
                      {t(lang, 'printer.connect')}
                    </span>
                  </button>
                ))}
              </div>
            )}
          <p className="text-xs text-[#C9B8A8] mt-3">
            Hanya printer BLE yang didukung. Untuk printer Bluetooth klasik, gunakan koneksi USB.
          </p>
          </div>
        )}

        {/* Settings */}
        <div className="bg-white rounded-xl border border-[#E8E2D9] p-4">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-[#8D8D9B]" />
            <h2 className="font-semibold text-[#3D405B]">{t(lang, 'printer.settings')}</h2>
          </div>

          {/* Paper Width */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-[#3D405B] mb-2">
              {t(lang, 'printer.paperWidth')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([42, 48, 58, 60, 80] as const).map((pw) => (
                <button
                  key={pw}
                  onClick={() => {
                    setPaperWidth(pw);
                    updateSettings(pw, autoConnect);
                  }}
                  className={`py-3 px-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                    paperWidth === pw
                      ? 'border-[#E07A5F] bg-[#FDF6F4] text-[#E07A5F]'
                      : 'border-[#E8E2D9] text-[#3D405B] hover:border-[#C9B8A8]'
                  }`}
                >
                  {t(lang, `printer.paperWidth${pw}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Auto-connect */}
          <div className="flex items-center justify-between p-4 bg-[#FAFAF8] rounded-xl">
            <div>
              <p className="font-medium text-[#3D405B]">{t(lang, 'printer.autoConnect')}</p>
              <p className="text-sm text-[#8D8D9B]">
                {t(lang, 'standalone.autoConnectDesc')}
              </p>
            </div>
            <button
              onClick={() => {
                const newVal = !autoConnect;
                setAutoConnect(newVal);
                updateSettings(paperWidth, newVal);
              }}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                autoConnect ? 'bg-[#E07A5F]' : 'bg-[#E8E2D9]'
              }`}
            >
              <span
                className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  autoConnect ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
