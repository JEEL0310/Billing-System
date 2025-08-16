import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthService from '../services/AuthService';
import DashboardService from '../services/DashboardService';
import { useNavigate, Link } from 'react-router-dom';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

const DashboardPage = () => {
  const navigate = useNavigate();
  const currentUser = AuthService.getCurrentUser();

  // State management
  const [transactionChartType, setTransactionChartType] = useState('Bar');
  const [materialFlowChartType, setMaterialFlowChartType] = useState('Bar');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  const [dashboardData, setDashboardData] = useState({
    accountSummary: null,
    overdueBills: [],
    overduePurchases: [],
    upcomingBillDues: [],
    upcomingPurchaseDues: [],
    monthlyTransactionData: null,
    monthlyMaterialFlowData: null
  });
  
  const [loading, setLoading] = useState({
    summary: true,
    overdue: true,
    upcoming: true,
    charts: true
  });
  
  const [error, setError] = useState('');

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading({
        summary: true,
        overdue: true,
        upcoming: true,
        charts: true
      });
      setError('');
      
      try {
        const [
          summaryRes,
          overdueBillsRes,
          overduePurchasesRes,
          upcomingBillDuesRes,
          upcomingPurchaseDuesRes,
          monthlyTransactionRes,
          monthlyMaterialFlowRes,
        ] = await Promise.all([
          DashboardService.getAccountSummary(),
          DashboardService.getOverdueBills(),
          DashboardService.getOverduePurchases(),
          DashboardService.getUpcomingBillDues(),
          DashboardService.getUpcomingPurchaseDues(),
          DashboardService.getMonthlyTransactionSummary(),
          DashboardService.getMonthlyMaterialFlowSummary(),
        ]);

        setDashboardData({
          accountSummary: summaryRes.data,
          overdueBills: overdueBillsRes.data,
          overduePurchases: overduePurchasesRes.data,
          upcomingBillDues: upcomingBillDuesRes.data,
          upcomingPurchaseDues: upcomingPurchaseDuesRes.data,
          monthlyTransactionData: {
            ...monthlyTransactionRes.data,
            labels: monthlyTransactionRes.data.labels.map(label => label.split(' ')[0]),
          },
          monthlyMaterialFlowData: {
            ...monthlyMaterialFlowRes.data,
            labels: monthlyMaterialFlowRes.data.labels.map(label => label.split(' ')[0]),
          }
        });
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError(err.response?.data?.message || err.message || "Could not load dashboard data.");
      } finally {
        setLoading({
          summary: false,
          overdue: false,
          upcoming: false,
          charts: false
        });
      }
    };

    fetchDashboardData();
  }, []);

  // Redirect if not admin
  if (!currentUser || currentUser.role !== 'admin') {
    navigate('/login');
    return null;
  }

  // Helper functions
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const formatCurrency = (amount) => {
    return amount?.toLocaleString('en-IN', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }) || '0.00';
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        when: "beforeChildren"
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 md:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <motion.div
          className="bg-white p-4 sm:p-6 rounded-xl shadow-lg mb-6"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 text-sm sm:text-base mt-2 sm:mt-0">
              Welcome, <span className="font-semibold">{currentUser.username}</span>
            </p>
          </div>
          
          <AnimatePresence>
            {error && (
              <motion.p
                className="text-red-500 text-xs sm:text-sm p-3 bg-red-50 rounded-lg"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Account Summary */}
        {loading.summary ? (
          <LoadingPlaceholder text="Loading Account Summary..." />
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Total Income */}
            <SummaryCard 
              title="Total Income"
              value={`₹${formatCurrency(dashboardData.accountSummary?.overall?.totalIn)}`}
              color="green"
              delay={0.1}
            />
            
            {/* Total Expenses */}
            <SummaryCard 
              title="Total Expenses"
              value={`₹${formatCurrency(dashboardData.accountSummary?.overall?.totalOut)}`}
              color="red"
              delay={0.2}
            />
            
            {/* Current Balance */}
            <SummaryCard 
              title="Current Balance"
              value={`₹${formatCurrency(dashboardData.accountSummary?.overall?.currentBalance)}`}
              color="blue"
              delay={0.3}
            />
            
            {/* This Month */}
            <motion.div
              className="p-4 bg-indigo-50 rounded-lg border-t-4 border-indigo-500"
              variants={itemVariants}
            >
              <p className="text-xs sm:text-sm text-indigo-600 font-medium">
                This Month ({dashboardData.accountSummary?.currentMonth?.month} {dashboardData.accountSummary?.currentMonth?.year})
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                <p className="text-sm font-semibold text-indigo-700">
                  In: ₹{formatCurrency(dashboardData.accountSummary?.currentMonth?.totalIn)}
                </p>
                <p className="text-sm font-semibold text-indigo-700">
                  Out: ₹{formatCurrency(dashboardData.accountSummary?.currentMonth?.totalOut)}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Overdue and Upcoming Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Overdue Section */}
          <SectionWrapper 
            title="Overdue Items"
            loading={loading.overdue}
            data={[...dashboardData.overdueBills, ...dashboardData.overduePurchases]}
            emptyMessage="No overdue items found. Great job!"
            error={error}
          >
            {dashboardData.overdueBills.length > 0 && (
              <DataList 
                title={`Overdue Sales Bills (${dashboardData.overdueBills.length})`}
                items={dashboardData.overdueBills}
                type="bill"
                color="red"
              />
            )}
            
            {dashboardData.overduePurchases.length > 0 && (
              <DataList 
                title={`Overdue Purchases (${dashboardData.overduePurchases.length})`}
                items={dashboardData.overduePurchases}
                type="purchase"
                color="orange"
              />
            )}
          </SectionWrapper>

          {/* Upcoming Section */}
          <SectionWrapper 
            title="Upcoming Dues (Next 5 Days)"
            loading={loading.upcoming}
            data={[...dashboardData.upcomingBillDues, ...dashboardData.upcomingPurchaseDues]}
            emptyMessage="No upcoming dues in the next 5 days."
            error={error}
          >
            {dashboardData.upcomingBillDues.length > 0 && (
              <DataList 
                title={`Upcoming Sales Dues (${dashboardData.upcomingBillDues.length})`}
                items={dashboardData.upcomingBillDues}
                type="bill"
                color="yellow"
              />
            )}
            
            {dashboardData.upcomingPurchaseDues.length > 0 && (
              <DataList 
                title={`Upcoming Purchase Dues (${dashboardData.upcomingPurchaseDues.length})`}
                items={dashboardData.upcomingPurchaseDues}
                type="purchase"
                color="amber"
              />
            )}
          </SectionWrapper>
        </div>

        {/* Charts Section */}
        <motion.div
          className="bg-white p-4 sm:p-6 rounded-xl shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
            Financial Overview Charts
          </h2>
          
          {loading.charts ? (
            <LoadingPlaceholder text="Loading charts..." />
          ) : error ? (
            <ErrorDisplay message={`Could not load chart data: ${error}`} />
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {/* Transaction Chart */}
              {dashboardData.monthlyTransactionData && (
                <ChartContainer 
                  title="Income vs Expense"
                  chartType={transactionChartType}
                  setChartType={setTransactionChartType}
                  data={dashboardData.monthlyTransactionData}
                  labels={['Income (IN)', 'Expense (OUT)']}
                  colors={['rgba(75, 192, 192, 0.7)', 'rgba(255, 99, 132, 0.7)']}
                  isMobile={isMobile}
                />
              )}

              {/* Material Flow Chart */}
              {dashboardData.monthlyMaterialFlowData && (
                <ChartContainer 
                  title="Material Flow (Qty)"
                  chartType={materialFlowChartType}
                  setChartType={setMaterialFlowChartType}
                  data={dashboardData.monthlyMaterialFlowData}
                  labels={['Quantity Sold', 'Quantity Purchased']}
                  colors={['rgba(54, 162, 235, 0.7)', 'rgba(255, 159, 64, 0.7)']}
                  isMobile={isMobile}
                  unit="Kg"
                />
              )}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

// Reusable Components

const LoadingPlaceholder = ({ text }) => (
  <motion.div
    className="text-center p-4 sm:p-6 bg-white rounded-xl shadow-lg text-gray-500"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3 }}
  >
    {text}
  </motion.div>
);

const ErrorDisplay = ({ message }) => (
  <motion.p
    className="text-center text-red-500 p-3 sm:p-4 bg-red-50 rounded-lg text-xs sm:text-sm"
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
  >
    {message}
  </motion.p>
);

const SummaryCard = ({ title, value, color, delay = 0 }) => {
  const colorClasses = {
    green: { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-600', valueText: 'text-green-700' },
    red: { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-600', valueText: 'text-red-700' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-600', valueText: 'text-blue-700' }
  };

  return (
    <motion.div
      className={`p-4 ${colorClasses[color].bg} rounded-lg border-t-4 ${colorClasses[color].border}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
    >
      <p className={`text-xs sm:text-sm ${colorClasses[color].text} font-medium`}>{title}</p>
      <p className={`text-lg sm:text-2xl font-bold ${colorClasses[color].valueText}`}>{value}</p>
    </motion.div>
  );
};

const SectionWrapper = ({ title, loading, data, emptyMessage, error, children }) => (
  <motion.div
    className="bg-white rounded-xl shadow-lg overflow-hidden"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    {loading ? (
      <LoadingPlaceholder text={`Loading ${title}...`} />
    ) : error ? (
      <ErrorDisplay message={error} />
    ) : data.length === 0 ? (
      <div className="p-4 sm:p-6 text-center text-gray-500">
        {emptyMessage}
      </div>
    ) : (
      <div className="p-4 sm:p-6">
        {children}
      </div>
    )}
  </motion.div>
);

const DataList = ({ title, items, type, color }) => {
  const colorClasses = {
    red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', hover: 'hover:bg-red-100' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600', hover: 'hover:bg-orange-100' },
    yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-600', hover: 'hover:bg-yellow-100' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', hover: 'hover:bg-amber-100' }
  };

  return (
    <div className="mb-4 last:mb-0">
      <h3 className={`text-base sm:text-lg font-semibold ${colorClasses[color].text} mb-3`}>
        {title}
      </h3>
      <ul className="space-y-2 max-h-60 overflow-y-auto text-xs sm:text-sm">
        {items.map((item, index) => (
          <motion.li
            key={item._id}
            className={`p-3 border ${colorClasses[color].border} rounded-md ${colorClasses[color].hover} transition-colors flex flex-col sm:flex-row sm:justify-between sm:items-center`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <div>
              <Link 
                to={`/${type}s/${item._id}`} 
                className="font-medium text-indigo-600 hover:text-indigo-800 block"
              >
                {type === 'bill' ? `Bill #${item.billNumber}` : `Purchase #${item.purchaseBillNumber}`}
              </Link>
              <p className="text-xs text-gray-500">
                {type === 'bill' ? `To: ${item.company?.name || 'N/A'}` : `From: ${item.supplierCompany?.name || 'N/A'}`}
              </p>
              <p className="text-xs text-gray-500">
                Due: {new Date(item.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <p className={`text-xs sm:text-sm font-semibold ${colorClasses[color].text} mt-1 sm:mt-0`}>
              ₹{(item.totalAmount || item.amount - (item.totalPaidAmount || 0)).toLocaleString('en-IN', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </p>
          </motion.li>
        ))}
      </ul>
    </div>
  );
};

const ChartContainer = ({ title, chartType, setChartType, data, labels, colors, isMobile, unit = '' }) => {
  const chartData = {
    Bar: {
      labels: data.labels,
      datasets: [
        { 
          label: labels[0], 
          data: data.incomeData || data.soldData, 
          backgroundColor: colors[0].replace('0.7', '0.6'), 
          borderColor: colors[0].replace('0.7', '1'), 
          borderWidth: 1 
        },
        { 
          label: labels[1], 
          data: data.expenseData || data.boughtData, 
          backgroundColor: colors[1].replace('0.7', '0.6'), 
          borderColor: colors[1].replace('0.7', '1'), 
          borderWidth: 1 
        },
      ],
    },
    Line: {
      labels: data.labels,
      datasets: [
        { 
          label: labels[0], 
          data: data.incomeData || data.soldData, 
          borderColor: colors[0].split(', 0.7')[0] + ')', 
          backgroundColor: colors[0].replace('0.7', '0.5'), 
          fill: true, 
          tension: 0.1 
        },
        { 
          label: labels[1], 
          data: data.expenseData || data.boughtData, 
          borderColor: colors[1].split(', 0.7')[0] + ')', 
          backgroundColor: colors[1].replace('0.7', '0.5'), 
          fill: true, 
          tension: 0.1 
        },
      ],
    },
    Pie: {
      labels: [`Total ${labels[0]} (Last 12M)`, `Total ${labels[1]} (Last 12M)`],
      datasets: [{
        data: [
          (data.incomeData || data.soldData).reduce((a, b) => a + b, 0),
          (data.expenseData || data.boughtData).reduce((a, b) => a + b, 0),
        ],
        backgroundColor: colors,
        borderColor: colors.map(color => color.replace('0.7', '1')),
        borderWidth: 1,
      }],
    }
  };

  const chartOptions = {
    Bar: { 
      responsive: true, 
      maintainAspectRatio: false, 
      scales: { 
        y: { 
          beginAtZero: true, 
          ticks: { 
            callback: value => unit ? `${value.toLocaleString('en-IN')} ${unit}` : `₹${value.toLocaleString('en-IN')}` 
          } 
        }, 
        x: { grid: { display: false } } 
      }, 
      plugins: { 
        legend: { position: 'top' }, 
        title: { 
          display: true, 
          text: 'Last 12 Months', 
          align: 'center', 
          font: { size: 12 } 
        } 
      }, 
      barThickness: isMobile ? 10 : 20 
    },
    Line: { 
      responsive: true, 
      maintainAspectRatio: false, 
      scales: { 
        y: { 
          beginAtZero: true, 
          ticks: { 
            callback: value => unit ? `${value.toLocaleString('en-IN')} ${unit}` : `₹${value.toLocaleString('en-IN')}` 
          } 
        }, 
        x: { grid: { display: false } } 
      }, 
      plugins: { 
        legend: { position: 'top' }, 
        title: { 
          display: true, 
          text: 'Last 12 Months', 
          align: 'center', 
          font: { size: 12 } 
        } 
      } 
    },
    Pie: { 
      responsive: true, 
      maintainAspectRatio: false, 
      plugins: { 
        legend: { position: 'top' }, 
        title: { 
          display: true, 
          text: 'Last 12 Months Total', 
          align: 'center', 
          font: { size: 12 } 
        } 
      } 
    }
  };

  return (
    <motion.div
      className="p-4 sm:p-6 bg-white rounded-xl shadow-md"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
        <h3 className="text-base sm:text-lg font-medium text-gray-700 mb-2 sm:mb-0">
          {title}
        </h3>
        <select
          value={chartType}
          onChange={(e) => setChartType(e.target.value)}
          className="text-xs sm:text-sm border-gray-200 rounded-lg shadow-sm py-2 px-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all w-full sm:w-auto"
        >
          <option value="Bar">Bar Chart</option>
          <option value="Line">Line Chart</option>
          <option value="Pie">Pie Chart</option>
        </select>
      </div>
      
      <div style={{ height: isMobile ? '250px' : '300px', maxWidth: '100%' }}>
        {chartType === 'Bar' && <Bar data={chartData.Bar} options={chartOptions.Bar} />}
        {chartType === 'Line' && <Line data={chartData.Line} options={chartOptions.Line} />}
        {chartType === 'Pie' && <Pie data={chartData.Pie} options={chartOptions.Pie} />}
      </div>
    </motion.div>
  );
};

export default DashboardPage;