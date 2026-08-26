import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './lib/ToastContext';
import Login from './pages/Login';
import EmployeeDashboard from './pages/EmployeeDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import ManagerDocuments from './pages/ManagerDocuments';
import Notifications from './pages/Notifications';
import Credentials from './pages/Credentials';

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/employee" element={<EmployeeDashboard />} />
          <Route path="/manager" element={<ManagerDashboard />} />
          <Route path="/manager/documents" element={<ManagerDocuments />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/credentials" element={<Credentials />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
