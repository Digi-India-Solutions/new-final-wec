
import { useEffect, useState } from 'react';
// import { useAuthStore } from '../../store/authStore';
import DataTable from '../../components/base/DataTable';
import Button from '../../components/base/Button';
import Modal from '../../components/base/Modal';
import SchemaForm from './ClaimsSchemaForm';
import ConfirmDialog from '../../components/base/ConfirmDialog';
import Input from '../../components/base/Input';
import { useToast } from '../../components/base/Toast';
import { getData, postData } from '../../services/FetchNodeServices';



export default function ClaimsPage() {

  const [user, setUser] = useState(() => {
    const storedUser = sessionStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const { showToast, ToastContainer } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingClaim, setEditingClaim] = useState(null);
  const [deletingClaim, setDeletingClaim] = useState(null);
  const [loading, setLoading] = useState(false);
  const [claims, setClaims] = useState([]);
  const [filter, setFilter] = useState({});
  const [rolePermissions, setRolePermissions] = useState([]);

  const [canRead, canWrite, canEdit, canDelete] = (() => {
    // Default admin/distributor/retailer logic
    if (['admin'].includes(user?.role)) return [true, true, true, true];
    if (['distributor'].includes(user?.role)) return [true, true, true, true];
    if (['retailer'].includes(user?.role)) return [false, false, false, false];

    // Dynamic staff role permissions
    const modulePerm = rolePermissions?.find(
      (m) => m.module === 'Claims Management'
    );
    if (!modulePerm) return [false, false, false, false];

    return [
      modulePerm.permissions.includes('read'),
      modulePerm.permissions.includes('write'),
      modulePerm.permissions.includes('edit'),
      modulePerm.permissions.includes('delete'),
    ];
  })();


  const claimFields = [
    { name: 'customerName', label: 'Customer Name', type: 'text', required: true },
    { name: 'amcNumber', label: 'WEC No. / Contract ID', type: 'text', required: true },
    { name: 'claimValue', label: 'Claim Value (₹)', type: 'number', required: true },
    { name: 'productDetails', label: 'Product Details', type: 'textarea', required: true },
    { name: 'billPhoto', label: 'Upload Bill Photo', type: 'file', required: false, accept: '.jpg,.jpeg,.png,.pdf' },
    { name: 'accountHolderName', label: 'Account Holder Name', type: 'text', required: true },
    { name: 'bankName', label: 'Bank Name', type: 'text', required: true },
    { name: 'accountNumber', label: 'Account Number', type: 'text', required: true },
    { name: 'ifscCode', label: 'IFSC Code', type: 'text', required: true },
    { name: 'remarks', label: 'Remarks', type: 'textarea', required: false },
    {
      name: 'status', label: 'Status', type: 'select', required: true, options: [
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' }
      ]
    }
  ];

  // const columns = [
  //   { key: 'claimId', title: 'Claim ID', sortable: true },
  //   { key: 'customerName', title: 'Customer Name', sortable: true },
  //   { key: 'productDetails', title: 'Product Details' },
  //   { key: 'amcNumber', title: 'AMC No.', sortable: true },
  //   { key: 'claimValue', title: 'Claim Value', render: (value) => `₹${value.toLocaleString()}` },
  //   {
  //     key: 'billPhoto', title: 'Bill Photo', render: (value) => {
  //       if (!value) return '-';
  //       const isImage = value.toLowerCase().includes('.jpg') || value.toLowerCase().includes('.png') || value.toLowerCase().includes('.jpeg');
  //       return (
  //         <div className="flex items-center space-x-2">
  //           {isImage ? (
  //             <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
  //               <i className="ri-image-line text-blue-600 w-4 h-4 flex items-center justify-center"></i>
  //             </div>
  //           ) : (
  //             <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
  //               <i className="ri-file-pdf-line text-red-600 w-4 h-4 flex items-center justify-center"></i>
  //             </div>
  //           )}
  //           <Button
  //             size="sm"
  //             variant="ghost"
  //             onClick={() => {
  //               try {
  //                 // 🧠 Force Cloudinary to download by adding `fl_attachment` to the URL
  //                 let downloadUrl = editingAMC.productPicture;

  //                 if (downloadUrl.includes("/upload/")) {
  //                   downloadUrl = downloadUrl.replace("/upload/", "/upload/fl_attachment/");
  //                 }

  //                 // Create and trigger a temporary link
  //                 const link = document.createElement("a");
  //                 link.href = downloadUrl;
  //                 link.download = editingAMC.purchaseProof.split("/").pop() || "purchase-proof";
  //                 document.body.appendChild(link);
  //                 link.click();
  //                 document.body.removeChild(link);

  //                 showToast("File downloaded successfully", "success");
  //               } catch (error) {
  //                 console.error("Error downloading image:", error);
  //                 showToast("Failed to download file", "error");
  //               }
  //             }}
  //             // onClick={() => showToast('File downloaded successfully', 'success')}
  //             title="Download"
  //           >
  //             <i className="ri-download-line w-4 h-4 flex items-center justify-center"></i>
  //           </Button>
  //         </div>
  //       );
  //     }
  //   },
  //   { key: 'bankName', title: 'Bank Name' },
  //   {
  //     key: 'status', title: 'Status', render: (value) => (
  //       <span className={`px-2 py-1 rounded-full text-xs font-medium ${value === 'pending' ? 'bg-yellow-100 text-yellow-800' :
  //         value === 'approved' ? 'bg-green-100 text-green-800' :
  //           'bg-red-100 text-red-800'
  //         }`}>
  //         {value.charAt(0).toUpperCase() + value.slice(1)}
  //       </span>
  //     )
  //   },
  //   { key: 'createdAt', title: 'Created Date', sortable: true }
  // ];

  const columns = [
  { key: 'claimId', title: 'Claim ID', sortable: true },
  { key: 'customerName', title: 'Customer Name', sortable: true },
  { key: 'productDetails', title: 'Product Details' },
  { key: 'amcNumber', title: 'WEC No.', sortable: true },
  {
    key: 'claimValue',
    title: 'Claim Value',
    render: (value) => (value ? `₹${Number(value).toLocaleString()}` : '-'),
  },
  {
    key: 'billPhoto',
    title: 'Bill Photo',
    render: (value) => {
      if (!value) return '-';
      const fileName = value.split('/').pop();
      const isImage = /\.(jpg|jpeg|png)$/i.test(value);

      return (
        <div className="flex items-center space-x-2">
          <div
            className={`w-8 h-8 rounded flex items-center justify-center ${
              isImage ? 'bg-blue-100' : 'bg-red-100'
            }`}
          >
            <i
              className={`${
                isImage ? 'ri-image-line text-blue-600' : 'ri-file-pdf-line text-red-600'
              } w-4 h-4 flex items-center justify-center`}
            ></i>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              try {
                let downloadUrl = value;
                // 🧠 Force Cloudinary file download by adding `fl_attachment`
                if (downloadUrl.includes('/upload/')) {
                  downloadUrl = downloadUrl.replace('/upload/', '/upload/fl_attachment/');
                }

                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = fileName || 'bill-photo';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                showToast('File downloaded successfully', 'success');
              } catch (error) {
                console.error('Error downloading file:', error);
                showToast('Failed to download file', 'error');
              }
            }}
            title="Download"
          >
            <i className="ri-download-line w-4 h-4 flex items-center justify-center"></i>
          </Button>
        </div>
      );
    },
  },
  { key: 'bankName', title: 'Bank Name' },
  {
    key: 'status',
    title: 'Status',
    render: (value) => (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'pending'
            ? 'bg-yellow-100 text-yellow-800'
            : value === 'approved'
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}
      >
        {value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Unknown'}
      </span>
    ),
  },
  {
    key: 'createdAt',
    title: 'Created Date',
    sortable: true,
    render: (value) =>
      value ? new Date(value).toLocaleDateString('en-IN') : '-',
  },
];


  const handleAdd = () => {
    setEditingClaim(null);
    setIsModalOpen(true);
  };

  const handleEdit = (claim) => {
    setEditingClaim(claim);
    setIsModalOpen(true);
  };

  const handleDelete = (claim) => {
    setDeletingClaim(claim);
    setIsDeleteDialogOpen(true);
  };

  const handleApprove = async (claim) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const respons = await postData(`api/claims/change-status-claim-by-admin/${claim._id}`, { status: 'approved' });
      console.log("respons==>", respons);
      if (respons.status === true) {
        fetchClaimsData();
        setClaims(prev => prev.map(c => c._id === claim._id ? { ...c, status: 'approved' } : c));
        showToast('Claim approved successfully', 'success');
      }

    } catch (error) {
      showToast('Approval failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (claim) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const respons = await postData(`api/claims/change-status-claim-by-admin/${claim._id}`, { status: 'rejected' });
      console.log("respons==>", respons);
      if (respons.status === true) {
        fetchClaimsData();
        setClaims(prev => prev.map(c => c._id === claim._id ? { ...c, status: 'rejected' } : c));
        showToast('Claim rejected successfully', 'success');
      }


    } catch (error) {
      showToast('Rejection failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const respons = await getData(`api/claims/delete-claim-by-admin/${deletingClaim._id}`);
      console.log("respons==>", respons);
      if (respons.status === true) {
        fetchClaimsData();
        setClaims(prev => prev.filter(c => c._id !== deletingClaim._id));
        showToast('Claim deleted successfully', 'success');
        setIsDeleteDialogOpen(false);
        setDeletingClaim(null);
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
        title="Edit"
      >
        <i className="ri-edit-line w-4 h-4 flex items-center justify-center"></i>
      </Button>}
      {canEdit && record.status === 'pending' && (
        <>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleApprove(record)}
            title="Approve"
            className="text-green-600 hover:text-green-700"
          >
            <i className="ri-check-line w-4 h-4 flex items-center justify-center"></i>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleReject(record)}
            title="Reject"
            className="text-red-600 hover:text-red-700"
          >
            <i className="ri-close-line w-4 h-4 flex items-center justify-center"></i>
          </Button>
        </>
      )}
      {canDelete && <Button
        size="sm"
        variant="ghost"
        onClick={() => handleDelete(record)}
        title="Delete"
      >
        <i className="ri-delete-bin-line w-4 h-4 flex items-center justify-center text-red-600"></i>
      </Button>}
      {/* <Button
        size="sm"
        variant="ghost"
        onClick={() => window.open('#', '_blank')}
        title="Download Bill"
      >
        <i className="ri-download-line w-4 h-4 flex items-center justify-center text-blue-600"></i>
      </Button> */}
    </div>
  );
  /////////////////////////////////////////////////////////////////////////////////////////////
  const fetchClaimsData = async () => {
    try {
      const response = await getData(`api/claims/get-claim-by-admin-with-pagination?limit=10&page=1&search=${searchTerm}&status=${statusFilter}`);
      console.log("responseresponseresponseresponse===>", response);
      if (response?.status === true) {
        setClaims(response?.data);
        setFilter(response?.pagination);
      }
    } catch (e) {
      console.log(e)
    }
  }

  const fetchUserRoleData = async () => {
    try {
      const response = await getData(`api/admin/get-admin-users-by-id/${user?.id}`);
      console.log('response==>getAdminUsersByAdmin', response)
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
    fetchClaimsData();
    fetchUserRoleData()
  }, [searchTerm, statusFilter]);

  if (user?.role === 'distributor' || user?.role === 'retailer') {
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
        <h1 className="text-2xl font-bold text-gray-900">Claims Management</h1>
        {canWrite && <Button onClick={handleAdd}>
          <i className="ri-add-line mr-2 w-4 h-4 flex items-center justify-center"></i>
          Add Claim
        </Button>}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <i className="ri-file-list-line text-blue-600 w-6 h-6 flex items-center justify-center"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Claims</p>
              <p className="text-2xl font-semibold text-gray-900">{filter?.totalClaims}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <i className="ri-time-line text-yellow-600 w-6 h-6 flex items-center justify-center"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-semibold text-gray-900">{filter?.totalPendingClaims}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <i className="ri-check-line text-green-600 w-6 h-6 flex items-center justify-center"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-semibold text-gray-900">{filter?.totalApprovedClaims}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <i className="ri-close-line text-red-600 w-6 h-6 flex items-center justify-center"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-2xl font-semibold text-gray-900">{filter?.totalRejectedClaims}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by customer name, WEC number, or claim ID..."
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
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <i className="ri-arrow-down-s-line text-gray-400 w-4 h-4 flex items-center justify-center"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={claims}
        columns={columns}
        actions={canEdit === true || canDelete === true ? renderActions : ''}
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`${editingClaim ? 'Edit' : 'Add'} Claim`}
        size="lg"
      >
        <SchemaForm
          fields={claimFields}
          initialData={editingClaim || {}}
          editingUser={editingClaim}
          setIsModalOpen={setIsModalOpen}
          onCancel={() => setIsModalOpen(false)}
          loading={loading}
          setLoading={setLoading}
          fetchClaimsData={fetchClaimsData}
        />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Claim"
        message={`Are you sure you want to delete claim ${deletingClaim?.claimId}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={loading}
      />
    </div>
  );
}
