import { create } from "zustand";

const BASE_URL = "http://54.252.152.233";

const useKitchenStore = create((set, get) => ({
  // State
  dirtyTables: [],
  orders: [],
  isLoading: false,
  isLoadingOrders: false,
  error: null,
  message: "",
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
            // Subscribe to kitchen orders updates
            stompClient.subscribe("/topic/table/orders", (message) => {
              try {
                const newOrderData = JSON.parse(message.body);
                console.log("Received new order:", newOrderData);

                const { orders } = get();

                // Check if this order already exists in the current orders
                const existingOrderIndex = orders.findIndex(
                  (order) => order.id === newOrderData.id
                );

                let updatedOrders;
                if (existingOrderIndex !== -1) {
                  // Update existing order
                  updatedOrders = orders.map((order, index) =>
                    index === existingOrderIndex ? newOrderData : order
                  );
                } else {
                  // Add new order to the beginning of the array
                  updatedOrders = [newOrderData, ...orders];
                }

                set({ orders: updatedOrders });
              } catch (error) {
                console.error("Failed to process orders update:", error);
                set({
                  error: "Failed to process orders update",
                  message: "Failed to process orders update",
                });
              }
            });

            // Subscribe to dirty tables updates
            stompClient.subscribe("/topic/table/dirty", (message) => {
              try {
                const dirtyTableData = JSON.parse(message.body);
                const { dirtyTables } = get();

                // Handle single table or array of tables
                const newDirtyTables = Array.isArray(dirtyTableData)
                  ? dirtyTableData
                  : [dirtyTableData];

                // Add new dirty tables, avoiding duplicates
                const updatedDirtyTables = [...dirtyTables];
                newDirtyTables.forEach((newTable) => {
                  const exists = updatedDirtyTables.some(
                    (table) =>
                      (table.table_number || table.tableNumber) ===
                      (newTable.table_number || newTable.tableNumber)
                  );
                  if (!exists) {
                    updatedDirtyTables.push(newTable);
                  }
                });

                set({ dirtyTables: updatedDirtyTables });
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
                const { dirtyTables } = get();

                // Remove cleaned tables from dirty tables list
                if (statusData.status === "AVAILABLE" || statusData.cleaned) {
                  const tableNumber =
                    statusData.table_number || statusData.tableNumber;
                  const updatedDirtyTables = dirtyTables.filter(
                    (table) =>
                      (table.table_number || table.tableNumber) !== tableNumber
                  );
                  set({ dirtyTables: updatedDirtyTables });
                }
              } catch (error) {
                set({
                  error: "Failed to process table status update",
                  message: "Failed to process table status update",
                });
              }
            });

            set({
              message: "Connected to live kitchen updates",
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

  // Fetch kitchen orders (initial retrieve only)
  fetchOrders: async () => {
    set({ isLoadingOrders: true, error: null });

    try {
      const response = await fetch(`${BASE_URL}/kitchen/orders`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const ordersData = await response.json();
        // Directly use the orders data without processing
        set({
          orders: ordersData,
          isLoadingOrders: false,
          error: null,
        });
        return ordersData;
      } else {
        const errorData = await response.json();
        throw new Error(
          errorData.msg || errorData.error || "Failed to fetch orders"
        );
      }
    } catch (error) {
      set({
        error: error.message,
        isLoadingOrders: false,
        message: error.message,
      });

      setTimeout(() => set({ message: "", error: null }), 3000);
      throw error;
    }
  },

  // Fetch dirty tables (initial retrieve only)
  fetchDirtyTables: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`${BASE_URL}/table/dirty`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const dirtyTablesData = await response.json();
        set({
          dirtyTables: dirtyTablesData,
          isLoading: false,
          error: null,
        });
        return dirtyTablesData;
      } else {
        const errorData = await response.json();
        throw new Error(
          errorData.msg || errorData.error || "Failed to fetch dirty tables"
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

  // Clean a table using table number
  cleanTable: async (tableNumber) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`${BASE_URL}/table/cleaned/${tableNumber}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const result = await response.json();

        // Remove the cleaned table from dirty tables list
        const { dirtyTables } = get();
        const updatedDirtyTables = dirtyTables.filter(
          (table) => (table.table_number || table.tableNumber) !== tableNumber
        );

        set({
          dirtyTables: updatedDirtyTables,
          isLoading: false,
          message: `Table #${tableNumber} cleaned successfully`,
          error: null,
        });

        setTimeout(() => set({ message: "" }), 3000);
        return result;
      } else {
        const errorData = await response.json();
        throw new Error(
          errorData.msg || errorData.error || "Failed to clean table"
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

  // Mark order as served using the serve endpoint
  markOrderServed: async (orderId, tableNumber) => {
    try {
      const response = await fetch(`${BASE_URL}/kitchen/serve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ id: orderId }),
      });

      if (response.ok) {
        const result = await response.json();

        // Remove the served order from orders list
        const { orders } = get();
        const updatedOrders = orders.filter((order) => order.id !== orderId);

        set({
          orders: updatedOrders,
          message: `Order for ${
            tableNumber === 0 ? "Takeout" : `Table #${tableNumber}`
          } served successfully`,
          error: null,
        });

        setTimeout(() => set({ message: "" }), 3000);
        return result;
      } else {
        const errorData = await response.json();
        throw new Error(
          errorData.msg || errorData.error || "Failed to serve order"
        );
      }
    } catch (error) {
      set({
        error: error.message,
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
    const { stompClient } = get();
    if (stompClient && stompClient.connected) {
      stompClient.disconnect();
    }
    set({
      dirtyTables: [],
      orders: [],
      isLoading: false,
      isLoadingOrders: false,
      error: null,
      message: "",
      stompClient: null,
      isConnected: false,
    });
  },
}));

export default useKitchenStore;
