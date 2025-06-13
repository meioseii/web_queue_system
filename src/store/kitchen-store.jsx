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
            // Subscribe to order updates
            stompClient.subscribe("/topic/table/orders", (message) => {
              try {
                const orderData = JSON.parse(message.body);
                const processedOrders = processOrdersData(orderData);

                if (processedOrders.length > 0) {
                  const { orders: currentOrders } = get();
                  const updatedOrders = [...currentOrders];

                  processedOrders.forEach((newOrder) => {
                    const existingIndex = updatedOrders.findIndex(
                      (order) => order.id === newOrder.id
                    );

                    if (existingIndex >= 0) {
                      updatedOrders[existingIndex] = newOrder;
                    } else {
                      updatedOrders.push(newOrder);
                    }
                  });

                  set({
                    orders: updatedOrders,
                    isLoadingOrders: false,
                    error: null,
                  });
                }
              } catch {
                set({
                  error: "Failed to process order update",
                  message: "Failed to process order update",
                });
              }
            });

            // Subscribe to dirty table updates
            stompClient.subscribe("/topic/table/dirty", (message) => {
              try {
                const dirtyTableData = JSON.parse(message.body);

                if (dirtyTableData && typeof dirtyTableData === "object") {
                  if (dirtyTableData.tableNumber) {
                    const { dirtyTables: currentTables } = get();

                    const newDirtyTable = {
                      tableId: `table_${dirtyTableData.tableNumber}`,
                      table_number: dirtyTableData.tableNumber,
                      tableNumber: dirtyTableData.tableNumber,
                    };

                    const existingIndex = currentTables.findIndex(
                      (table) =>
                        table.table_number === dirtyTableData.tableNumber ||
                        table.tableNumber === dirtyTableData.tableNumber
                    );

                    let updatedDirtyTables;
                    if (existingIndex >= 0) {
                      updatedDirtyTables = [...currentTables];
                      updatedDirtyTables[existingIndex] = {
                        ...updatedDirtyTables[existingIndex],
                        ...newDirtyTable,
                      };
                    } else {
                      updatedDirtyTables = [...currentTables, newDirtyTable];
                    }

                    set({
                      dirtyTables: updatedDirtyTables,
                      error: null,
                    });
                  }
                }
              } catch {
                set({
                  error: "Failed to process dirty table update",
                  message: "Failed to process dirty table update",
                });
              }
            });
          } catch {
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
        const processedOrders = processOrdersData(ordersData);

        set({
          orders: processedOrders,
          isLoadingOrders: false,
          error: null,
        });
        return processedOrders;
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
        const tables = await response.json();
        set({
          dirtyTables: tables,
          isLoading: false,
          error: null,
        });
        return tables;
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
        const { dirtyTables } = get();
        const updatedTables = dirtyTables.filter(
          (table) =>
            table.table_number !== tableNumber &&
            table.tableNumber !== tableNumber
        );

        set({
          dirtyTables: updatedTables,
          isLoading: false,
          message: `Table ${tableNumber} cleaned successfully`,
        });

        setTimeout(() => set({ message: "" }), 2000);
        return true;
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
        body: JSON.stringify({
          id: orderId,
        }),
      });

      if (response.ok) {
        const { orders } = get();
        const updatedOrders = orders.filter((order) => order.id !== orderId);

        set({
          orders: updatedOrders,
          message: `Order for table ${tableNumber} served successfully`,
        });

        setTimeout(() => set({ message: "" }), 2000);
        return true;
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

// Helper function to process orders data
function processOrdersData(ordersData) {
  let dataToProcess = [];

  if (Array.isArray(ordersData)) {
    dataToProcess = ordersData;
  } else if (ordersData && typeof ordersData === "object") {
    if (ordersData.id && ordersData.tableNumber && ordersData.orders) {
      dataToProcess = [ordersData];
    } else if (ordersData.orders && Array.isArray(ordersData.orders)) {
      dataToProcess = ordersData.orders;
    } else if (ordersData.data && Array.isArray(ordersData.data)) {
      dataToProcess = ordersData.data;
    } else {
      dataToProcess = [ordersData];
    }
  } else {
    return [];
  }

  const groupedOrders = {};

  dataToProcess.forEach((orderItem, index) => {
    const tableNumber = orderItem.tableNumber || "Unknown";
    const orderId = orderItem.id || `order_${tableNumber}_${index}`;
    const key = orderId;

    if (!groupedOrders[key]) {
      groupedOrders[key] = {
        id: orderId,
        tableNumber: tableNumber,
        type: orderItem.type || "table",
        items: [],
        isServed: false,
      };
    }

    if (orderItem.orders && Array.isArray(orderItem.orders)) {
      orderItem.orders.forEach((order) => {
        groupedOrders[key].items.push({
          name: order.name,
          quantity: order.quantity,
          price: order.price,
          product_id: order.product_id,
        });
      });
    } else if (orderItem.name && orderItem.quantity) {
      groupedOrders[key].items.push({
        name: orderItem.name,
        quantity: orderItem.quantity,
        price: orderItem.price || 0,
        product_id: orderItem.product_id,
      });
    }
  });

  return Object.values(groupedOrders);
}

export default useKitchenStore;
