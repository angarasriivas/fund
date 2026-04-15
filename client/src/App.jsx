import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import GroupPage from './pages/GroupPage';
import ContributorListPage from './pages/ContributorListPage';
import PaymentsPage from './pages/PaymentsPage';
import LoanPage from './pages/LoanPage';
import Navbar from './components/Navbar';
import RequireAuth from './components/RequireAuth';
import RequireAdmin from './components/RequireAdmin';
import './index.css';

function App() {
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <Router>
      <div className="app-container">
        {isAuthenticated && <Navbar />}
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/group" element={<RequireAdmin><GroupPage /></RequireAdmin>} />
          <Route path="/list" element={<RequireAuth><ContributorListPage /></RequireAuth>} />
          <Route path="/payments" element={<RequireAuth><PaymentsPage /></RequireAuth>} />
          <Route path="/loans" element={<RequireAuth><LoanPage /></RequireAuth>} />
          <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
