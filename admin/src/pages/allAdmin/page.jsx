
import { use, useEffect, useState } from 'react';
import DataTable from '../../components/base/DataTable';
import Button from '../../components/base/Button';
import Modal from '../../components/base/Modal';
import SchemaForm from './UserSchemaForm';
import ConfirmDialog from '../../components/base/ConfirmDialog';
import Input from '../../components/base/Input';
import { useToast } from '../../components/base/Toast';
import { ToastContainer, toast } from "react-toastify"
import { getData, postData } from '../../services/FetchNodeServices';
import AdminWalletCalculator from './AdminWalletCalculator';
import html2pdf from "html2pdf.js";
import * as XLSX from "xlsx";


export default function UsersPage() {

    const [user, setUser] = useState(() => {
        const storedUser = sessionStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    const { showToast, ToastContainer } = useToast();
    const [activeTab, setActiveTab] = useState(user?.role === 'distributor' ? 'retailer' : 'user-admin');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [deletingUser, setDeletingUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalData, setTotalData] = useState(0);
    const [retailerTotal, setRetailerTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10); // [pageSize]
    const [data, setData] = useState([]);
    const [rolePermissions, setRolePermissions] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [transactionType, setTransactionType] = useState('credit');
    const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
    const [isTranjectionModalOpen, setIsTranjectionModalOpen] = useState(false)
    const [userTransactions, setUserTransactions] = useState([]);

    const [adminWEC, setAdminWEC] = useState([]);

    const [transactionUserId, setTransactionUserId] = useState([user?.id]);
    const [transactionCurrentPage, setTransactionCurrentPage] = useState(1);
    const [transactionPageSize, setTransactionPageSize] = useState(10);
    const [transactionTotalPages, setTransactionTotalPages] = useState(1);
    const [transactionTotalData, setTransactionTotalData] = useState(1);
    const [isWECModalOpen, setIsWECModalOpen] = useState(false)

    const [teamAndConditions, setSetTeamAndConditions] = useState('');
    const [companySettings, setCompanySettings] = useState('');
    const [isViewWecModalOpen, setIsViewWecModalOpen] = useState(false);
    const [editingAMC, setEditingAMC] = useState(null);

    // Mock data
    const [distributors, setDistributors] = useState(data.filter(user => user?.role === 'distributor'));
    const availableUsers = data;

    const [canRead, canWrite, canEdit, canDelete] = (() => {
        // Default admin/distributor/retailer logic
        if (['admin'].includes(user?.role)) return [true, true, true, true];
        if (['distributor'].includes(user?.role)) return [true, true, true, true];
        if (['retailer'].includes(user?.role)) return [false, false, false, false];

        // Dynamic staff role permissions
        const modulePerm = rolePermissions?.find(
            (m) => m.module === 'User Management'
        );
        if (!modulePerm) return [false, false, false, false];

        return [
            modulePerm.permissions.includes('read'),
            modulePerm.permissions.includes('write'),
            modulePerm.permissions.includes('edit'),
            modulePerm.permissions.includes('delete'),
        ];
    })();

    const fetchAdminData = async () => {
        try {
            const queryParams = new URLSearchParams({
                limit: pageSize.toString(),
                page: currentPage.toString(),
                search: searchTerm || '',
                role: 'admin',
                status: statusFilter || '',
            }).toString();

            const response = await getData(`api/user-admin/getUserAdminUsersByAdminwithPagination?${queryParams}`);
            console.log('ADMINresponse==>', response)
            if (response?.status) {
                if (activeTab === 'distributor') {
                    setTotalData(response.pagination.total);
                    setRetailerTotal(response.pagination.totalRetailers)
                } else {
                    setRetailerTotal(response.pagination.total)
                }

                setData(response.data);
                setPage(response.pagination.totalPages);
                setPageSize(response.pagination.pageSize);
                // setTotalData(response.pagination.total);
                // console.log('Fetched Admin Users:', response.data);
                // Optionally update state here
            } else {
                console.warn('Failed to fetch admin users:', response.message);
            }
        } catch (error) {
            console.error('Error fetching admin users:', error);
        }
    };

    useEffect(() => {
        fetchAdminData();
    }, [currentPage, searchTerm, statusFilter, activeTab]);


    const fetchUserRoleData = async () => {
        try {
            const response = await getData(`api/admin/get-admin-users-by-id/${user?.id}`);
            // console.log('response==>getAdminUsersByAdmin', response)
            if (response?.status) {
                // setUsersData(response.data.role);
                setRolePermissions(response.data?.staffRole?.permissions);
            } else {
                console.warn('Failed to fetch admin users:', response.message);
            }
        } catch (error) {
            console.error('Error fetching admin users:', error);
        }
    }

    useEffect(() => {
        fetchUserRoleData();
    }, [activeTab]);

    const adminFields = [
        { name: 'ownerName', label: 'Owner Name', type: 'text', required: true },
        { name: 'name', label: 'Store Name', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'phone', label: 'Mobile', type: 'number', required: true },
        { name: 'password', label: 'Password', type: 'password', required: !editingUser, oldpassword: !['distributor', 'retailer'].includes(user?.role) && editingUser?.showpassword },
        { name: 'address', label: 'Address', type: 'textarea', required: false },
        { name: 'gst', label: 'GST', type: 'text', required: false },
        { name: 'url', label: 'Add Domain url', type: 'text', required: false },
        {
            name: 'status', label: 'Status', type: 'select', required: true, options: [
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' }
            ]
        }
    ];

    const balanceColumns = [
        { key: 'name', title: 'Name', sortable: true },
        {
            key: 'role', title: 'role', render: (value) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${value === 'distributor' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                    {value?.charAt(0)?.toUpperCase() + value?.slice(1)}
                </span>
            )
        },
        { key: 'email', title: 'Email' },
        {
            key: 'walletBalance', title: 'Wallet Balance', render: (value) => (
                <span className="font-semibold text-green-600">₹{value?.toLocaleString()}</span>
            )
        },
        {
            key: 'status', title: 'Status', render: (value) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${value === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                    {value?.charAt(0)?.toUpperCase() + value?.slice(1)}
                </span>
            )
        }
    ];

    const transactionColumns = [
        {
            key: 'createdDate', title: 'Date', render: (value) =>
                new Date(value).toLocaleDateString('en-IN')
        },

        {
            key: 'createdAt',
            title: 'Time',
            render: (value) => new Date(value).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        },

        // { key: 'userName', title: 'User', sortable: true },

        // {
        //   key: 'userType', title: 'Type', render: (value) => (
        //     <span className={`px-2 py-1 rounded-full text-xs font-medium ${value === 'distributor' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
        //       }`}>
        //       {value.charAt(0).toUpperCase() + value.slice(1)}
        //     </span>
        //   )
        // },
        {
            key: 'type', title: 'Transaction', render: (value) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${value === 'credit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                    {value === 'credit' ? 'Credit' : 'Debit'}
                </span>
            )
        },
        {
            key: 'amount', title: 'Amount', render: (value, record) => (
                <span className={`font-semibold ${record.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                    {record.type === 'credit' ? '+' : '-'}₹{value.toLocaleString()}
                </span>
            )
        },
        { key: 'description', title: 'Description' },
        { key: 'createdBy', title: 'Created By' }
    ];

    const adminColumns = [
        { key: 'name', title: 'Store Name', sortable: true },
        { key: 'email', title: 'Email', sortable: true },
        { key: 'phone', title: 'Mobile' },
        { key: 'createdAt', title: 'Date of Joining', render: (value) => new Date(value).toLocaleDateString('en-IN') },
        ...(user?.role !== 'distributor' && user?.role !== 'retailer' ? [{ key: 'DistributorId', title: 'Created By', sortable: true }] : []),
        { key: 'totalAMCs', title: 'Total WECs', render: (value) => value || 0 },
        { key: 'walletBalance', title: 'Wallet Balance', render: (value) => `₹${value.toLocaleString()}` },
        {

            key: 'status', title: 'Status', render: (value) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${value === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                    {value.charAt(0).toUpperCase() + value.slice(1)}
                </span>
            )
        }
    ];

    const WECcolumns = [
        { key: 'id', title: 'WEC ID', sortable: true },
        { key: 'customerName', title: 'Customer', sortable: true },
        { key: 'productCategory', title: 'Category' },
        { key: 'productBrand', title: 'Brand' },
        { key: 'productModel', title: 'Model' },
        { key: 'amcAmount', title: 'WEC Amount', render: (value) => `₹${value.toLocaleString()}` },
        { key: 'startDate', title: 'Start Date', render: (value) => new Date(value).toLocaleDateString('en-IN') },
        { key: 'endDate', title: 'End Date', render: (value) => new Date(value).toLocaleDateString('en-IN') },
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



    const handleAdd = () => {
        setEditingUser(null);
        setEditingAMC(null);
        setIsModalOpen(true);

    };

    const handleEdit = (user) => {
        const { password, ...userWithoutPassword } = user;
        setEditingUser({ ...userWithoutPassword, oldCreatedByEmail: userWithoutPassword?.createdByEmail });
        setIsModalOpen(true);
    };

    const handleDelete = (user) => {
        setDeletingUser(user);
        setIsDeleteDialogOpen(true);
    };

    const handleWEC = (user) => {
        setSelectedUser(user);
        setIsWECModalOpen(true);
    }

    // const handleSubmit = async (formData) => {
    //     setLoading(true);
    //     try {
    //         await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

    //         // Set default date of joining if not provided
    //         if (!formData.dateOfJoining) {
    //             formData.dateOfJoining = new Date().toISOString().split('T')[0];
    //         }

    //         if (activeTab === 'distributor') {
    //             if (editingUser) {
    //                 setDistributors(prev => prev.map(d => d.id === editingUser.id ? { ...d, ...formData } : d));
    //                 showToast('Distributor updated successfully', 'success');
    //             } else {
    //                 const newDistributor = {
    //                     id: Date.now().toString(),
    //                     ...formData,
    //                     walletBalance: 0,
    //                     joinedDate: formData.dateOfJoining,
    //                     totalRetailers: 0,
    //                     totalAMCs: 0
    //                 };
    //                 setDistributors(prev => [...prev, newDistributor]);
    //                 showToast('Distributor added successfully', 'success');
    //             }
    //         } else {
    //             const distributorId = user?.role === 'distributor' ? user.id : formData.distributorId;
    //             const distributor = distributors.find(d => d.id === distributorId);

    //             if (editingUser) {
    //                 setRetailers(prev => prev.map(r => r._id === editingUser._id ? {
    //                     ...r,
    //                     ...formData,
    //                     distributorId,
    //                     assignedDistributor: distributor?.name || ''
    //                 } : r));
    //                 showToast('Retailer updated successfully', 'success');
    //             } else {
    //                 const newRetailer = {
    //                     id: Date.now().toString(),
    //                     ...formData,
    //                     distributorId,
    //                     assignedDistributor: distributor?.name || '',
    //                     walletBalance: 0,
    //                     joinedDate: formData.dateOfJoining,
    //                     totalAMCs: 0
    //                 };
    //                 setRetailers(prev => [...prev, newRetailer]);
    //                 showToast('Retailer added successfully', 'success');
    //             }
    //         }

    //         setIsModalOpen(false);
    //     } catch (error) {
    //         showToast('Operation failed', 'error');
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    const handleConfirmDelete = async () => {
        setLoading(true);
        try {
            // await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
            const respons = await getData(`api/user-admin/delete-user-admin-user-by-admin/${deletingUser?._id}`);
            if (respons.status === true) {
                showToast('deleted successfully', 'success');
                setIsDeleteDialogOpen(false);
                setDeletingUser(null);
                setLoading(false);
                fetchAdminData()

            } else {
                showToast('Delete failed', 'error');
                setLoading(false);
            }

        } catch (error) {
            showToast('Delete failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const renderActions = (record) => (
        <div className="flex space-x-2">
            {canEdit && <Button
                size="sm"
                variant="ghost"
                onClick={() => handleEdit(record)}
            >
                <i className="ri-edit-line w-4 h-4 flex items-center justify-center"></i>
            </Button>}
            {canDelete && <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(record)}
            >
                <i className="ri-delete-bin-line w-4 h-4 flex items-center justify-center text-red-600"></i>
            </Button>}
            <Button
                size="sm"
                variant="neon"
                onClick={() => handleWEC(record)}
            >
                Total WEC
            </Button>
        </div>
    );

    const handleCredit = (user) => {
        setSelectedUser(user);
        setTransactionType('credit');
        setIsCreditModalOpen(true);
    };
    const handleDebit = (user) => {
        setSelectedUser(user);
        setTransactionType('debit');
        setIsCreditModalOpen(true);
    };

    const handleViewAMC = (amc) => {
        setEditingAMC(amc);
        setIsWECModalOpen(false);
        setIsModalOpen(true);
    };

    const transaction = (user) => {
        setSelectedUser(user);
        setIsTranjectionModalOpen(true);
    }

    const handleDownloadPdf = (record) => {
        console.log("GGGGGG:==>", record)

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
                <th style="width: 5%;">#</th>
                <th style="width: 25%;">Product Name</th>
                <th style="width: 15%;">Model</th>
                <th style="width: 15%;">Serial No.</th>
                <th style="width: 12%;">valid from  </th>
                <th style="width: 12%;">valid till</th>
                <th style="width: 12%;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>${record.productCategory} - ${record?.productBrand} ${record?.productType && record?.productType}</td>
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

    const handleDownloadExcel = async (selectedUser) => {
        try {
            if (!selectedUser?.email) {
                return toast.error("Invalid user selected");
            }

            const queryParams = new URLSearchParams({
                createdByEmail: JSON.stringify({
                    email: selectedUser.email,
                    name: selectedUser.name
                })
            });

            const response = await getData(`api/user-admin-wec/download-excel-wec?${queryParams}`);

            if (response.status === true && Array.isArray(response.data)) {
                const jsonData = response.data;

                // Convert JSON → Excel Sheet
                const worksheet = XLSX.utils.json_to_sheet(jsonData);

                // Create Excel Workbook
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "WEC Data");

                // Generate Excel file and download
                XLSX.writeFile(workbook, `WEC_Data_${selectedUser.name}.xlsx`);

                toast.success("Excel downloaded successfully!");
            } else {
                toast.error("No data found to export");
            }

        } catch (error) {
            console.log(error);
            toast.error("Something went wrong!");
        }
    };


    const renderAdminWECActions = (record) => (
        <div className="flex space-x-2">
            <Button
                size="sm"
                variant="ghost"
                onClick={() => handleViewAMC(record)}
            >
                <i className="ri-eye-line w-4 h-4 flex items-center justify-center"></i>
            </Button>
            {/* <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDownloadPdf(record)}
            >
                <i className="ri-download-line w-4 h-4 flex items-center justify-center"></i>
            </Button> */}
        </div>
    );

    const renderBalanceActions = (record) => (
        <div className="flex space-x-2">
            {canWrite && <Button
                size="sm"
                onClick={() => handleCredit(record)}
                disabled={record.status !== 'active'}
            >
                <i className="ri-add-line mr-1 w-4 h-4 flex items-center justify-center"></i>
                Add
            </Button>}
            {canEdit && <Button
                size="sm"
                variant="secondary"
                onClick={() => handleDebit(record)}
                disabled={record?.status !== 'active' || record?.walletBalance <= 0}
            >
                <i className="ri-subtract-line mr-1 w-4 h-4 flex items-center justify-center"></i>
                Remove
            </Button>}

            <Button
                size="sm"
                variant="success"
                onClick={() => transaction(record)}
            // disabled={record?.status !== 'active' || record?.walletBalance <= 0}
            >
                Transaction
            </Button>

        </div>
    );

    const handleWalletTransaction = async (clientAmount, percentage, finalAmount) => {
        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

            // Check if debit amount exceeds balance
            if (transactionType === 'debit' && finalAmount > selectedUser.walletBalance) {
                showToast('Insufficient wallet balance', 'error');
                setLoading(false);
                return;
            }

            const transactionAmount = transactionType === 'credit' ? finalAmount : -finalAmount;

            console.log("newTransactionnewTransaction:==>", selectedUser);
            // Add transaction record
            const newTransaction = {
                role: user.role,
                id: Date.now().toString(),
                userId: selectedUser._id,
                userType: selectedUser.role,
                userName: selectedUser.name,
                userEmail: selectedUser.email,
                type: transactionType,
                amount: finalAmount,
                description: `Wallet ${transactionType} - ₹${finalAmount?.toLocaleString()} ${transactionType === 'credit' ? '(Recharge)' : '(Return)'}`,
                clientAmount,
                percentage,
                createdBy: user?.name || 'System',
                createdByEmail: { name: user?.name, email: user?.email, createdBy: user?.role },
                createdDate: new Date().toISOString(),
                balanceAfter: selectedUser?.walletBalance + transactionAmount
            };
            const response = await postData(`api/user-admin-transaction/create-user-admin-transaction-by-admin`, newTransaction);
            console.log("newTransactionnewTransaction:==>", response?.status);
            if (response?.status === true) {
                fetchAdminData()
                showToast(`₹${finalAmount.toLocaleString()} ${transactionType === 'credit' ? 'credited to' : 'debited from'} ${selectedUser?.name}`, 'success');
                setIsCreditModalOpen(false);
                setSelectedUser(null);
            } else {
                showToast(`${response?.massage || 'Failed'}`, 'error');
                setIsCreditModalOpen(false);
                setSelectedUser(null);
            }

        } catch (error) {
            showToast(`${transactionType === 'credit' ? 'Credit' : 'Debit'} failed`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchUserTransactions = async () => {
        try {
            const queryParamsObj = {
                limit: transactionPageSize.toString(),
                page: transactionCurrentPage.toString(),
                role: selectedUser?.role,
                createdByEmail: selectedUser?.email || '',
            };

            if (selectedUser && queryParamsObj?.role && queryParamsObj?.createdByEmail) {
                const queryParams = new URLSearchParams(queryParamsObj).toString();
                const response = await getData(`api/user-admin-transaction/get-transaction-by-admin-with-pagination?${queryParams}`);
                console.log("DDDDDDD::=>", response);
                if (response?.status) {
                    setUserTransactions(response?.data);
                    setTransactionTotalPages(response?.pagination.totalPages);
                    setTransactionCurrentPage(response?.pagination.currentPage);
                    setTransactionTotalData(response?.pagination?.totalTransactions);
                }
            }


        } catch (e) {
            console.log(e)
        }
    }

    const fetchUserAdminWEC = async () => {
        try {
            const queryParamsObj = {
                limit: transactionPageSize.toString(),
                page: transactionCurrentPage.toString(),
                role: selectedUser?.role,
                createdByEmail: selectedUser?.email || '',
                createdByName: selectedUser?.name || '',
                search: searchTerm
            };

            if (selectedUser && queryParamsObj?.role && queryParamsObj?.createdByEmail) {
                const queryParams = new URLSearchParams(queryParamsObj).toString();
                const response = await getData(`api/user-admin-wec/get-amc-by-admin-with-pagination?${queryParams}`);
                console.log("DDDDDDD::=>", response);
                if (response?.status) {
                    setAdminWEC(response?.data);
                    setTransactionTotalPages(response?.pagination.totalPages);
                    setTransactionCurrentPage(response?.pagination.currentPage);
                    setTransactionTotalData(response?.pagination?.totalTransactions);
                }
            }


        } catch (e) {
            console.log(e)
        }
    }


    useEffect(() => {
        fetchUserTransactions()
        fetchUserAdminWEC()
    }, [transactionUserId, transactionCurrentPage, currentPage, selectedUser, searchTerm])

    const fetchTeamAndConditions = async () => {
        try {
            const response2 = await getData(`api/company/get-company-settings`);
            const response = await getData('api/company/get-AMC-settings');
            console.log("response==>get-team-and-conditions=>", response)
            if (response?.status === true) {
                setSetTeamAndConditions(response?.data);
                // setAmcPercentage(response?.data?.defaultPercentage || 8);
            }
            if (response2?.status === true) {
                setCompanySettings(response2?.data);
            }
        } catch (error) {
            console.error('Error fetching team and conditions:', error);
        }
    }
    useEffect(() => {
        fetchTeamAndConditions()
    }, [])
    // Check permissions
    if (user?.role !== 'admin') {
        return (
            <div className="p-6">
                <div className="text-center py-12">
                    <i className="ri-lock-line text-4xl text-gray-400 mb-4 w-16 h-16 flex items-center justify-center mx-auto"></i>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600">You don't have permission to access this page.</p>
                </div>
            </div>
        );
    }
    return (
        <div className="p-6 space-y-6">
            <ToastContainer />

            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">All Admin Management</h1>
                {canWrite && activeTab === 'user-admin' ?
                    <Button onClick={handleAdd}>
                        <i className="ri-add-line mr-2 w-4 h-4 flex items-center justify-center"></i>
                        Add Admin
                    </Button> :
                    <div className="flex space-x-3">
                        <Button
                            onClick={() => {
                                setTransactionType('credit');
                                setIsCreditModalOpen(true);
                            }}
                        >
                            <i className="ri-add-line mr-2 w-4 h-4 flex items-center justify-center"></i>
                            Add Points
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setTransactionType('debit');
                                setIsCreditModalOpen(true);
                            }}
                        >
                            <i className="ri-subtract-line mr-2 w-4 h-4 flex items-center justify-center"></i>
                            Remove Points
                        </Button>
                    </div>}
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => user?.role === 'user-admin' ? '' : setActiveTab('user-admin')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap cursor-pointer ${activeTab === 'user-admin'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        All Admin ({retailerTotal})
                    </button>
                    <button
                        onClick={() => user?.role === 'wallet' ? '' : setActiveTab('wallet')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap cursor-pointer ${activeTab === 'wallet'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Admin  Wallet
                    </button>
                </nav>

            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <Input
                        placeholder="Search by name or email..."
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
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <i className="ri-arrow-down-s-line text-gray-400 w-4 h-4 flex items-center justify-center"></i>
                        </div>
                    </div>
                </div>
            </div>

            {/* Data Table */}
            {activeTab === 'user-admin' && <>
                <DataTable
                    data={data}
                    columns={adminColumns}
                    actions={canEdit === true || canDelete === true ? renderActions : ''}
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    totalPages={page}
                    pageSize={pageSize}
                />

                {/* Add/Edit Modal */}
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setEditingAMC(null);
                    }}
                    title={`${editingUser ? 'Edit' : 'Add'} ${'Admin'}`}
                    size="lg"
                >
                    {editingAMC ? <div className="space-y-6">
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">WEC Details</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">WEC ID</label>
                                        <p className="text-gray-900">{editingAMC.id}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Start Date</label>
                                        <p className="text-gray-900">{new Date(editingAMC.startDate).toLocaleDateString('en-IN')}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">End Date</label>
                                        <p className="text-gray-900">{new Date(editingAMC.endDate).toLocaleDateString('en-IN')}</p>
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
                                    {/* <div>
                                        <label className="text-sm font-medium text-gray-600">Last Service</label>
                                        <p className="text-gray-900">
                                            {editingAMC.lastServiceDate ? new Date(editingAMC.lastServiceDate).toLocaleDateString('en-IN') : 'No service yet'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Renewal Count</label>
                                        <p className="text-gray-900">{editingAMC.renewalCount || 0}</p>
                                    </div> */}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <Button
                                variant="secondary"
                                onClick={() => setIsModalOpen(false)}
                            >
                                Close
                            </Button>
                            {/* <Button
                                onClick={() => handleDownloadPdf(editingAMC)}
                            >
                                <i className="ri-download-line mr-2 w-4 h-4 flex items-center justify-center"></i>
                                Download PDF
                            </Button> */}
                        </div>
                    </div> : <SchemaForm
                        fields={adminFields}
                        initialData={editingUser || {}}
                        distributors={distributors}
                        editingUser={editingUser}
                        // onSubmit={handleSubmit}
                        setIsModalOpen={setIsModalOpen}
                        activeTab={activeTab}
                        onCancel={() => setIsModalOpen(false)}
                        loading={loading}
                        fetchAdminData={fetchAdminData}
                    />}

                </Modal>

                <Modal
                    isOpen={isWECModalOpen}
                    onClose={() => {
                        setIsWECModalOpen(false);
                        setSelectedUser(null);
                    }}
                    title={` Wallet Transactions for ${selectedUser?.name}`}
                    size="2xl"
                >
                    <div className="space-y-6">
                        {!selectedUser && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select User to {transactionType === 'credit' ? 'Credit' : 'Debit'}
                                </label>

                                <div className="flex-1 mb-3">
                                    <Input
                                        placeholder={
                                            activeTab === 'balance'
                                                ? 'Search users...'
                                                : 'Search transactions...'
                                        }
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)} // ✅ only update search term
                                        icon="ri-search-line"
                                    />
                                </div>

                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {availableUsers
                                        .filter(
                                            (u) =>
                                                u.status === 'active' &&
                                                (transactionType === 'credit' || u.walletBalance > 0) &&
                                                (u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                    u.email.toLowerCase().includes(searchTerm.toLowerCase()))
                                        )
                                        .map((user) => (
                                            <div
                                                key={user?.id}
                                                onClick={() => setSelectedUser(user)}
                                                className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-medium text-gray-900">{user?.name}</p>
                                                        <p className="text-sm text-gray-500">{user?.email}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span
                                                            className={`px-2 py-1 rounded-full text-xs font-medium ${user?.role === 'distributor'
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : 'bg-green-100 text-green-800'
                                                                }`}
                                                        >
                                                            {user?.role?.charAt(0)?.toUpperCase() +
                                                                user?.role?.slice(1)}
                                                        </span>
                                                        <p className="text-sm font-semibold text-green-600 mt-1">
                                                            ₹{user.walletBalance.toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}

                        {selectedUser && (
                            <div className="space-y-4">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h3 className="font-medium text-gray-900 mb-2">Selected User</h3>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">{selectedUser.name}</p>
                                            <p className="text-sm text-gray-500">{selectedUser.email}</p>
                                        </div>
                                        <div className="text-right">

                                            <span className={`px-2 py-1 rounded-full text-xs font-medium mr-10 ${selectedUser.role === 'distributor' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                                }`}>
                                                {selectedUser?.role?.charAt(0).toUpperCase() + selectedUser?.role?.slice(1)}
                                            </span>
                                            <p className="text-sm font-semibold text-green-600 mt-1">
                                                Current Balance: ₹{selectedUser?.walletBalance?.toLocaleString()}
                                            </p>
                                            <div className="mt-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                                                    onClick={() => { handleDownloadExcel(selectedUser); }}
                                                >
                                                    <i className="ri-file-pdf-line text-lg"></i>
                                                    Download Excel
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setSelectedUser(null)}
                                        className="mt-2"
                                    >
                                        Change User
                                    </Button>
                                </div>

                                <div className="flex-1 mb-3">
                                    <Input
                                        placeholder={
                                            activeTab === 'balance'
                                                ? 'Search users...'
                                                : 'Search transactions...'
                                        }
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)} // ✅ only update search term
                                        icon="ri-search-line"
                                    />
                                </div>
                                <DataTable
                                    data={adminWEC}
                                    columns={WECcolumns}
                                    actions={renderAdminWECActions}
                                    setCurrentPage={setTransactionCurrentPage}
                                    currentPage={transactionCurrentPage}
                                    totalPages={transactionTotalPages} // total records count from API
                                    pageSize={transactionPageSize}
                                    totalData={adminWEC?.length}
                                />

                            </div>
                        )}
                    </div>
                </Modal>


                {/* Delete Confirmation */}
                <ConfirmDialog
                    isOpen={isDeleteDialogOpen}
                    onClose={() => setIsDeleteDialogOpen(false)}
                    onConfirm={handleConfirmDelete}
                    title="Delete User"
                    message={`Are you sure you want to delete ${deletingUser?.name}? This action cannot be undone.`}
                    confirmText="Delete"
                    variant="danger"
                    loading={loading}
                />
            </>}

            {activeTab === 'wallet' && <>
                <Modal
                    isOpen={isCreditModalOpen}
                    onClose={() => {
                        setIsCreditModalOpen(false);
                        setSelectedUser(null);
                    }}
                    title={`${transactionType === 'credit' ? 'Credit' : 'Debit'} Wallet`}
                    size="lg"
                >
                    <div className="space-y-6">
                        {!selectedUser && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select User to {transactionType === 'credit' ? 'Credit' : 'Debit'}
                                </label>

                                <div className="flex-1 mb-3">
                                    <Input
                                        placeholder={
                                            activeTab === 'balance'
                                                ? 'Search users...'
                                                : 'Search transactions...'
                                        }
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)} // ✅ only update search term
                                        icon="ri-search-line"
                                    />
                                </div>

                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {availableUsers
                                        .filter(
                                            (u) =>
                                                u.status === 'active' &&
                                                (transactionType === 'credit' || u.walletBalance > 0) &&
                                                (u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                    u.email.toLowerCase().includes(searchTerm.toLowerCase()))
                                        )
                                        .map((user) => (
                                            <div
                                                key={user?.id}
                                                onClick={() => setSelectedUser(user)}
                                                className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-medium text-gray-900">{user?.name}</p>
                                                        <p className="text-sm text-gray-500">{user?.email}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span
                                                            className={`px-2 py-1 rounded-full text-xs font-medium ${user?.role === 'distributor'
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : 'bg-green-100 text-green-800'
                                                                }`}
                                                        >
                                                            {user?.role?.charAt(0)?.toUpperCase() +
                                                                user?.role?.slice(1)}
                                                        </span>
                                                        <p className="text-sm font-semibold text-green-600 mt-1">
                                                            ₹{user.walletBalance.toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}

                        {selectedUser && (
                            <div className="space-y-4">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h3 className="font-medium text-gray-900 mb-2">Selected User</h3>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">{selectedUser.name}</p>
                                            <p className="text-sm text-gray-500">{selectedUser.email}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${selectedUser.role === 'distributor' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                                }`}>
                                                {selectedUser?.role?.charAt(0).toUpperCase() + selectedUser?.role?.slice(1)}
                                            </span>
                                            <p className="text-sm font-semibold text-green-600 mt-1">
                                                Current Balance: ₹{selectedUser?.walletBalance?.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setSelectedUser(null)}
                                        className="mt-2"
                                    >
                                        Change User
                                    </Button>
                                </div>

                                <div className="bg-blue-50 rounded-lg p-4">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <i className={`${transactionType === 'credit' ? 'ri-add-circle-line text-green-600' : 'ri-subtract-circle-line text-red-600'} w-5 h-5 flex items-center justify-center`}></i>
                                        <h3 className="font-medium text-gray-900">
                                            {transactionType === 'credit' ? 'Add Points' : 'Remove Points'}
                                        </h3>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        {transactionType === 'credit'
                                            ? 'Add points to increase the user\'s wallet balance.'
                                            : 'Remove points to decrease the user\'s wallet balance.'}
                                    </p>
                                </div>

                                <AdminWalletCalculator
                                    onCredit={handleWalletTransaction}
                                    loading={loading}
                                    buttonText={transactionType === 'credit' ? 'Credit Wallet' : 'Debit Wallet'}
                                    buttonColor={transactionType === 'credit' ? 'primary' : 'danger'}
                                />
                            </div>
                        )}
                    </div>
                </Modal>

                <Modal
                    isOpen={isTranjectionModalOpen}
                    onClose={() => {
                        setIsTranjectionModalOpen(false);
                        setSelectedUser(null);
                    }}
                    title={` Wallet Transactions for ${selectedUser?.name}`}
                    size="2xl"
                >
                    <div className="space-y-6">
                        {!selectedUser && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select User to {transactionType === 'credit' ? 'Credit' : 'Debit'}
                                </label>

                                <div className="flex-1 mb-3">
                                    <Input
                                        placeholder={
                                            activeTab === 'balance'
                                                ? 'Search users...'
                                                : 'Search transactions...'
                                        }
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)} // ✅ only update search term
                                        icon="ri-search-line"
                                    />
                                </div>

                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {availableUsers
                                        .filter(
                                            (u) =>
                                                u.status === 'active' &&
                                                (transactionType === 'credit' || u.walletBalance > 0) &&
                                                (u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                    u.email.toLowerCase().includes(searchTerm.toLowerCase()))
                                        )
                                        .map((user) => (
                                            <div
                                                key={user?.id}
                                                onClick={() => setSelectedUser(user)}
                                                className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-medium text-gray-900">{user?.name}</p>
                                                        <p className="text-sm text-gray-500">{user?.email}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span
                                                            className={`px-2 py-1 rounded-full text-xs font-medium ${user?.role === 'distributor'
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : 'bg-green-100 text-green-800'
                                                                }`}
                                                        >
                                                            {user?.role?.charAt(0)?.toUpperCase() +
                                                                user?.role?.slice(1)}
                                                        </span>
                                                        <p className="text-sm font-semibold text-green-600 mt-1">
                                                            ₹{user.walletBalance.toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}

                        {selectedUser && (
                            <div className="space-y-4">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h3 className="font-medium text-gray-900 mb-2">Selected User</h3>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">{selectedUser.name}</p>
                                            <p className="text-sm text-gray-500">{selectedUser.email}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${selectedUser.role === 'distributor' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                                }`}>
                                                {selectedUser?.role?.charAt(0).toUpperCase() + selectedUser?.role?.slice(1)}
                                            </span>
                                            <p className="text-sm font-semibold text-green-600 mt-1">
                                                Current Balance: ₹{selectedUser?.walletBalance?.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setSelectedUser(null)}
                                        className="mt-2"
                                    >
                                        Change User
                                    </Button>
                                </div>

                                <DataTable
                                    data={userTransactions}
                                    columns={transactionColumns}
                                    // actions={renderBalanceActions}
                                    setCurrentPage={setTransactionCurrentPage}
                                    currentPage={transactionCurrentPage}
                                    totalPages={transactionTotalPages} // total records count from API
                                    pageSize={transactionPageSize}
                                    totalData={userTransactions.length}
                                />

                            </div>
                        )}
                    </div>
                </Modal>

                <DataTable
                    data={availableUsers.filter(
                        user => user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase())
                    )}
                    columns={balanceColumns}
                    actions={user?.role !== 'retailer'
                        ? (canWrite || canEdit ? renderBalanceActions : undefined)
                        : undefined}
                    setCurrentPage={setCurrentPage}
                    currentPage={currentPage}
                    totalPages={page}
                    totalData={totalData}
                    pageSize={pageSize}
                />
            </>}

        </div>
    );
}
