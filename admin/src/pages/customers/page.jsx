
import { useState } from 'react';
import DataTable from '../../components/base/DataTable';
import Button from '../../components/base/Button';
import Modal from '../../components/base/Modal';
import Input from '../../components/base/Input';
import { useToast } from '../../components/base/Toast';
import { getData, postData, serverURL } from '../../services/FetchNodeServices';
import html2pdf from "html2pdf.js";


export default function CustomersPage() {

  const [user, setUser] = useState(() => {
    const storedUser = sessionStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const { showToast, ToastContainer } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Mock data
  const [customers, setCustomers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalData, setTotalData] = useState(0);
  const [totalActive, setTotalActive] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalInActive, setTotalInActive] = useState(0);
  const [companySettings, setCompanySettings] = useState('');
  const [teamAndConditions, setTeamAndConditions] = useState('');
  const [loading, setLoading] = useState(false);
  const [amcs, setAmcs] = useState([]);

  // Filter customers based on user role
  const getUserCustomers = () => {
    if (user?.role === 'admin') {
      return customers;
    } else if (user?.role === 'distributor') {
      const distributorAMCs = amcs.filter(amc => amc.distributorId === user.id);
      const customerIds = [...new Set(distributorAMCs.map(amc => amc.customerEmail))];
      return customers.filter(customer => customerIds.includes(customer.email));
    } else if (user?.role === 'retailer') {
      const retailerAMCs = amcs.filter(amc => amc.retailerId === user.id);
      const customerIds = [...new Set(retailerAMCs.map(amc => amc.customerEmail))];
      return customers.filter(customer => customerIds.includes(customer.email));
    }
    return [];
  };

  const userCustomers = getUserCustomers();

  // Filter data
  const filteredData = userCustomers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.mobile.includes(searchTerm);

    let matchesStatus = true;
    if (statusFilter === 'active') {
      matchesStatus = customer.activeAMCs > 0;
    } else if (statusFilter === 'inactive') {
      matchesStatus = customer.activeAMCs === 0;
    }

    return matchesSearch && matchesStatus;
  });

  const columns = [
    { key: 'name', title: 'Customer Name', sortable: true },
    { key: 'email', title: 'Email', sortable: true },
    { key: 'mobile', title: 'Mobile' },
    { key: 'totalAMCs', title: 'Total WECs', render: (value) => value || 0 },
    {
      key: 'activeAMCs', title: 'Active WECs', render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${value > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
          {value || 0}
        </span>
      )
    },
    { key: 'totalSpent', title: 'Total Spent', render: (value) => `₹${value.toLocaleString()}` },
    {
      key: 'updatedAt', title: 'Last Purchase', render: (value) =>
        new Date(value).toLocaleDateString('en-IN')
    }
  ];

  const handleViewDetails = (customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const renderActions = (record) => {
    // const customerAmcs = amcs?.filter(a =>
    //   (a?.customerEmail || "").trim().toLowerCase() ===
    //   (record?.email || "").trim().toLowerCase()
    // );

    return (
      <div className="flex space-x-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleViewDetails(record)}
        >
          <i className="ri-eye-line w-4 h-4 flex items-center justify-center"></i>
        </Button>

        {/* <Button
          size="sm"
          variant="ghost"
          onClick={() => handleSendEmail(record, customerAmcs)}
        >
          <i className="ri-mail-line w-4 h-4"></i>
        </Button> */}
      </div>
    );
  };

  // Get customer AMCs
  const getCustomerAMCs = async (customerEmail) => {
    try {
      const response = await getData(`api/amcs/get-amc-by-customer?customerEmail=${customerEmail}`);
      console.log("AMC response===>", response?.data)
      if (response?.status === true) {
        setAmcs(response?.data)
      }
    } catch (error) {
      console.log(error)
    }
  };

  useEffect(() => {
    if (selectedCustomer?.email) {
      getCustomerAMCs(selectedCustomer?.email);
    }
  }, [selectedCustomer]);

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  const fetchCustomers = async () => {
    try {
      const queryParamsObj = {
        limit: pageSize,
        page: currentPage,
        search: searchTerm
      };
      const queryParams = new URLSearchParams(queryParamsObj).toString();
      let response = await getData(`api/customer/get-customer-by-admin-with-pagination?${queryParams}`)

      console.log("CUSTOMER response===>", response)
      if (response?.status === true) {
        setCustomers(response?.data);
        setCurrentPage(response?.pagination?.currentPage || 1);
        setTotalPages(response?.pagination?.totalPages || 1);
        setTotalData(response?.pagination?.totalData || 0);
        setTotalActive(response?.pagination?.totalActive || 0);
        setTotalRevenue(response?.pagination?.totalRevenue || 0);
        setTotalInActive(response?.pagination?.totalInActive || 0);
      }
    } catch (error) {
      console.error('Error fetching AMC data:', error);
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [searchTerm, pageSize, currentPage])

  const formatAmount = (amount) => {
    if (amount >= 100000) return `${(amount / 100000).toFixed(2)}L`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(2)}k`;
    return amount.toString();
  };

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  ////////////////////////////////// Export Data ///////////////////////////////////////////////////////////////////////////////////
  const handleExportData = async () => {
    try {
      // Use full URL or a wrapper that returns the raw Response object
      const url = `${serverURL}/api/customer/export-customers`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('token') || ''}`,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Export failed: ${response.status} ${text}`);
      }

      const blob = await response.blob();

      // Detect filename from header if available
      const disposition = response.headers.get("content-disposition");
      let filename = "customers.xlsx";
      if (disposition && disposition.includes("filename=")) {
        const match = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^;"']+)/i);
        if (match && match[1]) {
          filename = decodeURIComponent(match[1].replace(/['"]/g, ""));
        }
      }

      const urlObject = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = urlObject;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(urlObject);
    } catch (error) {
      console.error("Export Error:", error);
      // show toast or user-friendly message
    }
  };


  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  //////////////////////////////////////////////////HANDLE PDF///////////////////////////////////////////////////////////////
  const handleDownloadPdf = (record) => {
    // Clone your HTML template and inject dynamic values
    console.log("GGGGGG:==>", record)
    const template = `
    <div class="invoice-box">
      <div class="header">
        <div class="header-left">
           <div class="logo">
            <img src="${companySettings?.logo || ''}" alt="Company Logo" style="width:70px;height:70px;object-fit:contain;border-radius:8px;">
          </div>
          <div class="company-info">
            <h2>${user?.name}</h2>
            <p>${user?.address || ''}</p>
            <p>${user?.phone} | ${user?.email}</p>
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
  
      <table class="meta-table">
        <tr><td>Customer Name</td><td>${record.customerName}</td></tr>
        <tr><td>Address</td><td>${record.customerAddress}</td></tr>
        <tr><td>Contact No.</td><td>${record.customerMobile}</td></tr>
        <tr><td>Email</td><td>${record.customerEmail}</td></tr>
      </table>
  
      <table class="details-table">
        <thead>
          <tr>
            <th>#</th><th>Product Name</th><th>Model</th><th>Serial No.</th>
            <th>Original Warranty</th><th>Extended Till</th><th>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>${record.productCategory} - ${record?.productBrand} ${record?.productType}</td>
            <td>${record.productModel}</td>
            <td>${record.serialNumber || 'N/A'}</td>
            <td>${new Date(record.startDate).toLocaleDateString('en-IN')}</td>
            <td>${new Date(record.endDate).toLocaleDateString('en-IN')}</td>
            <td>₹${record.amcAmount.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
  
      <div class="summary">
        <table>
          <tr><td>Subtotal</td><td>₹${record?.amcAmount}</td></tr>
        </table>
      </div>
  
      <div class="terms">
        <strong>Terms & Conditions:</strong>
         <div
      style={{
        border: "1px solid #ccc",
        padding: "15px",
        borderRadius: "8px",
        marginTop: "10px",
        background: "#fafafa",
      }}
      dangerouslySetInnerHTML={{ __html: ${teamAndConditions?.termsAndConditions} }}
    />
      </div>
  
      <div class="signature">
        <div><div class="sig-line"></div><div>Customer Signature</div></div>
        <div><div class="sig-line"></div><div>Authorized Signatory</div></div>
      </div>
  
      <div class="footer">
        Thank you for choosing ${record.companyName}. For support, call ${record.supportPhone} or email ${record.supportEmail}.
      </div>
    </div>
    `;

    // Create a temporary container to hold styled HTML
    const container = document.createElement("div");
    container.innerHTML = `
    <html>
    <head>
      <style>
        body {
          font-family: "Poppins", Arial, sans-serif;
          background: #f4f6f8;
          margin: 0;
          padding: 20px;
        }
        .invoice-box {
          max-width: 850px;
          margin: auto;
          background: #fff;
          padding: 25px 30px;
          border: 1px solid #e0e0e0;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
          border-radius: 8px;
        }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        .logo { width: 70px; height: 70px; background: #007bff; color: #fff; border-radius: 8px; font-weight: bold; font-size: 20px; display: flex; align-items: center; justify-content: center; }
        .company-info h2 { margin: 0; color: #007bff; }
        .invoice-title { text-align: center; font-size: 22px; font-weight: 600; color: #222; margin: 25px 0 10px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 14px; }
        th { background: #007bff; color: #fff; }
        .summary table td { border: 1px solid #ddd; }
        .terms { margin-top: 20px; font-size: 13px; color: #555; }
        .signature { display: flex; justify-content: space-between; margin-top: 40px; font-size: 14px; }
        .sig-line { margin-top: 50px; border-top: 1px solid #000; width: 200px; }
        .footer { text-align: center; font-size: 12px; color: #777; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px; }
      </style>
    </head>
    <body>${template}</body>
    </html>`;

    // Generate the PDF
    const opt = {
      margin: 0.5,
      filename: `WEC_${record.id}_${record.customerName.replace(/\s+/g, "_")}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    };

    html2pdf().set(opt).from(container).save();
  };



  const fetchTeamAndConditions = async () => {
    try {
      const response2 = await getData(`api/company/get-company-settings`);
      const response = await getData('api/company/get-AMC-settings');
      console.log("response==>get-team-and-conditions=>", response)
      if (response?.status === true) {
        setTeamAndConditions(response?.data);
        // setAmcPercentage(response?.data?.defaultPercentage);
      }
      if (response2?.status === true) {
        setCompanySettings(response2?.data);
      }
    } catch (error) {
      console.error('Error fetching team and conditions:', error);
    }
  }

  useEffect(() => {
    fetchTeamAndConditions();
  }, [])

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  const handleSendEmail = async (selectedCustomer, amcs) => {
    try {
      setLoading(true)
      const response = await postData(`api/customer/send-email`, { data: { ...selectedCustomer, amc: { amcs } } });
      if (response?.status === true) {
        setLoading(false)
        showToast(response?.message || 'Email sent successfully', 'success')
      } else {
        setLoading(false)
        showToast(response?.message || 'Email not sent', 'error')
      }
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <ToastContainer />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Customer Database</h1>
        <Button onClick={handleExportData}>
          <i className="ri-download-line mr-2 w-4 h-4 flex items-center justify-center"></i>
          Export Data
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">{totalData}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <i className="ri-user-heart-line text-white text-xl w-6 h-6 flex items-center justify-center"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Customers</p>
              <p className="text-2xl font-bold text-green-600">{totalActive}</p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <i className="ri-user-star-line text-white text-xl w-6 h-6 flex items-center justify-center"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inactive Customers</p>
              <p className="text-2xl font-bold text-gray-600">{totalInActive}</p>
            </div>
            <div className="w-12 h-12 bg-gray-500 rounded-lg flex items-center justify-center">
              <i className="ri-user-unfollow-line text-white text-xl w-6 h-6 flex items-center justify-center"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-purple-600">₹{formatAmount(totalRevenue)}</p>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <i className="ri-money-dollar-circle-line text-white text-xl w-6 h-6 flex items-center justify-center"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by name, email, or mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon="ri-search-line"
          />
        </div>
        <div className="w-full sm:w-48">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 pr-8"
            >
              <option value="all">All Customers</option>
              <option value="active">Active WECs</option>
              <option value="inactive">No Active WECs</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <i className="ri-arrow-down-s-line text-gray-400 w-4 h-4 flex items-center justify-center"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={filteredData}
        columns={columns}
        actions={renderActions}
        currentPage={currentPage}
        pageSize={pageSize}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
      />

      {/* Customer Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Customer Details"
        size="xl"
      >
        {selectedCustomer && (
          <div className="space-y-6">
            {/* Customer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Name</label>
                    <p className="text-gray-900">{selectedCustomer.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="text-gray-900">{selectedCustomer.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Mobile</label>
                    <p className="text-gray-900">{selectedCustomer.mobile}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Address</label>
                    <p className="text-gray-900">{selectedCustomer.address}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Purchase Summary</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Total WECs</label>
                    <p className="text-gray-900">{selectedCustomer.totalAMCs}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Active WECs</label>
                    <p className="text-gray-900">{selectedCustomer.activeAMCs}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Total Spent</label>
                    <p className="text-gray-900 font-semibold">₹{selectedCustomer?.totalSpent.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Customer Since</label>
                    <p className="text-gray-900">{new Date(selectedCustomer?.createdAt).toLocaleDateString('en-IN')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Last Purchase</label>
                    <p className="text-gray-900">{new Date(selectedCustomer?.updatedAt).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* AMC History */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">WEC History</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">WEC ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {amcs?.map((amc) => (
                      <tr key={amc?._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{amc?.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {amc?.productBrand} {amc?.productType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{amc?.amcAmount?.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(amc?.startDate)?.toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(amc?.endDate)?.toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${amc?.status === 'active' ? 'bg-green-100 text-green-800' :
                            amc?.status === 'expiring' ? 'bg-yellow-100 text-yellow-800' :
                              amc?.status === 'expired' ? 'bg-red-100 text-red-800' :
                                'bg-blue-100 text-blue-800'
                            }`}>
                            {amc?.status?.charAt(0)?.toUpperCase() + amc?.status?.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDownloadPdf(amc)}
                          >
                            <i className="ri-download-line w-4 h-4 flex items-center justify-center"></i>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="secondary"
                onClick={() => setIsModalOpen(false)}
              >
                Close
              </Button>
              <Button onClick={() => handleSendEmail(selectedCustomer, amcs)} disabled={!selectedCustomer?.email} variant="primary"  >
                <i className="ri-mail-line mr-2 w-4 h-4 flex items-center justify-center"></i>
                {loading ? 'Sending Email...' : 'Send Email'}
              </Button>
            </div>
          </div>
        )
        }
      </Modal >
    </div >
  );
}
