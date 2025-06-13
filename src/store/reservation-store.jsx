import { create } from "zustand";

const useReservationStore = create((set, get) => ({
  // State
  reservations: [],
  isLoading: false,
  error: null,
  message: null,

  // Actions
  setReservations: (reservations) => set({ reservations }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, message: null }),
  setMessage: (message) => set({ message, error: null }),
  clearMessage: () => set({ error: null, message: null }),

  // Fetch reservations API request
  fetchReservations: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(
        "http://54.252.152.233/cashier/menu/reservations",
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
          reservations: data,
          isLoading: false,
          error: null,
        });
        return data;
      } else {
        const errorData = await response.json();
        throw new Error(
          errorData.msg || errorData.error || "Failed to fetch reservations"
        );
      }
    } catch (error) {
      console.error("Error fetching reservations:", error);
      set({
        error: error.message,
        isLoading: false,
        message: null,
      });
      throw error;
    }
  },
}));

export default useReservationStore;
