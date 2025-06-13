import { create } from "zustand";

const BASE_URL = "http://54.252.152.233";

const useCashierStore = create((set, get) => ({
  // State
  tables: [],
  categories: [],
  menuItems: [],
  selectedCategory: null,
  cart: [],
  orderDetails: {
    name: "",
    isTakeout: false,
  },
  isLoading: false,
  error: null,
  message: "",

  // WebSocket related state
  stompClient: null,
  isConnected: false,

  // Connect to WebSocket
  connectWebSocket: () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    if (
      typeof window.SockJS === "undefined" ||
      typeof window.Stomp === "undefined"
    ) {
      return;
    }

    try {
      const socket = new window.SockJS(`${BASE_URL}/queue-websocket`);
      const stompClient = window.Stomp.over(socket);

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      stompClient.connect(
        headers,
        (frame) => {
          set({ isConnected: true, error: null, stompClient });

          try {
            // Subscribe to seated tables updates
            stompClient.subscribe("/topic/seated-tables", (message) => {
              try {
                const tableData = JSON.parse(message.body);
                get().handleTableUpdate(tableData);
              } catch (error) {
                set({
                  error: "Failed to process table update",
                  message: "Failed to process table update",
                });
              }
            });

            // Subscribe to dirty table updates (for table cleaning status)
            stompClient.subscribe("/topic/table/dirty", (message) => {
              try {
                const dirtyTableData = JSON.parse(message.body);

                // Handle dirty table update - mark table as DIRTY
                if (dirtyTableData && dirtyTableData.tableNumber) {
                  const tableUpdate = {
                    tableNumber: dirtyTableData.tableNumber,
                    status: "DIRTY",
                    action: "Table to clean",
                  };
                  get().handleTableUpdate(tableUpdate);
                }
              } catch (error) {
                set({
                  error: "Failed to process dirty table update",
                  message: "Failed to process dirty table update",
                });
              }
            });

            // Subscribe to table status updates (for when tables are cleaned)
            stompClient.subscribe("/topic/table/status", (message) => {
              try {
                const statusData = JSON.parse(message.body);

                // Handle table status update (cleaned tables become AVAILABLE)
                if (statusData && statusData.tableNumber) {
                  const tableUpdate = {
                    tableNumber: statusData.tableNumber,
                    status: statusData.status || "AVAILABLE",
                    username: statusData.cleaned ? "" : statusData.username,
                    queueingNumber: statusData.cleaned
                      ? ""
                      : statusData.queueingNumber,
                  };
                  get().handleTableUpdate(tableUpdate);
                }
              } catch (error) {
                set({
                  error: "Failed to process table status update",
                  message: "Failed to process table status update",
                });
              }
            });

            set({
              message: "Connected to live table updates",
              error: null,
            });
            setTimeout(() => set({ message: "" }), 3000);
          } catch (error) {
            set({
              error: "Failed to subscribe to updates",
              message: "Failed to subscribe to updates",
            });
          }
        },
        (error) => {
          set({
            isConnected: false,
            error: `WebSocket Error: ${error.message || "Connection failed"}`,
            message: `WebSocket Error: ${error.message || "Connection failed"}`,
          });
        }
      );

      set({ stompClient });
    } catch (error) {
      set({
        error: `Setup Error: ${error.message}`,
        message: `Setup Error: ${error.message}`,
      });
    }
  },

  // Disconnect from WebSocket
  disconnectWebSocket: () => {
    const { stompClient } = get();
    if (stompClient && stompClient.connected) {
      stompClient.disconnect(() => {
        set({ isConnected: false, stompClient: null });
      });
    } else {
      set({ isConnected: false, stompClient: null });
    }
  },

  // Handle table updates from WebSocket
  handleTableUpdate: (tableData) => {
    const { tables } = get();

    // Handle single table update or array of tables
    const updateData = Array.isArray(tableData) ? tableData : [tableData];

    let updatedTables = [...tables];
    let hasUpdates = false;

    updateData.forEach((update) => {
      const tableNumber = update.tableNumber || update.table_number;

      if (!tableNumber) {
        return;
      }

      const existingIndex = updatedTables.findIndex((table) => {
        return (
          table.tableNumber == tableNumber || table.table_number == tableNumber
        );
      });

      if (existingIndex >= 0) {
        // Determine the new status based on the update
        let newStatus = update.status || updatedTables[existingIndex].status;

        // Handle special cases
        if (update.action === "Table to clean" || update.status === "DIRTY") {
          newStatus = "DIRTY";
        } else if (update.cleaned === true || update.status === "AVAILABLE") {
          newStatus = "AVAILABLE";
        }

        // Update existing table
        updatedTables[existingIndex] = {
          ...updatedTables[existingIndex],
          ...update,
          // Ensure consistent property names
          tableNumber: tableNumber,
          status: newStatus,
          username: update.cleaned
            ? ""
            : update.customerName ||
              update.username ||
              updatedTables[existingIndex].username,
          queueingNumber: update.cleaned
            ? ""
            : update.queueingNumber ||
              updatedTables[existingIndex].queueingNumber,
          size: update.size || updatedTables[existingIndex].size,
        };

        hasUpdates = true;
      } else {
        // Add new table if it doesn't exist
        const newTable = {
          tableNumber: tableNumber,
          status: update.status || "AVAILABLE",
          username: update.customerName || update.username || "",
          queueingNumber: update.queueingNumber || "",
          size: update.size || "",
          ...update,
        };

        updatedTables.push(newTable);
        hasUpdates = true;
      }
    });

    if (hasUpdates) {
      set({
        tables: updatedTables,
        message: `Table updates received`,
      });

      // Clear message after 2 seconds
      setTimeout(() => {
        set({ message: "" });
      }, 2000);
    }
  },

  // Fetch all tables (initial retrieve only)
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

        // Connect to WebSocket after successful table fetch
        if (!get().isConnected) {
          get().connectWebSocket();
        }

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

  // Add customer to queue
  addToQueue: async (guestData) => {
    set({ isLoading: true, error: null, message: "" });

    try {
      const response = await fetch(`${BASE_URL}/cashier/menu/enter-queue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          guestUsername: guestData.guestUsername.trim(),
          num_people: parseInt(guestData.num_people),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.msg ||
            errorData.error ||
            `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();

      set({
        isLoading: false,
        message: `Successfully added ${guestData.guestUsername} (${
          guestData.num_people
        } ${guestData.num_people === 1 ? "person" : "people"}) to the queue!`,
        error: null,
      });

      // Clear success message after 5 seconds
      setTimeout(() => set({ message: "" }), 5000);

      return result;
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
        message: error.message,
      });

      // Clear error message after 7 seconds
      setTimeout(() => set({ message: "", error: null }), 7000);
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
    const { stompClient } = get();
    if (stompClient && stompClient.connected) {
      stompClient.disconnect();
    }
    set({
      tables: [],
      categories: [],
      menuItems: [],
      selectedCategory: null,
      cart: [],
      orderDetails: {
        name: "",
        isTakeout: false,
      },
      isLoading: false,
      error: null,
      message: "",
      stompClient: null,
      isConnected: false,
    });
  },

  // Submit order to API
  submitOrder: async () => {
    const { cart, orderDetails } = get();

    // Validate form
    if (!orderDetails.name.trim()) {
      throw new Error("Please enter a name");
    }

    if (cart.length === 0) {
      throw new Error("Please add items to your order");
    }

    set({ isLoading: true, error: null });

    try {
      // Prepare order data - exact structure as specified
      const orderData = {
        username: orderDetails.name.trim(),
        takeOut: orderDetails.isTakeout,
        orders: cart.map((item) => ({
          product_id: item.menu_id,
          quantity: item.quantity,
        })),
      };

      // Send order to API
      const response = await fetch(`${BASE_URL}/cashier/menu/add-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.msg ||
            errorData.error ||
            `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();

      // Success - clear cart and reset form
      set({
        cart: [],
        orderDetails: {
          name: "",
          isTakeout: false,
        },
        isLoading: false,
        message: "Order successfully added to the queue!",
        error: null,
      });

      // Clear success message after 3 seconds
      setTimeout(() => set({ message: "" }), 3000);

      return result;
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
        message: error.message,
      });

      // Clear error message after 5 seconds
      setTimeout(() => set({ message: "", error: null }), 5000);
      throw error;
    }
  },
}));

export default useCashierStore;
