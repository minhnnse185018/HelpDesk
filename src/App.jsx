import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import StudentLayout from './layouts/StudentLayout.jsx'
import AdminLayout from './layouts/AdminLayout.jsx'
import Login from './pages/Login.jsx'
import StudentDashboard from './pages/student/StudentDashboard.jsx'
import CreateTicket from './pages/student/CreateTicket.jsx'
import MyTickets from './pages/student/MyTickets.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import TicketManagement from './pages/admin/TicketManagement.jsx'
import CategoryManagement from './pages/admin/CategoryManagement.jsx'
import RoomsDepartments from './pages/admin/RoomsDepartments.jsx'
import Reports from './pages/admin/Reports.jsx'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        <Route path="/student" element={<StudentLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="create-ticket" element={<CreateTicket />} />
          <Route path="my-tickets" element={<MyTickets />} />
        </Route>

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="tickets" element={<TicketManagement />} />
          <Route path="categories" element={<CategoryManagement />} />
          <Route path="rooms-departments" element={<RoomsDepartments />} />
          <Route path="reports" element={<Reports />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
