import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import StudentLayout from "./layouts/StudentLayout.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";
import StudentDashboard from "./pages/student/StudentDashboard.jsx";
import CreateTicket from "./pages/student/CreateTicket.jsx";
import MyTickets from "./pages/student/MyTickets.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import TicketManagement from "./pages/admin/TicketManagement.jsx";
import CategoryManagement from "./pages/admin/CategoryManagement.jsx";
import Reports from "./pages/admin/SlaManagement.jsx";
import UserManagement from "./pages/admin/UserManagement.jsx";
import DepartmentManagement from "./pages/admin/DepartmentManagement.jsx";
import RoomManagement from "./pages/admin/RoomManagement.jsx";
import RequireRoles from "./components/RequireRoles.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import SlaManagement from "./pages/admin/SlaManagement.jsx";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route
          path="/student"
          element={
            <RequireRoles allowedRoles={["STUDENT", "STAFF"]}>
              <StudentLayout />
            </RequireRoles>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="create-ticket" element={<CreateTicket />} />
          <Route path="my-tickets" element={<MyTickets />} />
        </Route>

        <Route
          path="/admin"
          element={
            <RequireRoles allowedRoles={["ADMIN"]}>
              <AdminLayout />
            </RequireRoles>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="tickets" element={<TicketManagement />} />
          <Route path="categories" element={<CategoryManagement />} />
          <Route path="departments" element={<DepartmentManagement />} />
          <Route path="rooms" element={<RoomManagement />} />
          <Route path="Sla" element={<SlaManagement />} />
          <Route path="reports" element={<Reports />} />
          <Route path="users" element={<UserManagement />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
