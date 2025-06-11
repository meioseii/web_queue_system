import { create } from "zustand";

const BASE_URL = "http://54.252.152.233";

const useCashierStore = create((set, get) => ({
  tables: [],
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

  // Clear messages
  clearMessage: () => {
    set({ message: "", error: null });
  },

  // Reset store
  reset: () => {
    set({
      tables: [],
      isLoading: false,
      error: null,
      message: "",
    });
  },
}));

export default useCashierStore;
