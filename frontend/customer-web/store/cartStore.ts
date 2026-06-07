import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartItem, Product, SelectedOption } from '@/types';

interface CartState {
  restaurantId: string | null;
  restaurantName: string;
  restaurantDeliveryFee: number;
  items: CartItem[];
  couponCode: string | null;
  couponDiscount: number;

  // Computed
  itemCount: number;
  subtotal: number;
  total: number;

  // Actions
  addItem: (
    product: Product,
    quantity: number,
    selectedOptions?: SelectedOption[],
    notes?: string
  ) => 'added' | 'different_restaurant';
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string, discount: number) => void;
  removeCoupon: () => void;
  setRestaurant: (id: string, name: string, deliveryFee: number) => void;
}

const calcItemPrice = (product: Product, options: SelectedOption[]): number => {
  let price = product.effectivePrice;
  options.forEach((opt) => {
    opt.valueIds.forEach((valId) => {
      product.options.forEach((o) => {
        const val = o.values.find((v) => v.id === valId);
        if (val) price += val.additionalPrice;
      });
    });
  });
  return price;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      restaurantId: null,
      restaurantName: '',
      restaurantDeliveryFee: 0,
      items: [],
      couponCode: null,
      couponDiscount: 0,
      itemCount: 0,
      subtotal: 0,
      total: 0,

      addItem: (product, quantity, selectedOptions = [], notes) => {
        const state = get();

        // Different restaurant — require confirmation
        if (state.restaurantId && state.restaurantId !== product.id) {
          // Caller must handle this case and clear cart first
          if (state.items.length > 0) return 'different_restaurant';
        }

        const unitPrice = calcItemPrice(product, selectedOptions);
        const existingIdx = state.items.findIndex(
          (i) =>
            i.product.id === product.id &&
            JSON.stringify(i.selectedOptions) === JSON.stringify(selectedOptions)
        );

        let newItems: CartItem[];
        if (existingIdx >= 0) {
          newItems = [...state.items];
          const existing = newItems[existingIdx];
          const newQty = existing.quantity + quantity;
          newItems[existingIdx] = {
            ...existing,
            quantity: newQty,
            totalPrice: unitPrice * newQty,
          };
        } else {
          newItems = [
            ...state.items,
            {
              product,
              quantity,
              selectedOptions,
              notes,
              totalPrice: unitPrice * quantity,
            },
          ];
        }

        const subtotal = newItems.reduce((sum, i) => sum + i.totalPrice, 0);
        const total = subtotal - state.couponDiscount + state.restaurantDeliveryFee;

        set({
          items: newItems,
          itemCount: newItems.reduce((s, i) => s + i.quantity, 0),
          subtotal,
          total: Math.max(total, 0),
        });
        return 'added';
      },

      removeItem: (productId) => {
        const newItems = get().items.filter((i) => i.product.id !== productId);
        const subtotal = newItems.reduce((s, i) => s + i.totalPrice, 0);
        set({
          items: newItems,
          itemCount: newItems.reduce((s, i) => s + i.quantity, 0),
          subtotal,
          total: Math.max(subtotal - get().couponDiscount + get().restaurantDeliveryFee, 0),
          restaurantId: newItems.length === 0 ? null : get().restaurantId,
        });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        const newItems = get().items.map((i) =>
          i.product.id === productId
            ? {
                ...i,
                quantity,
                totalPrice: calcItemPrice(i.product, i.selectedOptions) * quantity,
              }
            : i
        );
        const subtotal = newItems.reduce((s, i) => s + i.totalPrice, 0);
        set({
          items: newItems,
          itemCount: newItems.reduce((s, i) => s + i.quantity, 0),
          subtotal,
          total: Math.max(subtotal - get().couponDiscount + get().restaurantDeliveryFee, 0),
        });
      },

      clearCart: () =>
        set({
          items: [],
          restaurantId: null,
          restaurantName: '',
          couponCode: null,
          couponDiscount: 0,
          itemCount: 0,
          subtotal: 0,
          total: 0,
        }),

      applyCoupon: (code, discount) => {
        const state = get();
        set({
          couponCode: code,
          couponDiscount: discount,
          total: Math.max(state.subtotal - discount + state.restaurantDeliveryFee, 0),
        });
      },

      removeCoupon: () => {
        const state = get();
        set({
          couponCode: null,
          couponDiscount: 0,
          total: state.subtotal + state.restaurantDeliveryFee,
        });
      },

      setRestaurant: (id, name, deliveryFee) =>
        set({
          restaurantId: id,
          restaurantName: name,
          restaurantDeliveryFee: deliveryFee,
          total: get().subtotal - get().couponDiscount + deliveryFee,
        }),
    }),
    {
      name: 'sw-cart',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
