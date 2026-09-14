import React, { useState } from 'react';
import { Building2, MapPin, X, Check } from 'lucide-react';
import type { QuranComplex } from '../types';
import { GoogleMapPicker } from './GoogleMapPicker';

interface EditComplexModalProps {
  complex: QuranComplex;
  isOpen: boolean;
  onClose: () => void;
  onSave: (complexId: string, data: { name: string; locationName: string; latitude?: number; longitude?: number }) => Promise<void>;
}

export const EditComplexModal: React.FC<EditComplexModalProps> = ({
  complex,
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(complex.name);
  const [locationName, setLocationName] = useState(complex.locationName || '');
  const [lat, setLat] = useState<number | undefined>(complex.latitude);
  const [lng, setLng] = useState<number | undefined>(complex.longitude);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await onSave(complex.id, {
        name: name.trim(),
        locationName: locationName.trim(),
        latitude: lat,
        longitude: lng,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[1050] bg-[#053B50]/70 backdrop-blur-sm flex items-center justify-center p-4">
        <div
          className="bg-[#FFFFFF] border-2 border-[#E8DAC8] rounded-2xl w-full max-w-md p-6 shadow-2xl relative"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#E8DAC8] mb-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-[#053B50] text-[#E8DAC8] flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-[#053B50]">
                تعديل بيانات المجمع القرآني
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-[#053B50] p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-[#053B50] mb-1">
                اسم المجمع القرآني <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="اسم المجمع"
                className="w-full p-2.5 border-2 border-[#E8DAC8] rounded-xl outline-none focus:border-[#053B50] text-sm text-[#053B50]"
                autoFocus
              />
            </div>

            <div>
              <label className="block font-bold text-[#053B50] mb-1">
                موقع الجامع / الحي:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="مثال: حي النزهة، الرياض"
                  className="flex-1 p-2.5 border-2 border-[#E8DAC8] rounded-xl outline-none focus:border-[#053B50] text-xs text-[#053B50]"
                />
                <button
                  type="button"
                  onClick={() => setShowMapPicker(true)}
                  className="bg-[#F7F3EE] hover:bg-[#E8DAC8] text-[#053B50] border border-[#E8DAC8] px-3 py-2 rounded-xl font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                >
                  <MapPin className="w-4 h-4 text-[#053B50]" />
                  <span>الخريطة</span>
                </button>
              </div>
              {lat && lng && (
                <span className="block text-[11px] text-emerald-700 font-mono mt-1">
                  ✓ الإحداثيات المحددة: ({lat.toFixed(4)}, {lng.toFixed(4)})
                </span>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8DAC8]">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-bold text-[#053B50] hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="bg-[#053B50] hover:bg-[#042E3F] text-[#FFFFFF] text-xs font-bold px-5 py-2.5 rounded-xl shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{isSubmitting ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {showMapPicker && (
        <GoogleMapPicker
          initialLat={lat || 24.7136}
          initialLng={lng || 46.6753}
          initialName={locationName}
          onSelectLocation={(loc, selectedLat, selectedLng) => {
            setLocationName(loc);
            setLat(selectedLat);
            setLng(selectedLng);
          }}
          onClose={() => setShowMapPicker(false)}
        />
      )}
    </>
  );
};
