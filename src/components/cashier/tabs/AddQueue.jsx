import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Spinner,
} from "react-bootstrap";
import useCashierStore from "../../../store/cashier-store";
import "../../../assets/css/add-queue.css";

const AddQueue = () => {
  const { addToQueue, isLoading, message, error, clearMessage } =
    useCashierStore();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm({
    defaultValues: {
      guestUsername: "",
      num_people: "",
    },
    mode: "onChange",
  });

  const onSubmit = async (data) => {
    try {
      await addToQueue(data);
      reset();
    } catch (error) {
      console.error("Error adding to queue:", error);
    }
  };

  const handleReset = () => {
    reset();
    clearMessage();
  };

  return (
    <div className="add-queue-container">
      <Container fluid>
        <Row className="justify-content-center">
          <Col xxl={5} xl={6} lg={7} md={8} sm={10} xs={12}>
            <div className="form-wrapper">
              {/* Header */}
              <div className="page-header">
                <div className="header-icon">
                  <span className="material-icons">person_add</span>
                </div>
                <h2 className="page-title">Add Walk-in Customer</h2>
                <p className="page-subtitle">
                  Enter customer details to add them to the waiting queue
                </p>
              </div>

              {/* Form Information Card */}
              <Card className="info-card mb-4">
                <Card.Body className="info-body">
                  <Row className="info-content">
                    <Col lg={6} md={12} className="mb-3">
                      <div className="requirement-item">
                        <span className="material-icons req-icon">person</span>
                        <div className="req-details">
                          <strong>Guest Name</strong>
                          <p>2-50 characters, any characters allowed</p>
                        </div>
                      </div>
                    </Col>
                    <Col lg={6} md={12} className="mb-3">
                      <div className="requirement-item">
                        <span className="material-icons req-icon">group</span>
                        <div className="req-details">
                          <strong>Party Size</strong>
                          <p>1-6 people maximum per party</p>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Alerts */}
              {message && (
                <Alert variant="success" className="custom-alert alert-success">
                  <span className="material-icons alert-icon">
                    check_circle
                  </span>
                  <div className="alert-content">
                    <strong>Success!</strong>
                    <span>{message}</span>
                  </div>
                </Alert>
              )}

              {error && (
                <Alert variant="danger" className="custom-alert alert-error">
                  <span className="material-icons alert-icon">error</span>
                  <div className="alert-content">
                    <strong>Error!</strong>
                    <span>{error}</span>
                  </div>
                </Alert>
              )}

              {/* Form Card */}
              <Card className="form-card">
                <Card.Header className="form-header">
                  <div className="header-content">
                    <span className="material-icons header-icon-small">
                      edit
                    </span>
                    <span className="header-title">Customer Information</span>
                  </div>
                </Card.Header>

                <Card.Body className="form-body">
                  <Form onSubmit={handleSubmit(onSubmit)}>
                    <Row>
                      <Col lg={6} md={12} className="mb-4">
                        <Form.Group>
                          <Form.Label className="form-label">
                            <span className="material-icons label-icon">
                              person
                            </span>
                            Guest Name
                            <span className="required-mark">*</span>
                          </Form.Label>
                          <Controller
                            name="guestUsername"
                            control={control}
                            rules={{
                              required: "Guest name is required",
                              minLength: {
                                value: 2,
                                message:
                                  "Guest name must be at least 2 characters",
                              },
                              maxLength: {
                                value: 50,
                                message:
                                  "Guest name cannot exceed 50 characters",
                              },
                            }}
                            render={({ field }) => (
                              <Form.Control
                                {...field}
                                type="text"
                                placeholder="Enter guest name"
                                className={`form-input ${
                                  errors.guestUsername ? "is-invalid" : ""
                                }`}
                                disabled={isLoading}
                              />
                            )}
                          />
                          {errors.guestUsername && (
                            <div className="invalid-feedback">
                              <span className="material-icons feedback-icon">
                                warning
                              </span>
                              {errors.guestUsername.message}
                            </div>
                          )}
                        </Form.Group>
                      </Col>

                      <Col lg={6} md={12} className="mb-4">
                        <Form.Group>
                          <Form.Label className="form-label">
                            <span className="material-icons label-icon">
                              group
                            </span>
                            Number of People
                            <span className="required-mark">*</span>
                          </Form.Label>
                          <Controller
                            name="num_people"
                            control={control}
                            rules={{
                              required: "Number of people is required",
                              min: {
                                value: 1,
                                message: "Minimum 1 person required",
                              },
                              max: {
                                value: 6,
                                message: "Maximum 6 people allowed",
                              },
                            }}
                            render={({ field }) => (
                              <Form.Control
                                {...field}
                                type="number"
                                placeholder="Enter party size"
                                min="1"
                                max="6"
                                className={`form-input ${
                                  errors.num_people ? "is-invalid" : ""
                                }`}
                                disabled={isLoading}
                              />
                            )}
                          />
                          {errors.num_people && (
                            <div className="invalid-feedback">
                              <span className="material-icons feedback-icon">
                                warning
                              </span>
                              {errors.num_people.message}
                            </div>
                          )}
                        </Form.Group>
                      </Col>
                    </Row>
                    <div className="form-actions">
                      <Button
                        type="button"
                        variant="outline-secondary"
                        className="btn-reset"
                        onClick={handleReset}
                        disabled={isLoading}
                      >
                        <span className="material-icons btn-icon">refresh</span>
                        <span className="btn-text">Reset</span>
                      </Button>

                      <Button
                        type="submit"
                        className="btn-submit"
                        disabled={isLoading || !isValid}
                      >
                        {isLoading ? (
                          <>
                            <Spinner
                              as="span"
                              animation="border"
                              size="sm"
                              role="status"
                              aria-hidden="true"
                              className="me-2"
                            />
                            <span>Adding to Queue...</span>
                          </>
                        ) : (
                          <>
                            <span className="material-icons btn-icon">add</span>
                            <span className="btn-text">Add to Queue</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AddQueue;
