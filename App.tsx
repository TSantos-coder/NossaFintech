
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Proposals from './pages/Proposals';
import Users from './pages/Users';
import ImportData from './pages/ImportData';
import Layout from './components/Layout';
import { useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children }: React.PropsWithChildren) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const MasterRoute = ({ children }: React.PropsWithChildren) => {
  const { user } = useAuth();
  if (user?.role !== 'MASTER') {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="propostas" element={<Proposals />} />
          <Route path="importar" element={
            <MasterRoute>
              <ImportData />
            </MasterRoute>
          } />
          <Route path="usuarios" element={
            <MasterRoute>
              <Users />
            </MasterRoute>
          } />
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default App;
