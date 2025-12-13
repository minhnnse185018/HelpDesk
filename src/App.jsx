import { Navigate, Route, Routes } from "react-router-dom";
import StudentLayout from "./layouts/StudentLayout.jsx";
import StaffLayout from "./layouts/StaffLayout.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";
import StudentDashboard from "./pages/student/StudentDashboard.jsx";
import CreateTicket from "./pages/student/CreateTicket.jsx";
import MyTickets from "./pages/student/MyTickets.jsx";
import StudentTicketDetail from "./pages/student/StudentTicketDetail.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import TicketManagement from "./pages/admin/TicketManagement.jsx";
import EditTicket from "./pages/admin/EditTicket.jsx";
import TicketDetail from "./pages/admin/TicketDetail.jsx";
import CategoryManagement from "./pages/admin/CategoryManagement.jsx";
import Reports from "./pages/admin/SlaManagement.jsx";
import UserManagement from "./pages/admin/UserManagement.jsx";
import DepartmentManagement from "./pages/admin/DepartmentManagement.jsx";
import RoomManagement from "./pages/admin/RoomManagement.jsx";
import RequireRoles from "./components/RequireRoles.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import SlaManagement from "./pages/admin/SlaManagement.jsx";
import AdminReassignRequests from "./pages/admin/AdminReassignRequests.jsx";
import AdminReassignRequestDetail from "./pages/admin/AdminReassignRequestDetail.jsx";
import StaffDashboard from "./pages/staff/StaffDashboard.jsx";
import StaffAssignedTickets from "./pages/staff/StaffAssignedTickets.jsx";
import StaffTicketDetail from "./pages/staff/StaffTicketDetail.jsx";
import StaffSubTickets from "./pages/staff/StaffSubTickets.jsx";
import StaffSubTicketDetail from "./pages/staff/StaffSubTicketDetail.jsx";
import AdminSubTicketDetail from "./pages/admin/AdminSubTicketDetail.jsx";
import NotificationsPage from "./pages/notifications/NotificationsPage.jsx";
import "./App.css";

function App() {
  return (
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
          <Route path="my-tickets/:id" element={<StudentTicketDetail />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>

        <Route
          path="/staff"
          element={
            <RequireRoles allowedRoles={["STAFF"]}>
              <StaffLayout />
            </RequireRoles>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<StaffDashboard />} />
          <Route path="tickets" element={<StaffAssignedTickets />} />
          <Route path="tickets/:id" element={<StaffTicketDetail />} />
          <Route path="sub-tickets" element={<StaffSubTickets />} />
          <Route path="sub-tickets/:id" element={<StaffSubTicketDetail />} />
          <Route path="notifications" element={<NotificationsPage />} />
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
          <Route path="tickets/:id" element={<TicketDetail />} />
          <Route path="tickets/edit/:id" element={<EditTicket />} />
          <Route path="sub-tickets/:id" element={<AdminSubTicketDetail />} />
          <Route path="categories" element={<CategoryManagement />} />
          <Route path="departments" element={<DepartmentManagement />} />
          <Route path="rooms" element={<RoomManagement />} />
          <Route path="Sla" element={<SlaManagement />} />
          <Route path="reports" element={<Reports />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="reassign-requests" element={<AdminReassignRequests />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="reassign-requests/:id" element={<AdminReassignRequestDetail />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

  );
}

export default App;
