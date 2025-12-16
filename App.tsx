
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Reports } from './pages/Reports';
import { DonorList } from './pages/DonorList';
import { DonorForm } from './pages/DonorForm';
import { DonorProfile } from './pages/DonorProfile';
import { BatchList } from './pages/BatchList';
import { BatchForm } from './pages/BatchForm';
import { BatchDetail } from './pages/BatchDetail';
import { QualityControlList } from './pages/QualityControlList';
import { QualityControlForm } from './pages/QualityControlForm';
import { PhysicalInspectionForm } from './pages/PhysicalInspectionForm';
import { RecipientList } from './pages/RecipientList';
import { RecipientForm } from './pages/RecipientForm';
import { RecipientDetail } from './pages/RecipientDetail';
import { InventoryList } from './pages/InventoryList';
import { AdministrationForm } from './pages/AdministrationForm';
import { MilkCollection } from './pages/MilkCollection';
import { Layout } from './components/Layout';
import { authService } from './services/authService';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <Layout>{children}</Layout>;
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />
        
        {/* Donor Routes */}
        <Route
          path="/donors"
          element={
            <ProtectedRoute>
              <DonorList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/donors/new"
          element={
            <ProtectedRoute>
              <DonorForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/donors/:id"
          element={
            <ProtectedRoute>
              <DonorProfile />
            </ProtectedRoute>
          }
        />

        {/* Collection Route */}
        <Route
          path="/collection"
          element={
            <ProtectedRoute>
              <MilkCollection />
            </ProtectedRoute>
          }
        />

        {/* Batch Routes */}
        <Route
          path="/batches"
          element={
            <ProtectedRoute>
              <BatchList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/batches/new"
          element={
            <ProtectedRoute>
              <BatchForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/batches/:id"
          element={
            <ProtectedRoute>
              <BatchDetail />
            </ProtectedRoute>
          }
        />

        {/* Quality Control Routes */}
        <Route
          path="/quality-control"
          element={
            <ProtectedRoute>
              <QualityControlList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quality-control/physical/:batchId"
          element={
            <ProtectedRoute>
              <PhysicalInspectionForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quality-control/:batchId"
          element={
            <ProtectedRoute>
              <QualityControlForm />
            </ProtectedRoute>
          }
        />

        {/* Recipient Routes */}
        <Route
          path="/recipients"
          element={
            <ProtectedRoute>
              <RecipientList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recipients/new"
          element={
            <ProtectedRoute>
              <RecipientForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recipients/:id"
          element={
            <ProtectedRoute>
              <RecipientDetail />
            </ProtectedRoute>
          }
        />

        {/* Administration & Inventory Routes */}
        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <InventoryList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/administration"
          element={
            <ProtectedRoute>
              <AdministrationForm />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
