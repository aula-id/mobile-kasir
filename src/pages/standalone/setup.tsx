import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useStandaloneConfigStore } from '@/stores/standalone/standaloneConfigStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { t } from '@/lib/i18n';
import { ArrowLeft, Store, Percent, DollarSign } from 'lucide-react';

export default function StandaloneSetupPage() {
  const navigate = useNavigate();
  const {
    mode,
    businessName,
    currency,
    taxRate,
    serviceChargeEnabled,
    serviceChargeRate,
    setBusinessName,
    setCurrency,
    setTaxRate,
    setServiceChargeEnabled,
    setServiceChargeRate,
    completeSetup,
  } = useStandaloneConfigStore();
  const { appSettings } = useSettingsStore();
  const lang = appSettings.language;

  const [localBusinessName, setLocalBusinessName] = useState(businessName);
  const [localCurrency, setLocalCurrency] = useState(currency);
  const [localTaxRate, setLocalTaxRate] = useState(taxRate.toString());
  const [localServiceEnabled, setLocalServiceEnabled] = useState(serviceChargeEnabled);
  const [localServiceRate, setLocalServiceRate] = useState(serviceChargeRate.toString());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleBack = () => {
    navigate({ to: '/' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const newErrors: Record<string, string> = {};
    if (!localBusinessName.trim()) {
      newErrors.businessName = t(lang, 'standalone.businessNameRequired');
    }
    if (isNaN(parseFloat(localTaxRate)) || parseFloat(localTaxRate) < 0) {
      newErrors.taxRate = t(lang, 'standalone.invalidTaxRate');
    }
    if (localServiceEnabled && (isNaN(parseFloat(localServiceRate)) || parseFloat(localServiceRate) < 0)) {
      newErrors.serviceRate = t(lang, 'standalone.invalidServiceRate');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Save settings
    setBusinessName(localBusinessName.trim());
    setCurrency(localCurrency);
    setTaxRate(parseFloat(localTaxRate));
    setServiceChargeEnabled(localServiceEnabled);
    setServiceChargeRate(parseFloat(localServiceRate) || 0);
    completeSetup();

    // Navigate to POS
    if (mode === 'fnb') {
      navigate({ to: '/fnb/pos' });
    } else {
      navigate({ to: '/rtl/pos' });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#E8E2D9] bg-white">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 text-[#8D8D9B] hover:text-[#3D405B] transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold text-[#3D405B]">
            {t(lang, 'standalone.setupTitle')}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#E07A5F] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Store className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-lg font-medium text-[#3D405B] mb-1">
              {t(lang, 'standalone.setupSubtitle')}
            </h2>
            <p className="text-sm text-[#8D8D9B]">
              {mode === 'fnb'
                ? t(lang, 'standalone.standaloneFnb')
                : t(lang, 'standalone.standaloneRetail')
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Business Name */}
            <div>
              <label className="block text-sm font-medium text-[#3D405B] mb-2">
                {t(lang, 'standalone.businessName')}
              </label>
              <Input
                value={localBusinessName}
                onChange={(e) => {
                  setLocalBusinessName(e.target.value);
                  setErrors((prev) => ({ ...prev, businessName: '' }));
                }}
                placeholder={t(lang, 'standalone.businessNamePlaceholder')}
                className="w-full"
              />
              {errors.businessName && (
                <p className="text-sm text-red-500 mt-1">{errors.businessName}</p>
              )}
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-medium text-[#3D405B] mb-2">
                {t(lang, 'standalone.currency')}
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8D8D9B]" />
                <select
                  value={localCurrency}
                  onChange={(e) => setLocalCurrency(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E8E2D9] bg-white text-[#3D405B] focus:outline-none focus:ring-2 focus:ring-[#E07A5F] focus:border-transparent"
                >
                  <option value="IDR">IDR - Indonesian Rupiah</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="SGD">SGD - Singapore Dollar</option>
                  <option value="MYR">MYR - Malaysian Ringgit</option>
                </select>
              </div>
            </div>

            {/* Tax Rate */}
            <div>
              <label className="block text-sm font-medium text-[#3D405B] mb-2">
                {t(lang, 'standalone.taxRate')}
              </label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8D8D9B]" />
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={localTaxRate}
                  onChange={(e) => {
                    setLocalTaxRate(e.target.value);
                    setErrors((prev) => ({ ...prev, taxRate: '' }));
                  }}
                  className="w-full pl-10"
                />
              </div>
              {errors.taxRate && (
                <p className="text-sm text-red-500 mt-1">{errors.taxRate}</p>
              )}
            </div>

            {/* Service Charge Toggle */}
            <div className="bg-white rounded-xl border border-[#E8E2D9] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-[#3D405B]">
                    {t(lang, 'standalone.serviceCharge')}
                  </p>
                  <p className="text-sm text-[#8D8D9B]">
                    {t(lang, 'standalone.serviceChargeDesc')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setLocalServiceEnabled(!localServiceEnabled)}
                  className={`relative w-12 h-7 rounded-full transition-colors ${
                    localServiceEnabled ? 'bg-[#E07A5F]' : 'bg-[#E8E2D9]'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      localServiceEnabled ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {localServiceEnabled && (
                <div className="mt-4 pt-4 border-t border-[#E8E2D9]">
                  <label className="block text-sm font-medium text-[#3D405B] mb-2">
                    {t(lang, 'standalone.serviceRate')}
                  </label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8D8D9B]" />
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={localServiceRate}
                      onChange={(e) => {
                        setLocalServiceRate(e.target.value);
                        setErrors((prev) => ({ ...prev, serviceRate: '' }));
                      }}
                      className="w-full pl-10"
                    />
                  </div>
                  {errors.serviceRate && (
                    <p className="text-sm text-red-500 mt-1">{errors.serviceRate}</p>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              fullWidth
              className="h-14"
            >
              {t(lang, 'standalone.startUsing')}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
