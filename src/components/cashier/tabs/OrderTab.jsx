import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Spinner,
  Alert,
  Button,
  Form,
  ListGroup,
} from "react-bootstrap";
import useCashierStore from "../../../store/cashier-store";
import "../../../assets/css/order.css";

const OrderTab = () => {
  const {
    categories,
    menuItems,
    selectedCategory,
    cart,
    orderDetails,
    isLoading,
    error,
    message,
    fetchCategories,
    fetchMenuItems,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    updateOrderDetails,
    getCartTotal,
    clearMessage,
  } = useCashierStore();

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories().catch(() => {});
  }, [fetchCategories]);

  // Fetch menu items for the first category when categories are loaded
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      fetchMenuItems(categories[0].category).catch(() => {});
    }
  }, [categories, selectedCategory, fetchMenuItems]);

  const handleCategoryClick = (category) => {
    fetchMenuItems(category).catch(() => {});
  };

  const handleAddToCart = (item) => {
    addToCart(item);
  };

  const handleQuantityChange = (menuId, change) => {
    const item = cart.find((cartItem) => cartItem.menu_id === menuId);
    if (item) {
      updateCartItemQuantity(menuId, item.quantity + change);
    }
  };

  const handleRemoveFromCart = (menuId) => {
    removeFromCart(menuId);
  };

  const handleInputChange = (field, value) => {
    updateOrderDetails({ [field]: value });
  };

  const handleTakeoutChange = (checked) => {
    updateOrderDetails({
      isTakeout: checked,
      tableNumber: checked ? "" : orderDetails.tableNumber,
    });
  };

  const handleProceedToCheckout = () => {
    // Validate form
    if (!orderDetails.name.trim()) {
      alert("Please enter a name");
      return;
    }

    if (!orderDetails.isTakeout && !orderDetails.tableNumber.trim()) {
      alert("Please enter a table number");
      return;
    }

    if (cart.length === 0) {
      alert("Please add items to your order");
      return;
    }

    // Proceed with checkout logic
    console.log("Proceeding to checkout with:", {
      orderDetails,
      cart,
      total: getCartTotal(),
    });
  };

  const formatCategoryName = (category) => {
    return category
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatPrice = (price) => {
    return `₱${price}`;
  };

  return (
    <div className="order-tab">
      <Container fluid className="h-100">
        <Row className="h-100">
          {/* Left Side - Categories */}
          <Col xs={1} className="categories-sidebar">
            <div className="categories-content">
              <h5 className="categories-title">Categories</h5>
              {isLoading && categories.length === 0 ? (
                <div className="text-center">
                  <Spinner animation="border" size="sm" />
                </div>
              ) : (
                <div className="categories-list">
                  {categories.map((category) => (
                    <div
                      key={category.category_id}
                      className={`category-item ${
                        selectedCategory === category.category ? "active" : ""
                      }`}
                      onClick={() => handleCategoryClick(category.category)}
                    >
                      <img
                        src={category.imageURL}
                        alt={category.category}
                        className="category-image"
                        onError={(e) => {
                          e.target.src = "/placeholder-image.jpg";
                        }}
                      />
                      <span className="category-name">
                        {formatCategoryName(category.category)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Col>

          {/* Middle - Menu Items */}
          <Col xs={7} className="menu-content">
            <div className="menu-header">
              <h3 className="menu-title">
                {selectedCategory
                  ? formatCategoryName(selectedCategory)
                  : "Menu Items"}
              </h3>
            </div>

            {/* Error/Message Display */}
            {(error || message) && (
              <Alert
                variant={error ? "danger" : "success"}
                dismissible
                onClose={clearMessage}
                className="mb-3"
              >
                {error || message}
              </Alert>
            )}

            {/* Menu Items Grid */}
            <div className="menu-items-container">
              {isLoading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2">Loading menu items...</p>
                </div>
              ) : (
                <div className="menu-items-grid">
                  {menuItems.length > 0 ? (
                    menuItems.map((item) => (
                      <div
                        key={item.menu_id}
                        className="col-6 col-sm-6 col-md-4 col-lg-3 col-xl-3"
                      >
                        <Card
                          className="menu-item-card"
                          onClick={() => handleAddToCart(item)}
                        >
                          <div className="menu-item-image-container">
                            <Card.Img
                              variant="top"
                              src={item.img_url}
                              alt={item.name}
                              className="menu-item-image"
                              onError={(e) => {
                                e.target.src = "/placeholder-food.jpg";
                              }}
                            />
                          </div>
                          <Card.Body className="menu-item-body">
                            <Card.Title className="menu-item-name">
                              {item.name}
                            </Card.Title>
                            <Card.Text className="menu-item-price">
                              {formatPrice(item.price)}
                            </Card.Text>
                          </Card.Body>
                        </Card>
                      </div>
                    ))
                  ) : (
                    <div className="col-12">
                      <div className="text-center py-5">
                        <p className="text-muted">No menu items available</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Col>

          {/* Right Side - Order Summary - Fixed width issue */}
          <Col
            xs={4}
            className="order-summary-sidebar"
            style={{ maxWidth: "33.33%", flex: "0 0 33.33%" }}
          >
            <div className="order-summary-content">
              <div className="order-list-section">
                <div className="order-list-header">
                  <span>Order List:</span>
                  <span>Price</span>
                </div>

                <div className="order-items-container">
                  {cart.length > 0 ? (
                    <ListGroup variant="flush">
                      {cart.map((item) => (
                        <ListGroup.Item
                          key={item.menu_id}
                          className="order-item"
                        >
                          <div className="order-item-content">
                            <div className="order-item-name">{item.name}</div>
                            <div className="order-item-controls">
                              <div className="quantity-controls">
                                <Button
                                  variant="outline-secondary"
                                  size="sm"
                                  onClick={() =>
                                    handleQuantityChange(item.menu_id, -1)
                                  }
                                  className="quantity-btn"
                                >
                                  -
                                </Button>
                                <span className="quantity-display">
                                  {item.quantity}
                                </span>
                                <Button
                                  variant="outline-secondary"
                                  size="sm"
                                  onClick={() =>
                                    handleQuantityChange(item.menu_id, 1)
                                  }
                                  className="quantity-btn"
                                >
                                  +
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() =>
                                    handleRemoveFromCart(item.menu_id)
                                  }
                                  className="remove-btn"
                                >
                                  🗑️
                                </Button>
                              </div>
                              <div className="price-display">
                                {formatPrice(item.price * item.quantity)}
                              </div>
                            </div>
                          </div>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  ) : (
                    <div className="empty-cart">
                      <p>No items in order</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="order-form-section">
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>Name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter customer name"
                      value={orderDetails.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label="Takeout"
                      checked={orderDetails.isTakeout}
                      onChange={(e) => handleTakeoutChange(e.target.checked)}
                    />
                  </Form.Group>

                  {!orderDetails.isTakeout && (
                    <Form.Group className="mb-3">
                      <Form.Label>Table Number</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter table number"
                        value={orderDetails.tableNumber}
                        onChange={(e) =>
                          handleInputChange("tableNumber", e.target.value)
                        }
                      />
                    </Form.Group>
                  )}
                </Form>
              </div>

              <div className="order-total-section">
                <div className="total-display">
                  <h4>Total: {formatPrice(getCartTotal())}</h4>
                </div>
                <Button
                  variant="success"
                  size="lg"
                  className="proceed-btn"
                  onClick={handleProceedToCheckout}
                  disabled={cart.length === 0}
                >
                  Proceed to Payment
                </Button>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default OrderTab;
