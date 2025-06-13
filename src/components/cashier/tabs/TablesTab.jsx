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
} from "react-bootstrap";
import useCashierStore from "../../../store/cashier-store";
import useTablesStore from "../../../store/tables-store";

const TablesTab = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [showToast, setShowToast] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    tables,
    isLoading,
    error,
    message,
    fetchTables,
    clearMessage,
    isConnected,
  } = useCashierStore();

  const {
    confirmCustomerPresence,
    markCustomerMissed,
  } = useTablesStore();

  // Fetch tables on component mount
  useEffect(() => {
    fetchTables().catch(() => {});
  }, [fetchTables]);

  // Periodic fetch only when not connected (fallback)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isConnected) {
        fetchTables().catch(() => {});
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [fetchTables, isConnected]);

  // Show toast when there's a message or error
  useEffect(() => {
    if (error || message) {
      setShowToast(true);
    }
  }, [error, message]);

  // Transform API data to display format
  const transformTableData = (apiTables) => {
    return apiTables.map((table) => {
      let action = "";
      let status = table.status;

      switch (table.status) {
        case "AVAILABLE":
          action = "";
          status = "Available";
          break;
        case "OCCUPIED":
          action = "Checkout";
          status = "Occupied";
          break;
        case "DIRTY":
          action = "Table to clean";
          status = "Unavailable";
          break;
        case "CONFIRMING":
          action = "Confirm/Missing";
          status = "Confirming";
          break;
        default:
          action = "";
          status = "Available";
      }

      return {
        table: table.tableNumber,
        name: table.username || "",
        pax: table.size || "",
        status: status,
        action: action,
        originalStatus: table.status,
        queueingNumber: table.queueingNumber || "",
      };
    });
  };

  const transformedTables = transformTableData(tables);

  // Get current page data (12 tables per page)
  const tablesPerPage = 12;
  const startIndex = (currentPage - 1) * tablesPerPage;
  const currentTableData = transformedTables.slice(
    startIndex,
    startIndex + tablesPerPage
  );
  const totalPages = Math.ceil(transformedTables.length / tablesPerPage);

  const getStatusBadge = (status) => {
    let variant = "secondary";
    if (status === "Available") variant = "success";
    else if (status === "Occupied") variant = "warning";
    else if (status === "Unavailable") variant = "danger";
    else if (status === "Confirming") variant = "info";

    return <Badge bg={variant}>{status}</Badge>;
  };

  const getActionButton = (action, tableData) => {
    if (!action) return "";

    let variant = "outline-primary";
    if (action === "Table to clean") variant = "outline-danger";
    else if (action === "Checkout") variant = "outline-warning";
    else if (action === "Confirm/Missing") variant = "outline-info";

    return (
      <Button
        variant={variant}
        size="sm"
        onClick={() => handleAction(action, tableData)}
      >
        {action}
      </Button>
    );
  };

  const handleAction = (action, tableData) => {
    console.log(`Action: ${action} for Table ${tableData.table}`);

    if (action === "Confirm/Missing") {
      setSelectedTable(tableData);
      setShowConfirmModal(true);
    }
    // Handle other actions here
  };

  const handleConfirmPresence = async (isPresent) => {
    if (!selectedTable || !selectedTable.name) {
      console.error("No table or username selected");
      return;
    }

    setIsProcessing(true);

    try {
      if (isPresent) {
        await confirmCustomerPresence(selectedTable.name);
      } else {
        await markCustomerMissed(selectedTable.name);
      }
      
      // Show success message
      setShowToast(true);
      
      // Refresh tables to get updated status
      fetchTables().catch(() => {});
      
      // Close modal
      setShowConfirmModal(false);
      setSelectedTable(null);
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
    fetchTables().catch(() => {});
  };

  const handleToastClose = () => {
    setShowToast(false);
    clearMessage();
  };

  const handleCloseModal = () => {
    if (!isProcessing) {
      setShowConfirmModal(false);
      setSelectedTable(null);
    }
  };

  return (
    <div className="content-section">
      <div className="content-header">
        <h3 className="content-title">Table List</h3>
        <div className="page-info">
          <span className="page-indicator">
            Page {currentPage} of {totalPages} | Tables {startIndex + 1}-
            {Math.min(startIndex + tablesPerPage, transformedTables.length)}
          </span>
          {/* WebSocket Status Indicator */}
          <div className="ws-status-indicator">
            {isConnected ? (
              <Badge bg="success" className="me-2">
                🟢 Live Updates
              </Badge>
            ) : (
              <Badge bg="warning" className="me-2">
                🟡 Manual Mode
              </Badge>
            )}
          </div>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="refresh-btn"
          >
            {isLoading ? (
              <Spinner animation="border" size="sm" />
            ) : (
              "🔄 Refresh"
            )}
          </Button>
        </div>
      </div>

      {/* WebSocket connection status alert */}
      {!isConnected && (
        <Alert variant="warning" className="mb-3">
          <small>
            Connecting to live updates... Tables will refresh automatically once
            connected.
          </small>
        </Alert>
      )}

      <div className="table-container">
        {isLoading && tables.length === 0 ? (
          <div
            className="text-center py-5"
            style={{
              minHeight: "500px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
            }}
          >
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Loading tables...</p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <Table striped bordered hover className="mb-0">
                <thead className="table-header">
                  <tr>
                    <th>Table</th>
                    <th>Name</th>
                    <th>Pax</th>
                    <th>Table Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Always render exactly 12 rows for consistency */}
                  {Array.from({ length: 12 }).map((_, index) => {
                    const row = currentTableData[index];
                    if (row) {
                      return (
                        <tr key={`table-${row.table}`}>
                          <td className="table-number">
                            {row.table}
                            {row.queueingNumber && (
                              <small className="text-muted d-block">
                                Q#{row.queueingNumber}
                              </small>
                            )}
                          </td>
                          <td>{row.name}</td>
                          <td>{row.pax}</td>
                          <td>{getStatusBadge(row.status)}</td>
                          <td>{getActionButton(row.action, row)}</td>
                        </tr>
                      );
                    } else {
                      // Render empty rows to maintain consistent height
                      return (
                        <tr
                          key={`empty-${index}`}
                          style={{ visibility: "hidden" }}
                        >
                          <td>&nbsp;</td>
                          <td>&nbsp;</td>
                          <td>&nbsp;</td>
                          <td>&nbsp;</td>
                          <td>&nbsp;</td>
                        </tr>
                      );
                    }
                  })}
                </tbody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="table-pagination">
                <Pagination className="custom-pagination">
                  <Pagination.Prev
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                  />
                  {[...Array(totalPages)].map((_, index) => (
                    <Pagination.Item
                      key={index + 1}
                      active={index + 1 === currentPage}
                      onClick={() => handlePageChange(index + 1)}
                    >
                      {index + 1}
                    </Pagination.Item>
                  ))}
                  <Pagination.Next
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                  />
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>

      {/* Confirm/Missing Modal */}
      <Modal
        show={showConfirmModal}
        onHide={handleCloseModal}
        centered
        backdrop={isProcessing ? "static" : true}
        keyboard={!isProcessing}
      >
        <Modal.Header closeButton={!isProcessing}>
          <Modal.Title>Customer Status Check</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-4">
          <div className="mb-3">
            <i
              className="fas fa-user-check text-info"
              style={{ fontSize: "3rem" }}
            ></i>
          </div>
          <h5 className="mb-3">
            Is <strong>{selectedTable?.name}</strong> missing or present?
          </h5>
          <p className="text-muted mb-0">
            Table #{selectedTable?.table} - Please confirm the customer's status.
          </p>
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
            variant="danger"
            onClick={() => handleConfirmPresence(false)}
            disabled={isProcessing}
            className="px-3"
          >
            {isProcessing ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Processing...
              </>
            ) : (
              <>
                <i className="fas fa-user-times me-2"></i>
                Missing
              </>
            )}
          </Button>
          <Button
            variant="success"
            onClick={() => handleConfirmPresence(true)}
            disabled={isProcessing}
            className="px-3"
          >
            {isProcessing ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Processing...
              </>
            ) : (
              <>
                <i className="fas fa-user-check me-2"></i>
                Present
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

export default TablesTab;
