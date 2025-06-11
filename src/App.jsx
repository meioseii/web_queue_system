import React from "react";
import { Route, Routes } from "react-router-dom";
import Login from "./components/Login.jsx";
import "./assets/css/main.scss";
import Kitchen from "./components/kitchen/Kitchen.jsx";
import ProtectedRoutes from "./ProtectedRoutes.jsx";
import CashierDashboard from "./components/cashier/CashierDashboard.jsx";

function App() {
  return (
    <>
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
