import React from "react";
import { Container, Row, Col, Form, Button, Card } from "react-bootstrap";
import { useForm, Controller } from "react-hook-form";
import "bootstrap/dist/css/bootstrap.min.css";
import "../assets/css/login.css";
import iQueueImage from "../assets/images/iQueueImage.svg";
import useAuthStore from "../store/auth-store";
import { useNavigate } from "react-router-dom";

function Login() {
  const { handleLogin, isLoading, message } = useAuthStore();
  const navigate = useNavigate();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = (data) => {
    handleLogin(data, navigate);
  };

  return (
    <Container fluid className="login-container p-0">
      <Row className="h-100 g-0">
        {/* Left Section - Branding */}
        <Col
          md={6}
          className="left-section d-none d-md-flex align-items-center justify-content-center"
        >
          <div className="text-center">
            <div className="brand-logo mb-3">
              <img
                src={iQueueImage}
                alt="iQueue Logo"
                className="logo-image"
                style={{ width: "150px", height: "150px" }}
              />
            </div>
            <h1 className="brand-title">iQUEUE</h1>
            <p className="brand-tagline">Less waiting, more enjoying!</p>
          </div>
        </Col>

        {/* Right Section - Login Form */}
        <Col
          md={6}
          sm={12}
          className="right-section d-flex align-items-center justify-content-center"
        >
          <div className="login-form-container">
            <div className="mb-4">
              <h2 className="form-title text-white">Sign in</h2>
              <p className="form-subtitle text-white">
                Sign in to continue to our application
              </p>
            </div>

            <Form onSubmit={handleSubmit(onSubmit)}>
              <Form.Group className="mb-3">
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg
                      width="20"
                      height="20"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z" />
                    </svg>
                  </span>
                  <Controller
                    name="username"
                    control={control}
                    rules={{ required: "Username is required" }}
                    render={({ field }) => (
                      <Form.Control
                        {...field}
                        type="text"
                        placeholder="Username"
                        className="custom-input"
                        isInvalid={!!errors.username}
                      />
                    )}
                  />
                </div>
                {errors.username && (
                  <Form.Control.Feedback
                    type="invalid"
                    className="text-warning"
                  >
                    {errors.username.message}
                  </Form.Control.Feedback>
                )}
              </Form.Group>

              <Form.Group className="mb-3">
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg
                      width="20"
                      height="20"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM5 8h6a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
                    </svg>
                  </span>
                  <Controller
                    name="password"
                    control={control}
                    rules={{ required: "Password is required" }}
                    render={({ field }) => (
                      <Form.Control
                        {...field}
                        type="password"
                        placeholder="Password"
                        className="custom-input"
                        isInvalid={!!errors.password}
                      />
                    )}
                  />
                </div>
                {errors.password && (
                  <Form.Control.Feedback
                    type="invalid"
                    className="text-warning"
                  >
                    {errors.password.message}
                  </Form.Control.Feedback>
                )}
              </Form.Group>

              <div className="text-end mb-4">
                <a href="#" className="forgot-password">
                  Forgot password?
                </a>
              </div>

              <Button
                disabled={isLoading}
                type="submit"
                className="signin-btn w-100"
              >
                SIGN IN
              </Button>
            </Form>
          </div>
        </Col>
      </Row>
    </Container>
  );
}

export default Login;
