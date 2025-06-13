import { create } from "zustand";

const usePaymentStore = create((set, get) => ({
  // State
  payments: [],
  isLoading: false,
  error: null,
  message: null,

  // Actions
  setPayments: (payments) => set({ payments }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, message: null }),
  setMessage: (message) => set({ message, error: null }),
  clearMessage: () => set({ error: null, message: null }),

  // Fetch payments API request
  fetchPayments: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(
        "http://54.252.152.233/cashier/menu/unpaid",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        set({
          payments: data,
          isLoading: false,
          error: null,
        });
        return data;
      } else {
        const errorData = await response.json();
        throw new Error(
          errorData.msg || errorData.error || "Failed to fetch payments"
        );
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
      set({
        error: error.message,
        isLoading: false,
        message: null,
      });
      throw error;
    }
  },

  // Process payment API request
  processPayment: async (username, isGuest, paymentMethod) => {
    set({ isLoading: true });

    try {
      const response = await fetch(
        "http://54.252.152.233/cashier/menu/payment",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            username: username,
            guest: isGuest,
            paymentMethod: paymentMethod,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        set({
          message: "Payment processed successfully",
          error: null,
          isLoading: false,
        });

        // Refresh payments list after successful payment
        const { fetchPayments } = get();
        fetchPayments();

        return result;
      } else {
        const errorData = await response.json();
        throw new Error(
          errorData.msg || errorData.error || "Failed to process payment"
        );
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      set({
        error: error.message,
        message: null,
        isLoading: false,
      });
      throw error;
    }
  },
}));

export default usePaymentStore;
