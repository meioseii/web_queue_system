import { create } from "zustand";

const BASE_URL = "http://54.252.152.233";

const useCashierStore = create((set, get) => ({
  tables: [],
  categories: [],
  menuItems: [],
  selectedCategory: null,
  cart: [],
  orderDetails: {
    name: "",
    tableNumber: "",
    isTakeout: false,
  },
  isLoading: false,
  error: null,
  message: "",

  // Fetch all tables
  fetchTables: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`${BASE_URL}/cashier/menu/main`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const tablesData = await response.json();
        set({
          tables: tablesData,
          isLoading: false,
          error: null,
        });
        return tablesData;
      } else {
        const errorData = await response.json();
        throw new Error(
          errorData.msg || errorData.error || "Failed to fetch tables"
        );
      }
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
        message: error.message,
      });

      setTimeout(() => set({ message: "", error: null }), 3000);
      throw error;
    }
  },

  // Fetch all categories
  fetchCategories: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`${BASE_URL}/category/all`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const categoriesData = await response.json();
        set({
          categories: categoriesData,
          isLoading: false,
          error: null,
        });
        return categoriesData;
      } else {
        const errorData = await response.json();
        throw new Error(
          errorData.msg || errorData.error || "Failed to fetch categories"
        );
      }
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
        message: error.message,
      });

      setTimeout(() => set({ message: "", error: null }), 3000);
      throw error;
    }
  },

  // Fetch menu items by category
  fetchMenuItems: async (category) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`${BASE_URL}/menu/view/${category}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const menuData = await response.json();
        set({
          menuItems: menuData,
          selectedCategory: category,
          isLoading: false,
          error: null,
        });
        return menuData;
      } else {
        const errorData = await response.json();
        throw new Error(
          errorData.msg || errorData.error || "Failed to fetch menu items"
        );
      }
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
        message: error.message,
      });

      setTimeout(() => set({ message: "", error: null }), 3000);
      throw error;
    }
  },

  // Cart functionality
  addToCart: (item) => {
    const { cart } = get();
    const existingItem = cart.find(
      (cartItem) => cartItem.menu_id === item.menu_id
    );

    if (existingItem) {
      set({
        cart: cart.map((cartItem) =>
          cartItem.menu_id === item.menu_id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        ),
      });
    } else {
      set({
        cart: [...cart, { ...item, quantity: 1 }],
      });
    }
  },

  removeFromCart: (menuId) => {
    const { cart } = get();
    set({
      cart: cart.filter((item) => item.menu_id !== menuId),
    });
  },

  updateCartItemQuantity: (menuId, quantity) => {
    const { cart } = get();
    if (quantity <= 0) {
      set({
        cart: cart.filter((item) => item.menu_id !== menuId),
      });
    } else {
      set({
        cart: cart.map((item) =>
          item.menu_id === menuId ? { ...item, quantity } : item
        ),
      });
    }
  },

  clearCart: () => {
    set({ cart: [] });
  },

  // Order details
  updateOrderDetails: (details) => {
    set((state) => ({
      orderDetails: { ...state.orderDetails, ...details },
    }));
  },

  // Calculate total
  getCartTotal: () => {
    const { cart } = get();
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  },

  // Clear messages
  clearMessage: () => {
    set({ message: "", error: null });
  },

  // Reset store
  reset: () => {
    set({
      tables: [],
      categories: [],
      menuItems: [],
      selectedCategory: null,
      cart: [],
      orderDetails: {
        name: "",
        tableNumber: "",
        isTakeout: false,
      },
      isLoading: false,
      error: null,
      message: "",
    });
  },
}));

export default useCashierStore;
