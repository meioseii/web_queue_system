import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Badge,
  Pagination,
  Spinner,
  Alert,
  Toast,
  ToastContainer,
  Modal,
  Card,
  Row,
  Col,
  Form,
} from "react-bootstrap";
import usePaymentStore from "../../../store/payment-store";
import "../../../assets/css/payment-modal.css"; // Import your custom CSS for styling

const Payment = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [showToast, setShowToast] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("CASH"); // Already set to CASH

  // Add new states for receipt functionality
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [cashAmount, setCashAmount] = useState("");
  const [orderDetails, setOrderDetails] = useState(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);

  const {
    payments,
    isLoading,
    error,
    message,
    fetchPayments,
    processPayment,
    clearMessage,
  } = usePaymentStore();

  // Fetch payments on component mount
  useEffect(() => {
    fetchPayments().catch(() => {});
  }, [fetchPayments]);

  // Show toast when there's a message or error
  useEffect(() => {
    if (error || message) {
      setShowToast(true);
    }
  }, [error, message]);

  // Get current page data (10 payments per page)
  const paymentsPerPage = 10;
  const startIndex = (currentPage - 1) * paymentsPerPage;
  const currentPaymentData = payments.slice(
    startIndex,
    startIndex + paymentsPerPage
  );
  const totalPages = Math.ceil(payments.length / paymentsPerPage);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getCustomerTypeBadge = (isGuest) => {
    return (
      <Badge bg={isGuest ? "secondary" : "primary"}>
        {isGuest ? "Guest" : "Member"}
      </Badge>
    );
  };

  // Function to fetch order details for receipt
  const fetchOrderDetails = async (username) => {
    setIsLoadingOrder(true);
    try {
      const response = await fetch(
        `http://54.252.152.233/cashier/menu/view/unpaid/${username}`,
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
        setOrderDetails(data);
        return data;
      } else {
        throw new Error("Failed to fetch order details");
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      setShowToast(true);
      return null;
    } finally {
      setIsLoadingOrder(false);
    }
  };

  // Updated handleProcessPayment to ensure CASH is default
  const handleProcessPayment = async (payment) => {
    setSelectedPayment(payment);
    setPaymentMethod("CASH"); // Ensure CASH is set as default
    setCashAmount("");

    // Fetch order details
    const details = await fetchOrderDetails(payment.customer.username);
    if (details) {
      setShowPaymentModal(true);
    }
  };

  // Function to process the actual payment
  const handleConfirmPayment = async () => {
    if (!selectedPayment || !orderDetails) return;

    // Validate cash amount for CASH payments
    if (paymentMethod === "CASH") {
      const cash = parseFloat(cashAmount);
      if (!cash || cash < orderDetails.totalAmount) {
        alert("Cash amount must be greater than or equal to the total amount");
        return;
      }
    }

    setIsProcessing(true);

    try {
      const paymentData = {
        username: selectedPayment.customer.username,
        guest: selectedPayment.customer.guest,
        paymentMethod: paymentMethod,
        cashAmount: paymentMethod === "CASH" ? cashAmount : "0",
      };

      const response = await fetch(
        "http://54.252.152.233/cashier/menu/payment",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(paymentData),
        }
      );

      if (response.ok) {
        const receiptResponse = await response.json();
        setReceiptData(receiptResponse);
        setShowPaymentModal(false);
        setShowReceiptModal(true);

        // Refresh payments list
        await fetchPayments();
      } else {
        throw new Error("Payment processing failed");
      }
    } catch (error) {
      console.error("Payment error:", error);
      setShowToast(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleRefresh = () => {
    fetchPayments().catch(() => {});
  };

  const handleToastClose = () => {
    setShowToast(false);
    clearMessage();
  };

  const handleCloseModal = () => {
    if (!isProcessing) {
      setShowPaymentModal(false);
      setSelectedPayment(null);
      setPaymentMethod("CASH");
    }
  };

  return (
    <div className="content-section">
      <div className="content-header">
        <h3 className="content-title" style={{ color: "#FF9500" }}>
          <i className="fas fa-credit-card me-2"></i>
          Payment Management
        </h3>
        <Button
          variant="outline-primary"
          onClick={handleRefresh}
          disabled={isLoading}
          className="refresh-btn"
          style={{ borderColor: "#FF9500", color: "#FF9500" }}
        >
          {isLoading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Loading...
            </>
          ) : (
            <>Refresh</>
          )}
        </Button>
      </div>

      {/* Summary Cards */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center d-flex flex-column justify-content-center">
              <div className="mb-2" style={{ color: "#FF9500" }}>
                <i className="fas fa-clock" style={{ fontSize: "2rem" }}></i>
              </div>
              <h5 className="mb-1">{payments.length}</h5>
              <p className="text-muted mb-0">Pending Payments</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center d-flex flex-column justify-content-center">
              <div className="text-success mb-2">
                <i
                  className="fas fa-peso-sign"
                  style={{ fontSize: "2rem" }}
                ></i>
              </div>
              <h5 className="mb-1">
                {formatCurrency(
                  payments.reduce((sum, payment) => sum + payment.total, 0)
                )}
              </h5>
              <p className="text-muted mb-0">Total Amount</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center d-flex flex-column justify-content-center">
              <div className="text-info mb-2">
                <i className="fas fa-table" style={{ fontSize: "2rem" }}></i>
              </div>
              <h5 className="mb-1">
                {
                  new Set(
                    payments
                      .filter((p) => p.tableNumber > 0)
                      .map((p) => p.tableNumber)
                  ).size
                }
              </h5>
              <p className="text-muted mb-0">Tables with Orders</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" className="mb-3">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      )}

      <div className="table-container">
        <Table responsive striped hover className="modern-table">
          <thead>
            <tr>
              <th className="text-center">Customer</th>
              <th className="text-center">Type</th>
              <th className="text-center">Table</th>
              <th className="text-center">Total</th>
              <th className="text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="5" className="text-center py-4">
                  <Spinner animation="border" className="me-2" />
                  Loading payments...
                </td>
              </tr>
            ) : currentPaymentData.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-4 text-muted">
                  No pending payments found
                </td>
              </tr>
            ) : (
              currentPaymentData.map((payment, index) => (
                <tr key={index}>
                  <td className="text-center">
                    <div className="fw-medium">{payment.customer.username}</div>
                  </td>
                  <td className="text-center">
                    {getCustomerTypeBadge(payment.customer.guest)}
                  </td>
                  <td className="text-center">
                    {payment.tableNumber > 0 ? (
                      <span className="fw-medium">#{payment.tableNumber}</span>
                    ) : (
                      <span className="text-muted fst-italic">Takeout</span>
                    )}
                  </td>
                  <td className="text-center fw-medium text-success">
                    {formatCurrency(payment.total)}
                  </td>
                  <td className="text-center">
                    <Button
                      variant="outline-success"
                      size="sm"
                      onClick={() => handleProcessPayment(payment)}
                      style={{
                        borderColor: "#FF9500",
                        color: "#FF9500",
                        backgroundColor: "transparent",
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = "#FF9500";
                        e.target.style.color = "white";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = "transparent";
                        e.target.style.color = "#FF9500";
                      }}
                    >
                      <i className="fas fa-credit-card me-1"></i>
                      Process Payment
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <Pagination>
            <Pagination.First
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
            />
            <Pagination.Prev
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            />

            {Array.from({ length: totalPages }, (_, index) => {
              const pageNumber = index + 1;
              const isVisible =
                pageNumber === 1 ||
                pageNumber === totalPages ||
                Math.abs(pageNumber - currentPage) <= 2;

              if (!isVisible) {
                if (
                  pageNumber === currentPage - 3 ||
                  pageNumber === currentPage + 3
                ) {
                  return <Pagination.Ellipsis key={pageNumber} />;
                }
                return null;
              }

              return (
                <Pagination.Item
                  key={pageNumber}
                  active={pageNumber === currentPage}
                  onClick={() => handlePageChange(pageNumber)}
                  style={
                    pageNumber === currentPage
                      ? { backgroundColor: "#FF9500", borderColor: "#FF9500" }
                      : {}
                  }
                >
                  {pageNumber}
                </Pagination.Item>
              );
            })}

            <Pagination.Next
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            />
            <Pagination.Last
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
            />
          </Pagination>
        </div>
      )}

      {/* Simplified Payment Modal */}
      <Modal
        show={showPaymentModal}
        onHide={handleCloseModal}
        centered
        size="lg"
        backdrop={isProcessing ? "static" : true}
        keyboard={!isProcessing}
      >
        <Modal.Header closeButton={!isProcessing}>
          <Modal.Title style={{ color: "#FF9500" }}>
            <i className="fas fa-receipt me-2"></i>
            Process Payment
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {isLoadingOrder ? (
            <div className="text-center py-4">
              <Spinner animation="border" style={{ color: "#FF9500" }} />
              <p className="mt-3 mb-0">Loading order details...</p>
            </div>
          ) : orderDetails ? (
            <div>
              {/* Customer Info */}
              <div className="mb-4 p-3 bg-light rounded">
                <h5 className="mb-2">Customer: {orderDetails.username}</h5>
                <Badge bg={orderDetails.guest ? "primary" : "secondary"}>
                  {orderDetails.guest ? "Member" : "Guest"}
                </Badge>
              </div>

              {/* Order Items */}
              <div className="mb-4">
                <h6 className="mb-3">Order Items:</h6>
                {orderDetails.orders.map((item, index) => (
                  <div
                    key={index}
                    className="d-flex justify-content-between align-items-center mb-2 p-2 border rounded"
                  >
                    <div>
                      <div className="fw-medium">{item.name}</div>
                      <small className="text-muted">
                        {formatCurrency(item.price)} × {item.quantity}
                      </small>
                    </div>
                    <div className="fw-bold text-success">
                      {formatCurrency(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Payment Summary */}
              <div className="mb-4 p-3 border rounded">
                <div className="d-flex justify-content-between mb-2">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(orderDetails.vatableSale)}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>VAT (12%):</span>
                  <span>{formatCurrency(orderDetails.vat)}</span>
                </div>
                <hr />
                <div className="d-flex justify-content-between mb-3">
                  <strong>Total Amount:</strong>
                  <strong style={{ color: "#FF9500", fontSize: "1.2rem" }}>
                    {formatCurrency(orderDetails.totalAmount)}
                  </strong>
                </div>

                {/* Cash Input */}
                <div>
                  <Form.Label className="fw-medium">Cash Amount:</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Enter cash amount"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    disabled={isProcessing}
                    min={orderDetails.totalAmount}
                    step="0.01"
                    className="mb-2"
                  />

                  {cashAmount &&
                    parseFloat(cashAmount) >= orderDetails.totalAmount && (
                      <div className="alert alert-success py-2">
                        <strong>
                          Change:{" "}
                          {formatCurrency(
                            parseFloat(cashAmount) - orderDetails.totalAmount
                          )}
                        </strong>
                      </div>
                    )}

                  {cashAmount &&
                    parseFloat(cashAmount) < orderDetails.totalAmount && (
                      <div className="alert alert-warning py-2">
                        <small>
                          Cash amount must be at least{" "}
                          {formatCurrency(orderDetails.totalAmount)}
                        </small>
                      </div>
                    )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted">Failed to load order details</p>
            </div>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={handleCloseModal}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmPayment}
            disabled={
              isProcessing ||
              !orderDetails ||
              !cashAmount ||
              parseFloat(cashAmount) < orderDetails?.totalAmount
            }
            style={{ backgroundColor: "#FF9500", borderColor: "#FF9500" }}
          >
            {isProcessing ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Processing...
              </>
            ) : (
              "Confirm Payment"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Simple Receipt Modal */}
      <Modal
        show={showReceiptModal}
        onHide={() => setShowReceiptModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title style={{ color: "#28a745" }}>
            <i className="fas fa-check-circle me-2"></i>
            Payment Successful
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {receiptData && (
            <div>
              <div className="text-center mb-4">
                <h5>Receipt</h5>
                <p className="mb-1">
                  <strong>Customer:</strong> {receiptData.username}
                </p>
                <p className="mb-1">
                  <strong>Payment Method:</strong> Cash
                </p>
                <p>
                  <strong>Date:</strong> {new Date().toLocaleString()}
                </p>
              </div>

              <div className="mb-4">
                <h6>Items:</h6>
                {receiptData.orders.map((item, index) => (
                  <div
                    key={index}
                    className="d-flex justify-content-between mb-2"
                  >
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <span>{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="border-top pt-3">
                <div className="d-flex justify-content-between mb-1">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(receiptData.vatableSale)}</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span>VAT:</span>
                  <span>{formatCurrency(receiptData.vat)}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <strong>Total:</strong>
                  <strong>{formatCurrency(receiptData.totalAmount)}</strong>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span>Cash Received:</span>
                  <span>{formatCurrency(receiptData.cashAmount)}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <strong>Change:</strong>
                  <strong className="text-success">
                    {formatCurrency(receiptData.change)}
                  </strong>
                </div>
              </div>

              <div className="text-center mt-4">
                <p className="mb-0">Thank you for your business!</p>
              </div>
            </div>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="primary"
            onClick={() => setShowReceiptModal(false)}
            style={{ backgroundColor: "#FF9500", borderColor: "#FF9500" }}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Toast Container for messages/errors */}
      <ToastContainer
        position="bottom-end"
        className="p-3"
        style={{ zIndex: 1050 }}
      >
        <Toast
          show={showToast}
          onClose={handleToastClose}
          delay={3500}
          autohide
          bg={error ? "danger" : "success"}
        >
          <Toast.Header>
            <strong className="me-auto">{error ? "Error" : "Success"}</strong>
          </Toast.Header>
          <Toast.Body
            className={error ? "text-white" : ""}
            style={{ color: "#fff" }}
          >
            {error || message}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
};

export default Payment;
