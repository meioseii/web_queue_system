import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Badge,
  ListGroup,
  Alert,
  Spinner,
  Toast,
  ToastContainer,
  Button,
} from "react-bootstrap";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import useReservationStore from "../../../store/reservation-store";
import "../../../assets/css/reservation.css";

const Reservation = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDateReservations, setSelectedDateReservations] = useState([]);
  const [showToast, setShowToast] = useState(false);

  const {
    reservations,
    isLoading,
    error,
    message,
    fetchReservations,
    clearMessage,
  } = useReservationStore();

  useEffect(() => {
    fetchReservations().catch(() => {});
  }, [fetchReservations]);

  useEffect(() => {
    if (error || message) {
      setShowToast(true);
    }
  }, [error, message]);

  // Helper function to get date string in local timezone
  const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    // Get selected date as local date string
    const selectedDateStr = getLocalDateString(selectedDate);

    const dayReservations = reservations.filter((res) => {
      const resDate = res.reservation_date;
      if (!resDate) return false;

      // Parse the reservation date and get local date string
      const reservationDate = new Date(resDate);
      const reservationDateStr = getLocalDateString(reservationDate);

      return reservationDateStr === selectedDateStr;
    });

    setSelectedDateReservations(dayReservations);
    console.log(
      `Selected date: ${selectedDateStr}, Found reservations:`,
      dayReservations
    );
  }, [selectedDate, reservations]);

  const formatTime = (dateTimeString) => {
    if (!dateTimeString) return "N/A";

    try {
      const date = new Date(dateTimeString);
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      return "N/A";
    }
  };

  const hasReservations = (date) => {
    const dateStr = getLocalDateString(date);

    const hasRes = reservations.some((res) => {
      const resDate = res.reservation_date;
      if (!resDate) return false;

      const reservationDate = new Date(resDate);
      const reservationDateStr = getLocalDateString(reservationDate);

      return reservationDateStr === dateStr;
    });

    return hasRes;
  };

  const getStatusBadgeColor = (status) => {
    switch (status?.toUpperCase()) {
      case "CREATED":
        return "success";
      case "CONFIRMED":
        return "primary";
      case "CANCELLED":
        return "danger";
      case "COMPLETED":
        return "secondary";
      default:
        return "warning";
    }
  };

  const handleRefresh = () => {
    fetchReservations().catch(() => {});
  };

  const handleToastClose = () => {
    setShowToast(false);
    clearMessage();
  };

  return (
    <div className="content-section reservation-section">
      <div className="content-header">
        <h3 className="content-title" style={{ color: "#FF9500" }}>
          <i className="fas fa-calendar-alt me-2"></i>
          Reservation Management
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

      <Row className="h-100">
        {/* Left Side - Calendar */}
        <Col md={6} className="reservation-left">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-light border-bottom">
              <h5 className="mb-0">
                <i
                  className="fas fa-calendar me-2"
                  style={{ color: "#FF9500" }}
                ></i>
                Reservation Calendar
              </h5>
            </Card.Header>
            <Card.Body className="d-flex align-items-center justify-content-center">
              <div className="calendar-container">
                <Calendar
                  onChange={setSelectedDate}
                  value={selectedDate}
                  tileClassName={({ date }) =>
                    hasReservations(date) ? "has-reservations" : null
                  }
                  className="custom-calendar"
                />
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Right Side - Reservations List */}
        <Col md={6} className="reservation-right">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-light border-bottom">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i
                    className="fas fa-list me-2"
                    style={{ color: "#FF9500" }}
                  ></i>
                  Reservations for {selectedDate.toLocaleDateString()}
                </h5>
                <Badge style={{ backgroundColor: "#FF9500" }} className="fs-6">
                  {selectedDateReservations.length} Reservations
                </Badge>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              {error && (
                <Alert variant="danger" className="m-3 mb-0">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {error}
                </Alert>
              )}

              <div className="reservations-list p-3">
                {isLoading ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" style={{ color: "#FF9500" }} />
                    <p className="mt-3 mb-0 text-muted">
                      Loading reservations...
                    </p>
                  </div>
                ) : selectedDateReservations.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <i
                      className="fas fa-calendar-times fa-3x mb-4 d-block"
                      style={{ color: "#FF9500", opacity: 0.5 }}
                    ></i>
                    <h5 className="mb-2">No reservations found</h5>
                    <p className="mb-0">
                      No reservations scheduled for this date
                    </p>
                  </div>
                ) : (
                  <ListGroup variant="flush">
                    {selectedDateReservations.map((reservation, index) => (
                      <ListGroup.Item
                        key={reservation.reservation_id || index}
                        className="px-0 py-0 reservation-item border-0 mb-3"
                      >
                        <div className="reservation-card">
                          <div className="reservation-header">
                            <div className="d-flex align-items-center justify-content-between">
                              <div className="d-flex align-items-center">
                                <div className="customer-avatar">
                                  <i className="fas fa-user"></i>
                                </div>
                                <div className="ms-3">
                                  <h6 className="customer-name mb-1">
                                    {reservation.customer?.username || "N/A"}
                                  </h6>
                                  <Badge
                                    className={`customer-badge ${
                                      reservation.customer?.guest
                                        ? "guest-badge"
                                        : "member-badge"
                                    }`}
                                  >
                                    {reservation.customer?.guest
                                      ? "Guest"
                                      : "Member"}
                                  </Badge>
                                </div>
                              </div>
                              <div className="reservation-time">
                                {new Date(
                                  reservation.reservation_date
                                ).toLocaleTimeString("en-US", {
                                  hour: "numeric",
                                  minute: "2-digit",
                                  hour12: true,
                                })}
                              </div>
                            </div>
                          </div>

                          <div className="reservation-details">
                            <div className="detail-row">
                              <div className="detail-item">
                                <div className="detail-icon">
                                  <i className="fas fa-phone"></i>
                                </div>
                                <div className="detail-content">
                                  <span className="detail-label">Mobile</span>
                                  <span className="detail-value">
                                    {reservation.customer?.mobileNumber ||
                                      "N/A"}
                                  </span>
                                </div>
                              </div>
                              <div className="detail-item">
                                <div className="detail-icon">
                                  <i className="fas fa-users"></i>
                                </div>
                                <div className="detail-content">
                                  <span className="detail-label">Guests</span>
                                  <span className="detail-value">
                                    {reservation.num_people}{" "}
                                    {reservation.num_people === 1
                                      ? "person"
                                      : "people"}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="detail-row">
                              <div className="detail-item full-width">
                                <div className="detail-icon">
                                  <i className="fas fa-calendar-alt"></i>
                                </div>
                                <div className="detail-content">
                                  <span className="detail-label">
                                    Date & Time
                                  </span>
                                  <span className="detail-value">
                                    {new Date(
                                      reservation.reservation_date
                                    ).toLocaleString("en-US", {
                                      weekday: "short",
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                      hour: "numeric",
                                      minute: "2-digit",
                                      hour12: true,
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Toast Container */}
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

export default Reservation;
