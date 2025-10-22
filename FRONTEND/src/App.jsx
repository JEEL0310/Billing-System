import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import CompanyPage from './pages/Company/CompanyPage';
import SettingsPage from './pages/Setting/SettingsPage';
import BillListPage from './pages/Bills/BillListPage';
import CreateBillPage from './pages/Bills/CreateBillPage';
import EditBillPage from './pages/Bills/EditBillPage';
import ViewBillPage from './pages/Bills/ViewBillPage';
import WorkerPage from './pages/Worker/WorkerPage';
import AttendancePage from './pages/Worker/AttendancePage';
import MonthlyReportPage from './pages/Worker/MonthlyReportPage';
import PurchaseListPage from './pages/Purchases/PurchaseListPage';
// import AddPurchasePage from './pages/Purchases/AddPurchasePage';
// import ViewPurchasePage from './pages/Purchases/ViewPurchasePage';
import TransactionListPage from './pages/Transaction/TransactionListPage';
import AddTransactionPage from './pages/Transaction/AddTransactionPage';
import CreateDebitNote from './pages/Debits/CreateDebitNote'; 
import DebitNoteListPage from './pages/Debits/DebitNoteListPage'; 
import DebitNoteDetailPage from './pages/Debits/DebitNoteDetailPage'; 
import TransactionReportPage from './pages/Transaction/TransactionReportPage';
import BillDownloadsPage from './pages/Bills/BillDownloadsPage';
import AdminPanelPage from './pages/AdminPanelPage';
import CompanyLedgerPage from './pages/Ledger/CompanyLedgerPage';
import CreateChallanPage from './pages/Challan/CreateChallanPage';
import EditChallanPage from './pages/Challan/EditChallanPage';
import ViewChallanPage from './pages/Challan/ViewChallanPage';
import DownloadChallanPage from './pages/Challan/DownloadChallanPage';
import ChallanListPage from './pages/Challan/ChallanListPage';
import BoxDetailPage from './pages/Box/BoxDetailPage';
import BoxListPage from './pages/Box/BoxListPage';
import BoxFormPage from './pages/Box/BoxFormPage';
import Sidebar from './components/Sidebar';
import { FaBars } from 'react-icons/fa';
import AuthService from './services/AuthService';
import PurchaseService from './services/PurchaseService';
import TransactionService from './services/TransactionService';

const ProtectedRoute = ({ children }) => {
  const currentUser = AuthService.getCurrentUser();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!currentUser || currentUser.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-gray-100 relative">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <main className="flex-grow xl:pl-12 xl:ml-64">
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          {/* Protected Dashboard Route */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />

          {/* Protected Company Page Route */}
          <Route
            path="/companies"
            element={
              <ProtectedRoute>
                <CompanyPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Settings Page Route */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          
          {/* Debit Note Routes */}
          <Route
            path="/debit-notes"
            element={
              <ProtectedRoute>
                <DebitNoteListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/debit-notes/create/:billId"
            element={
              <ProtectedRoute>
                <CreateDebitNote />
              </ProtectedRoute>
            }
          />
          <Route
            path="/debit-notes/:id"
            element={
              <ProtectedRoute>
                <DebitNoteDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Billing Routes */}
          <Route
            path="/bills"
            element={
              <ProtectedRoute>
                <BillListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bills/create"
            element={
              <ProtectedRoute>
                <CreateBillPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bills/:id"
            element={
              <ProtectedRoute>
                <ViewBillPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bills/edit/:id"
            element={
              <ProtectedRoute>
                <EditBillPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Challan Routes */}
          <Route
            path="/challans"
            element={
              <ProtectedRoute>
                <ChallanListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/challans/create"
            element={
              <ProtectedRoute>
                <CreateChallanPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/challans/:id"
            element={
              <ProtectedRoute>
                <ViewChallanPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/challans/edit/:id"
            element={
              <ProtectedRoute>
                <EditChallanPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/challans/download"
            element={
              <ProtectedRoute>
                <DownloadChallanPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Box Routes */}
          <Route
            path="/boxes"
            element={
              <ProtectedRoute>
                <BoxListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/boxes/create"
            element={
              <ProtectedRoute>
                <BoxFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/boxes/:id"
            element={
              <ProtectedRoute>
                <BoxFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/boxes/detail/:id"
            element={
              <ProtectedRoute>
                <BoxDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Worker & Attendance Routes */}
          <Route
            path="/workers"
            element={
              <ProtectedRoute>
                <WorkerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance"
            element={
              <ProtectedRoute>
                <AttendancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance/report"
            element={
              <ProtectedRoute>
                <MonthlyReportPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Purchase Routes */}
          <Route
            path="/purchases"
            element={
              <ProtectedRoute>
                <PurchaseListPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Transaction Routes */}
          <Route
            path="/transactions"
            element={
              <ProtectedRoute>
                <TransactionListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transactions/add"
            element={
              <ProtectedRoute>
                <AddTransactionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transactions/edit/:id"
            element={
              <ProtectedRoute>
                <AddTransactionPageWrapperForEdit />
              </ProtectedRoute>
            }
          />

          {/* Protected Report Routes */}
          <Route
            path="/reports/transactions"
            element={
              <ProtectedRoute>
                <TransactionReportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bill-downloads"
            element={
              <ProtectedRoute>
                <BillDownloadsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-panel"
            element={
              <ProtectedRoute>
                <AdminPanelPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company-ledger"
            element={
              <ProtectedRoute>
                <CompanyLedgerPage />
              </ProtectedRoute>
            }
          />

          {/* Default route */}
          <Route 
            path="/" 
            element={
              AuthService.getCurrentUser() && AuthService.getCurrentUser().role === 'admin' ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

const AddPurchasePageWrapperForEdit = () => {
  const { id } = useParams();
  const [purchaseData, setPurchaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (id) {
      PurchaseService.getPurchaseById(id)
        .then(response => {
          setPurchaseData(response.data);
          setLoading(false);
        })
        .catch(err => {
          setError('Failed to load purchase data for editing.');
          setLoading(false);
          console.error(err);
        });
    }
  }, [id]);

  if (loading) return <div className="container mx-auto p-8 text-center">Loading purchase data for edit...</div>;
  if (error) return <div className="container mx-auto p-8 text-center text-red-500">{error}</div>;
  if (!purchaseData && id) return <div className="container mx-auto p-8 text-center">Purchase not found for editing.</div>;
  
  return <AddPurchasePage purchaseToEdit={purchaseData} />;
};

const AddTransactionPageWrapperForEdit = () => {
  const { id } = useParams();
  const [transactionData, setTransactionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      TransactionService.getTransactionById(id)
        .then(response => {
          setTransactionData(response.data);
          setLoading(false);
        })
        .catch(err => {
          setError('Failed to load transaction data for editing.');
          setLoading(false);
          console.error(err);
        });
    }
  }, [id]);

  if (loading) return <div className="container mx-auto p-8 text-center">Loading transaction data for edit...</div>;
  if (error) return <div className="container mx-auto p-8 text-center text-red-500">{error}</div>;
  if (!transactionData && id) return <div className="container mx-auto p-8 text-center">Transaction not found for editing.</div>;

  return <AddTransactionPage transactionToEdit={transactionData} />;
};

export default App;