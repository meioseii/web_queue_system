import { create } from "zustand";

const useTablesStore = create((set, get) => ({
  // State
  tables: [],
  isLoading: false,
  error: null,
  message: null,

  // Actions
  setTables: (tables) => set({ tables }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, message: null }),
  setMessage: (message) => set({ message, error: null }),
  clearMessage: () => set({ error: null, message: null }),

  // Confirm customer presence API request
  confirmCustomerPresence: async (username) => {
    set({ isLoading: true });

    try {
      const response = await fetch("http://54.252.152.233/seating/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          username: username,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        set({
          message: "Customer presence confirmed successfully",
          error: null,
          isLoading: false,
        });
        return result;
      } else {
        const errorData = await response.json();
        throw new Error(
          errorData.msg || errorData.error || "Failed to confirm presence"
        );
      }
    } catch (error) {
      console.error("Error confirming presence:", error);
      set({
        error: error.message,
        message: null,
        isLoading: false,
      });
      throw error;
    }
  },

  // Mark customer as missed API request
  markCustomerMissed: async (username) => {
    set({ isLoading: true });

    try {
      const response = await fetch("http://54.252.152.233/seating/missed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          username: username,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        set({
          message: "Customer marked as missed successfully",
          error: null,
          isLoading: false,
        });
        return result;
      } else {
        const errorData = await response.json();
        throw new Error(
          errorData.msg ||
            errorData.error ||
            "Failed to mark customer as missed"
        );
      }
    } catch (error) {
      console.error("Error marking customer as missed:", error);
      set({
        error: error.message,
        message: null,
        isLoading: false,
      });
      throw error;
    }
  },

  // Customer checkout API request
  checkoutCustomer: async (username) => {
    set({ isLoading: true });

    try {
      const response = await fetch(
        "http://54.252.152.233/cashier/menu/done-table",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            username: username,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        set({
          message: "Customer checked out successfully",
          error: null,
          isLoading: false,
        });
        return result;
      } else {
        const errorData = await response.json();
        throw new Error(
          errorData.msg || errorData.error || "Failed to checkout customer"
        );
      }
    } catch (error) {
      console.error("Error checking out customer:", error);
      set({
        error: error.message,
        message: null,
        isLoading: false,
      });
      throw error;
    }
  },
}));

export default useTablesStore;
