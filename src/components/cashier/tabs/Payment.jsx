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

const Payment = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [showToast, setShowToast] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("CASH");

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

  const handleProcessPayment = (payment) => {
    setSelectedPayment(payment);
    setPaymentMethod("CASH"); // Reset to default
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedPayment) return;

    setIsProcessing(true);

    try {
      await processPayment(
        selectedPayment.customer.username,
        selectedPayment.customer.guest,
        paymentMethod
      );

      // Show success message
      setShowToast(true);

      // Close modal
      setShowPaymentModal(false);
      setSelectedPayment(null);
    } catch (error) {
      // Error is already handled in the store
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
            <>
              <i className="fas fa-sync-alt me-2"></i>
              Refresh
            </>
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
                  <i className="fas fa-inbox fa-2x mb-3 d-block"></i>
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

      {/* Payment Confirmation Modal */}
      <Modal
        show={showPaymentModal}
        onHide={handleCloseModal}
        centered
        backdrop={isProcessing ? "static" : true}
        keyboard={!isProcessing}
      >
        <Modal.Header closeButton={!isProcessing}>
          <Modal.Title style={{ color: "#FF9500" }}>
            <i className="fas fa-credit-card me-2"></i>
            Process Payment
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-4">
          <div className="text-center mb-4">
            <i
              className="fas fa-credit-card"
              style={{ fontSize: "3rem", color: "#FF9500" }}
            ></i>
          </div>
          <h5 className="text-center mb-3">
            Process payment for{" "}
            <strong>{selectedPayment?.customer.username}</strong>?
          </h5>
          <div className="mb-4 text-center">
            <p className="mb-1">
              <strong>Amount:</strong>{" "}
              <span style={{ color: "#FF9500", fontWeight: "bold" }}>
                {formatCurrency(selectedPayment?.total || 0)}
              </span>
            </p>
            {selectedPayment?.tableNumber > 0 && (
              <p className="mb-1">
                <strong>Table:</strong> #{selectedPayment.tableNumber}
              </p>
            )}
            <p className="mb-0">
              <strong>Customer Type:</strong>{" "}
              {selectedPayment?.customer.guest ? "Guest" : "Member"}
            </p>
          </div>

          {/* Payment Method Selection */}
          <div className="mb-3">
            <Form.Label className="fw-medium">Payment Method</Form.Label>
            <Form.Select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              disabled={isProcessing}
              style={{ borderColor: "#FF9500" }}
            >
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="GCASH">GCash</option>
              <option value="PAYMAYA">PayMaya</option>
            </Form.Select>
          </div>
        </Modal.Body>
        <Modal.Footer className="justify-content-center">
          <Button
            variant="outline-secondary"
            onClick={handleCloseModal}
            disabled={isProcessing}
            className="px-3"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmPayment}
            disabled={isProcessing}
            className="px-3"
            style={{
              backgroundColor: "#FF9500",
              borderColor: "#FF9500",
              color: "white",
            }}
          >
            {isProcessing ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Processing...
              </>
            ) : (
              <>
                <i className="fas fa-check me-2"></i>
                Confirm Payment
              </>
            )}
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
