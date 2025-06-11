import { create } from "zustand";

const useAuthenticationStore = create((set) => ({
  message: "",
  isLoggedIn: localStorage.getItem("token") ? true : false,
  isLoading: false,

  handleLogin: async (data, navigate) => {
    set({ isLoading: true });

    try {
      const response = await fetch("http://54.252.152.233/cashier/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const { token } = await response.json();
        localStorage.setItem("token", token);

        // Navigate to cashier dashboard or appropriate route
        navigate("/kitchen"); // Update this path as needed

        set({
          isLoggedIn: true,
          message: "Login successful",
        });

        // Clear success message after 1.5 seconds
        setTimeout(() => set({ message: "" }), 1500);
      } else {
        const error = await response.json();
        set({
          message:
            error.msg || error.error || "Login failed. Please try again.",
        });
        setTimeout(() => set({ message: "" }), 1500);
      }
    } catch (error) {
      set({
        message: error.message || "An error occurred. Please try again.",
      });
      setTimeout(() => set({ message: "" }), 1500);
    } finally {
      set({ isLoading: false });
    }
  },

  handleLogout: (navigate) => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
    set({
      isLoggedIn: false,
      isCashier: false,
      isAdmin: false,
    });
  },
}));

export default useAuthenticationStore;
