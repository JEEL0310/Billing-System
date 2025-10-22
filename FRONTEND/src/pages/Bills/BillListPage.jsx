import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  Edit3,
  Trash2,
  Plus,
  RefreshCw,
  Download,
  FileText,
  ChevronLeft,
  ChevronRight,
  X,
  Filter,
  Building2,
  DollarSign,
  TrendingUp,
  BarChart3,
  ArrowLeft,
  SlidersHorizontal,
} from "lucide-react";
import BillService from "../../services/BillService";
import DebitService from "../../services/DebitService";
import CompanyService from "../../services/CompanyService";
import SettingsService from "../../services/SettingsService";
import DebitNoteListPage from "../Debits/DebitNoteListPage";

const BillListPage = () => {
  const [bills, setBills] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showFilters, setShowFilters] = useState(false);
  const [showDebitNotes, setShowDebitNotes] = useState(false);
  const [openDebitCreateForBillId, setOpenDebitCreateForBillId] = useState('');

  // Fetch companies for dropdown
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await CompanyService.getAllCompanies();
        setCompanies(response.data);
      } catch (err) {
        console.error("Failed to fetch companies:", err);
      }
    };
    fetchCompanies();
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setShowFilters(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Helper function to format dates for input fields (YYYY-MM-DD)
  const formatDateForInput = (date) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Set initial date filters to current month
  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    setFilterStartDate(formatDateForInput(firstDay));
    setFilterEndDate(formatDateForInput(lastDay));
  }, []);

  const fetchBills = useCallback(async () => {
    setIsLoading(true);
    setError("");
    const params = {};
    if (filterStartDate) params.startDate = filterStartDate;
    if (filterEndDate) params.endDate = filterEndDate;
    if (filterCompany) params.companyId = filterCompany;
    if (filterStatus) params.status = filterStatus;

    try {
      const response = await BillService.getAllBills(params);
      console.log("Fetched bills:", response.data);
      setBills(response.data);
    } catch (err) {
      const errMsg =
        err.response?.data?.message || err.message || "Failed to fetch bills.";
      setError(errMsg);
      console.error("Fetch bills error:", errMsg);
    } finally {
      setIsLoading(false);
    }
  }, [filterStartDate, filterEndDate, filterCompany, filterStatus]);

  useEffect(() => {
    if (filterStartDate && filterEndDate) {
      fetchBills();
    }
  }, [fetchBills, filterStartDate, filterEndDate]);

  const handleDownloadExcel = async () => {
    try {
      setIsLoading(true);
      const filters = {
        startDate: filterStartDate,
        endDate: filterEndDate,
        companyId: filterCompany,
        status: filterStatus,
      };
      const response = await BillService.downloadBulkExcel(filters);

      // Generate filename
      let fileName = "Bills";
      if (filterStartDate && filterEndDate) {
        fileName += `_${filterStartDate}_to_${filterEndDate}`;
      }
      if (filterCompany) {
        const company = companies.find((c) => c._id === filterCompany);
        fileName += `_${company?.name || filterCompany}`;
      }
      fileName += ".xlsx";

      BillService.triggerDownload(response.data, fileName);
    } catch (err) {
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to download Excel.";
      setError(errMsg);
      console.error("Excel download error:", errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setIsLoading(true);
      const filters = {
        startDate: filterStartDate,
        endDate: filterEndDate,
        companyId: filterCompany,
        status: filterStatus,
      };
      const response = await BillService.downloadBulkPdf(filters);

      // Generate filename
      let fileName = "Bills";
      if (filterStartDate && filterEndDate) {
        fileName += `_${filterStartDate}_to_${filterEndDate}`;
      }
      if (filterCompany) {
        const company = companies.find((c) => c._id === filterCompany);
        fileName += `_${company?.name || filterCompany}`;
      }
      fileName += ".pdf";

      BillService.triggerDownload(response.data, fileName);
    } catch (err) {
      const errMsg =
        err.response?.data?.message || err.message || "Failed to download PDF.";
      setError(errMsg);
      console.error("PDF download error:", errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBill = async (billId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this bill? This action cannot be undone."
      )
    ) {
      setIsLoading(true);
      try {
        await BillService.deleteBill(billId);
        setBills((prevBills) => prevBills.filter((b) => b._id !== billId));
      } catch (err) {
        const errMsg =
          err.response?.data?.message ||
          err.message ||
          "Failed to delete bill.";
        setError(errMsg);
        console.error("Delete bill error:", errMsg);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // View modal state and handlers (combined ViewBillPage into a popup)
  const [selectedBill, setSelectedBill] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isViewLoading, setIsViewLoading] = useState(false);
  const [viewError, setViewError] = useState("");

  // Edit modal state and handlers (combined EditBillPage into a popup)
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editBillId, setEditBillId] = useState(null);
  const [isFetchingEditBill, setIsFetchingEditBill] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // Edit form fields (prefixed with edit_)
  const [edit_billNumber, setEditBillNumber] = useState("");
  const [edit_challanMode, setEditChallanMode] = useState("manual");
  const [edit_challanId, setEditChallanId] = useState("");
  const [edit_challanNumber, setEditChallanNumber] = useState("");
  const [edit_billDate, setEditBillDate] = useState("");
  const [edit_companyId, setEditCompanyId] = useState("");
  const [edit_items, setEditItems] = useState([{ description: '', hsnSacCode: '', quantity: 1, rate: 0, amount: 0 }]);
  const [edit_rate, setEditRate] = useState('');
  const [edit_discountPercentage, setEditDiscountPercentage] = useState(0);
  const [edit_taxType, setEditTaxType] = useState('CGST_SGST');
  const [edit_overrideCgstPercentage, setEditOverrideCgstPercentage] = useState('');
  const [edit_overrideSgstPercentage, setEditOverrideSgstPercentage] = useState('');
  const [edit_overrideIgstPercentage, setEditOverrideIgstPercentage] = useState('');
  const [edit_overrideJobCgstPercentage, setEditOverrideJobCgstPercentage] = useState('');
  const [edit_overrideJobSgstPercentage, setEditOverrideJobSgstPercentage] = useState('');
  const [edit_status, setEditStatus] = useState('Pending');
  const [edit_amountInWords, setEditAmountInWords] = useState('');
  // paymentRecords for edit modal
  const [edit_paymentRecords, setEditPaymentRecords] = useState([]);
  const [settings, setSettings] = useState(null);
  const [edit_availableItemConfigs, setEditAvailableItemConfigs] = useState([]);
  const [edit_originalBillNumber, setEditOriginalBillNumber] = useState('');
  const [editFormErrors, setEditFormErrors] = useState({});
  const [editSuccessMessage, setEditSuccessMessage] = useState("");

  // Create modal state and fields (combined CreateBillPage into popup)
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreateLoading, setIsCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccessMessage, setCreateSuccessMessage] = useState("");
  const [create_billNumber, setCreateBillNumber] = useState("");
  const [create_billDate, setCreateBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [create_companyId, setCreateCompanyId] = useState("");
  const [create_items, setCreateItems] = useState([{ description: '', hsnSacCode: '', quantity: 1, rate: 0, amount: 0 }]);
  const [create_discountPercentage, setCreateDiscountPercentage] = useState(0);
  const [create_taxType, setCreateTaxType] = useState('CGST_SGST');
  const [create_overrideCgstPercentage, setCreateOverrideCgstPercentage] = useState('');
  const [create_overrideSgstPercentage, setCreateOverrideSgstPercentage] = useState('');
  const [create_overrideIgstPercentage, setCreateOverrideIgstPercentage] = useState('');
  const [create_overrideJobCgstPercentage, setCreateOverrideJobCgstPercentage] = useState('');
  const [create_overrideJobSgstPercentage, setCreateOverrideJobSgstPercentage] = useState('');
  const [create_status, setCreateStatus] = useState('');
  const [create_amountInWords, setCreateAmountInWords] = useState('');
  const [create_paymentRecords, setCreatePaymentRecords] = useState([]);
  const [create_availableItemConfigs, setCreateAvailableItemConfigs] = useState([]);
  const [createFormErrors, setCreateFormErrors] = useState({});

  const openViewModal = async (billId) => {
    setIsViewLoading(true);
    setViewError("");
    setIsViewOpen(true);
    setSelectedBill(null);
    try {
      const res = BillService.getBillById
        ? await BillService.getBillById(billId)
        : await BillService.getBill(billId);
      setSelectedBill(res.data || res);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || "Failed to load bill.";
      setViewError(errMsg);
      console.error("View bill error:", errMsg);
    } finally {
      setIsViewLoading(false);
    }
  };

  const openCreateModal = async () => {
    setCreateError("");
    setCreateSuccessMessage("");
    setIsCreateOpen(true);
    // reset fields
  setCreateBillNumber("");
  setCreateBillDate(new Date().toISOString().split('T')[0]);
  setCreateCompanyId("");
  setCreateItems([{ description: '', hsnSacCode: '', quantity: 1, rate: 0, amount: 0 }]);
  setCreateDiscountPercentage(0);
  setCreateTaxType('CGST_SGST');
  setCreateOverrideCgstPercentage('');
  setCreateOverrideSgstPercentage('');
  setCreateOverrideIgstPercentage('');
  setCreateOverrideJobCgstPercentage('');
  setCreateOverrideJobSgstPercentage('');
  setCreateStatus('Pending');
  setCreateAmountInWords('');
  setCreatePaymentRecords([]); 
    try {
      const settingsRes = await SettingsService.getSettings();
      setSettings(settingsRes.data);
      setCreateAvailableItemConfigs(settingsRes.data.itemConfigurations || []);
    } catch (sErr) {
      console.warn('Failed to load settings for create modal', sErr);
    }
  };

  const closeCreateModal = () => {
    setIsCreateOpen(false);
    setCreateFormErrors({});
    setCreateError('');
    setCreateSuccessMessage('');
  };

  const handleCreateItemChange = (index, field, value) => {
    const newItems = [...create_items];
    newItems[index][field] = value;
    if (field === 'description') {
      const selectedConfig = create_availableItemConfigs.find(config => config.description === value);
      if (selectedConfig) {
        newItems[index].hsnSacCode = selectedConfig.hsnSacCode;
        newItems[index].rate = selectedConfig.defaultRate !== undefined ? selectedConfig.defaultRate : 0;
      }
    }
    const qty = parseFloat(newItems[index].quantity) || 0;
    const rate = parseFloat(newItems[index].rate) || 0;
    newItems[index].amount = parseFloat((qty * rate).toFixed(2));
    setCreateItems(newItems);
  };

  const addCreateItem = () => setCreateItems([...create_items, { description: '', hsnSacCode: '', quantity: 1, rate: 0, amount: 0 }]);
  const removeCreateItem = (index) => setCreateItems(create_items.filter((_, i) => i !== index));

  const validateCreateForm = () => {
    const errors = {};
    if (!create_billNumber.trim()) errors.billNumber = 'Bill number is required.';
    if (!create_billDate) errors.billDate = 'Bill date is required.';
    if (!create_companyId) errors.companyId = 'Company is required.';
    if (create_items.length === 0) errors.items = 'Add at least one item.';
    create_items.forEach((item, idx) => {
      if (!item.description.trim()) errors[`item_description_${idx}`] = 'Description required.';
      if (isNaN(parseFloat(item.quantity)) || parseFloat(item.quantity) <= 0) errors[`item_qty_${idx}`] = 'Valid qty required.';
      if (isNaN(parseFloat(item.rate)) || parseFloat(item.rate) < 0) errors[`item_rate_${idx}`] = 'Valid rate required.';
    });
    setCreateFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const calculateCreatePreviewTotals = useCallback(() => {
    let subTotal = 0;
    create_items.forEach(item => {
      subTotal += (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0);
    });
    subTotal = parseFloat(subTotal.toFixed(2));
    const discount = parseFloat((subTotal * (parseFloat(create_discountPercentage) / 100)).toFixed(2)) || 0;
    const amountAfterDiscount = parseFloat((subTotal - discount).toFixed(2));
    let totalTax = 0;
    let cgst = 0, sgst = 0, igst = 0, jobCgst = 0, jobSgst = 0;
    if (settings) {
      if (create_taxType === 'CGST_SGST') {
        const cgstRate = parseFloat(create_overrideCgstPercentage) || settings.cgstPercentage;
        const sgstRate = parseFloat(create_overrideSgstPercentage) || settings.sgstPercentage;
        cgst = parseFloat((amountAfterDiscount * (cgstRate / 100)).toFixed(2));
        sgst = parseFloat((amountAfterDiscount * (sgstRate / 100)).toFixed(2));
        totalTax = cgst + sgst;
      } else if (create_taxType === 'IGST') {
        const igstRate = parseFloat(create_overrideIgstPercentage) || settings.igstPercentage;
        igst = parseFloat((amountAfterDiscount * (igstRate / 100)).toFixed(2));
        totalTax = igst;
      } else if (create_taxType === 'JOBCGST_JOBSGST') {
        const jobCgstRate = parseFloat(create_overrideJobCgstPercentage) || settings.jobCgstPercentage;
        const jobSgstRate = parseFloat(create_overrideJobSgstPercentage) || settings.jobSgstPercentage;
        jobCgst = parseFloat((amountAfterDiscount * (jobCgstRate / 100)).toFixed(2));
        jobSgst = parseFloat((amountAfterDiscount * (jobSgstRate / 100)).toFixed(2));
        totalTax = jobCgst + jobSgst;
      }
    }
    totalTax = parseFloat(totalTax.toFixed(2));
    const grandTotal = parseFloat((amountAfterDiscount + totalTax).toFixed(2));
    return { subTotal, discount, amountAfterDiscount, cgst, sgst, igst, jobCgst, jobSgst, totalTax, grandTotal };
  }, [create_items, create_discountPercentage, create_taxType, settings, create_overrideCgstPercentage, create_overrideSgstPercentage, create_overrideIgstPercentage, create_overrideJobCgstPercentage, create_overrideJobSgstPercentage]);

  const createPreview = calculateCreatePreviewTotals();

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!validateCreateForm()) {
      setCreateError('Please fix the errors');
      return;
    }
    setCreateError('');
    setIsCreateLoading(true);
    const billData = {
      billNumber: create_billNumber,
      billDate: create_billDate,
      companyId: create_companyId,
      discountPercentage: parseFloat(create_discountPercentage) || 0,
      taxType: create_taxType,
      status: create_status,
      amountInWords: create_amountInWords,
      paymentRecords: create_paymentRecords.map(r => ({ paymentDate: r.paymentDate, amountPaid: parseFloat(r.amountPaid || 0), paymentMethod: r.paymentMethod, referenceNumber: r.referenceNumber, notes: r.notes })),
      overrideCgstPercentage: parseFloat(create_overrideCgstPercentage) || undefined,
      overrideSgstPercentage: parseFloat(create_overrideSgstPercentage) || undefined,
      overrideIgstPercentage: parseFloat(create_overrideIgstPercentage) || undefined,
      overrideJobCgstPercentage: parseFloat(create_overrideJobCgstPercentage) || undefined,
      overrideJobSgstPercentage: parseFloat(create_overrideJobSgstPercentage) || undefined,
    };
    // items
    billData.items = create_items.map(item => ({ description: item.description, hsnSacCode: item.hsnSacCode, quantity: parseFloat(item.quantity), rate: parseFloat(item.rate) }));
    // If user marked bill as Paid but didn't add payment records, add a full payment record
    if ((create_status || '').toLowerCase() === 'paid' && (!create_paymentRecords || create_paymentRecords.length === 0)) {
      try {
        const paidAmount = createPreview?.grandTotal || 0;
        billData.paymentRecords = [{ paymentDate: create_billDate || new Date().toISOString().split('T')[0], amountPaid: parseFloat(paidAmount), paymentMethod: 'Cash', referenceNumber: '', notes: '' }];
      } catch (e) {
        // fallback: leave paymentRecords as empty, backend will handle
        console.warn('Failed to auto-add payment record for paid status', e);
      }
    }
    try {
      await BillService.createBill(billData);
      setCreateSuccessMessage('Bill created successfully');
      // refresh list
      await fetchBills();
      // close modal
      setTimeout(() => {
        setIsCreateOpen(false);
        setCreateSuccessMessage('');
      }, 800);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to create bill.';
      setCreateError(errMsg);
      console.error('Create bill error:', errMsg);
    } finally {
      setIsCreateLoading(false);
    }
  };

  const closeViewModal = () => {
    setIsViewOpen(false);
    setSelectedBill(null);
    setViewError("");
  };

  const handleViewBill = (billId) => {
    openViewModal(billId);
  };

  const handleCreateDebitNote = async (billId) => {
    try {
      const canHaveDebitNote = await DebitService.checkBillCanHaveDebitNote(
        billId
      );

      if (canHaveDebitNote.data.canHaveDebitNote) {
        // Show inline Debit Notes section and request create modal for this bill
        setShowDebitNotes(true);
        setOpenDebitCreateForBillId(billId);
      } else {
        alert(
          canHaveDebitNote.data.reason ||
            "Cannot create debit note for this bill"
        );
      }
    } catch (error) {
      const errMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to check debit note eligibility.";
      setError(errMsg);
      console.error("Check debit note error:", errMsg);
    }
  };

  /* ---- Edit modal helpers (extracted from EditBillPage) ---- */
  const openEditModal = async (billId) => {
    setIsEditOpen(true);
    setEditBillId(billId);
    setIsFetchingEditBill(true);
    setEditError("");
    try {
      const billRes = await BillService.getBillById(billId);
      const bill = billRes.data;
      console.log("Editing bill data:", bill);
      setEditBillNumber(bill.billNumber);
      setEditOriginalBillNumber(bill.billNumber);
      setEditChallanNumber(bill.challanNumber || '');
      setEditBillDate(new Date(bill.billDate).toISOString().split('T')[0]);
      setEditCompanyId(bill.company._id || bill.company);
      setEditItems(bill.items.map(item => ({ ...item, id: item._id, amount: parseFloat((item.quantity * item.rate).toFixed(2)) })) || [{ description: '', hsnSacCode: '', quantity: 1, rate: 0, amount: 0 }]);
      setEditDiscountPercentage(bill.discountPercentage || 0);
      setEditTaxType(bill.taxType || 'CGST_SGST');
      setEditOverrideCgstPercentage(bill.overrideCgstPercentage || '');
      setEditOverrideSgstPercentage(bill.overrideSgstPercentage || '');
      setEditOverrideIgstPercentage(bill.overrideIgstPercentage || '');
      setEditOverrideJobCgstPercentage(bill.overrideJobCgstPercentage || '');
      setEditOverrideJobSgstPercentage(bill.overrideJobSgstPercentage || '');
      setEditStatus(bill.status || 'Pending');
      setEditAmountInWords(bill.amountInWords || '');
      setEditPaymentRecords(bill.paymentRecords || []);
      setEditChallanId(bill.challan?._id || '');
      setEditChallanMode(bill.challan ? 'challan' : 'manual');
      setEditRate(bill.items[0]?.rate || '');

      // Reuse existing companies state; fetch settings
      try {
        const settingsRes = await SettingsService.getSettings();
        setSettings(settingsRes.data);
        setEditAvailableItemConfigs(settingsRes.data.itemConfigurations || []);
      } catch (sErr) {
        console.warn('Failed to load settings for edit modal', sErr);
      }

      // If bill has challan info we preserve challan id (modal uses manual mode by default)
      if ((bill.company?._id || bill.company) && bill.challan) {
        setEditChallanId(bill.challan._id || '');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to load bill data for editing.';
      setEditError(errMsg);
      console.error('Error fetching bill for edit:', err);
      setIsEditOpen(false);
    } finally {
      setIsFetchingEditBill(false);
    }
  };

  // Note: challan-specific fetching removed for compact edit modal; manual mode is default.
  
  const handleEditItemChange = (index, field, value) => {
    if (edit_challanMode === 'challan') return;
    const newItems = [...edit_items];
    newItems[index][field] = value;
    if (field === 'description') {
      const selectedConfig = edit_availableItemConfigs.find(config => config.description === value);
      if (selectedConfig) {
        newItems[index].hsnSacCode = selectedConfig.hsnSacCode;
        newItems[index].rate = selectedConfig.defaultRate !== undefined ? selectedConfig.defaultRate : 0;
      }
    }
    const qty = parseFloat(newItems[index].quantity) || 0;
    const rate = parseFloat(newItems[index].rate) || 0;
    newItems[index].amount = parseFloat((qty * rate).toFixed(2));
    setEditItems(newItems);
  };

  const addEditItem = () => {
    if (edit_challanMode === 'challan') return;
    setEditItems([...edit_items, { description: '', hsnSacCode: '', quantity: 1, rate: 0, amount: 0 }]);
  };

  const removeEditItem = (index) => {
    if (edit_challanMode === 'challan') return;
    const newItems = edit_items.filter((_, i) => i !== index);
    setEditItems(newItems);
  };

  const validateEditForm = () => {
    const errors = {};
    if (!edit_billNumber.trim()) errors.billNumber = 'Bill number is required.';
    if (!edit_billDate) errors.billDate = 'Bill date is required.';
    if (!edit_companyId) errors.companyId = 'Company is required.';
    if (edit_challanMode === 'manual' && edit_items.length === 0) errors.items = 'At least one item is required in manual mode.';
    if (edit_challanMode === 'challan' && !edit_challanId) errors.challanId = 'Challan selection is required in challan mode.';
    if (edit_challanMode === 'manual') {
      edit_items.forEach((item, index) => {
        if (!item.description.trim()) errors[`item_description_${index}`] = 'Description is required.';
        if (!item.hsnSacCode.trim()) errors[`item_hsn_${index}`] = 'HSN/SAC is required.';
        if (isNaN(parseFloat(item.quantity)) || parseFloat(item.quantity) <= 0) errors[`item_qty_${index}`] = 'Valid quantity is required.';
        if (isNaN(parseFloat(item.rate)) || parseFloat(item.rate) < 0) errors[`item_rate_${index}`] = 'Valid rate is required.';
      });
    }
    if (edit_challanMode === 'challan' && (isNaN(parseFloat(edit_rate)) || parseFloat(edit_rate) < 0)) errors.rate = 'Valid rate is required in challan mode.';
    if (!edit_taxType) errors.taxType = 'Tax type is required.';
    if (edit_discountPercentage < 0 || edit_discountPercentage > 100) errors.discountPercentage = 'Discount must be between 0 and 100.';
    if (!edit_status) errors.status = 'Status is required.';
    if (edit_overrideCgstPercentage && (isNaN(parseFloat(edit_overrideCgstPercentage)) || parseFloat(edit_overrideCgstPercentage) < 0)) errors.overrideCgstPercentage = 'Valid CGST percentage is required.';
    if (edit_overrideSgstPercentage && (isNaN(parseFloat(edit_overrideSgstPercentage)) || parseFloat(edit_overrideSgstPercentage) < 0)) errors.overrideSgstPercentage = 'Valid SGST percentage is required.';
    if (edit_overrideIgstPercentage && (isNaN(parseFloat(edit_overrideIgstPercentage)) || parseFloat(edit_overrideIgstPercentage) < 0)) errors.overrideIgstPercentage = 'Valid IGST percentage is required.';
    if (edit_overrideJobCgstPercentage && (isNaN(parseFloat(edit_overrideJobCgstPercentage)) || parseFloat(edit_overrideJobCgstPercentage) < 0)) errors.overrideJobCgstPercentage = 'Valid JOBCGST percentage is required.';
    if (edit_overrideJobSgstPercentage && (isNaN(parseFloat(edit_overrideJobSgstPercentage)) || parseFloat(edit_overrideJobSgstPercentage) < 0)) errors.overrideJobSgstPercentage = 'Valid JOBSGST percentage is required.';
    edit_paymentRecords.forEach((record, index) => {
      if (!record.paymentDate) errors[`payment_date_${index}`] = 'Payment date is required.';
      if (isNaN(parseFloat(record.amountPaid)) || parseFloat(record.amountPaid) <= 0) errors[`payment_amount_${index}`] = 'Valid payment amount is required.';
    });

    setEditFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateEditForm()) {
      setEditError('Please correct the errors in the form.');
      return;
    }
    setEditError('');
    setIsEditLoading(true);

    const billData = {
      billNumber: edit_billNumber,
      billDate: edit_billDate,
      companyId: edit_companyId,
      discountPercentage: parseFloat(edit_discountPercentage) || 0,
      taxType: edit_taxType,
      status: edit_status,
      amountInWords: edit_amountInWords,
      paymentRecords: edit_paymentRecords.map(record => ({
        paymentDate: record.paymentDate,
        amountPaid: parseFloat(record.amountPaid),
        paymentMethod: record.paymentMethod,
        referenceNumber: record.referenceNumber,
        notes: record.notes
      })),
      overrideCgstPercentage: parseFloat(edit_overrideCgstPercentage) || undefined,
      overrideSgstPercentage: parseFloat(edit_overrideSgstPercentage) || undefined,
      overrideIgstPercentage: parseFloat(edit_overrideIgstPercentage) || undefined,
      overrideJobCgstPercentage: parseFloat(edit_overrideJobCgstPercentage) || undefined,
      overrideJobSgstPercentage: parseFloat(edit_overrideJobSgstPercentage) || undefined,
      _originalBillNumber: edit_originalBillNumber !== edit_billNumber ? edit_originalBillNumber : undefined,
    };

    if (edit_challanMode === 'challan') {
      billData.challanId = edit_challanId;
      if (edit_rate) billData.rate = parseFloat(edit_rate);
    } else {
      billData.challanNumber = edit_challanNumber;
      billData.items = edit_items.map(item => ({
        description: item.description,
        hsnSacCode: item.hsnSacCode,
        quantity: parseFloat(item.quantity),
        rate: parseFloat(item.rate),
      }));
    }

    try {
      await BillService.updateBill(editBillId, billData);
      setEditSuccessMessage('Bill updated successfully!');
      // refresh list
      fetchBills();
      setTimeout(() => {
        setIsEditOpen(false);
        setEditSuccessMessage('');
      }, 1000);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to update bill.';
      setEditError(errMsg);
      console.error('Update bill error:', errMsg);
    } finally {
      setIsEditLoading(false);
    }
  };

  const calculateEditPreviewTotals = useCallback(() => {
    let subTotal = 0;
    edit_items.forEach(item => {
      subTotal += (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0);
    });
    subTotal = parseFloat(subTotal.toFixed(2));
    const discount = parseFloat((subTotal * (parseFloat(edit_discountPercentage) / 100)).toFixed(2)) || 0;
    const amountAfterDiscount = parseFloat((subTotal - discount).toFixed(2));
    let totalTax = 0;
    let cgst = 0, sgst = 0, igst = 0, jobCgst = 0, jobSgst = 0;

    if (settings) {
      if (edit_taxType === 'CGST_SGST') {
        const cgstRate = parseFloat(edit_overrideCgstPercentage) || settings.cgstPercentage;
        const sgstRate = parseFloat(edit_overrideSgstPercentage) || settings.sgstPercentage;
        cgst = parseFloat((amountAfterDiscount * (cgstRate / 100)).toFixed(2));
        sgst = parseFloat((amountAfterDiscount * (sgstRate / 100)).toFixed(2));
        totalTax = cgst + sgst;
      } else if (edit_taxType === 'IGST') {
        const igstRate = parseFloat(edit_overrideIgstPercentage) || settings.igstPercentage;
        igst = parseFloat((amountAfterDiscount * (igstRate / 100)).toFixed(2));
        totalTax = igst;
      } else if (edit_taxType === 'JOBCGST_JOBSGST') {
        const jobCgstRate = parseFloat(edit_overrideJobCgstPercentage) || settings.jobCgstPercentage;
        const jobSgstRate = parseFloat(edit_overrideJobSgstPercentage) || settings.jobSgstPercentage;
        jobCgst = parseFloat((amountAfterDiscount * (jobCgstRate / 100)).toFixed(2));
        jobSgst = parseFloat((amountAfterDiscount * (jobSgstRate / 100)).toFixed(2));
        totalTax = jobCgst + jobSgst;
      }
    }
    totalTax = parseFloat(totalTax.toFixed(2));
    const grandTotal = parseFloat((amountAfterDiscount + totalTax).toFixed(2));
    return { subTotal, discount, amountAfterDiscount, cgst, sgst, igst, jobCgst, jobSgst, totalTax, grandTotal };
  }, [edit_items, edit_discountPercentage, edit_taxType, settings, edit_overrideCgstPercentage, edit_overrideSgstPercentage, edit_overrideIgstPercentage, edit_overrideJobCgstPercentage, edit_overrideJobSgstPercentage]);

  const editPreview = calculateEditPreviewTotals();

  const formatDisplayDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "overdue":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "partially paid":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "cancelled":
        return "bg-gray-50 text-gray-600 border-gray-200";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  const handleMonthChange = (direction) => {
    const currentDate = new Date(filterStartDate);
    let newYear = currentDate.getFullYear();
    let newMonth = currentDate.getMonth();

    if (direction === "prev") {
      newMonth--;
      if (newMonth < 0) {
        newMonth = 11;
        newYear--;
      }
    } else {
      newMonth++;
      if (newMonth > 11) {
        newMonth = 0;
        newYear++;
      }
    }

    const newFirstDay = new Date(newYear, newMonth, 1);
    const newLastDay = new Date(newYear, newMonth + 1, 0);

    setFilterStartDate(formatDateForInput(newFirstDay));
    setFilterEndDate(formatDateForInput(newLastDay));
  };

  const clearFilters = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    setFilterStartDate(formatDateForInput(firstDay));
    setFilterEndDate(formatDateForInput(lastDay));
    setFilterCompany("");
    setFilterStatus("");
    if (isMobile) setShowFilters(false);
  };

  // Calculate summary statistics
  const summaryStats = React.useMemo(() => {
    const totalAmount = bills.reduce(
      (sum, bill) => sum + (bill.totalAmount || 0),
      0
    );
    const paidAmount = bills
      .filter((bill) => bill.status?.toLowerCase() === "paid")
      .reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);
    const pendingAmount = bills
      .filter((bill) => bill.status?.toLowerCase() === "pending")
      .reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);
    const overdueCount = bills.filter(
      (bill) => bill.status?.toLowerCase() === "overdue"
    ).length;

    return { totalAmount, paidAmount, pendingAmount, overdueCount };
  }, [bills]);

  if (isLoading && bills.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <motion.div
          className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <RefreshCw className="h-8 w-8 text-violet-600 animate-spin" />
              <div className="absolute inset-0 h-8 w-8 bg-violet-100 rounded-full animate-pulse"></div>
            </div>
            <p className="text-slate-600 font-medium">Loading your bills...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4">
        {/* Header Section */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg lg:text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                    Bill Management
                  </h1>
                </div>
              </div>
            </div>
      {/* Inline Debit Notes section (toggle) */}
      {showDebitNotes && (
        <div className="mt-6">
          <DebitNoteListPage
            openCreateForBillId={openDebitCreateForBillId}
            onCreateOpened={() => setOpenDebitCreateForBillId('')}
          />
        </div>
      )}

            <div className="flex flex-wrap gap-3">
              {isMobile && (
                <motion.button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-3 py-2 rounded-xl font-semibold text-xs transition-all duration-200 ${
                    showFilters
                      ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                      : "bg-white text-slate-700 hover:bg-slate-50 shadow-md border border-slate-200"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {showFilters ? (
                    <>
                      <X className="h-4 w-4 mr-2 inline" />
                      Hide Filters
                    </>
                  ) : (
                    <>
                      <SlidersHorizontal className="h-4 w-4 mr-2 inline" />
                      Filters
                    </>
                  )}
                </motion.button>
              )}

              <button
                type="button"
                onClick={openCreateModal}
                className="hidden lg:flex group px-3 py-2 lg:px-6 lg:py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center"
              >
                <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-200" />
                <span className="text-xs lg:text-base">Create Bill</span>
              </button>

              {/* Debit Notes toggle is at the header; removed redirect link */}
            </div>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-white rounded-2xl p-4 shadow-md border border-slate-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center space-x-3">
              <div className="p-2 lg:p-3 bg-blue-50 rounded-xl">
                <DollarSign className="w-5 h-5 lg:h-6 lg:w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-slate-500 text-xs lg:text-sm font-medium">
                  Total Amount
                </p>
                <p className="text-slate-900 text-lg lg:text-xl font-bold">
                  ₹{summaryStats.totalAmount.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-md border border-slate-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center space-x-3">
              <div className="p-2 lg:p-3 bg-emerald-50 rounded-xl">
                <TrendingUp className="h-5 w-5 lg:h-6 lg:w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-slate-500 text-xs lg:text-sm font-medium">
                  Paid Amount
                </p>
                <p className="text-slate-900 text-lg lg:text-xl font-bold">
                  ₹{summaryStats.paidAmount.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-md border border-slate-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center space-x-3">
              <div className="p-2 lg:p-3 bg-amber-50 rounded-xl">
                <BarChart3 className="h-5 w-5 lg:h-6 lg:w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-slate-500 text-xs lg:text-sm font-medium">Pending</p>
                <p className="text-slate-900 text-lg lg:text-xl font-bold">
                  ₹{summaryStats.pendingAmount.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-md border border-slate-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center space-x-3">
              <div className="p-2 lg:p-3 bg-rose-50 rounded-xl">
                <Building2 className="w-5 h-5 lg:h-6 lg:w-6 text-rose-600" />
              </div>
              <div>
                <p className="text-slate-500 text-xs lg:text-sm font-medium">Overdue</p>
                <p className="text-slate-900 text-lg lg:text-xl font-bold">
                  {summaryStats.overdueCount}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filters Section */}
        <AnimatePresence>
          {(showFilters || !isMobile) && (
            <motion.div
              className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4 lg:p-6 mb-8"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-violet-50 rounded-xl">
                    <Filter className="h-5 w-5 text-violet-600" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-800">
                    Filters & Export
                  </h2>
                </div>
                {/* Action Buttons Desktop */}
                <div className="hidden lg:flex flex-wrap gap-2 lg:gap-3">
                  <motion.button
                    onClick={fetchBills}
                    className="px-2 lg:px-3 md:px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center space-x-2"
                    disabled={isLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Filter className="h-4 w-4" />
                    <span className="hidden lg:block">Apply Filters</span>
                  </motion.button>

                  {!isMobile && (
                    <motion.button
                      onClick={clearFilters}
                      className="px-2 lg:px-3 md:px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-all hidden lg:flex items-center space-x-2"
                      disabled={isLoading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <X className="h-4 w-4" />
                      <span className="hidden lg:block">Reset</span>
                    </motion.button>
                  )}

                  <motion.button
                    onClick={handleDownloadExcel}
                    className="px-2 lg:px-3 md:px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-all flex items-center space-x-2"
                    disabled={isLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden lg:block">Excel</span>
                  </motion.button>

                  <motion.button
                    onClick={handleDownloadPdf}
                    className="px-2 lg:px-3 md:px-6 py-3 bg-rose-600 text-white font-semibold rounded-xl hover:bg-rose-700 transition-all flex items-center space-x-2"
                    disabled={isLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FileText className="h-4 w-4" />
                    <span className="hidden lg:block">PDF</span>
                  </motion.button>
                </div>
              </div>

              <div className="flex md:flex-row flex-col md:items-end items-start gap-4 md:flex-wrap">
                {/* Action Buttons Mobile */}
                <div className="lg:hidden flex flex-wrap gap-2 lg:gap-3">
                  <motion.button
                    onClick={fetchBills}
                    className="px-3 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center"
                    disabled={isLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    <span className="text-xs lg:hidden">Apply</span>
                  </motion.button>

                  <motion.button
                    onClick={clearFilters}
                    className="px-3 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-all flex items-center space-x-2 lg:hidden"
                    disabled={isLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <X className="h-4 w-4" />
                    <span className="text-xs lg:hidden">Clear</span>
                  </motion.button>

                  <motion.button
                    onClick={handleDownloadExcel}
                    className="px-3 py-2 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-all flex items-center space-x-2"
                    disabled={isLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Download className="h-4 w-4" />
                    <span className="text-xs lg:hidden">Excel</span>
                  </motion.button>

                  <motion.button
                    onClick={handleDownloadPdf}
                    className="px-3 py-2 bg-rose-600 text-white font-semibold rounded-xl hover:bg-rose-700 transition-all flex items-center space-x-2"
                    disabled={isLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FileText className="h-4 w-4" />
                    <span className="text-xs lg:hidden">PDF</span>
                  </motion.button>
                </div>

                {/* Date Range */}
                <div className="w-full md:flex-1">
                  <label htmlFor="filterStartDate" className="block text-sm font-semibold text-slate-700 mb-2">
                    Date Range
                  </label>
                  <div className="flex items-center space-x-2">
                    <motion.button
                      onClick={() => handleMonthChange("prev")}
                      className="p-2 lg:p-3 rounded-lg lg:rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
                      disabled={isLoading}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ChevronLeft className="h-4 w-4 text-slate-600" />
                    </motion.button>

                    <div className="flex space-x-2 flex-1">
                      <input
                        type="date"
                        id="filterStartDate"
                        value={filterStartDate}
                        onChange={(e) => setFilterStartDate(e.target.value)}
                        className="px-2 py-2.5 text-sm border border-slate-200 text-black rounded-xl shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all bg-white md:w-40 w-full"
                      />
                      <input
                        type="date"
                        id="filterEndDate"
                        value={filterEndDate}
                        onChange={(e) => setFilterEndDate(e.target.value)}
                        className="px-2 py-2.5 text-sm border border-slate-200 text-black rounded-xl shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all bg-white md:w-40 w-full"
                      />
                    </div>

                    <motion.button
                      onClick={() => handleMonthChange("next")}
                      className="p-2 lg:p-3 rounded-lg lg:rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
                      disabled={isLoading}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ChevronRight className="h-4 w-4 text-slate-600" />
                    </motion.button>
                  </div>
                </div>

                {/* Company Filter */}
                <div className="w-full md:flex-1 md:min-w-[150px]">
                  <label htmlFor="filterCompany" className="block text-sm font-semibold text-slate-700 mb-2">
                    Company
                  </label>
                  <select
                    id="filterCompany"
                    value={filterCompany}
                    onChange={(e) => setFilterCompany(e.target.value)}
                    className="w-full px-2 py-2.5 lg:px-4 lg:py-3 border border-slate-200 text-black rounded-xl shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all bg-white text-sm"
                  >
                    <option value="">All Companies</option>
                    {companies.map((company) => (
                      <option key={company._id} value={company._id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div className="w-full md:flex-1 md:min-w-[150px]">
                  <label htmlFor="filterStatus" className="block text-sm font-semibold text-slate-700 mb-2">
                    Status
                  </label>
                  <select
                    id="filterStatus"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-2 py-2.5 lg:px-4 lg:py-3 border border-slate-200 text-black rounded-xl shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all bg-white text-sm"
                  >
                    <option value="">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Partially Paid">Partially Paid</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create Bill Modal */}
        <AnimatePresence>
          {isCreateOpen && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="absolute inset-0 bg-black/50" onClick={() => closeCreateModal()} />
              <motion.div
                className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-auto p-4 z-10 overflow-auto max-h-[80vh]"
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Create Bill</h3>
                    <p className="text-sm text-slate-500">Create a new bill</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => closeCreateModal()}
                      className="text-slate-500 hover:text-slate-700 p-2 rounded-lg"
                    >
                      <X className="h-10 w-10 border border-black-100 rounded-full p-2" />
                    </button>
                  </div>
                </div>

                {createError && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-4">
                    <p className="text-rose-700">{createError}</p>
                  </div>
                )}

                {createSuccessMessage && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
                    <p className="text-emerald-700">{createSuccessMessage}</p>
                  </div>
                )}

                {Object.keys(createFormErrors || {}).length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-sm">
                    <p className="font-semibold text-amber-700">Fix the following errors:</p>
                    <ul className="list-disc list-inside text-amber-700">
                      {Object.values(createFormErrors).map((v, i) => (
                        <li key={i}>{v}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <form onSubmit={handleCreateSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label htmlFor="createBillNumber" className="block text-xs lg:text-sm font-medium text-gray-700">Bill Number</label>
                      <input id="createBillNumber" value={create_billNumber} onChange={(e) => setCreateBillNumber(e.target.value)} className="mt-1 text-black block w-full p-2 text-xs lg:text-sm border border-gray-200 rounded-lg" />
                    </div>
                    <div>
                      <label htmlFor="createBillDate" className="block text-xs lg:text-sm font-medium text-gray-700">Bill Date</label>
                      <input id="createBillDate" type="date" value={create_billDate} onChange={(e) => setCreateBillDate(e.target.value)} className="mt-1 text-black block w-full p-2 text-xs lg:text-sm border border-gray-200 rounded-lg" />
                    </div>
                    <div>
                      <label htmlFor="createCompany" className="block text-xs lg:text-sm font-medium text-gray-700">Company</label>
                      <select id="createCompany" value={create_companyId} onChange={(e) => setCreateCompanyId(e.target.value)} className="mt-1 text-black block w-full p-2 text-xs lg:text-sm border border-gray-200 rounded-lg">
                        <option value="">Select Company</option>
                        {companies.map(comp => (
                          <option key={comp._id} value={comp._id}>{comp.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="createStatus" className="block text-xs lg:text-sm font-medium text-gray-700">Status</label>
                      <select id="createStatus" value={create_status} onChange={(e) => setCreateStatus(e.target.value)} className="mt-1 text-black block w-full p-2 text-xs lg:text-sm border border-gray-200 rounded-lg">
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                        <option value="Partially Paid">Partially Paid</option>
                        <option value="Overdue">Overdue</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  <div className="border border-gray-200 p-3 rounded-lg">
                    <h4 className="text-sm text-gray-700 font-semibold mb-2">Items</h4>
                    <div className="space-y-2">
                      {create_items.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-1 lg:grid-cols-6 gap-2 items-end">
                          <div className="lg:col-span-2">
                            <input value={item.description} onChange={(e) => handleCreateItemChange(idx, 'description', e.target.value)} placeholder="Description" className="w-full text-black p-2 border border-gray-200 rounded-lg text-sm" />
                          </div>
                          <div>
                            <input value={item.hsnSacCode} onChange={(e) => handleCreateItemChange(idx, 'hsnSacCode', e.target.value)} placeholder="HSN/SAC" className="w-full text-black p-2 border border-gray-200 rounded-lg text-sm" />
                          </div>
                          <div>
                            <input type="number" value={item.quantity} onChange={(e) => handleCreateItemChange(idx, 'quantity', e.target.value)} placeholder="Qty" className="w-full text-black p-2 border border-gray-200 rounded-lg text-sm" />
                          </div>
                          <div>
                            <input type="number" value={item.rate} onChange={(e) => handleCreateItemChange(idx, 'rate', e.target.value)} placeholder="Rate" className="w-full text-black p-2 border border-gray-200 rounded-lg text-sm" />
                          </div>
                          <div className="text-sm text-black font-semibold">₹{(item.amount || 0).toFixed(2)}</div>
                          <div>
                            <button type="button" onClick={() => removeCreateItem(idx)} className="text-red-500 text-xs">Remove</button>
                          </div>
                        </div>
                      ))}
                      <div>
                        <button type="button" onClick={addCreateItem} className="text-indigo-600 text-sm">+ Add Item</button>
                      </div>
                    </div>
                  </div>

                  <div className="border text-black border-gray-200 p-3 rounded-lg">
                    <div className="flex justify-between text-sm"><span>Subtotal</span><span>₹{createPreview.subTotal.toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm"><span>Discount ({create_discountPercentage}%)</span><span className="text-red-600">- ₹{createPreview.discount.toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm font-medium border-t pt-1"><span>Amount After Discount:</span><span>₹{createPreview.amountAfterDiscount.toFixed(2)}</span></div>
                    {create_taxType === 'CGST_SGST' && (
                      <>
                        <div className="flex justify-between text-sm"><span>CGST ({(parseFloat(create_overrideCgstPercentage) || settings?.cgstPercentage || 0)}%)</span><span>+ ₹{createPreview.cgst.toFixed(2)}</span></div>
                        <div className="flex justify-between text-sm"><span>SGST ({(parseFloat(create_overrideSgstPercentage) || settings?.sgstPercentage || 0)}%)</span><span>+ ₹{createPreview.sgst.toFixed(2)}</span></div>
                      </>
                    )}
                    {create_taxType === 'IGST' && (
                      <div className="flex justify-between text-sm"><span>IGST ({(parseFloat(create_overrideIgstPercentage) || settings?.igstPercentage || 0)}%)</span><span>+ ₹{createPreview.igst.toFixed(2)}</span></div>
                    )}
                    {create_taxType === 'JOBCGST_JOBSGST' && (
                      <>
                        <div className="flex justify-between text-sm"><span>JOBCGST ({(parseFloat(create_overrideJobCgstPercentage) || settings?.jobCgstPercentage || 0)}%)</span><span>+ ₹{createPreview.jobCgst.toFixed(2)}</span></div>
                        <div className="flex justify-between text-sm"><span>JOBSGST ({(parseFloat(create_overrideJobSgstPercentage) || settings?.jobSgstPercentage || 0)}%)</span><span>+ ₹{createPreview.jobSgst.toFixed(2)}</span></div>
                      </>
                    )}
                    <div className="flex justify-between text-base font-bold border-t-2 border-slate-300 pt-2 mt-1"><span>Grand Total:</span><span>₹{createPreview.grandTotal.toFixed(2)}</span></div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button type="button" onClick={() => closeCreateModal()} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg">Cancel</button>
                    <button type="submit" disabled={isCreateLoading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">{isCreateLoading ? 'Creating...' : 'Create Bill'}</button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-6"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-rose-100 rounded-xl">
                  <X className="h-5 w-5 text-rose-600" />
                </div>
                <p className="text-rose-700 font-medium">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {!isLoading && !error && bills.length === 0 && (
          <motion.div
            className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-24 h-24 bg-gradient-to-r from-violet-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FileText className="h-12 w-12 text-violet-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              No bills found
            </h3>
            <p className="text-slate-500 mb-8">
              Try adjusting your filters or create your first bill to get
              started.
            </p>
            <button onClick={openCreateModal} className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all space-x-2">
              <Plus className="h-5 w-5" />
              <span>Create Your First Bill</span>
            </button>
          </motion.div>
        )}

        {/* Bills Table/Cards */}
        {bills.length > 0 && (
          <motion.div
            className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {isMobile ? (
              // Mobile Card View
              <div className="divide-y divide-slate-100">
                {bills.map((bill, index) => (
                  <motion.div
                    key={bill._id}
                    className="p-6 hover:bg-slate-50 transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <button
                          onClick={() => handleViewBill(bill._id)}
                          className="text-lg font-bold text-violet-600 hover:text-violet-800"
                        >
                          #{bill.billNumber} {bill.company?.name ||
                            bill.companyDetailsSnapshot?.name ||
                            "N/A"}
                        </button>
                        <p className="text-slate-500 text-sm">
                          GST No: {bill.company?.gstNumber || "N/A"}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                          bill.status
                        )}`}
                      >
                        {bill.status}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Amount:</span>
                        <span className="font-semibold text-slate-800">
                          ₹{bill.totalAmount?.toFixed(2) || "0.00"}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Date:</span>
                        <span className="text-slate-600">
                          {formatDisplayDate(bill.billDate)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Due:</span>
                        <span className="text-slate-600">
                          {formatDisplayDate(bill.dueDate)}
                        </span>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <motion.button
                        onClick={() => handleViewBill(bill._id)}
                        className="flex-1 px-2 py-1.5 bg-blue-100 text-blue-700 rounded-xl font-medium hover:bg-blue-100 transition-colors flex items-center justify-center space-x-1"
                        whileTap={{ scale: 0.95 }}
                      >
                        <Eye className="h-4 w-4" />
                        <span className="text-sm">View</span>
                      </motion.button>
                      <motion.button
                        onClick={() => openEditModal(bill._id)}
                        className="flex-1 px-2 py-1.5 bg-amber-100 text-amber-700 rounded-xl font-medium hover:bg-amber-100 transition-colors flex items-center justify-center space-x-1"
                        whileTap={{ scale: 0.95 }}
                      >
                        <Edit3 className="h-4 w-4" />
                        <span className="text-sm">Edit</span>
                      </motion.button>
                      <motion.button
                        onClick={() => handleCreateDebitNote(bill._id)}
                        className="flex-1 px-4 py-2 bg-violet-100 text-violet-600 hover:text-violet-800 hover:bg-violet-50 rounded-xl font-medium transition-colors flex items-center justify-center space-x-1"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title="Create Debit Note"
                      >
                        <Plus className="h-4 w-4" />
                        <span className="text-sm">Note</span>
                      </motion.button>
                      <motion.button
                        onClick={() => handleDeleteBill(bill._id)}
                        className="px-4 py-2 bg-rose-50 text-rose-700 rounded-xl font-medium hover:bg-rose-100 transition-colors"
                        whileTap={{ scale: 0.95 }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              // Desktop Table View
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Bill #
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {bills.map((bill, index) => (
                      <motion.tr
                        key={bill._id}
                        className="hover:bg-slate-50 transition-colors"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.03 }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleViewBill(bill._id)}
                            className="text-violet-600 hover:text-violet-800 font-semibold"
                          >
                            #{bill.billNumber}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                          {bill.company?.name ||
                            bill.companyDetailsSnapshot?.name ||
                            "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                          {formatDisplayDate(bill.billDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                          {formatDisplayDate(bill.dueDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-slate-800">
                          ₹{bill.totalAmount?.toFixed(2) || "0.00"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                              bill.status
                            )}`}
                          >
                            {bill.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex justify-center space-x-2">
                            <motion.button
                              onClick={() => handleViewBill(bill._id)}
                              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-xl transition-all"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              title="View Bill"
                            >
                              <Eye className="h-4 w-4" />
                            </motion.button>
                            <motion.button
                              onClick={() => openEditModal(bill._id)}
                              className="p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-xl transition-all"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              title="Edit Bill"
                            >
                              <Edit3 className="h-4 w-4" />
                            </motion.button>
                            <motion.button
                              onClick={() => handleCreateDebitNote(bill._id)}
                              className="p-2 text-violet-600 hover:text-violet-800 hover:bg-violet-50 rounded-xl transition-all"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              title="Create Debit Note"
                            >
                              <Plus className="h-4 w-4" />
                            </motion.button>
                            <motion.button
                              onClick={() => handleDeleteBill(bill._id)}
                              className="p-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition-all"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              title="Delete Bill"
                            >
                              <Trash2 className="h-4 w-4" />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {/* Mobile Floating Action Button */}
        {isMobile && (
          <motion.div
            className="fixed bottom-6 right-6 z-10"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <button onClick={openCreateModal} className="w-16 h-16 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl shadow-2xl flex items-center justify-center text-white hover:shadow-3xl transition-all">
              <Plus className="h-7 w-7" />
            </button>
          </motion.div>
        )}

        {/* View Bill Modal */}
        <AnimatePresence>
          {isViewOpen && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="absolute inset-0 bg-black/50" onClick={() => closeViewModal()} />
              <motion.div
                className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-auto p-6 z-10 overflow-auto max-h-[80vh]"
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Bill Details</h3>
                    <p className="text-sm text-slate-500">Preview of selected bill</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => closeViewModal()}
                      className="text-slate-500 hover:text-slate-700 p-2 rounded-lg"
                    >
                      <X className="h-10 w-10 border border-black-100 rounded-full p-2" />
                    </button>
                  </div>
                </div>
                {isViewLoading && (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-8 w-8 text-violet-600 animate-spin" />
                  </div>
                )}

                {viewError && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-4">
                    <p className="text-rose-700">{viewError}</p>
                  </div>
                )}

                {selectedBill && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-500">Bill Number</p>
                        <p className="font-semibold text-slate-800">#{selectedBill.billNumber}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Company</p>
                        <p className="font-semibold text-slate-800">{selectedBill.company?.name || selectedBill.companyDetailsSnapshot?.name || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-slate-500">Bill Date</p>
                        <p className="font-semibold text-slate-800">{formatDisplayDate(selectedBill.billDate)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Due Date</p>
                        <p className="font-semibold text-slate-800">{formatDisplayDate(selectedBill.dueDate)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Status</p>
                        <p className={`inline-block px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(selectedBill.status)}`}>{selectedBill.status}</p>
                      </div>
                    </div>

                    <div className="overflow-x-auto border border-slate-300 rounded-xl p-3 bg-white">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-slate-500 text-xs">
                            <th className="text-left py-2">Description</th>
                            <th className="text-left py-2">HSN/SAC</th>
                            <th className="text-right py-2">Qty</th>
                            <th className="text-right py-2">Rate</th>
                            <th className="text-right py-2">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedBill.items?.map((it, idx) => (
                            <tr key={idx} className="border-t border-slate-300">
                              <td className="py-2 text-slate-700">{it.description}</td>
                              <td className="py-2 text-slate-600">{it.hsnSacCode}</td>
                              <td className="py-2 text-right text-slate-600">{it.quantity}</td>
                              <td className="py-2 text-right text-slate-600">₹{(it.rate || 0).toFixed(2)}</td>
                              <td className="py-2 text-right font-semibold text-slate-800">₹{(it.amount || 0).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                      <div className="md:col-span-2">
                        {selectedBill.amountInWords && (
                          <p className="text-sm text-slate-600">Amount in Words: <span className="font-semibold text-slate-800">{selectedBill.amountInWords}</span></p>
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-slate-700">
                        <div className="flex justify-between"><span>Subtotal:</span> <span>₹{(selectedBill.subTotalAmount || 0).toFixed(2)}</span></div>
                        {selectedBill.discountAmount > 0 && (
                          <div className="flex justify-between"><span>Discount ({selectedBill.discountPercentage}%):</span> <span>- ₹{(selectedBill.discountAmount || 0).toFixed(2)}</span></div>
                        )}
                        <div className="flex justify-between font-medium border-t border-slate-200 pt-1"><span>Amount After Discount:</span> <span>₹{(selectedBill.amountAfterDiscount || 0).toFixed(2)}</span></div>
                        {selectedBill.taxType === 'CGST_SGST' && (
                          <>
                            <div className="flex justify-between"><span>CGST ({selectedBill.cgstPercentage}%):</span> <span>+ ₹{(selectedBill.cgstAmount || 0).toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>SGST ({selectedBill.sgstPercentage}%):</span> <span>+ ₹{(selectedBill.sgstAmount || 0).toFixed(2)}</span></div>
                          </>
                        )}
                        {selectedBill.taxType === 'IGST' && (
                          <div className="flex justify-between"><span>IGST ({selectedBill.igstPercentage}%):</span> <span>+ ₹{(selectedBill.igstAmount || 0).toFixed(2)}</span></div>
                        )}
                        <div className="flex justify-between text-base font-bold border-t-2 border-slate-300 pt-2 mt-1"><span>Grand Total:</span> <span>₹{(selectedBill.totalAmount || 0).toFixed(2)}</span></div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3">
                      <button onClick={() => { closeViewModal(); openEditModal(selectedBill._id); }} className="px-4 py-2 bg-amber-100 text-amber-700 rounded-xl">Edit</button>
                      <button onClick={() => { closeViewModal(); handleDeleteBill(selectedBill._id); }} className="px-4 py-2 bg-rose-50 text-rose-700 rounded-xl">Delete</button>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit Bill Modal */}
        <AnimatePresence>
          {isEditOpen && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="absolute inset-0 bg-black/50" onClick={() => setIsEditOpen(false)} />
              <motion.div
                className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-auto p-6 z-10 overflow-auto max-h-[80vh]"
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Edit Bill</h3>
                    <p className="text-sm text-slate-500">Modify and update the selected bill</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setIsEditOpen(false)}
                      className="text-slate-500 hover:text-slate-700 p-2 rounded-lg"
                    >
                      <X className="h-10 w-10 border border-black-100 rounded-full p-2" />
                    </button>
                  </div>
                </div>

                {isFetchingEditBill && (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-8 w-8 text-violet-600 animate-spin" />
                  </div>
                )}

                {editError && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-4">
                    <p className="text-rose-700">{editError}</p>
                  </div>
                )}

                {editSuccessMessage && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
                    <p className="text-emerald-700">{editSuccessMessage}</p>
                  </div>
                )}

                {Object.keys(editFormErrors || {}).length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-sm">
                    <p className="font-semibold text-amber-700">Fix the following errors:</p>
                    <ul className="list-disc list-inside text-amber-700">
                      {Object.values(editFormErrors).map((v, i) => (
                        <li key={i}>{v}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {!isFetchingEditBill && (
                  <form onSubmit={handleEditSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label htmlFor="editBillNumber" className="block text-xs lg:text-sm font-medium text-gray-700">Bill Number</label>
                        <input id="editBillNumber" value={edit_billNumber} onChange={(e) => setEditBillNumber(e.target.value)} className="mt-1 text-black block w-full p-2 text-xs lg:text-sm border border-gray-200 rounded-lg" />
                      </div>
                      <div>
                        <label htmlFor="editBillDate" className="block text-xs lg:text-sm font-medium text-gray-700">Bill Date</label>
                        <input id="editBillDate" type="date" value={edit_billDate} onChange={(e) => setEditBillDate(e.target.value)} className="mt-1 text-black block w-full p-2 text-xs lg:text-sm border border-gray-200 rounded-lg" />
                      </div>
                      <div>
                        <label htmlFor="editCompany" className="block text-xs lg:text-sm font-medium text-gray-700">Company</label>
                        <select id="editCompany" value={edit_companyId} onChange={(e) => setEditCompanyId(e.target.value)} className="mt-1 text-black block w-full p-2 text-xs lg:text-sm border border-gray-200 rounded-lg">
                          <option value="">Select Company</option>
                          {companies.map(comp => (
                            <option key={comp._id} value={comp._id}>{comp.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="editStatus" className="block text-xs lg:text-sm font-medium text-gray-700">Status</label>
                        <select id="editStatus" value={edit_status} onChange={(e) => setEditStatus(e.target.value)} className="mt-1 text-black block w-full p-2 text-xs lg:text-sm border border-gray-200 rounded-lg">
                          <option value="Pending">Pending</option>
                          <option value="Paid">Paid</option>
                          <option value="Partially Paid">Partially Paid</option>
                          <option value="Overdue">Overdue</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>

                    {/* Items - simplified inline editor to keep modal compact */}
                    <div className="border border-gray-200 p-3 rounded-lg">
                      <h4 className="text-sm text-gray-700 font-semibold mb-2">Items</h4>
                      <div className="space-y-2">
                        {edit_items.map((item, idx) => (
                          <div key={item.id || idx} className="grid grid-cols-1 lg:grid-cols-6 gap-2 items-end">
                            <div className="lg:col-span-2">
                              <input value={item.description} onChange={(e) => handleEditItemChange(idx, 'description', e.target.value)} placeholder="Description" className="w-full text-black p-2 border border-gray-200 rounded-lg text-sm" />
                            </div>
                            <div>
                              <input value={item.hsnSacCode} onChange={(e) => handleEditItemChange(idx, 'hsnSacCode', e.target.value)} placeholder="HSN/SAC" className="w-full text-black p-2 border border-gray-200 rounded-lg text-sm" />
                            </div>
                            <div>
                              <input type="number" value={item.quantity} onChange={(e) => handleEditItemChange(idx, 'quantity', e.target.value)} placeholder="Qty" className="w-full text-black p-2 border border-gray-200 rounded-lg text-sm" />
                            </div>
                            <div>
                              <input type="number" value={item.rate} onChange={(e) => handleEditItemChange(idx, 'rate', e.target.value)} placeholder="Rate" className="w-full text-black p-2 border border-gray-200 rounded-lg text-sm" />
                            </div>
                            <div className="text-sm text-black font-semibold">₹{(item.amount || 0).toFixed(2)}</div>
                            <div>
                              <button type="button" onClick={() => removeEditItem(idx)} className="text-red-500 text-xs">Remove</button>
                            </div>
                          </div>
                        ))}
                        <div>
                          <button type="button" onClick={addEditItem} className="text-indigo-600 text-sm">+ Add Item</button>
                        </div>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="border text-black border-gray-200 p-3 rounded-lg">
                      <div className="flex justify-between text-sm"><span>Subtotal</span><span>₹{editPreview.subTotal.toFixed(2)}</span></div>
                      <div className="flex justify-between text-sm"><span>Discount ({edit_discountPercentage}%)</span><span className="text-red-600">- ₹{editPreview.discount.toFixed(2)}</span></div>
                      <div className="flex justify-between text-sm font-medium border-t pt-1"><span>Amount After Discount:</span><span>₹{editPreview.amountAfterDiscount.toFixed(2)}</span></div>
                      {edit_taxType === 'CGST_SGST' && (
                        <>
                          <div className="flex justify-between text-sm"><span>CGST ({(parseFloat(edit_overrideCgstPercentage) || settings?.cgstPercentage || 0)}%)</span><span>+ ₹{editPreview.cgst.toFixed(2)}</span></div>
                          <div className="flex justify-between text-sm"><span>SGST ({(parseFloat(edit_overrideSgstPercentage) || settings?.sgstPercentage || 0)}%)</span><span>+ ₹{editPreview.sgst.toFixed(2)}</span></div>
                        </>
                      )}
                      {edit_taxType === 'IGST' && (
                        <div className="flex justify-between text-sm"><span>IGST ({(parseFloat(edit_overrideIgstPercentage) || settings?.igstPercentage || 0)}%)</span><span>+ ₹{editPreview.igst.toFixed(2)}</span></div>
                      )}
                      {edit_taxType === 'JOBCGST_JOBSGST' && (
                        <>
                          <div className="flex justify-between text-sm"><span>JOBCGST ({(parseFloat(edit_overrideJobCgstPercentage) || settings?.jobCgstPercentage || 0)}%)</span><span>+ ₹{editPreview.jobCgst.toFixed(2)}</span></div>
                          <div className="flex justify-between text-sm"><span>JOBSGST ({(parseFloat(edit_overrideJobSgstPercentage) || settings?.jobSgstPercentage || 0)}%)</span><span>+ ₹{editPreview.jobSgst.toFixed(2)}</span></div>
                        </>
                      )}
                      <div className="flex justify-between text-base font-bold border-t-2 border-slate-300 pt-2 mt-1"><span>Grand Total:</span><span>₹{editPreview.grandTotal.toFixed(2)}</span></div>
                    </div>

                    <div className="flex justify-end space-x-3">
                      <button type="button" onClick={() => setIsEditOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg">Cancel</button>
                      <button type="submit" disabled={isEditLoading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">{isEditLoading ? 'Updating...' : 'Update Bill'}</button>
                    </div>
                  </form>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BillListPage;
