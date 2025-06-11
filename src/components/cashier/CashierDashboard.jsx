import React, { useState } from "react";
import { Container, Row, Col, Nav } from "react-bootstrap";
import TablesTab from "./tabs/TablesTab";
import "../../assets/css/cashier.css";

const CashierDashboard = () => {
  const [activeComponent, setActiveComponent] = useState("tableList");

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
        return (
          <div className="content-section">
            <h3 className="content-title">Add Queue</h3>
            <p>Add queue form will go here...</p>
          </div>
        );

      case "order":
        return (
          <div className="content-section">
            <h3 className="content-title">Order</h3>
            <p>Order management content will go here...</p>
          </div>
        );

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
      <Row className="h-100">
        {/* Left Sidebar - 1/4 of screen */}
        <Col xs={3} className="sidebar">
          <div className="sidebar-content">
            <h4 className="sidebar-title">Cashier Dashboard</h4>
            <Nav className="flex-column sidebar-nav">
              <Nav.Link
                className={`sidebar-link ${
                  activeComponent === "queueList" ? "active" : ""
                }`}
                onClick={() => setActiveComponent("queueList")}
              >
                Queue List
              </Nav.Link>
              <Nav.Link
                className={`sidebar-link ${
                  activeComponent === "tableList" ? "active" : ""
                }`}
                onClick={() => setActiveComponent("tableList")}
              >
                Table List
              </Nav.Link>
              <Nav.Link
                className={`sidebar-link ${
                  activeComponent === "addQueue" ? "active" : ""
                }`}
                onClick={() => setActiveComponent("addQueue")}
              >
                Add Queue
              </Nav.Link>
              <Nav.Link
                className={`sidebar-link ${
                  activeComponent === "order" ? "active" : ""
                }`}
                onClick={() => setActiveComponent("order")}
              >
                Order
              </Nav.Link>
              <Nav.Link
                className={`sidebar-link ${
                  activeComponent === "payment" ? "active" : ""
                }`}
                onClick={() => setActiveComponent("payment")}
              >
                Payment
              </Nav.Link>
            </Nav>
          </div>
        </Col>

        {/* Right Content Area - 3/4 of screen */}
        <Col xs={9} className="main-content">
          {renderContent()}
        </Col>
      </Row>
    </Container>
  );
};

export default CashierDashboard;
