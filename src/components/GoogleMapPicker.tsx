import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Check, Navigation, Loader2, Compass, X } from 'lucide-react';

interface GoogleMapPickerProps {
  initialLat?: number;
  initialLng?: number;
  initialName?: string;
  onSelectLocation: (name: string, lat: number, lng: number) => void;
  onClose: () => void;
}

interface MosqueLocation {
  name: string;
  region: string;
  lat: number;
  lng: number;
}

// Comprehensive catalog of well-known mosques & Quran complexes across Saudi regions
const POPULAR_MOSQUES: MosqueLocation[] = [
  // الرياض
  { name: 'جامع الراجحي الكبير - حي القدس (الرياض)', region: 'الرياض', lat: 24.6983, lng: 46.7839 },
  { name: 'جامع الملك خالد - أم الحمام (الرياض)', region: 'الرياض', lat: 24.6997, lng: 46.6432 },
  { name: 'مجمع جامع الإمام تركي بن عبدالله - قصر الحكم (الرياض)', region: 'الرياض', lat: 24.6308, lng: 46.7135 },
  { name: 'جامع الدخيل - حي الشهداء (الرياض)', region: 'الرياض', lat: 24.7891, lng: 46.7289 },
  { name: 'جامع المحيسن - حي إشبيليا (الرياض)', region: 'الرياض', lat: 24.8115, lng: 46.8052 },
  { name: 'جامع الهدى النموذجي - حي النزهة (الرياض)', region: 'الرياض', lat: 24.7516, lng: 46.6985 },
  { name: 'جامع البواردي - حي العزيزية (الرياض)', region: 'الرياض', lat: 24.5872, lng: 46.7761 },
  { name: 'جامع الجوهرة - حي الملقا (الرياض)', region: 'الرياض', lat: 24.8143, lng: 46.6124 },
  { name: 'جامع الصانع - حي السويدي (الرياض)', region: 'الرياض', lat: 24.5824, lng: 46.6892 },
  { name: 'جامع الراجحي - حي شبرا (الرياض)', region: 'الرياض', lat: 24.5768, lng: 46.7112 },
  { name: 'جامع الأميرة لطيفة بنت سلطان - حي الرحمانية (الرياض)', region: 'الرياض', lat: 24.7183, lng: 46.6621 },

  // مكة المكرمة
  { name: 'المسجد الحرام - مكة المكرمة', region: 'مكة المكرمة', lat: 21.4225, lng: 39.8262 },
  { name: 'جامع الراجحي - حي العزيزية (مكة المكرمة)', region: 'مكة المكرمة', lat: 21.4116, lng: 39.8652 },
  { name: 'مسجد السيدة عائشة (مسجد التنعيم) - مكة المكرمة', region: 'مكة المكرمة', lat: 21.4934, lng: 39.7997 },

  // المدينة المنورة
  { name: 'المسجد النبوي الشريف - المدينة المنورة', region: 'المدينة المنورة', lat: 24.4672, lng: 39.6111 },
  { name: 'مسجد قباء - المدينة المنورة', region: 'المدينة المنورة', lat: 24.4395, lng: 39.6173 },
  { name: 'مسجد القبلتين - المدينة المنورة', region: 'المدينة المنورة', lat: 24.4842, lng: 39.5786 },

  // جدة
  { name: 'جامع بن يماني - حي الروضة (جدة)', region: 'جدة', lat: 21.5731, lng: 39.1622 },
  { name: 'جامع الشعيبي - حي السلامة (جدة)', region: 'جدة', lat: 21.6021, lng: 39.1518 },
  { name: 'جامع خديجة بغلف - حي الفيحاء (جدة)', region: 'جدة', lat: 21.5034, lng: 39.2241 },
  { name: 'جامع الملك سعود - حي الشرفية (جدة)', region: 'جدة', lat: 21.5173, lng: 39.1834 },

  // المنطقة الشرقية
  { name: 'جامع الفرقان - حي الناصرية (الدمام)', region: 'الشرقية', lat: 26.4207, lng: 50.0888 },
  { name: 'جامع خادم الحرمين الشريفين - حي العليا (الخبر)', region: 'الشرقية', lat: 26.2912, lng: 50.1983 },
  { name: 'جامع القصيبي - حي اليرموك (الخبر)', region: 'الشرقية', lat: 26.3121, lng: 50.2154 },
  { name: 'جامع كانو - حي الشاطئ (الدمام)', region: 'الشرقية', lat: 26.4532, lng: 50.1245 },

  // القصيم
  { name: 'جامع الراجحي - حي الصفراء (بريدة)', region: 'القصيم', lat: 26.3482, lng: 43.9673 },
  { name: 'جامع خادم الحرمين الشريفين (بريدة)', region: 'القصيم', lat: 26.3261, lng: 43.9782 },
  { name: 'جامع الشايع - حي الفخرية (عنيزة)', region: 'القصيم', lat: 26.0912, lng: 43.9871 },

  // عسير والشمال
  { name: 'جامع الراجحي - حي الخالدية (أبها)', region: 'عسير', lat: 18.2241, lng: 42.5113 },
  { name: 'جامع إمام الدعوة - طريق الملك فهد (خميس مشيط)', region: 'عسير', lat: 18.3051, lng: 42.7214 },
  { name: 'جامع الوالدين - تبوك', region: 'تبوك', lat: 28.3835, lng: 36.5550 },
  { name: 'جامع خادم الحرمين الشريفين - حائل', region: 'حائل', lat: 27.5216, lng: 41.6961 },
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
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [onlineResults, setOnlineResults] = useState<Array<{ name: string; lat: number; lng: number }>>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('الكل');

  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Prevent background scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Filter local mosques list
  const filteredLocalMosques = POPULAR_MOSQUES.filter((m) => {
    const matchRegion = selectedRegion === 'الكل' || m.region === selectedRegion;
    const matchQuery =
      !searchQuery.trim() ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.region.toLowerCase().includes(searchQuery.toLowerCase());
    return matchRegion && matchQuery;
  });

  // Dynamic geocoding search via Nominatim
  useEffect(() => {
    const query = searchQuery.trim();
    if (!query || query.length < 3) {
      setOnlineResults([]);
      setIsSearchingOnline(false);
      return;
    }

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(async () => {
      setIsSearchingOnline(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&countrycodes=sa&limit=5&accept-language=ar`;
        const res = await fetch(url, {
          headers: {
            'Accept-Language': 'ar',
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const parsed = data.map((item: { display_name: string; lat: string; lon: string }) => ({
              name: item.display_name.split(',').slice(0, 3).join(' - '),
              lat: Number(parseFloat(item.lat).toFixed(5)),
              lng: Number(parseFloat(item.lon).toFixed(5)),
            }));
            setOnlineResults(parsed);
          } else {
            setOnlineResults([]);
          }
        }
      } catch (err) {
        console.warn('Geocoding search error:', err);
      } finally {
        setIsSearchingOnline(false);
      }
    }, 450);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchQuery]);

  const handleConfirm = () => {
    onSelectLocation(locationName.trim() || 'موقع المجمع / المسجد', selectedLat, selectedLng);
    onClose();
  };

  const handlePickMosque = (item: { name: string; lat: number; lng: number }) => {
    setLocationName(item.name);
    setSelectedLat(item.lat);
    setSelectedLng(item.lng);
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // Derive offset from current coordinates
    const latOffset = ((rect.height / 2 - y) / rect.height) * 0.05;
    const lngOffset = ((x - rect.width / 2) / rect.width) * 0.05;
    const newLat = Number((selectedLat + latOffset).toFixed(5));
    const newLng = Number((selectedLng + lngOffset).toFixed(5));
    setSelectedLat(newLat);
    setSelectedLng(newLng);
    setLocationName(`موقع مجمع محدد على الخريطة (${newLat}, ${newLng})`);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-[#053B50]/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-[#FFFFFF] border-2 border-[#E8DAC8] rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Modal Header */}
        <div className="bg-[#053B50] text-[#FFFFFF] p-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FFFFFF]/15 flex items-center justify-center text-[#E8DAC8]">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base">تحديد موقع الجامع / المجمع القرآني</h3>
              <p className="text-[11px] text-[#E8DAC8]">
                ابحث بالاسم أو اختر من المساجد المعروفة أو انقر على الخريطة مباشرة
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#FFFFFF]/80 hover:text-[#FFFFFF] bg-[#FFFFFF]/10 hover:bg-[#FFFFFF]/20 p-1.5 rounded-xl transition-colors cursor-pointer"
            title="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* Mosque Search Box */}
          <div>
            <label className="block text-xs font-bold text-[#053B50] mb-1.5">
              ابحث عن اسم المسجد أو المجمع أو الحي:
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="اكتب اسم المسجد (مثل: جامع الراجحي، جامع الهدى، مسجد قباء، حي النزهة...)"
                className="w-full pr-10 pl-10 py-2.5 bg-[#FFFFFF] border-2 border-[#E8DAC8] rounded-xl outline-none focus:border-[#053B50] text-xs sm:text-sm text-[#053B50] placeholder-[#053B50]/40 shadow-2xs font-medium"
                autoFocus
              />
              <Search className="w-4 h-4 text-[#053B50]/60 absolute right-3.5 top-3.5" />
              {isSearchingOnline && (
                <Loader2 className="w-4 h-4 text-[#053B50] animate-spin absolute left-3.5 top-3.5" />
              )}
            </div>
          </div>

          {/* Region Quick Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="font-bold text-[#053B50] shrink-0 text-[11px] ml-1">المنطقة:</span>
            {['الكل', 'الرياض', 'مكة المكرمة', 'المدينة المنورة', 'جدة', 'الشرقية', 'القصيم', 'عسير'].map(
              (reg) => (
                <button
                  key={reg}
                  type="button"
                  onClick={() => setSelectedRegion(reg)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition-colors cursor-pointer border ${
                    selectedRegion === reg
                      ? 'bg-[#053B50] text-[#FFFFFF] border-[#053B50]'
                      : 'bg-[#F7F3EE] text-[#053B50] border-[#E8DAC8] hover:bg-[#E8DAC8]'
                  }`}
                >
                  {reg}
                </button>
              )
            )}
          </div>

          {/* Search suggestions & Results */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-[#053B50] flex items-center justify-between">
              <span>نتائج المساجد والمجمعات المقترحة:</span>
              <span className="text-[#053B50]/60">انقر لاختيار المسجد وتثبيت موقعه</span>
            </span>

            {/* If Online Search has results, show them on top */}
            {onlineResults.length > 0 && (
              <div className="p-2 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1">
                <span className="text-[11px] font-bold text-blue-900 block px-1">
                  نتائج بحث الخرائط الجغرافية:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1">
                  {onlineResults.map((item, idx) => (
                    <button
                      key={`online_${idx}`}
                      type="button"
                      onClick={() => handlePickMosque(item)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 text-right ${
                        selectedLat === item.lat && selectedLng === item.lng
                          ? 'bg-[#053B50] text-[#FFFFFF] border-[#053B50]'
                          : 'bg-[#FFFFFF] text-[#053B50] border-[#E8DAC8] hover:border-[#053B50]'
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5 text-[#E8DAC8] shrink-0" />
                      <span className="font-bold">{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Local Mosques Grid */}
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-[#F7F3EE] rounded-xl border border-[#E8DAC8]">
              {filteredLocalMosques.length > 0 ? (
                filteredLocalMosques.map((m, idx) => {
                  const isSelected = selectedLat === m.lat && selectedLng === m.lng;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handlePickMosque(m)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-[#053B50] text-[#FFFFFF] border-[#053B50] shadow-xs'
                          : 'bg-[#FFFFFF] text-[#053B50] border-[#E8DAC8] hover:border-[#053B50] hover:bg-[#FFFFFF]'
                      }`}
                    >
                      <MapPin className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#E8DAC8]' : 'text-[#053B50]'}`} />
                      <span className="font-medium">{m.name}</span>
                    </button>
                  );
                })
              ) : (
                <div className="w-full text-center py-3 text-xs text-[#053B50]/60">
                  لم يتم العثور على مساجد مطابقة للبحث في هذه القائمة. يمكنك كتابة الاسم الكامل في الحقل أدناه أو النقر على الخريطة.
                </div>
              )}
            </div>
          </div>

          {/* Interactive Live Map Canvas */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#053B50] flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-[#053B50]" />
                معاينة الموقع المحدد على الخريطة:
              </span>
              <span className="text-[11px] text-[#053B50]/70 font-mono">
                الإحداثيات: ({selectedLat}, {selectedLng})
              </span>
            </div>

            <div className="relative rounded-xl border-2 border-[#053B50]/30 overflow-hidden shadow-inner h-60 sm:h-64 bg-[#e5e3df]">
              {/* Embedded Google Maps Live View */}
              <iframe
                title="Google Map Mosque Selection"
                width="100%"
                height="100%"
                frameBorder="0"
                src={`https://maps.google.com/maps?q=${selectedLat},${selectedLng}&z=16&output=embed`}
                className="w-full h-full pointer-events-none opacity-95"
              />

              {/* Clickable Overlay to reposition pin */}
              <div
                onClick={handleMapClick}
                className="absolute inset-0 cursor-crosshair flex items-center justify-center bg-black/5 hover:bg-black/0 transition-colors"
                title="انقر في أي مكان لتعديل موقع المجمع والمسجد بدقة"
              >
                <div className="flex flex-col items-center -translate-y-4 animate-bounce">
                  <div className="bg-[#053B50] text-[#FFFFFF] text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-xl border border-[#E8DAC8] whitespace-nowrap mb-1">
                    {locationName}
                  </div>
                  <div className="w-9 h-9 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl border-2 border-white">
                    <MapPin className="w-5 h-5 fill-white text-red-600" />
                  </div>
                </div>
              </div>

              <div className="absolute bottom-2 right-2 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-[#E8DAC8] text-[11px] font-mono text-[#053B50] shadow-sm flex items-center gap-1.5">
                <Navigation className="w-3 h-3 text-[#053B50]" />
                <span>خط العرض: {selectedLat} | خط الطول: {selectedLng}</span>
              </div>
            </div>
          </div>

          {/* Detailed Mosque / Location Name Input */}
          <div>
            <label className="block text-xs font-bold text-[#053B50] mb-1">
              اسم المسجد أو العنوان التفصيلي المحفوظ:
            </label>
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="مثال: جامع الهدى، حي النزهة، شارع عثمان بن عفان"
              className="w-full p-2.5 border-2 border-[#E8DAC8] rounded-xl outline-none focus:border-[#053B50] text-xs sm:text-sm text-[#053B50] font-bold bg-[#FFFFFF]"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#F7F3EE] border-t border-[#E8DAC8] flex items-center justify-between gap-3">
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
            className="bg-[#053B50] hover:bg-[#042E3F] text-[#FFFFFF] px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md cursor-pointer transition-all"
          >
            <Check className="w-4 h-4 text-[#E8DAC8]" />
            <span>تأكيد موقع المسجد وحفظه</span>
          </button>
        </div>
      </div>
    </div>
  );
};
