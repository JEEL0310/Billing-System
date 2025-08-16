import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FaTachometerAlt, FaFileInvoiceDollar, FaShoppingCart, FaExchangeAlt, 
  FaBuilding, FaUsers, FaUserClock, FaCog, FaChartBar, FaDownload, 
  FaUserShield, FaBookOpen, FaSignOutAlt, FaTimes, FaBars, FaBox
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import AuthService from '../services/AuthService';

const navLinks = [
  { to: "/dashboard", text: "Dashboard", icon: <FaTachometerAlt className="flex-shrink-0 h-5 w-5" /> },
  { to: "/bills", text: "Billing", icon: <FaFileInvoiceDollar className="flex-shrink-0 h-5 w-5" /> },
  { to: "/purchases", text: "Purchases", icon: <FaShoppingCart className="flex-shrink-0 h-5 w-5" /> },
  { to: "/transactions", text: "Transactions", icon: <FaExchangeAlt className="flex-shrink-0 h-5 w-5" /> },
  { to: "/companies", text: "Companies", icon: <FaBuilding className="flex-shrink-0 h-5 w-5" /> },
  { to: "/company-ledger", text: "Company Ledger", icon: <FaBookOpen className="flex-shrink-0 h-5 w-5" /> },
  { to: "/workers", text: "Workers", icon: <FaUsers className="flex-shrink-0 h-5 w-5" /> },
  { to: "/attendance", text: "Attendance", icon: <FaUserClock className="flex-shrink-0 h-5 w-5" /> },
  // { to: "/reports/transactions", text: "Reports", icon: <FaChartBar className="flex-shrink-0 h-5 w-5" /> },
  // { to: "/bill-downloads", text: "Downloads", icon: <FaDownload className="flex-shrink-0 h-5 w-5" /> },
  { to: "/admin-panel", text: "Admin Panel", icon: <FaUserShield className="flex-shrink-0 h-5 w-5" /> },
  { to: "/settings", text: "Settings", icon: <FaCog className="flex-shrink-0 h-5 w-5" /> },
  { to: "/challans", text: "Challans", icon: <FaFileInvoiceDollar className="flex-shrink-0 h-5 w-5" /> },
  { to: "/boxes", text: "Boxes", icon: <FaBox className="flex-shrink-0 h-5 w-5" /> },
];

const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768);

  const handleLogout = () => {
    AuthService.logout();
    navigate('/login');
  };

  const handleLinkClick = () => {
    if (mobileOpen) {
      setMobileOpen(false);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth > 768);
      if (window.innerWidth > 768) {
        setMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setMobileOpen]);

  return (
    <>
      {/* Mobile menu button - shows only on mobile */}
      {!isDesktop && (
        <button
          className="md:hidden fixed top-4 left-4 z-30 p-2 rounded-md text-white bg-gray-800 shadow-lg"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <FaBars className="h-6 w-6" />
        </button>
      )}

      {/* Overlay for mobile */}
      <AnimatePresence>
        {mobileOpen && !isDesktop && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar container */}
      <motion.div
        className={`fixed top-0 left-0 z-50 h-screen bg-gray-800 text-white shadow-xl overflow-hidden
          ${isDesktop ? 'w-64' : 'w-64'}`}
        initial={isDesktop ? { x: 0 } : { x: -320 }}
        animate={isDesktop ? { x: 0 } : { x: mobileOpen ? 0 : -320 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold whitespace-nowrap">Billing Software</h1>
            {!isDesktop && (
              <button
                onClick={() => setMobileOpen(false)}
                className="text-gray-300 hover:text-white p-1"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="h-[calc(100%-8rem)] overflow-y-auto py-2">
          {navLinks.map((link) => (
            <motion.div
              key={link.to}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                to={link.to}
                onClick={handleLinkClick}
                className={`
                  flex items-center py-3 px-4 mx-2 my-1 rounded-lg
                  text-sm font-medium transition-all duration-200
                  ${location.pathname.startsWith(link.to)
                    ? 'bg-indigo-600 shadow-md'
                    : 'hover:bg-gray-700 hover:shadow-md'
                  }
                `}
              >
                <span className="flex-shrink-0">
                  {link.icon}
                </span>
                <span className="ml-3 whitespace-nowrap">
                  {link.text}
                </span>
              </Link>
            </motion.div>
          ))}
        </nav>

        {/* Logout Section */}
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-700 bg-gray-800">
          <motion.button
            onClick={handleLogout}
            className="flex items-center justify-center w-full py-2 px-4 rounded-lg
                      bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800
                      text-sm font-medium shadow-md transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FaSignOutAlt className="flex-shrink-0 h-5 w-5" />
            <span className="ml-2 whitespace-nowrap">
              Logout
            </span>
          </motion.button>
          
          <p className="text-xs text-center text-gray-400 mt-2">
            © {new Date().getFullYear()} Mahadev Filaments
          </p>
        </div>
      </motion.div>
    </>
  );
};

export default Sidebar;