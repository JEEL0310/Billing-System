import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Bar, Line, Doughnut } from "react-chartjs-2";
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
} from "chart.js";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  AlertTriangle,
  Clock,
  BarChart3,
  PieChart,
  Activity,
  Users,
  Building2,
  Package,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Eye,
  ChevronRight,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import AuthService from "../services/AuthService";
import DashboardService from "../services/DashboardService";

// ✅ Move helper function above the component
function getActivityCount(data) {
  if (!data) return 0;

  return (
    (Array.isArray(data.overdueBills) ? data.overdueBills.length : 0) +
    (Array.isArray(data.overduePurchases) ? data.overduePurchases.length : 0) +
    (Array.isArray(data.upcomingBillDues) ? data.upcomingBillDues.length : 0) +
    (Array.isArray(data.upcomingPurchaseDues) ? data.upcomingPurchaseDues.length : 0)
  );
}

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

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 10,
    },
  },
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const currentUser = AuthService.getCurrentUser();

  // State management
  const [transactionChartType, setTransactionChartType] = useState("Bar");
  const [materialFlowChartType, setMaterialFlowChartType] = useState("Bar");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [dashboardData, setDashboardData] = useState({
    accountSummary: null,
    overdueBills: [],
    overduePurchases: [],
    upcomingBillDues: [],
    upcomingPurchaseDues: [],
    monthlyTransactionData: null,
    monthlyMaterialFlowData: null,
  });

  const [loading, setLoading] = useState({
    summary: true,
    overdue: true,
    upcoming: true,
    charts: true,
  });

  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState('quick');
  const [activitySeen, setActivitySeen] = useState(true); // Assume seen until we check

  const currentCount = getActivityCount(dashboardData);

  // ✅ Check when dashboard data changes
  useEffect(() => {
    const storedCount = parseInt(localStorage.getItem('lastSeenActivityCount') || '0');

    if (currentCount > storedCount) {
      setActivitySeen(false); // New data → show dot
    } else {
      setActivitySeen(true); // Same or less data → no dot
    }
  }, [currentCount]);

  const handleTabClick = (tab) => {
    setActiveTab(tab);

    if (tab === 'activity') {
      const storedCount = parseInt(localStorage.getItem('lastSeenActivityCount') || '0');

      if (currentCount !== storedCount) {
        // Update local storage to new count whether increased or decreased
        localStorage.setItem('lastSeenActivityCount', currentCount.toString());
      }

      setActivitySeen(true); // Mark as seen no matter what
    }
  };

  const hasRecentActivity = currentCount > 0;


  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading({
        summary: true,
        overdue: true,
        upcoming: true,
        charts: true,
      });
      setError("");

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
            labels: monthlyTransactionRes.data.labels.map(
              (label) => label.split(" ")[0]
            ),
          },
          monthlyMaterialFlowData: {
            ...monthlyMaterialFlowRes.data,
            labels: monthlyMaterialFlowRes.data.labels.map(
              (label) => label.split(" ")[0]
            ),
          },
        });
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError(
          err.response?.data?.message ||
            err.message ||
            "Could not load dashboard data."
        );
      } finally {
        setLoading({
          summary: false,
          overdue: false,
          upcoming: false,
          charts: false,
        });
      }
    };

    fetchDashboardData();
  }, []);

  // Redirect if not admin
  if (!currentUser || currentUser.role !== "admin") {
    navigate("/login");
    return null;
  }

  // Helper functions
  const formatCurrency = (amount) => {
    return (
      amount?.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) || "0.00"
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        when: "beforeChildren",
      },
    },
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-4 xl:px-8 py-4">
        {/* Header Section */}
        <motion.div
          className="mb-4"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg xl:text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                    Dashboard
                  </h1>
                  <p className="text-slate-500 text-xs xl:text-sm font-medium">
                    Welcome back,{" "}
                    <span className="font-semibold text-slate-700">
                      {currentUser.username}
                    </span>
                  </p>
                </div>
              </div>
            </div>

          </div>
          
            {/* Sidebar Content for Mobile */}
            <div className="block xl:hidden space-y-6 mt-5">
              {/* Toggle Buttons */}
              <div className="flex justify-around mb-2">
                <button
                  onClick={() => handleTabClick("quick")}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200 ${
                    activeTab === "quick"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Quick Actions
                </button>

                <div>
                  <button
                    onClick={() => handleTabClick("activity")}
                    className={`px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200 ${
                      activeTab === "activity"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Recent Activity
                  {/* Notification Badge (Dot) */}
                  {!activitySeen && hasRecentActivity && (
                    <span className="absolute -mt-1 -mr-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                  )}
                  {!activitySeen && hasRecentActivity && (
                    <span className="absolute -mt-1 -mr-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
                  )}
                  </button>
                </div>
              </div>

              {/* Content */}
              {activeTab === "quick" && <QuickActionsCard />}
              {activeTab === "activity" && (
                <ActivityCard
                  title="Recent Activity"
                  overdueBills={dashboardData.overdueBills}
                  overduePurchases={dashboardData.overduePurchases}
                  upcomingBills={dashboardData.upcomingBillDues}
                  upcomingPurchases={dashboardData.upcomingPurchaseDues}
                  loading={loading.overdue || loading.upcoming}
                />
              )}

            </div>

          <AnimatePresence>
            {error && (
              <motion.div
                className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Account Summary Cards */}
        {loading.summary ? (
          <LoadingSection title="Loading Account Summary..." />
        ) : (
          <motion.div
            className="grid grid-cols-2 xl:grid-cols-4 gap-6 mb-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <SummaryCard
              title="Total Income"
              value={`₹${formatCurrency(
                dashboardData.accountSummary?.overall?.totalIn
              )}`}
              icon={<TrendingUp className="w-5 h-5 xl:h-6 xl:w-6" />}
              gradient="from-emerald-500 to-green-600"
              bgGradient="from-emerald-50 to-green-50"
              // change="+12.5%"
              changeType="positive"
            />

            <SummaryCard
              title="Total Expenses"
              value={`₹${formatCurrency(
                dashboardData.accountSummary?.overall?.totalOut
              )}`}
              icon={<TrendingDown className="w-5 h-5 xl:h-6 xl:w-6" />}
              gradient="from-red-500 to-rose-600"
              bgGradient="from-red-50 to-rose-50"
              // change="-8.2%"
              changeType="negative"
            />

            <SummaryCard
              title="Current Balance"
              value={`₹${formatCurrency(
                dashboardData.accountSummary?.overall?.currentBalance
              )}`}
              icon={<DollarSign className="w-5 h-5 xl:h-6 xl:w-6" />}
              gradient="from-blue-500 to-indigo-600"
              bgGradient="from-blue-50 to-indigo-50"
              // change="+5.7%"
              changeType="positive"
            />

            <SummaryCard
              title={`${dashboardData.accountSummary?.currentMonth?.month} ${dashboardData.accountSummary?.currentMonth?.year}`}
              value={`₹${formatCurrency(
                dashboardData.accountSummary?.currentMonth?.totalIn -
                  dashboardData.accountSummary?.currentMonth?.totalOut
              )}`}
              icon={<Calendar className="w-5 h-5 xl:h-6 xl:w-6" />}
              gradient="from-violet-500 to-purple-600"
              bgGradient="from-violet-50 to-purple-50"
              subtitle={`In: ₹${formatCurrency(
                dashboardData.accountSummary?.currentMonth?.totalIn
              )} | Out: ₹${formatCurrency(
                dashboardData.accountSummary?.currentMonth?.totalOut
              )}`}
            />
          </motion.div>
        )}

        {/* Quick Stats Grid */}
        <motion.div
          className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <QuickStatCard
            title="Overdue Bills"
            value={dashboardData.overdueBills?.length || 0}
            icon={<AlertTriangle className="h-5 w-5" />}
            color="red"
            link="/bills"
          />
          <QuickStatCard
            title="Overdue Purchases"
            value={dashboardData.overduePurchases?.length || 0}
            icon={<Clock className="h-5 w-5" />}
            color="orange"
            link="/purchases"
          />
          <QuickStatCard
            title="Upcoming Bills"
            value={dashboardData.upcomingBillDues?.length || 0}
            icon={<FileText className="h-5 w-5" />}
            color="yellow"
            link="/bills"
          />
          <QuickStatCard
            title="Upcoming Purchases"
            value={dashboardData.upcomingPurchaseDues?.length || 0}
            icon={<Package className="h-5 w-5" />}
            color="blue"
            link="/purchases"
          />
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
          {/* Charts Section */}
          <div className="xl:col-span-2 space-y-8">
            {/* Transaction Chart */}
            {loading.charts ? (
              <LoadingSection title="Loading Transaction Chart..." />
            ) : (
              <ChartCard
                title="Financial Overview"
                subtitle="Income vs Expense (Last 12 Months)"
                chartType={transactionChartType}
                setChartType={setTransactionChartType}
                data={dashboardData.monthlyTransactionData}
                dataKeys={["incomeData", "expenseData"]}
                labels={["Income", "Expense"]}
                colors={["rgba(34, 197, 94, 0.8)", "rgba(239, 68, 68, 0.8)"]}
                isMobile={isMobile}
                icon={<BarChart3 className="h-5 w-5" />}
              />
            )}

            {/* Material Flow Chart */}
            {loading.charts ? (
              <LoadingSection title="Loading Material Flow Chart..." />
            ) : (
              <ChartCard
                title="Material Flow"
                subtitle="Quantity Sold vs Purchased (Last 12 Months)"
                chartType={materialFlowChartType}
                setChartType={setMaterialFlowChartType}
                data={dashboardData.monthlyMaterialFlowData}
                dataKeys={["soldData", "boughtData"]}
                labels={["Sold (Kg)", "Purchased (Kg)"]}
                colors={["rgba(59, 130, 246, 0.8)", "rgba(245, 158, 11, 0.8)"]}
                isMobile={isMobile}
                unit="Kg"
                icon={<Activity className="h-5 w-5" />}
              />
            )}
          </div>

          {/* Sidebar Content for Desktop */}
          <div className="hidden xl:block space-y-6">
            {/* Recent Activity */}
            <ActivityCard
              title="Recent Activity"
              overdueBills={dashboardData.overdueBills}
              overduePurchases={dashboardData.overduePurchases}
              upcomingBills={dashboardData.upcomingBillDues}
              upcomingPurchases={dashboardData.upcomingPurchaseDues}
              loading={loading.overdue || loading.upcoming}
            />

            {/* Quick Actions */}
            <QuickActionsCard />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Reusable Components

const LoadingSection = ({ title }) => (
  <motion.div
    className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 p-8 text-center"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3 }}
  >
    <div className="flex items-center justify-center gap-3 text-slate-500">
      <RefreshCw className="h-5 w-5 animate-spin" />
      <span className="text-sm font-medium">{title}</span>
    </div>
  </motion.div>
);

const SummaryCard = ({
  title,
  value,
  icon,
  gradient,
  bgGradient,
  change,
  changeType,
  subtitle,
}) => (
  <motion.div
    className={`relative p-3 md:p-6 bg-gradient-to-br ${bgGradient} rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden group hover:shadow-xl transition-all duration-300`}
    variants={itemVariants}
    whileHover={{ y: -2 }}
  >
    <div
      className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}
    />

    <div className="relative z-10">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div
            className={`p-2 md:p-3 rounded-lg xl:rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg`}
          >
            {icon}
          </div>
          {change && (
            <div
              className={`flex items-center gap-1 text-xs font-medium ${
                changeType === "positive" ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {changeType === "positive" ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {change}
            </div>
          )}
          <p className="text-sm xl:text-base font-medium text-slate-600 mb-1">
            {title}
          </p>
        </div>
        <div className="block lg:items-center lg:justify-between">
          <p className="text-lg lg:text-2xl font-bold text-slate-800">{value}</p>
          {subtitle && (
            <p className="text-xs xl:text-sm text-slate-500">{subtitle}</p>
          )}
        </div>
        {/* <div className="block xl:hidden">
          <p className="text-lg font-bold text-slate-800">{value}</p>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div> */}
      </div>
    </div>
  </motion.div>
);

const QuickStatCard = ({ title, value, icon, color, link }) => {
  const colorClasses = {
    red: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-600",
      icon: "bg-red-100",
    },
    orange: {
      bg: "bg-orange-50",
      border: "border-orange-200",
      text: "text-orange-600",
      icon: "bg-orange-100",
    },
    yellow: {
      bg: "bg-yellow-50",
      border: "border-yellow-300",
      text: "text-yellow-600",
      icon: "bg-yellow-200/50",
    },
    blue: {
      bg: "bg-blue-100",
      border: "border-blue-300",
      text: "text-blue-600",
      icon: "bg-blue-200",
    },
  };

  return (
    <motion.div variants={itemVariants}>
      <Link to={link}>
        <motion.div
          className={`p-4 ${colorClasses[color].bg} border ${colorClasses[color].border} rounded-xl hover:shadow-md transition-all duration-200 group`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600 mb-1">{title}</p>
              <p className={`text-2xl font-bold ${colorClasses[color].text}`}>
                {value}
              </p>
            </div>
            <div
              className={`p-2 ${colorClasses[color].icon} rounded-lg ${colorClasses[color].text} group-hover:scale-110 transition-transform duration-200`}
            >
              {icon}
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
};

const ChartCard = ({
  title,
  subtitle,
  chartType,
  setChartType,
  data,
  dataKeys,
  labels,
  colors,
  isMobile,
  unit = "",
  icon,
}) => {
  if (!data) return null;

  const chartData = {
    Bar: {
      labels: data.labels,
      datasets: [
        {
          label: labels[0],
          data: data[dataKeys[0]],
          backgroundColor: colors[0].replace("0.8", "0.6"),
          borderColor: colors[0],
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        },
        {
          label: labels[1],
          data: data[dataKeys[1]],
          backgroundColor: colors[1].replace("0.8", "0.6"),
          borderColor: colors[1],
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    },
    Line: {
      labels: data.labels,
      datasets: [
        {
          label: labels[0],
          data: data[dataKeys[0]],
          borderColor: colors[0],
          backgroundColor: colors[0].replace("0.8", "0.1"),
          fill: true,
          tension: 0.4,
          pointBackgroundColor: colors[0],
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointRadius: 4,
        },
        {
          label: labels[1],
          data: data[dataKeys[1]],
          borderColor: colors[1],
          backgroundColor: colors[1].replace("0.8", "0.1"),
          fill: true,
          tension: 0.4,
          pointBackgroundColor: colors[1],
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointRadius: 4,
        },
      ],
    },
    Doughnut: {
      labels: [`Total ${labels[0]}`, `Total ${labels[1]}`],
      datasets: [
        {
          data: [
            data[dataKeys[0]].reduce((a, b) => a + b, 0),
            data[dataKeys[1]].reduce((a, b) => a + b, 0),
          ],
          backgroundColor: colors,
          borderColor: colors.map((color) => color.replace("0.8", "1")),
          borderWidth: 2,
          hoverOffset: 4,
        },
      ],
    },
  };

  const chartOptions = {
    Bar: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          labels: {
            usePointStyle: true,
            padding: 20,
            font: { size: 12, weight: "500" },
          },
        },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          titleColor: "#fff",
          bodyColor: "#fff",
          borderColor: "rgba(255, 255, 255, 0.1)",
          borderWidth: 1,
          cornerRadius: 8,
          callbacks: {
            label: (context) => {
              const value = context.parsed.y;
              return `${context.dataset.label}: ${
                unit
                  ? `${value.toLocaleString("en-IN")} ${unit}`
                  : `₹${value.toLocaleString("en-IN")}`
              }`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: "rgba(0, 0, 0, 0.05)" },
          ticks: {
            font: { size: 11 },
            callback: (value) =>
              unit
                ? `${value.toLocaleString("en-IN")} ${unit}`
                : `₹${value.toLocaleString("en-IN")}`,
          },
        },
        x: {
          grid: { display: false },
          ticks: { font: { size: 11 } },
        },
      },
    },
    Line: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          labels: {
            usePointStyle: true,
            padding: 20,
            font: { size: 12, weight: "500" },
          },
        },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          titleColor: "#fff",
          bodyColor: "#fff",
          borderColor: "rgba(255, 255, 255, 0.1)",
          borderWidth: 1,
          cornerRadius: 8,
          callbacks: {
            label: (context) => {
              const value = context.parsed.y;
              return `${context.dataset.label}: ${
                unit
                  ? `${value.toLocaleString("en-IN")} ${unit}`
                  : `₹${value.toLocaleString("en-IN")}`
              }`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: "rgba(0, 0, 0, 0.05)" },
          ticks: {
            font: { size: 11 },
            callback: (value) =>
              unit
                ? `${value.toLocaleString("en-IN")} ${unit}`
                : `₹${value.toLocaleString("en-IN")}`,
          },
        },
        x: {
          grid: { display: false },
          ticks: { font: { size: 11 } },
        },
      },
    },
    Doughnut: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            usePointStyle: true,
            padding: 20,
            font: { size: 12, weight: "500" },
          },
        },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          titleColor: "#fff",
          bodyColor: "#fff",
          borderColor: "rgba(255, 255, 255, 0.1)",
          borderWidth: 1,
          cornerRadius: 8,
          callbacks: {
            label: (context) => {
              const value = context.parsed;
              return `${context.label}: ${
                unit
                  ? `${value.toLocaleString("en-IN")} ${unit}`
                  : `₹${value.toLocaleString("en-IN")}`
              }`;
            },
          },
        },
      },
    },
  };

  return (
    <motion.div
      className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 p-6 hover:shadow-xl transition-all duration-300"
      variants={itemVariants}
    >
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
            <p className="text-sm text-slate-500">{subtitle}</p>
          </div>
        </div>
        <select
          value={chartType}
          onChange={(e) => setChartType(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-lg shadow-sm text-sm font-medium text-slate-700 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
        >
          <option value="Bar">Bar Chart</option>
          <option value="Line">Line Chart</option>
          <option value="Doughnut">Doughnut Chart</option>
        </select>
      </div>

      <div style={{ height: isMobile ? "250px" : "300px" }}>
        {chartType === "Bar" && (
          <Bar data={chartData.Bar} options={chartOptions.Bar} />
        )}
        {chartType === "Line" && (
          <Line data={chartData.Line} options={chartOptions.Line} />
        )}
        {chartType === "Doughnut" && (
          <Doughnut data={chartData.Doughnut} options={chartOptions.Doughnut} />
        )}
      </div>
    </motion.div>
  );
};

const ActivityCard = ({
  title,
  overdueBills,
  overduePurchases,
  upcomingBills,
  upcomingPurchases,
  loading,
}) => {
  const allItems = [
    ...overdueBills.map((item) => ({
      ...item,
      type: "overdue-bill",
      priority: "high",
    })),
    ...overduePurchases.map((item) => ({
      ...item,
      type: "overdue-purchase",
      priority: "high",
    })),
    ...upcomingBills
      .slice(0, 3)
      .map((item) => ({ ...item, type: "upcoming-bill", priority: "medium" })),
    ...upcomingPurchases.slice(0, 3).map((item) => ({
      ...item,
      type: "upcoming-purchase",
      priority: "medium",
    })),
  ].slice(0, 6);

  const getItemIcon = (type) => {
    switch (type) {
      case "overdue-bill":
        return <AlertTriangle className="h-4 w-4" />;
      case "overdue-purchase":
        return <Clock className="h-4 w-4" />;
      case "upcoming-bill":
        return <FileText className="h-4 w-4" />;
      case "upcoming-purchase":
        return <Package className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getItemColor = (type) => {
    switch (type) {
      case "overdue-bill":
        return "text-red-600 bg-red-50";
      case "overdue-purchase":
        return "text-orange-600 bg-orange-50";
      case "upcoming-bill":
        return "text-blue-600 bg-blue-50";
      case "upcoming-purchase":
        return "text-violet-600 bg-violet-50";
      default:
        return "text-slate-600 bg-slate-50";
    }
  };

  return (
    <motion.div
      className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 p-6 "
      variants={itemVariants}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
        <Target className="h-5 w-5 text-slate-400" />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-12 bg-slate-100 rounded-lg"></div>
            </div>
          ))}
        </div>
      ) : allItems.length === 0 ? (
        <div className="text-center py-5.5 text-slate-500">
          <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">All caught up! No pending items.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {allItems.map((item, index) => (
            <motion.div
              key={`${item._id}-${item.type}`}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className={`p-2 rounded-lg ${getItemColor(item.type)}`}>
                {getItemIcon(item.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">
                  {item.type.includes("bill")
                    ? `Bill #${item.billNumber}`
                    : `Purchase #${item.purchaseBillNumber}`}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {item.company?.name || item.supplierCompany?.name || "N/A"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-800">
                  ₹
                  {(item.totalAmount || item.amount)?.toLocaleString("en-IN") ||
                    "0"}
                </p>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {allItems.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <Link
            to="/dashboard"
            className="text-sm text-violet-600 hover:text-violet-800 font-medium flex items-center gap-1 group"
          >
            View all activity
            <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      )}
    </motion.div>
  );
};

const QuickActionsCard = () => {
  const actions = [
    {
      title: "Create Bill",
      icon: <FileText className="h-4 w-4" />,
      link: "/bills/create",
      color: "from-emerald-500 to-green-600",
    },
    {
      title: "Add Purchase",
      icon: <Package className="h-4 w-4" />,
      link: "/purchases/create",
      color: "from-violet-500 to-purple-600",
    },
    {
      title: "Manage Companies",
      icon: <Building2 className="h-4 w-4" />,
      link: "/companies",
      color: "from-blue-500 to-indigo-600",
    },
    {
      title: "View Reports",
      icon: <BarChart3 className="h-4 w-4" />,
      link: "/reports",
      color: "from-orange-500 to-red-600",
    },
  ];

  return (
    <motion.div
      className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 p-6"
      variants={itemVariants}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800">Quick Actions</h3>
        <Zap className="h-5 w-5 text-slate-400" />
      </div>

      <div className="grid grid-cols-4 xl:grid-cols-2 gap-2">
        {actions.map((action, index) => (
          <motion.div key={action.title} variants={itemVariants}>
            <Link to={action.link}>
              <motion.div
                className={`p-4 bg-gradient-to-br ${action.color} rounded-xl text-white hover:shadow-lg transition-all duration-200 group`}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
                    {action.icon}
                  </div>
                  <span className="text-xs font-medium">{action.title}</span>
                </div>
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default DashboardPage;
