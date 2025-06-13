import React, { useState, useEffect, useRef } from "react";
import { Container, Row, Col, Nav, Button } from "react-bootstrap";
import TablesTab from "./tabs/TablesTab";
import OrderTab from "./tabs/OrderTab";
import AddQueue from "./tabs/AddQueue";
import useCashierStore from "../../store/cashier-store";
import "../../assets/css/cashier.css";

const CashierDashboard = () => {
  const [activeComponent, setActiveComponent] = useState("tableList");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const wsInitialized = useRef(false);

  const { connectWebSocket, disconnectWebSocket } = useCashierStore();

  // Initialize WebSocket only once when dashboard mounts
  useEffect(() => {
    if (wsInitialized.current) return;

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
    wsInitialized.current = true;

    // Cleanup when dashboard unmounts
    return () => {
      disconnectWebSocket();
    };
  }, [connectWebSocket, disconnectWebSocket]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const renderContent = () => {
    switch (activeComponent) {
      case "queueList":
        return (
          <div className="content-section">
            <h3 className="content-title">Queue List</h3>
            <p>Queue management content will go here...</p>
          </div>
        );

      case "tableList":
        return <TablesTab />;

      case "addQueue":
        return <AddQueue />;

      case "order":
        return <OrderTab />;

      case "payment":
        return (
          <div className="content-section">
            <h3 className="content-title">Payment</h3>
            <p>Payment processing content will go here...</p>
          </div>
        );

      default:
        return <TablesTab />;
    }
  };

  return (
    <Container fluid className="cashier-dashboard">
      <Row className="h-100 g-0">
        {/* Left Sidebar - Collapsible */}
        <Col className={`sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
          <div className="sidebar-content">
            {/* Header section with hamburger and title */}
            <div className="sidebar-header">
              <div className="sidebar-header-content">
                {!sidebarCollapsed && (
                  <h4 className="sidebar-title">Cashier</h4>
                )}
                <Button
                  variant="link"
                  className="sidebar-toggle"
                  onClick={toggleSidebar}
                >
                  <span
                    className={`hamburger ${
                      sidebarCollapsed ? "collapsed" : ""
                    }`}
                  >
                    <span></span>
                    <span></span>
                    <span></span>
                  </span>
                </Button>
              </div>
            </div>

            {/* Navigation section */}
            {!sidebarCollapsed && (
              <Nav className="flex-column sidebar-nav">
                <Nav.Link
                  className={`sidebar-link ${
                    activeComponent === "queueList" ? "active" : ""
                  }`}
                  onClick={() => setActiveComponent("queueList")}
                  title="Queue List"
                >
                  <span className="sidebar-icon">📋</span>
                  <span className="sidebar-text">Queue List</span>
                </Nav.Link>
                <Nav.Link
                  className={`sidebar-link ${
                    activeComponent === "tableList" ? "active" : ""
                  }`}
                  onClick={() => setActiveComponent("tableList")}
                  title="Table List"
                >
                  <span className="sidebar-icon">🍽️</span>
                  <span className="sidebar-text">Table List</span>
                </Nav.Link>
                <Nav.Link
                  className={`sidebar-link ${
                    activeComponent === "addQueue" ? "active" : ""
                  }`}
                  onClick={() => setActiveComponent("addQueue")}
                  title="Add Queue"
                >
                  <span className="sidebar-icon">➕</span>
                  <span className="sidebar-text">Add Queue</span>
                </Nav.Link>
                <Nav.Link
                  className={`sidebar-link ${
                    activeComponent === "order" ? "active" : ""
                  }`}
                  onClick={() => setActiveComponent("order")}
                  title="Order"
                >
                  <span className="sidebar-icon">🛒</span>
                  <span className="sidebar-text">Order</span>
                </Nav.Link>
                <Nav.Link
                  className={`sidebar-link ${
                    activeComponent === "payment" ? "active" : ""
                  }`}
                  onClick={() => setActiveComponent("payment")}
                  title="Payment"
                >
                  <span className="sidebar-icon">💳</span>
                  <span className="sidebar-text">Payment</span>
                </Nav.Link>
              </Nav>
            )}

            {sidebarCollapsed && (
              <Nav className="flex-column sidebar-nav collapsed-nav">
                <Nav.Link
                  className={`sidebar-link ${
                    activeComponent === "queueList" ? "active" : ""
                  }`}
                  onClick={() => setActiveComponent("queueList")}
                  title="Queue List"
                >
                  <span className="sidebar-icon">📋</span>
                </Nav.Link>
                <Nav.Link
                  className={`sidebar-link ${
                    activeComponent === "tableList" ? "active" : ""
                  }`}
                  onClick={() => setActiveComponent("tableList")}
                  title="Table List"
                >
                  <span className="sidebar-icon">🍽️</span>
                </Nav.Link>
                <Nav.Link
                  className={`sidebar-link ${
                    activeComponent === "addQueue" ? "active" : ""
                  }`}
                  onClick={() => setActiveComponent("addQueue")}
                  title="Add Queue"
                >
                  <span className="sidebar-icon">➕</span>
                </Nav.Link>
                <Nav.Link
                  className={`sidebar-link ${
                    activeComponent === "order" ? "active" : ""
                  }`}
                  onClick={() => setActiveComponent("order")}
                  title="Order"
                >
                  <span className="sidebar-icon">🛒</span>
                </Nav.Link>
                <Nav.Link
                  className={`sidebar-link ${
                    activeComponent === "payment" ? "active" : ""
                  }`}
                  onClick={() => setActiveComponent("payment")}
                  title="Payment"
                >
                  <span className="sidebar-icon">💳</span>
                </Nav.Link>
              </Nav>
            )}
          </div>
        </Col>

        {/* Right Content Area */}
        <Col className={`main-content ${sidebarCollapsed ? "expanded" : ""}`}>
          {renderContent()}
        </Col>
      </Row>
    </Container>
  );
};

export default CashierDashboard;
