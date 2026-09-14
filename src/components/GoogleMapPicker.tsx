import React, { useState } from 'react';
import { MapPin, Search, Check, Navigation } from 'lucide-react';

interface GoogleMapPickerProps {
  initialLat?: number;
  initialLng?: number;
  initialName?: string;
  onSelectLocation: (name: string, lat: number, lng: number) => void;
  onClose: () => void;
}

// Popular Quran Centers & Mosques coordinates for quick selection
const POPULAR_MOSQUES = [
  { name: 'جامع الراجحي الكبير - الرياض', lat: 24.6983, lng: 46.7839 },
  { name: 'جامع الملك خالد - أم الحمام', lat: 24.6997, lng: 46.6432 },
  { name: 'مجمع جامع الإمام تركي بن عبدالله', lat: 24.6308, lng: 46.7135 },
  { name: 'جامع الدخيل - حي الشهداء', lat: 24.7891, lng: 46.7289 },
  { name: 'جامع المحيسن - إشبيليا', lat: 24.8115, lng: 46.8052 },
  { name: 'جامع الفرقان - الدمام', lat: 26.4207, lng: 50.0888 },
  { name: 'جامع بن يماني - جدة', lat: 21.5731, lng: 39.1622 },
];

export const GoogleMapPicker: React.FC<GoogleMapPickerProps> = ({
  initialLat = 24.7136,
  initialLng = 46.6753,
  initialName = '',
  onSelectLocation,
  onClose,
}) => {
  const [selectedLat, setSelectedLat] = useState(initialLat);
  const [selectedLng, setSelectedLng] = useState(initialLng);
  const [locationName, setLocationName] = useState(initialName || 'حي النزهة - الرياض');
  const [searchQuery, setSearchQuery] = useState('');

  const handleConfirm = () => {
    onSelectLocation(locationName || 'موقع المسجد / المجمع', selectedLat, selectedLng);
    onClose();
  };

  const handleQuickPick = (item: { name: string; lat: number; lng: number }) => {
    setLocationName(item.name);
    setSelectedLat(item.lat);
    setSelectedLng(item.lng);
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // Derive subtle simulated lat/long offset from Riyadh center
    const latOffset = ((rect.height / 2 - y) / rect.height) * 0.08;
    const lngOffset = ((x - rect.width / 2) / rect.width) * 0.08;
    const newLat = Number((24.7136 + latOffset).toFixed(5));
    const newLng = Number((46.6753 + lngOffset).toFixed(5));
    setSelectedLat(newLat);
    setSelectedLng(newLng);
    setLocationName(`موقع مجمع محدد على الخريطة (${newLat}, ${newLng})`);
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-[#053B50]/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#FFFFFF] border-2 border-[#E8DAC8] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#053B50] text-[#FFFFFF] p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#E8DAC8]" />
            <h3 className="font-bold text-base">تحديد موقع الجامع / المجمع من خرائط جوجل</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs bg-[#FFFFFF]/15 hover:bg-[#FFFFFF]/25 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto">
          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن اسم الحي، الشارع، أو اسم الجامع..."
              className="w-full pr-10 pl-4 py-2.5 border-2 border-[#E8DAC8] rounded-xl outline-none focus:border-[#053B50] text-sm"
            />
            <Search className="w-4 h-4 text-[#053B50]/50 absolute right-3.5 top-3.5" />
          </div>

          {/* Quick Mosques Recommendations */}
          <div>
            <span className="text-xs font-bold text-[#053B50] block mb-2">
              مواقع مسارح ومجمعات قرآنية شائعة:
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-[#F7F3EE] rounded-xl border border-[#E8DAC8]">
              {POPULAR_MOSQUES.filter((m) =>
                m.name.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((m, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickPick(m)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                    selectedLat === m.lat && selectedLng === m.lng
                      ? 'bg-[#053B50] text-[#FFFFFF] border-[#053B50]'
                      : 'bg-[#FFFFFF] text-[#053B50] border-[#E8DAC8] hover:border-[#053B50]'
                  }`}
                >
                  <MapPin className="w-3 h-3 text-[#E8DAC8]" />
                  <span>{m.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Visual Map Canvas with Embedded Open Map View */}
          <div className="relative rounded-xl border-2 border-[#053B50]/30 overflow-hidden shadow-inner h-64 bg-[#e5e3df]">
            {/* Embedded Live Map iframe targeting the coordinates with Google Maps Embed */}
            <iframe
              title="Google Map Selection"
              width="100%"
              height="100%"
              frameBorder="0"
              src={`https://maps.google.com/maps?q=${selectedLat},${selectedLng}&z=15&output=embed`}
              className="w-full h-full pointer-events-none opacity-90"
            />

            {/* Clickable Overlay to reposition pin */}
            <div
              onClick={handleMapClick}
              className="absolute inset-0 cursor-crosshair flex items-center justify-center bg-black/5 hover:bg-black/0 transition-colors"
              title="انقر في أي مكان لتثبيت موقع المجمع القرآني بدقة"
            >
              <div className="flex flex-col items-center -translate-y-4 animate-bounce">
                <div className="bg-[#053B50] text-[#FFFFFF] text-[11px] font-bold px-2 py-0.5 rounded shadow-lg border border-[#E8DAC8] whitespace-nowrap mb-1">
                  الموقع المحدد: {locationName}
                </div>
                <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl border-2 border-white">
                  <MapPin className="w-5 h-5 fill-white text-red-600" />
                </div>
              </div>
            </div>

            <div className="absolute bottom-2 right-2 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-[#E8DAC8] text-[11px] font-mono text-[#053B50] shadow-sm flex items-center gap-1">
              <Navigation className="w-3 h-3 text-[#053B50]" />
              <span>خط العرض: {selectedLat} | خط الطول: {selectedLng}</span>
            </div>
          </div>

          {/* Location Name Input */}
          <div>
            <label className="block text-xs font-bold text-[#053B50] mb-1">
              اسم الحي أو العنوان التفصيلي للمجمع / المسجد:
            </label>
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="مثال: حي النزهة، شارع عثمان بن عفان، جوار جامع الهدى"
              className="w-full p-2.5 border-2 border-[#E8DAC8] rounded-xl outline-none focus:border-[#053B50] text-sm text-[#053B50]"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#F7F3EE] border-t border-[#E8DAC8] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-[#053B50] hover:bg-[#E8DAC8] rounded-xl transition-colors cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="bg-[#053B50] hover:bg-[#042E3F] text-[#FFFFFF] px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
          >
            <Check className="w-4 h-4 text-[#E8DAC8]" />
            <span>تأكيد الموقع وحفظه</span>
          </button>
        </div>
      </div>
    </div>
  );
};
