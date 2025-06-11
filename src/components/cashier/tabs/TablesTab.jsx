import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Badge,
  Pagination,
  Spinner,
  Alert,
} from "react-bootstrap";
import useCashierStore from "../../../store/cashier-store";

const TablesTab = () => {
  const [currentPage, setCurrentPage] = useState(1);

  const { tables, isLoading, error, message, fetchTables, clearMessage } =
    useCashierStore();

  // Fetch tables on component mount
  useEffect(() => {
    fetchTables().catch(() => {});
  }, [fetchTables]);

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

  const getActionButton = (action, table) => {
    if (!action) return "";

    let variant = "outline-primary";
    if (action === "Table to clean") variant = "outline-danger";
    else if (action === "Checkout") variant = "outline-warning";
    else if (action === "Confirm/Missing") variant = "outline-info";

    return (
      <Button
        variant={variant}
        size="sm"
        onClick={() => handleAction(action, table)}
      >
        {action}
      </Button>
    );
  };

  const handleAction = (action, table) => {
    console.log(`Action: ${action} for Table ${table}`);
    // Handle different actions here
    // You can add API calls for checkout, clean, confirm actions
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleRefresh = () => {
    fetchTables().catch(() => {});
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
                          <td className="table-number">{row.table}</td>
                          <td>{row.name}</td>
                          <td>{row.pax}</td>
                          <td>{getStatusBadge(row.status)}</td>
                          <td>{getActionButton(row.action, row.table)}</td>
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

            {/* Pagination - always show if more than 1 page */}
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
    </div>
  );
};

export default TablesTab;
