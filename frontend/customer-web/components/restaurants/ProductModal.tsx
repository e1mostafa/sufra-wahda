'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, Plus, Minus, ShoppingCart, Flame } from 'lucide-react';
import { Product, SelectedOption } from '@/types';
import { useCartStore } from '@/store/cartStore';
import { cn, formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Props {
  product: Product;
  restaurantId: string;
  restaurantName: string;
  deliveryFee: number;
  onClose: () => void;
  onDifferentRestaurant?: () => void;
}

export function ProductModal({
  product, restaurantId, restaurantName, deliveryFee, onClose, onDifferentRestaurant
}: Props) {
  const { addItem, setRestaurant, clearCart } = useCartStore();
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([]);
  const [notes, setNotes] = useState('');

  const totalOptionPrice = selectedOptions.reduce((sum, opt) => {
    return sum + opt.valueIds.reduce((s, valId) => {
      for (const option of product.options) {
        const val = option.values.find((v) => v.id === valId);
        if (val) return s + val.additionalPrice;
      }
      return s;
    }, 0);
  }, 0);

  const unitPrice = product.effectivePrice + totalOptionPrice;
  const totalPrice = unitPrice * quantity;

  const handleOptionSelect = (optionId: string, valueId: string, isMulti: boolean) => {
    setSelectedOptions((prev) => {
      const existing = prev.find((o) => o.optionId === optionId);
      if (isMulti) {
        if (existing) {
          const newValueIds = existing.valueIds.includes(valueId)
            ? existing.valueIds.filter((id) => id !== valueId)
            : [...existing.valueIds, valueId];
          return newValueIds.length === 0
            ? prev.filter((o) => o.optionId !== optionId)
            : prev.map((o) => (o.optionId === optionId ? { ...o, valueIds: newValueIds } : o));
        }
        return [...prev, { optionId, valueIds: [valueId] }];
      } else {
        if (existing?.valueIds.includes(valueId)) {
          return prev.filter((o) => o.optionId !== optionId);
        }
        return [
          ...prev.filter((o) => o.optionId !== optionId),
          { optionId, valueIds: [valueId] },
        ];
      }
    });
  };

  const isOptionSelected = (optionId: string, valueId: string) =>
    selectedOptions.find((o) => o.optionId === optionId)?.valueIds.includes(valueId) ?? false;

  const requiredOptionsMet = product.options
    .filter((o) => o.isRequired)
    .every((o) => selectedOptions.some((s) => s.optionId === o.id && s.valueIds.length > 0));

  const handleAddToCart = () => {
    if (!requiredOptionsMet) {
      toast.error('يرجى اختيار الخيارات الإلزامية');
      return;
    }

    setRestaurant(restaurantId, restaurantName, deliveryFee);
    const result = addItem(product, quantity, selectedOptions, notes || undefined);

    if (result === 'different_restaurant') {
      onDifferentRestaurant?.();
      return;
    }

    toast.success(`تمت الإضافة للسلة 🛒`, { duration: 2000 });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl overflow-hidden animate-slide-up sm:animate-scale-in shadow-2xl max-h-[92vh] flex flex-col">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-10 w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Image */}
        <div className="relative h-56 bg-gradient-to-br from-burgundy to-burgundy-900 shrink-0">
          {product.imageUrl ? (
            <Image src={product.imageUrl} alt={product.nameAr} fill className="object-cover" sizes="512px" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-7xl">🍽️</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1">
          <div className="p-5">
            {/* Title & price */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h2 className="font-bold text-xl text-gray-800">{product.nameAr}</h2>
                {product.descriptionAr && (
                  <p className="text-gray-500 text-sm mt-1 leading-relaxed">{product.descriptionAr}</p>
                )}
                <div className="flex items-center gap-3 mt-2">
                  {product.calories && (
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Flame className="w-3 h-3 text-orange-400" />
                      {product.calories} سعر حراري
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    ⏱ {product.preparationMinutes} دقيقة
                  </span>
                </div>
              </div>
              <div className="text-left shrink-0">
                <div className="font-black text-xl text-burgundy">
                  {formatPrice(product.effectivePrice)}
                </div>
                {product.discountedPrice && product.basePrice > product.discountedPrice && (
                  <div className="text-xs text-gray-400 line-through">
                    {formatPrice(product.basePrice)}
                  </div>
                )}
              </div>
            </div>

            {/* Options */}
            {product.options.map((option) => (
              <div key={option.id} className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-800 text-sm">
                    {option.nameAr}
                    {option.isRequired && (
                      <span className="text-red-500 mr-1">*</span>
                    )}
                  </h4>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {option.isRequired ? 'إلزامي' : 'اختياري'}
                  </span>
                </div>
                <div className="space-y-2">
                  {option.values.map((val) => {
                    const selected = isOptionSelected(option.id, val.id);
                    return (
                      <button
                        key={val.id}
                        onClick={() =>
                          handleOptionSelect(
                            option.id, val.id, option.maxSelections > 1
                          )
                        }
                        className={cn(
                          'w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all text-sm',
                          selected
                            ? 'border-burgundy bg-burgundy/5'
                            : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                              selected
                                ? 'border-burgundy bg-burgundy'
                                : 'border-gray-300'
                            )}
                          >
                            {selected && (
                              <div className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </div>
                          <span className="font-medium text-gray-700">{val.nameAr}</span>
                        </div>
                        {val.additionalPrice > 0 && (
                          <span className="text-burgundy font-bold text-xs">
                            +{formatPrice(val.additionalPrice)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Notes */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ملاحظات (اختياري)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="مثال: بدون بصل، حار جداً..."
                rows={2}
                className="input-field resize-none text-sm"
                maxLength={200}
              />
            </div>
          </div>
        </div>

        {/* Footer - Quantity + Add to Cart */}
        <div className="p-4 border-t border-gray-100 bg-white shrink-0">
          <div className="flex items-center gap-4">
            {/* Quantity */}
            <div className="flex items-center gap-3 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="font-bold text-lg w-6 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 rounded-lg bg-burgundy text-white shadow-sm flex items-center justify-center hover:bg-burgundy-900 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Add Button */}
            <button
              onClick={handleAddToCart}
              disabled={!requiredOptionsMet}
              className="flex-1 btn-primary flex items-center justify-center gap-2 py-3"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>إضافة للسلة</span>
              <span className="font-black">{formatPrice(totalPrice)}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
