import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Alert,
  Spinner,
  Modal,
  Toast,
} from "react-bootstrap";
import useKitchenStore from "../../store/kitchen-store";
import "../../assets/css/kitchen.css";

const Kitchen = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVariant, setToastVariant] = useState("success");
  const [servingOrderId, setServingOrderId] = useState(null);

  const {
    dirtyTables,
    orders,
    isLoading,
    isLoadingOrders,
    error,
    message,
    isConnected,
    fetchOrders,
    fetchDirtyTables,
    cleanTable,
    markOrderServed,
    clearMessage,
    connectWebSocket,
    disconnectWebSocket,
  } = useKitchenStore();

  useEffect(() => {
    const loadWebSocketScripts = () => {
      if (!window.SockJS) {
        const sockjsScript = document.createElement("script");
        sockjsScript.src =
          "https://cdn.jsdelivr.net/npm/sockjs-client@1/dist/sockjs.min.js";
        sockjsScript.onload = () => {
          if (!window.Stomp) {
            const stompScript = document.createElement("script");
            stompScript.src =
              "https://cdn.jsdelivr.net/npm/stompjs@2.3.3/lib/stomp.min.js";
            stompScript.onload = () => {
              setTimeout(connectWebSocket, 1000);
            };
            document.head.appendChild(stompScript);
          } else {
            setTimeout(connectWebSocket, 1000);
          }
        };
        document.head.appendChild(sockjsScript);
      } else if (!window.Stomp) {
        const stompScript = document.createElement("script");
        stompScript.src =
          "https://cdn.jsdelivr.net/npm/stompjs@2.3.3/lib/stomp.min.js";
        stompScript.onload = () => {
          setTimeout(connectWebSocket, 1000);
        };
        document.head.appendChild(stompScript);
      } else {
        setTimeout(connectWebSocket, 1000);
      }
    };

    loadWebSocketScripts();

    return () => {
      disconnectWebSocket();
    };
  }, [connectWebSocket, disconnectWebSocket]);

  // Initial fetch for both orders and dirty tables
  useEffect(() => {
    Promise.all([
      fetchOrders().catch(() => {}),
      fetchDirtyTables().catch(() => {}),
    ]);
  }, [fetchOrders, fetchDirtyTables]);

  // Periodic fetch only when not connected (fallback)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isConnected) {
        Promise.all([
          fetchOrders().catch(() => {}),
          fetchDirtyTables().catch(() => {}),
        ]);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchOrders, fetchDirtyTables, isConnected]);

  const handleServed = async (orderId, tableNumber) => {
    setServingOrderId(orderId);
    try {
      await markOrderServed(orderId); // Remove tableNumber parameter
      setToastMessage(
        `Order for ${
          tableNumber === 0 ? "Takeout" : `Table #${tableNumber}`
        } has been served successfully! ✅`
      );
      setToastVariant("success");
      setShowToast(true);
    } catch (error) {
      setToastMessage(
        `Failed to serve order for ${
          tableNumber === 0 ? "Takeout" : `Table #${tableNumber}`
        }. Please try again.`
      );
      setToastVariant("danger");
      setShowToast(true);
    } finally {
      setServingOrderId(null);
    }
  };

  const handleCleanTableClick = (tableNumber) => {
    setSelectedTable(tableNumber);
    setShowModal(true);
  };

  const handleConfirmClean = async () => {
    if (!selectedTable) return;

    try {
      await cleanTable(selectedTable);
      setShowModal(false);
      setSelectedTable(null);
      setToastMessage(
        `Table #${selectedTable} has been cleaned successfully! ✨`
      );
      setToastVariant("success");
      setShowToast(true);
    } catch (error) {
      setShowModal(false);
      setSelectedTable(null);
      setToastMessage(
        `Failed to clean Table #${selectedTable}. Please try again.`
      );
      setToastVariant("danger");
      setShowToast(true);
    }
  };

  const handleCancelClean = () => {
    setShowModal(false);
    setSelectedTable(null);
  };

  // Update refresh function to fetch both orders and dirty tables
  const handleRefreshTables = () => {
    Promise.all([
      fetchOrders().catch(() => {}),
      fetchDirtyTables().catch(() => {}),
    ]);
  };

  // Update the formatOrderTime function to include seconds
  const formatOrderTime = (timestamp) => {
    if (!timestamp) return "";

    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  console.log("Orders from store:", orders);

  return (
    <>
      <Container fluid className="kitchen-wrapper p-0">
        <Row className="kitchen-container g-0">
          <Col xl={9} lg={8} md={7} sm={12} className="order-list-section">
            <div className="p-2 p-md-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="order-list-title-section">
                  <h2 className="section-title mb-0">Order List</h2>
                  {isConnected ? (
                    <span className="status-badge status-live">
                      <span className="status-dot"></span>
                      Live
                    </span>
                  ) : (
                    <span className="status-badge status-manual">
                      <span className="status-dot"></span>
                      Manual
                    </span>
                  )}
                </div>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={handleRefreshTables}
                  disabled={isLoadingOrders || isLoading}
                  className="refresh-orders-btn"
                >
                  {isLoadingOrders || isLoading ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    "Refresh"
                  )}
                </Button>
              </div>

              {!isConnected && (
                <Alert variant="warning" className="mb-3">
                  <small>
                    Connecting to live updates... Orders and tables will refresh
                    automatically once connected.
                  </small>
                </Alert>
              )}

              <Row className="orders-grid g-2 g-md-3">
                {isLoadingOrders && (!orders || orders.length === 0) ? (
                  <Col xs={12} className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-2">Loading orders...</p>
                  </Col>
                ) : !orders || orders.length === 0 ? (
                  <Col xs={12} className="text-center py-5">
                    <h4 className="text-muted">No orders at the moment! 🍽️</h4>
                    <p className="text-muted">
                      New orders will appear here automatically.
                    </p>
                  </Col>
                ) : (
                  // Ensure orders is always an array before mapping
                  (Array.isArray(orders) ? orders : []).map((order) => (
                    <Col
                      key={order.id}
                      xxl={3}
                      xl={4}
                      lg={6}
                      md={12}
                      sm={6}
                      xs={12}
                      className="order-card-wrapper"
                    >
                      <Card className="order-card">
                        <Card.Header
                          className={`order-header text-center ${
                            order.takeOut ? "takeout" : "table"
                          }`}
                          style={{
                            color: order.takeOut ? "#002BFF" : "inherit",
                          }}
                        >
                          <div>
                            {order.takeOut ? (
                              <span className="takeout-text">
                                Takeout {order.username}
                              </span>
                            ) : (
                              <span>Table [{order.tableNumber}]</span>
                            )}
                          </div>
                          {order.orderTime && (
                            <div className="order-time">
                              <small
                                style={{ color: "#000000", fontWeight: "500" }}
                              >
                                {formatOrderTime(order.orderTime)}
                              </small>
                            </div>
                          )}
                        </Card.Header>
                        <Card.Body className="order-body">
                          <div className="order-content">
                            <div className="order-header-row d-flex">
                              <div className="header-col-orders">Orders</div>
                              <div className="header-col-quantity">
                                Quantity
                              </div>
                            </div>
                            <div className="order-items-list">
                              {/* Ensure order.orders is an array before mapping */}
                              {Array.isArray(order.orders) &&
                                order.orders.map((item, index) => (
                                  <div key={index} className="order-row d-flex">
                                    <div className="order-name-col">
                                      [{item.name}]
                                    </div>
                                    <div className="order-quantity-col">
                                      [{item.quantity}]
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </Card.Body>
                        <Card.Footer className="order-footer text-center">
                          <Button
                            className="served-btn"
                            onClick={() =>
                              handleServed(order.id, order.tableNumber)
                            }
                            disabled={
                              servingOrderId === order.id || isLoadingOrders
                            }
                          >
                            {servingOrderId === order.id ? (
                              <>
                                <Spinner
                                  animation="border"
                                  size="sm"
                                  className="me-2"
                                />
                                Serving...
                              </>
                            ) : (
                              "Serve Order"
                            )}
                          </Button>
                        </Card.Footer>
                      </Card>
                    </Col>
                  ))
                )}
              </Row>
            </div>
          </Col>

          <Col
            xl={3}
            lg={4}
            md={5}
            sm={12}
            className="table-clean-section p-0"
            style={{ order: 2 }}
          >
            <div className="clean-section-content">
              <div className="clean-section-header">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h3 className="text-center mb-0 flex-grow-1">
                    Table to Clean
                  </h3>
                  <Button
                    variant="outline-light"
                    size="sm"
                    onClick={handleRefreshTables}
                    disabled={isLoading}
                    className="refresh-btn"
                  >
                    {isLoading ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      "🔄"
                    )}
                  </Button>
                </div>

                {message && (
                  <Alert
                    variant={error ? "danger" : "success"}
                    dismissible
                    onClose={clearMessage}
                    className="status-alert"
                  >
                    {message}
                  </Alert>
                )}
              </div>

              <div className="clean-tables-container">
                {isLoading && dirtyTables.length === 0 ? (
                  <div className="text-center py-3">
                    <Spinner animation="border" variant="light" />
                    <p className="mt-2 text-white">Loading tables...</p>
                  </div>
                ) : dirtyTables.length === 0 ? (
                  <div className="text-center py-3">
                    <p className="text-white">No dirty tables! 🎉</p>
                  </div>
                ) : (
                  dirtyTables.map((table) => (
                    <Button
                      key={
                        table.tableId || table.table_number || table.tableNumber
                      }
                      className="clean-table-btn"
                      onClick={() =>
                        handleCleanTableClick(
                          table.table_number || table.tableNumber
                        )
                      }
                      disabled={isLoading}
                    >
                      Table # {table.table_number || table.tableNumber}
                    </Button>
                  ))
                )}
              </div>

              <div className="clean-section-footer text-center mt-3">
                <small className="text-muted">
                  {dirtyTables.length > 0
                    ? `${dirtyTables.length} table(s) need cleaning`
                    : "All tables are clean!"}
                </small>
              </div>

              <div className="clean-section-toast-container">
                <Toast
                  show={showToast}
                  onClose={() => setShowToast(false)}
                  delay={4000}
                  autohide
                  bg={toastVariant}
                  className="clean-section-toast"
                >
                  <Toast.Header closeButton={false} className="text-white">
                    <strong className="me-auto">
                      {toastVariant === "success" ? "✅ Success" : "❌ Error"}
                    </strong>
                    <small>Just now</small>
                  </Toast.Header>
                  <Toast.Body className="text-white">{toastMessage}</Toast.Body>
                </Toast>
              </div>
            </div>
          </Col>
        </Row>
      </Container>

      <Modal show={showModal} onHide={handleCancelClean} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="text-dark">
            🧹 Clean Table Confirmation
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-4">
          <div className="mb-3">
            <i
              className="fas fa-question-circle text-warning"
              style={{ fontSize: "3rem" }}
            ></i>
          </div>
          <h5 className="text-dark mb-3">
            Are you sure you want to clean Table #{selectedTable}?
          </h5>
          <p className="text-muted mb-0">
            This action will mark the table as clean and remove it from the
            dirty tables list.
          </p>
        </Modal.Body>
        <Modal.Footer className="border-0 justify-content-center">
          <Button
            variant="outline-secondary"
            onClick={handleCancelClean}
            disabled={isLoading}
            className="px-4"
          >
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={handleConfirmClean}
            disabled={isLoading}
            className="px-4"
          >
            {isLoading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Cleaning...
              </>
            ) : (
              <>
                <i className="fas fa-check me-2"></i>
                Yes, Clean Table
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Kitchen;
