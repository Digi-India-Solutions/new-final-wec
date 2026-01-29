
import { useState } from 'react';
// import { useAuthStore } from '../../store/authStore';
import DataTable from '../../components/base/DataTable';
import Button from '../../components/base/Button';
import Modal from '../../components/base/Modal';
import SchemaForm from './AmcsForm';
import Input from '../../components/base/Input';
import { useToast } from '../../components/base/Toast';
import { getData, postData } from '../../services/FetchNodeServices';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2pdf from "html2pdf.js";


export default function AMCsPage() {
  // const { user } = useAuthStore();

  const [user, setUser] = useState(() => {
    const storedUser = sessionStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const { showToast, ToastContainer } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAMC, setEditingAMC] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedPackage, setSelectedPackage] = useState({ name: '', percentage: '', validity: '' });
  const [selectedType, setSelectedType] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [purchaseValue, setPurchaseValue] = useState('');
  const [amcPercentage, setAmcPercentage] = useState('8');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [totalActive, setTotalActive] = useState(0);
  const [totalExpiringSoon, setTotalExpiringSoon] = useState(0);
  const [totalExpired, setTotalExpired] = useState(0);
  const [allCategories, setAllCategories] = useState([]);
  const [allBrands, setAllBrands] = useState([]);
  const [allPackages, setAllPackages] = useState([]);
  const [allTypes, setAllTypes] = useState([]);
  const [teamAndConditions, setSetTeamAndConditions] = useState('');
  const [companySettings, setCompanySettings] = useState('');
  // Mock data
  const [amcs, setAmcs] = useState([]);

  const [packageForms, setPackageForms] = useState([
    { packageId: '', durationId: '', packageData: null, },
  ]);
  const [totalPercentage, setTotalPersentage] = useState(0);


  // Filter AMCs based on user role
  const getUserAMCs = () => {
    if (user?.role === 'admin') {
      return amcs;
    } else if (user?.role === 'distributor') {
      return amcs;
    } else if (user?.role === 'retailer') {
      return amcs.filter(amc => amc.retailerId === user.id);
    } else if (user?.role === 'promoter') {
      return amcs.filter(amc => amc.promoterId === user.id);
    } else {
      return amcs;
    }
    return [];
  };

  const userAMCs = getUserAMCs();

  // Calculate AMC amount
  const calculateAMCAmount = () => {
    const value = parseFloat(purchaseValue) || 0;
    const percentage = parseFloat(totalPercentage) || 0;
    return (value * percentage) / 100;
  };

  const amcFields = [
    { name: 'customerName', label: 'Customer Name', type: 'text', required: true },
    { name: 'customerEmail', label: 'Customer Email', type: 'email', required: true },
    { name: 'customerMobile', label: 'Customer Mobile', type: 'tel', required: true },
    { name: 'customerAddress', label: 'Customer Address', type: 'textarea', required: true },
    { name: 'productPicture', label: 'Upload Product Picture', type: 'file', required: true, accept: '.pdf,.jpg,.jpeg,.png' },
    { name: 'purchaseProof', label: 'Upload Purchase Proof', type: 'file', required: true, accept: '.pdf,.jpg,.jpeg,.png' },
    { name: 'serialNumber', label: 'Serial / IMEI Number', type: 'text', required: true },
    // { name: 'gst', label: 'GST Number', type: 'text', required: false },
  ];

  const columns = [
    { key: 'id', title: 'WEC ID', sortable: true },
    { key: 'customerName', title: 'Customer', sortable: true },
    { key: 'productCategory', title: 'Category' },
    { key: 'productBrand', title: 'Brand' },
    { key: 'productModel', title: 'Model' },
    { key: 'amcAmount', title: 'WEC Amount', render: (value) => `₹${value.toLocaleString()}` },
    {
      key: 'startDate', title: 'Start Date',
      // render: (value) => new Date(value).toLocaleDateString('en-IN')
    },
    {
      key: 'endDate', title: 'End Date',
      // render: (value) => new Date(value).toLocaleDateString('en-IN')
    },
    {
      key: 'status', title: 'Status', render: (value) => {
        const colors = {
          active: 'bg-green-100 text-green-800',
          expiring: 'bg-yellow-100 text-yellow-800',
          expired: 'bg-red-100 text-red-800',
          renewed: 'bg-blue-100 text-blue-800'
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[value] || 'bg-gray-100 text-gray-800'}`}>
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </span>
        );
      }
    }
  ];

  // Add retailer/distributor columns for admin
  if (user?.role === 'admin') {
    columns.splice(-1, 0,
      { key: 'retailerName', title: 'Retailer/Promoter' },
      { key: 'distributorName', title: 'Distributor' }
    );
  } else if (user?.role === 'distributor') {
    columns.splice(-1, 0, { key: 'retailerName', title: 'Retailer/Promoter' }, { key: 'distributorName', title: 'Distributor' });
  } else if (user?.role !== 'retailer' && user?.role !== 'distributor') {
    columns.splice(-1, 0,
      { key: 'retailerName', title: 'Retailer/Promoter' },
      { key: 'distributorName', title: 'Distributor' }
    );
  }

  const handleAdd = () => {
    setEditingAMC(null);
    setSelectedCategory('');
    setSelectedBrand('');
    setSelectedType('');
    setPurchaseValue('');
    // setAmcPercentage('');
    setIsModalOpen(true);
  };

  const handleEdit = (amc) => {
    setEditingAMC(amc);
    setIsModalOpen(true);
  };

  const handleRenew = async (amc) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      const renewedAMC = {
        ...amc,
        id: `${amc.id}-R${(amc.renewalCount || 0) + 1}`,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'active',
        renewalCount: (amc.renewalCount || 0) + 1,
        createdDate: new Date().toISOString().split('T')[0]
      };

      setAmcs(prev => [renewedAMC, ...prev]);
      showToast('WEC renewed successfully', 'success');
    } catch (error) {
      showToast('Renewal failed', 'error');
    } finally {
      setLoading(false);
    }
  };



  const handleSubmit = async (formData) => {
    if (!selectedCategory || !selectedBrand || !purchaseValue || !formData.customerName || !formData.customerAddress || !formData.productPicture || !formData.purchaseProof || !formData.serialNumber) {
      alert('Please fill all product details');
      // showToast('Please fill all product details', 'error');
      return;
    }
    console.log("formData==>", formData)
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      // const pkg = allPackages?.[0]?.find(
      //   (item) => String(item._id) === String(selectedId)
      // );
      console.log("AAAAA>>=>", allPackages?.find(
        (item) => String(item.categoryIds._id) === String(selectedCategory)
      ))

      const today = new Date();

      // startDate = today + 1 year
      const startDateObj = new Date(today);
      startDateObj.setFullYear(startDateObj.getFullYear() + 1);

      // endDate = startDate + 1 year - 1 day
      const endDateObj = new Date(startDateObj);
      endDateObj.setFullYear(endDateObj.getFullYear() + 1);
      endDateObj.setDate(endDateObj.getDate() - 1);

      // Format YYYY-MM-DD
      const startDate = startDateObj.toISOString().split('T')[0];
      const endDate = endDateObj.toISOString().split('T')[0];

      const category = allCategories.find(c => c._id === selectedCategory);
      const brand = allBrands.find(b => b._id === selectedBrand);
      const type = allTypes.find(t => t._id === selectedType);
      // const model = mockModels.find(m => m.id === selectedModel);

      const newAMC = {
        id: `WEC${String(Date.now()).slice(-3).padStart(3, '0')}`,
        ...formData,
        productCategory: category?.name || '',
        productBrand: brand?.name || '',
        productType: type?.name || '',
        categoryId: selectedCategory,
        brandId: selectedBrand,
        typeId: selectedType,
        productModel: selectedModel || '',
        purchaseValue: parseFloat(purchaseValue),
        amcPercentage: parseFloat(totalPercentage || amcPercentage),
        amcAmount: calculateAMCAmount(),
        purchaseProof: formData.purchaseProof || `purchase_proof_${Date.now()}.pdf`,
        startDate: startDate,
        endDate: endDate,
        status: 'active',
        retailerId: user?.role === 'retailer' ? user.id : '',
        retailerName: user?.role === 'retailer' ? user.name : '',
        distributorId: user?.role === 'distributor' ? user.id : '',
        distributorName: user?.role === 'distributor' ? user.name : '',
        createdDate: new Date().toISOString().split('T')[0],
        renewalCount: 0,
        lastServiceDate: null,
      };

      console.log("newAMC==>newAMC==>", newAMC)
      const formDataToSend = new FormData();

      // Append all AMC fields correctly
      formDataToSend.append("id", newAMC?.id || ""); formDataToSend.append("customerName", newAMC?.customerName || "");
      formDataToSend.append("customerAddress", newAMC?.customerAddress || ""); formDataToSend.append("customerMobile", newAMC?.customerMobile || ""); formDataToSend.append("customerEmail", newAMC?.customerEmail || ""); formDataToSend.append("createdByEmail", JSON.stringify(newAMC?.createdByEmail || {}));
      formDataToSend.append("productCategory", newAMC?.productCategory || ""); formDataToSend.append("productBrand", newAMC?.productBrand || "");
      formDataToSend.append("productType", newAMC?.productType || "");
      formDataToSend.append("productModel", newAMC?.productModel || ""); formDataToSend.append("serialNumber", newAMC?.serialNumber || "");
      formDataToSend.append("purchaseValue", newAMC?.purchaseValue || ""); formDataToSend.append("amcPercentage", newAMC?.amcPercentage || ""); formDataToSend.append("amcAmount", newAMC?.amcAmount || "");
      formDataToSend.append("PackageForms", JSON.stringify(packageForms) || newAMC?.PackageForms || "");
      formDataToSend.append("startDate", newAMC?.startDate || ""); formDataToSend.append("endDate", newAMC?.endDate || ""); formDataToSend.append("status", newAMC?.status || "active"); formDataToSend.append("retailerId", newAMC?.retailerId || "");
      formDataToSend.append("retailerName", newAMC?.retailerName || ""); formDataToSend.append("distributorId", newAMC?.distributorId || ""); formDataToSend.append("distributorName", newAMC?.distributorName || "");
      formDataToSend.append("createdDate", newAMC?.createdDate || ""); formDataToSend.append("renewalCount", newAMC?.renewalCount || 0); formDataToSend.append("lastServiceDate", newAMC?.lastServiceDate || "");
      formDataToSend.append("categoryId", newAMC?.categoryId || ""); formDataToSend.append("brandId", newAMC?.brandId || ""); formDataToSend.append("typeId", newAMC?.typeId || ""); formDataToSend.append("userId", user.id || "");
      // formDataToSend.append("gst", newAMC?.gst || "");
      // ✅ Append purchase proof image only if provided
      if (newAMC?.purchaseProof) {
        formDataToSend.append("purchaseProof", newAMC.purchaseProof);
      }
      if (newAMC?.productPicture) {
        formDataToSend.append("productPicture", newAMC.productPicture);
      }

      const endpoint = editingAMC ? `api/amcs/update-amc-by-admin/${editingAMC?._id}` : "api/amcs/create-amc-by-admin";

      // Send API request
      const response = await postData(endpoint, formDataToSend);

      console.log("newAMC==>GGG", newAMC, response)
      if (response?.status === true) {
        fetchAMCs()
        showToast('WEC created successfully', 'success');
        setIsModalOpen(false);
      } else {
        showToast(response?.massage || 'WEC creation failed', 'error');
      }

    } catch (error) {
      showToast('WEC creation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (record) => {
    try {
      const response = await getData(`api/amcs/delete-amc-by-admin/${record?._id}`);
      if (response?.status === true) {
        fetchAMCs();
        showToast('WEC deleted successfully', 'success');
      } else {
        showToast(response?.message || 'WEC deletion failed', 'error');
      }
    } catch (error) {
      showToast('WEC deletion failed', 'error');
    }
  }

  const renderActions = (record) => (
    <div className="flex space-x-2">
      <Button
        size="sm"
        variant="ghost"
        onClick={() => handleEdit(record)}
      >
        <i className="ri-eye-line w-4 h-4 flex items-center justify-center"></i>
      </Button>
      {(record.status === 'expired' || record.status === 'expiring') && (
        <Button
          size="sm"
          onClick={() => handleRenew(record)}
          disabled={loading}
        >
          <i className="ri-refresh-line w-4 h-4 flex items-center justify-center"></i>
        </Button>
      )}
      <Button
        size="sm"
        variant="ghost"
        onClick={() => handleDownloadPdf(record)}
      >
        <i className="ri-download-line w-4 h-4 flex items-center justify-center"></i>
      </Button>

      {user?.role === "admin" && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleDelete(record)}
        >
          <i className="ri-delete-bin-line w-4 h-4 flex items-center justify-center text-red-600"></i>
        </Button>
      )}

    </div>
  );

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  console.log("companySettings:===>", companySettings)
  //  <tr><td>Tax (18%)</td><td>₹${(record.amcAmount * 0.18).toFixed(2)}</td></tr>
  //         <tr><td>Total</td><td><strong>₹${(record.amcAmount * 1.18).toFixed(2)}</strong></td></tr>
  const getSelectedPackage = (pkg) =>
    pkg.packageData?.packages?.find(
      (p) => String(p._id) === String(pkg.durationId)
    );
  const formatDate = (date) =>
    date ? new Date(date) : '—';


  const handleDownloadPdf = (record) => {
    console.log("GGGGGG:==>", record)

    const packageRows = record.PackageForms?.map((pkg, index) => {
      const selectedPkg = getSelectedPackage(pkg);

      return `
      <tr>
        <td>${index + 1}</td>
        <td>
          ${record.productCategory} - ${record.productBrand}
          ${record.productType ? `(${record.productType})` : ''}
        </td>
        <td>${record.productModel}</td>
        <td>${record.serialNumber || 'N/A'}</td>
        <td>${pkg.packageData?.name || '—'}</td>
        <td>${selectedPkg?.validity || '—'}</td>
        <td>${(pkg.startDate.split('T')[0])}</td>
        <td>${(pkg.endDate.split('T')[0])}</td>
       
      </tr>
    `;
    }).join('');

    const template = `
    <div class="invoice-box">
      <div class="header">
        <div class="header-left">
           <div class="logo">
            <img src="${companySettings?.logo || ''}" alt="Company Logo" style="width:70px;height:70px;object-fit:contain;border-radius:8px;">
          </div>
          <div class="company-info">
           <h2>${companySettings?.name || 'EMI PLUS CARE'}</h2>
            <p>${companySettings?.address || 'C9/7 c-block diishad colony Delhi-95'}</p>
            <p>${companySettings?.phone || '+91 8929391113'} | ${companySettings?.email || 'Support@emipluscare.in'}</p>
          </div>
        </div>
        <div class="header-right">
          <table class="meta-table">
            <tr><td><strong>WEC No:</strong></td><td>${record?.id}</td></tr>
            <tr><td><strong>Date:</strong></td><td>${new Date().toLocaleDateString('en-IN')}</td></tr>
          </table>
        </div>
      </div>
  
      <div class="invoice-title">Warranty Extended Contract (WEC)</div>
  
      <table class="customer-table">
        <tr><th style="width: 30%;">Customer Name</th><td>${record.customerName}</td></tr>
        <tr><th>Address</th><td>${record.customerAddress}</td></tr>
        <tr><th>Contact No.</th><td>${record.customerMobile}</td></tr>
        <tr><th>Email</th><td>${record.customerEmail}</td></tr>
      </table>
  
      <table class="details-table">
        <thead>
         <tr>
            <th>#</th>
            <th>Product</th>
            <th>Model</th>
            <th>Serial No.</th>
            <th>Package Name</th>
            <th>Validity</th>
            <th>Valid From</th>
            <th>Valid Till</th>
          </tr>
        </thead>
        <tbody>
          ${packageRows || '<tr><td colspan="9">No Packages Found</td></tr>'}
        </tbody>
      </table>
  
      <div class="summary">
        <table>
          <tr><td>Subtotal</td><td>₹${record?.amcAmount}</td></tr>
        </table>
      </div>
  
      <div class="signature no-break">
        <div><strong>Note:</strong> Under the extended warranty, claims are limited to a maximum of 80% of the product's value (excluding GST). Please check the attachment for what is covered under our Terms & Conditions.</div>
      </div>

      <div class="signature no-break">
        <div>Thank you for choosing EMI PLUS CARE. For support, call us at +91 8929391113 or email us at support@emipluscare.in</div>
      </div>
  
        <div class="terms-content">
          ${teamAndConditions?.termsAndConditions || 'No terms and conditions available.'}
        </div>
    </div>
    `;

    // Create a temporary container to hold styled HTML
    const container = document.createElement("div");
    container.innerHTML = `
    <html>
    <head>
      <style>
        @page {
            margin: 15px;
        }
        
        body {
          font-family: "Poppins", Arial, sans-serif;
          background: #fff;
          margin: 0;
          padding: 15px;
          font-size: 12px;
          line-height: 1.4;
        }
        
        .invoice-box {
          max-width: 800px;
          margin: 0 auto;
          background: #fff;
          padding: 20px;
          border: 1px solid #e0e0e0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          border-radius: 6px;
          box-sizing: border-box;
        }
        
        .header { 
          display: flex; 
          justify-content: space-between; 
          align-items: flex-start; 
          border-bottom: 2px solid #007bff; 
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        
        .header-left {
          display: flex;
          align-items: flex-start;
          gap: 15px;
        }
        
        .company-info h2 { 
          margin: 0 0 5px 0; 
          color: #007bff; 
          font-size: 16px;
        }
        
        .company-info p {
          margin: 2px 0;
          font-size: 11px;
        }
        
        .meta-table {
          width: auto;
          min-width: 180px;
          font-size: 11px;
        }
        
        .meta-table td {
          padding: 4px 8px;
          border: 1px solid #ddd;
        }
        
        .invoice-title { 
          text-align: center; 
          font-size: 16px; 
          font-weight: 600; 
          color: #222; 
          margin: 20px 0; 
        }
        
        .customer-table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
          font-size: 11px;
        }
        
        .customer-table th, 
        .customer-table td { 
          border: 1px solid #ddd; 
          padding: 6px 8px; 
          text-align: left;
        }
        
        .customer-table th { 
          background: #007bff; 
          color: #fff; 
          font-weight: 600;
        }
        
        .details-table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
          font-size: 11px;
        }
        
        .details-table th, 
        .details-table td { 
          border: 1px solid #ddd; 
          padding: 6px 8px; 
          text-align: left;
          word-wrap: break-word;
        }
        
        .details-table th { 
          background: #007bff; 
          color: #fff; 
          font-weight: 600;
        }
        
        .summary table {
          width: auto;
          margin-left: auto;
          font-size: 11px;
        }
        
        .summary td {
          border: 1px solid #ddd;
          padding: 6px 12px;
        }
        
        .signature { 
          margin: 15px 0;
          padding: 8px;
          font-size: 11px;
          line-height: 1.3;
        }
        
        .terms-section {
          margin-top: 25px;
          page-break-before: always;
        }
        
        .terms-content {
           page-break-before: always;
            border: 1px solid #ccc;
            padding: 15px;
            border-radius: 6px;
            margin-top: 30px;
            font-size: 10px;
            line-height: 1.2;
            text-align: justify;
        }
        
        .terms-section strong {
          font-size: 11px;
        }
        
        /* Prevent text cutting and bad page breaks */
        .no-break {
          page-break-inside: avoid;
        }
        
        /* Ensure images don't overflow */
        img {
          max-width: 100%;
          height: auto;
        }
      </style>
    </head>
    <body>${template}</body>
    </html>`;

    // Generate the PDF with proper margins
    const opt = {
      margin: 0.5,
      filename: `WEC_${record.id}_${record.customerName.replace(/\s+/g, "_")}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false
      },
      jsPDF: {
        unit: "in",
        format: "a4",
        orientation: "portrait"
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    html2pdf().set(opt).from(container).save();
  };

  const fetchAMCs = async () => {
    try {
      let response = ''
      if (user?.role === 'retailer') {
        response = await getData(`api/amcs/get-amc-by-retailer-with-pagination/${user?.id}?page=${currentPage}&limit=${pageSize}&search=${searchTerm}&status=${statusFilter}&category=${categoryFilter}&brand=${'brandFilter'}&type=${'typeFilter'}`)
      } else if (user?.role === 'distributor') {
        response = await getData(`api/amcs/get-amc-by-distributor-with-pagination/${user?.id}?createdByEmail=${user?.email}&page=${currentPage}&limit=${pageSize}&search=${searchTerm}&status=${statusFilter}&category=${categoryFilter}&brand=${'brandFilter'}&type=${'typeFilter'}`);
      } else {
        response = await getData(`api/amcs/get-amc-by-admin-with-pagination?page=${currentPage}&limit=${pageSize}&search=${searchTerm}&status=${statusFilter}&category=${categoryFilter}&brand=${'brandFilter'}&type=${'typeFilter'}`);
      }


      console.log("responseGGG=>", response.pagination)
      if (response?.status === true) {
        setAmcs(response?.data);
        setCurrentPage(response?.pagination?.currentPage || 1);
        setTotalPages(response?.pagination?.totalPages || 1);
        setTotalData(response?.pagination?.totalAMCs || 0);
        setTotalActive(response?.pagination?.totalActiveAMCs || 0);
        setTotalExpired(response?.pagination?.totalExpiredAMCs || 0);
        setTotalExpiringSoon(response?.pagination?.totalExpiringSoonAMCs || 0);

      }
    } catch (error) {
      console.error('Error fetching AMC data:', error);
    }
  }

  console.log("responseGGG=>", amcs)
  const fetchAllCategories = async () => {
    try {
      const response = await getData(`api/category/get-All-category`);
      console.log("response==>get-All-category=>", response)
      if (response?.status === true) {
        setAllCategories(response?.data);
      }
    } catch (error) {
      console.log(error)
    }
  }

  const fetchTeamAndConditions = async () => {
    try {
      const response2 = await getData(`api/company/get-company-settings`);
      const response = await getData('api/company/get-AMC-settings');
      console.log("response==>get-team-and-conditions=>", response)
      if (response?.status === true) {
        setSetTeamAndConditions(response?.data);
        setAmcPercentage(response?.data?.defaultPercentage || 8);
      }
      if (response2?.status === true) {
        setCompanySettings(response2?.data);
      }
    } catch (error) {
      console.error('Error fetching team and conditions:', error);
    }
  }


  useEffect(() => {
    fetchAMCs()
    fetchAllCategories();
    fetchTeamAndConditions();
  }, [currentPage, pageSize, searchTerm, statusFilter, categoryFilter, purchaseValue]);

  const fetchAllBrandsByCategory = async () => {
    try {
      const response = await getData(`api/brand/get-brand-by-category/${selectedCategory}`);
      const response2 = await getData(`api/packages/get-packages-by-category/${selectedCategory}`);
      console.log("response==>get-brand-by-category=>", response2?.data)
      if (response?.status === true) {
        setAllBrands(response?.data);
      }
      if (response2?.status === true) {
        if (response2?.data?.length > 0) {
          setAllPackages(response2?.data);
        } else {
          setAllPackages([])
        }

      }
    } catch (error) {
      console.log(error)
    }
  }

  const fetchAllTypesByBrand = async () => {
    try {
      const response = await getData(`api/type/get-type-by-brand/${selectedCategory}`);
      console.log("response==>get-brand-by-category=>", response)
      if (response?.status === true) {
        setAllTypes(response?.data);
      }
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    fetchAllBrandsByCategory();
    fetchAllTypesByBrand();
  }, [selectedCategory, selectedBrand, selectedType]);


  const addPackageForm = () => {
    setPackageForms((prev) => [
      ...prev,
      { packageId: '', durationId: '', packageData: null },
    ]);
  };


  const removePackageForm = (index) => {
    setPackageForms((prev) => prev.filter((_, i) => i !== index));

    const totalPercentage = packageForms.filter((_, i) => i !== index).reduce((sum, item) => {
      const selectedPkg = item.packageData?.packages?.find(
        (p) => String(p._id) === String(item.durationId)
      );

      return sum + Number(selectedPkg?.percentage || 0);
    }, 0);
    setTotalPersentage(totalPercentage)

  };

  const handlePackageNameChange = (index, value) => {
    const selectedPkg = allPackages.find((p) => p._id === value);
    const updated = [...packageForms];
    updated[index].packageId = value;
    updated[index].durationId = '';
    updated[index].packageData = selectedPkg;
    setPackageForms(updated);
    // console.log("XXXXXXX::=>", allPackages.filter((p) => p._id !== value) )
    // setAllPackages(allPackages.filter((p) => p._id !== value));

  };

  // const handlePackageDurationChange = (index, value) => {
  //   const updated = [...packageForms];
  //   const selectedPkg = updated.map((item) => item.packageData.packages.find((p) => p._id === value));
  //   updated[index].durationId = value;

  //   console.log("selectedPkg=>", updated[index].packageData.validFrom, selectedPkg)
  //   // updated[index].packageData = selectedPkg;
  //   if (updated[index].packageData.validFrom === 'Same Day') {
  //     updated[index].startDate = new Date();// today  example: 2025-09-12
  //     if (selectedPkg[0]?.validity === "1 year") {
  //       updated[index].endDate = new Date(selectedPkg[0]?.validTo); //add 12 month  example: 2026-09-12
  //     }
  //     if (selectedPkg[0]?.validity === "2 year") {
  //       updated[index].endDate = new Date(selectedPkg[0]?.validTo); //add 24 month  example: 2026-09-12
  //     }
  //     if (selectedPkg[0]?.validity === "6 months") {
  //       updated[index].endDate = new Date(selectedPkg[0]?.validTo); //add 6 month  example: 2026-09-12
  //     }

  //   } else if (updated[index].packageData.validFrom === 'after 365 day') {
  //     updated[index].startDate = new Date(); // after 365 day  example: 2026-09-12
  //     if (selectedPkg[0]?.validity === "1 year") {
  //       updated[index].endDate = new Date(selectedPkg[0]?.validTo); //add 12 month  example: 2027-09-11
  //     }
  //     if (selectedPkg[0]?.validity === "2 year") {
  //       updated[index].endDate = new Date(selectedPkg[0]?.validTo); //add 24 month  example: 2028-09-11
  //     }
  //     if (selectedPkg[0]?.validity === "6 months") {
  //       updated[index].endDate = new Date(selectedPkg[0]?.validTo); //add 6 month  example: 2027-03-11
  //     }
  //   }

  //   const totalPercentage = updated.reduce((sum, item) => {
  //     const selectedPkg = item.packageData?.packages?.find(
  //       (p) => String(p._id) === String(item.durationId)
  //     );

  //     return sum + Number(selectedPkg?.percentage || 0);
  //   }, 0);
  //   setTotalPersentage(totalPercentage)
  //   setPackageForms(updated);


  //   console.log("XXXXXXX:=>", totalPercentage)
  // };


  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  const addDays = (date, days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  };

  const addMonths = (date, months) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
  };

  const validityToMonths = (validity) => {
    if (!validity) return 0;
    if (validity.includes('month')) return parseInt(validity);
    if (validity.includes('year')) return parseInt(validity) * 12;
    return 0;
  };
  const handlePackageDurationChange = (index, value) => {
    const updated = [...packageForms];
    const row = updated[index];

    // find selected duration package
    const selectedDuration = row.packageData?.packages?.find(
      (p) => String(p._id) === String(value)
    );

    if (!selectedDuration) return;

    // save durationId
    row.durationId = value;

    // calculate start date
    const today = new Date();
    let startDate = today;

    if (row.packageData.validFrom === 'after 365 day') {
      startDate = addDays(today, 365);
    }

    // calculate end date
    const months = validityToMonths(selectedDuration.validity);
    const endDate = addMonths(startDate, months);

    // save calculated values
    row.startDate = startDate;
    row.endDate = endDate;

    row.selectedPackage = {
      _id: selectedDuration._id,
      validity: selectedDuration.validity,
      percentage: Number(selectedDuration.percentage),
    };

    // calculate total percentage
    const totalPercentage = updated.reduce((sum, item) => {
      return sum + Number(item.selectedPackage?.percentage || 0);
    }, 0);

    setTotalPersentage(totalPercentage);
    setPackageForms(updated);

    console.log('Updated Row:', row);
    console.log('Total Percentage:', totalPercentage);
  };

  console.log("amcs=>", amcs);
  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-full overflow-hidden">
      <ToastContainer />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">WEC Management</h1>
        {(user?.role === 'retailer' || user?.role === 'distributor' || user?.role === 'promoter') && (
          <Button onClick={handleAdd}>
            <i className="ri-add-line mr-2 w-4 h-4 flex items-center justify-center"></i>
            Create WEC
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total WECs</p>
              <p className="text-2xl font-bold text-gray-900">{totalData}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <i className="ri-file-shield-line text-white text-xl w-6 h-6 flex items-center justify-center"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">{totalActive}</p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <i className="ri-checkbox-circle-line text-white text-xl w-6 h-6 flex items-center justify-center"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
              <p className="text-2xl font-bold text-yellow-600">{totalExpiringSoon}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
              <i className="ri-alarm-warning-line text-white text-xl w-6 h-6 flex items-center justify-center"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Expired</p>
              <p className="text-2xl font-bold text-red-600">{totalExpired}</p>
            </div>
            <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
              <i className="ri-close-circle-line text-white text-xl w-6 h-6 flex items-center justify-center"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by customer name, email, or WEC ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon="ri-search-line"
          />
        </div>
        <div className="w-full lg:w-48">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 pr-8"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="expiring">Expiring</option>
              <option value="expired">Expired</option>
              <option value="renewed">Renewed</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <i className="ri-arrow-down-s-line text-gray-400 w-4 h-4 flex items-center justify-center"></i>
            </div>
          </div>
        </div>
        <div className="w-full lg:w-48">
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 pr-8"
            >
              <option value="all">All Categories</option>
              {allCategories.map(category => (
                <option key={category?._id} value={category?.name}>{category?.name}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <i className="ri-arrow-down-s-line text-gray-400 w-4 h-4 flex items-center justify-center"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={userAMCs}
        columns={columns}
        actions={renderActions}
        currentPage={currentPage}
        pageSize={pageSize}
        total={totalData}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
      />

      {/* Create/Edit AMC Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAMC ? 'WEC Details' : 'Create New WEC'}
        size="xl"
      >
        {editingAMC ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Name</label>
                    <p className="text-gray-900">{editingAMC?.customerName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="text-gray-900">{editingAMC?.customerEmail}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Mobile</label>
                    <p className="text-gray-900">{editingAMC?.customerMobile}</p>
                  </div>
                  {editingAMC?.productPicture && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Product Picture</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                          {editingAMC?.productPicture ? <img src={editingAMC?.productPicture} alt="Product Picture" className="w-full h-full object-cover rounded" /> : <i className="ri-file-line text-blue-600 w-4 h-4 flex items-center justify-center"></i>}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            try {

                              let downloadUrl = editingAMC?.productPicture;

                              if (downloadUrl.includes("/upload/")) {
                                downloadUrl = downloadUrl.replace("/upload/", "/upload/fl_attachment/");
                              }

                              // Create and trigger a temporary link
                              const link = document.createElement("a");
                              link.href = downloadUrl;
                              link.download = editingAMC.purchaseProof.split("/").pop() || "purchase-proof";
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);

                              showToast("File downloaded successfully", "success");
                            } catch (error) {
                              console.error("Error downloading image:", error);
                              showToast("Failed to download file", "error");
                            }
                          }}
                        >
                          View / Download
                        </Button>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-600">Address</label>
                    <p className="text-gray-900">{editingAMC.customerAddress}</p>
                  </div>

                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Product</label>
                    <p className="text-gray-900">{editingAMC.productCategory} - {editingAMC.productBrand} {editingAMC.productType}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Model</label>
                    <p className="text-gray-900">{editingAMC.productModel}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Serial / IMEI Number</label>
                    <p className="text-gray-900">{editingAMC.serialNumber || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Purchase Value</label>
                    <p className="text-gray-900">₹{editingAMC.purchaseValue.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">WEC Amount ({editingAMC.amcPercentage}%)</label>
                    <p className="text-gray-900 font-semibold">₹{editingAMC.amcAmount.toLocaleString()}</p>
                  </div>
                  {editingAMC?.purchaseProof && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Purchase Proof</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                          {editingAMC?.purchaseProof ? <img src={editingAMC?.purchaseProof} alt="Purchase Proof" className="w-full h-full object-cover rounded" /> : <i className="ri-file-line text-blue-600 w-4 h-4 flex items-center justify-center"></i>}

                          {/* <i className="ri-file-line text-blue-600 w-4 h-4 flex items-center justify-center"></i> */}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            try {
                              // 🧠 Force Cloudinary to download by adding `fl_attachment` to the URL
                              let downloadUrl = editingAMC.purchaseProof;

                              if (downloadUrl.includes("/upload/")) {
                                downloadUrl = downloadUrl.replace("/upload/", "/upload/fl_attachment/");
                              }

                              // Create and trigger a temporary link
                              const link = document.createElement("a");
                              link.href = downloadUrl;
                              link.download = editingAMC.purchaseProof.split("/").pop() || "purchase-proof";
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);

                              showToast("File downloaded successfully", "success");
                            } catch (error) {
                              console.error("Error downloading image:", error);
                              showToast("Failed to download file", "error");
                            }
                          }}
                        >
                          View / Download
                        </Button>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>

            {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">WEC Details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">WEC ID</label>
                    <p className="text-gray-900">{editingAMC.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Start Date</label>
                    <p className="text-gray-900">{editingAMC.startDate}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">End Date</label>
                    <p className="text-gray-900">{editingAMC.endDate}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${editingAMC.status === 'active' ? 'bg-green-100 text-green-800' :
                      editingAMC.status === 'expiring' ? 'bg-yellow-100 text-yellow-800' :
                        editingAMC.status === 'expired' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                      }`}>
                      {editingAMC.status.charAt(0).toUpperCase() + editingAMC.status.slice(1)}
                    </span>
                  </div>
                </div>

              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Information</h3>
                <div className="space-y-3">
                  {editingAMC?.retailerName &&
                    <div>
                      <label className="text-sm font-medium text-gray-600">Retailer</label>
                      <p className="text-gray-900">{editingAMC.retailerName}</p>
                    </div>}
                  {editingAMC?.distributorName &&
                    <div>
                      <label className="text-sm font-medium text-gray-600">Distributor</label>
                      <p className="text-gray-900">{editingAMC.distributorName}</p>
                    </div>}
                
                </div>
              </div>


            </div> */}

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Package Information
              </h3>

              <div className="space-y-4">
                {/* Retailer */}
                {editingAMC?.retailerName && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Retailer</label>
                    <p className="text-gray-900">
                      {editingAMC.retailerName || 'N/A'}
                    </p>
                  </div>
                )}

                {/* Distributor */}
                {editingAMC?.distributorName && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Distributor</label>
                    <p className="text-gray-900">{editingAMC.distributorName}</p>
                  </div>
                )}

                {/* Packages */}
                {editingAMC?.PackageForms?.length > 0 ? (
                  editingAMC.PackageForms.map((pkg, index) => {
                    const selectedPkg = pkg.packageData?.packages?.find(
                      (p) => p._id === pkg.durationId
                    );

                    return (
                      <div
                        key={pkg._id || index}
                        className="border rounded-lg p-4 bg-gray-50 space-y-2"
                      >
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            Package #{index + 1}
                          </span>
                          <span className="text-xs text-gray-500">
                            {pkg.packageData?.name}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div style={{ display: 'flex' }}>
                            <label className="text-gray-600">Validity :- </label>
                            <p className="text-gray-900">
                              {selectedPkg?.validity || '—'}
                            </p>
                          </div>

                          {/* <div>
                <label className="text-gray-600">Percentage</label>
                <p className="text-gray-900">
                  {selectedPkg?.percentage
                    ? `${selectedPkg.percentage}%`
                    : '—'}
                </p>
              </div> */}

                          <div style={{ display: 'flex' }}>
                            <label className="text-gray-600">Start Date :- </label>
                            <p className="text-gray-900">
                              {pkg.startDate
                                ? new Date(pkg.startDate).toLocaleDateString('en-IN')
                                : '—'}
                            </p>
                          </div>

                          <div style={{ display: 'flex' }}>
                            <label className="text-gray-600">End Date :- </label>
                            <p className="text-gray-900">
                              {pkg.endDate
                                ? new Date(pkg.endDate).toLocaleDateString('en-IN')
                                : '—'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-500">No packages assigned</p>
                )}
              </div>
            </div>


            <div className="flex justify-end space-x-3">
              <Button
                variant="secondary"
                onClick={() => setIsModalOpen(false)}
              >
                Close
              </Button>
              <Button
                onClick={() => handleDownloadPdf(editingAMC)}
              >
                <i className="ri-download-line mr-2 w-4 h-4 flex items-center justify-center"></i>
                Download PDF
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Customer Information Form */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
              <SchemaForm
                fields={amcFields}
                initialData={{}}
                onSubmit={handleSubmit}
                onCancel={() => setIsModalOpen(false)}
                loading={loading}
                submitText="Create WEC"
              />
            </div>

            {/* Product Selection */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <div className="relative">
                    <select
                      required={true}
                      value={selectedCategory}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value);
                        setSelectedBrand('');
                        setSelectedType('');
                      }}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 pr-8"
                    >
                      <option value="">Select Category</option>
                      {allCategories?.map(category => (
                        <option key={category._id} value={category._id}>{category.name}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <i className="ri-arrow-down-s-line text-gray-400 w-4 h-4 flex items-center justify-center"></i>
                    </div>
                  </div>
                </div>

                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Packages (Duration) *
                  </label>

                  <div className="relative">
                    <select
                      required
                      value={selectedPackage?._id || ''}
                      onChange={handlePackageChange}
                      disabled={!selectedCategory}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                 focus:border-blue-500 focus:outline-none focus:ring-1
                 focus:ring-blue-500 pr-8 disabled:bg-gray-100"
                    >
                      <option value="">Select Package</option>

                      {allPackages?.[0]?.map((item) => (
                        <option key={item._id} value={item._id}>
                          {item.validity}
                        </option>
                      ))}
                    </select>

                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <i className="ri-arrow-down-s-line text-gray-400"></i>
                    </div>
                  </div>
                </div> */}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand *</label>
                  <div className="relative">
                    <select
                      required={true}
                      value={selectedBrand}
                      onChange={(e) => {
                        setSelectedBrand(e.target.value);
                        setSelectedType('');
                      }}
                      disabled={!selectedCategory}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 pr-8 disabled:bg-gray-100"
                    >
                      <option value="">Select Brand</option>
                      {allBrands?.map(brand => (
                        <option key={brand._id} value={brand._id}>{brand?.name}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <i className="ri-arrow-down-s-line text-gray-400 w-4 h-4 flex items-center justify-center"></i>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <div className="relative">
                    <select
                      value={selectedType}
                      required={true}
                      onChange={(e) => setSelectedType(e.target.value)}
                      disabled={!selectedBrand}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 pr-8 disabled:bg-gray-100"
                    >
                      <option value="">Select Type</option>
                      {allTypes?.map(type => (
                        <option key={type._id} value={type._id}>{type?.name}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <i className="ri-arrow-down-s-line text-gray-400 w-4 h-4 flex items-center justify-center"></i>
                    </div>
                  </div>
                </div>


                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                  <div className="relative">
                    <input
                      type="text"
                      required={true}
                      name="productModel"
                      disabled={!selectedType}
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      placeholder="Enter model name"
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <i className="ri-pencil-line text-gray-400 w-4 h-4 flex items-center justify-center"></i>
                    </div>
                  </div>
                </div>

                <Input
                  type="number"
                  label="Purchase Value *"
                  value={purchaseValue}
                  required={true}
                  onChange={(e) => setPurchaseValue(e.target.value)}
                  placeholder="Enter purchase value"
                  icon="ri-money-rupee-circle-line"
                />

                {/* <Input
                  type="number"
                  label="AMC Percentage *"
                  hidden={true}
                  value={amcPercentage}
                  onChange={(e) => setAmcPercentage(e.target.value)}
                  placeholder="Enter AMC percentage"
                  icon="ri-percent-line"
                /> */}
              </div>

              {purchaseValue && totalPercentage && (
                <div className="mt-4 bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">WEC Amount:</span>
                    <span className="text-xl font-bold text-blue-600">
                      ₹{calculateAMCAmount().toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  {/* <p className="text-xs text-gray-500 mt-1">
                    ₹{parseFloat(purchaseValue).toLocaleString('en-IN')} × {amcPercentage}% = ₹{calculateAMCAmount().toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </p> */}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Package Information
              </h3>

              {packageForms.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 border rounded-lg"
                >
                  {/* Package Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Package Name *
                    </label>
                    <select
                      value={item.packageId}
                      onChange={(e) =>
                        handlePackageNameChange(index, e.target.value)
                      }
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="">Select Package</option>
                      {allPackages
                        .filter((pkg) =>
                          !packageForms.some(
                            (p, i) =>
                              i !== index && String(p.packageId) === String(pkg._id)
                          )
                        )
                        .map((pkg) => (
                          <option key={pkg._id} value={pkg._id}>
                            {pkg.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Package Duration */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Packages (Duration) *
                    </label>
                    <select
                      value={item.durationId}
                      onChange={(e) =>
                        handlePackageDurationChange(index, e.target.value)
                      }
                      disabled={!item.packageId}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
                    >
                      <option value="">Select Duration</option>
                      {allPackages
                        .find((p) => p._id === item.packageId)
                        ?.packages?.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.validity}
                            {/* ({p.percentage}%) */}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Display Selected Package Info */}
                  {/* {item.packageData && (
                    <div className="md:col-span-2 text-sm text-gray-600">
                      <strong>Validity:</strong> {item.packageData.packages.filter((p) => p._id === item.durationId)?.validity} |{' '}
                      <strong>Discount:</strong> {item.packageData.percentage}%
                    </div>
                  )} */}

                  {/* Remove Button */}
                  {packageForms.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePackageForm(index)}
                      className="md:col-span-2 text-red-500 text-sm"
                    >
                      Remove Package
                    </button>
                  )}
                </div>
              ))}

              {/* Add Button */}
              <button
                type="button"
                onClick={addPackageForm}
                className="text-blue-600 text-sm font-medium"
              >
                + Add Another Package
              </button>
            </div>

          </div>
        )}
      </Modal>
    </div>
  );
}
