import React from "react";
import { Route, Routes } from "react-router-dom";
import { Helmet } from "react-helmet";
import Login from "./components/Login.jsx";
import "./assets/css/main.scss";
import Kitchen from "./components/kitchen/Kitchen.jsx";
import ProtectedRoutes from "./ProtectedRoutes.jsx";
import CashierDashboard from "./components/cashier/CashierDashboard.jsx";
import iQueueIcon from "./assets/images/iQueueImage.svg";

function App() {
  return (
    <>
      <Helmet>
        <title>iQueue - Restaurant Queue Management System</title>
        <meta
          name="description"
          content="iQueue is a comprehensive restaurant queue management system that streamlines reservations, orders, and kitchen operations."
        />
        <meta
          name="keywords"
          content="restaurant, queue, management, reservations, orders, kitchen, iQueue"
        />
        <meta name="author" content="iQueue Team" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        {/* Favicon */}
        <link rel="icon" type="image/svg+xml" href={iQueueIcon} />
        <link rel="shortcut icon" href={iQueueIcon} />
        <link rel="apple-touch-icon" href={iQueueIcon} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta
          property="og:title"
          content="iQueue - Restaurant Queue Management System"
        />
        <meta
          property="og:description"
          content="Streamline your restaurant operations with iQueue's comprehensive management system."
        />
        <meta property="og:image" content={iQueueIcon} />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta
          property="twitter:title"
          content="iQueue - Restaurant Queue Management System"
        />
        <meta
          property="twitter:description"
          content="Streamline your restaurant operations with iQueue's comprehensive management system."
        />
        <meta property="twitter:image" content={iQueueIcon} />

        {/* Theme */}
        <meta name="theme-color" content="#FF9500" />
        <meta name="msapplication-navbutton-color" content="#FF9500" />
        <meta name="apple-mobile-web-app-status-bar-style" content="#FF9500" />
      </Helmet>

      <Routes>
        <Route path="/" element={<Login />} />
        <Route element={<ProtectedRoutes />}>
          <Route path="/kitchen" element={<Kitchen />} />
          <Route path="/cashier" element={<CashierDashboard />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
