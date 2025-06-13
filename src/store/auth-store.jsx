import { create } from "zustand";

const useAuthenticationStore = create((set) => ({
  message: "",
  isLoggedIn: localStorage.getItem("token") ? true : false,
  isLoading: false,
  userType: localStorage.getItem("userType") || null,
  userId: localStorage.getItem("userId") || null,
  token: localStorage.getItem("token") || null,

  handleLogin: async (data, navigate) => {
    set({ isLoading: true });

    try {
      const response = await fetch("http://54.252.152.233/staff/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const { userType, userId, token } = await response.json();

        // Store all data in localStorage
        localStorage.setItem("token", token);
        localStorage.setItem("userType", userType);
        localStorage.setItem("userId", userId);

        set({
          isLoggedIn: true,
          userType: userType,
          userId: userId,
          token: token,
          message: "Login successful",
        });

        // Navigate based on userType
        if (userType === "Cashier") {
          navigate("/cashier");
        } else if (userType === "KitchenStaff") {
          navigate("/kitchen");
        } else {
          // Default fallback for other user types
          navigate("/dashboard");
        }

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
    localStorage.removeItem("userType");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    navigate("/");
    set({
      isLoggedIn: false,
      userType: null,
      userId: null,
      token: null,
      isCashier: false,
      isAdmin: false,
    });
  },
}));

export default useAuthenticationStore;
