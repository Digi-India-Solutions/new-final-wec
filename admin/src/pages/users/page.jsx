
import { use, useEffect, useState } from 'react';
import DataTable from '../../components/base/DataTable';
import Button from '../../components/base/Button';
import Modal from '../../components/base/Modal';
import SchemaForm from './UserSchemaForm';
import ConfirmDialog from '../../components/base/ConfirmDialog';
import Input from '../../components/base/Input';
import { useToast } from '../../components/base/Toast';
import { getData } from '../../services/FetchNodeServices';


export default function UsersPage() {

  const [user, setUser] = useState(() => {
    const storedUser = sessionStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const { showToast, ToastContainer } = useToast();
  const [activeTab, setActiveTab] = useState(user?.role === 'distributor' ? 'retailer' : 'distributor');
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
  // Mock data
  const [distributors, setDistributors] = useState(data.filter(user => user?.role === 'distributor'));
  const [retailers, setRetailers] = useState(data.filter(user => user?.role === 'retailer'));

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
        role: activeTab || '',
        status: statusFilter || ''
      }).toString();

      const response = await getData(`api/admin/getAdminUsersByAdminwithPagination?${queryParams}`);
      // console.log('response==>', response)
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
  const fetchAllRetailers = async () => {
    try {
      const queryParams = new URLSearchParams({
        limit: pageSize.toString(),
        page: currentPage.toString(),
        search: searchTerm || '',
        role: 'retailer' || '',
        status: statusFilter || '',
        createdByEmail: user?.email || '',
      }).toString();

      const response = await getData(`api/admin/getRetailersByAdminwithPagination?${queryParams}`);
      // console.log('response==>', response)
      if (response?.status) {

        setRetailerTotal(response.pagination.total);

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
    if (user?.role === 'distributor') {
      fetchAllRetailers();
    } else {
      fetchAdminData();
    }

  }, [currentPage, searchTerm, statusFilter, activeTab]);

  const fetchDistributorData = async () => {
    try {
      const response = await getData(`api/admin/getDistributorsByAdmin`);
      // console.log('response==>getDistributorsByAdmin', response)
      if (response?.status) {
        setDistributors(response.data);
      } else {
        console.warn('Failed to fetch admin users:', response.message);
      }
    } catch (error) {
      console.error('Error fetching admin users:', error);
    }
  };

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
    fetchDistributorData();
    fetchUserRoleData();
  }, []);




  const distributorFields = [
    { name: 'ownerName', label: 'Owner Name', type: 'text', required: true },
    { name: 'name', label: 'Company Name', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'phone', label: 'Mobile', type: 'number', required: true },
    { name: 'password', label: 'Password', type: 'password', required: !editingUser },
    { name: 'address', label: 'Address', type: 'textarea', required: true },
    { name: 'gst', label: 'GST', type: 'text', required: false },
    {
      name: 'status', label: 'Status', type: 'select', required: true, options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
      ]
    }
  ];

  const retailerFields = [
    { name: 'ownerName', label: 'Owner Name', type: 'text', required: true },
    { name: 'name', label: 'Store Name', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'phone', label: 'Mobile', type: 'number', required: true },
    { name: 'password', label: 'Password', type: 'password', required: !editingUser },
    { name: 'address', label: 'Address', type: 'textarea', required: false },
    { name: 'gst', label: 'GST', type: 'text', required: false },
    ...(user?.role !== 'distributor' && user?.role !== 'retailer' ? [{
      name: 'DistributorId', label: 'Assigned Distributor', type: 'select', required: true, options:
        distributors.filter(d => d.status === 'active')
    }] : []),

    {
      name: 'status', label: 'Status', type: 'select', required: true, options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
      ]
    }
  ];

  const distributorColumns = [
    { key: 'name', title: 'Company Name', sortable: true },
    { key: 'email', title: 'Email', sortable: true },
    { key: 'phone', title: 'Mobile' },
    { key: 'createdAt', title: 'Date of Joining', render: (value) => new Date(value).toLocaleDateString('en-IN') },
    { key: 'totalRetailers', title: 'Retailers', render: (value) => value || 0 },
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

  const retailerColumns = [
    { key: 'name', title: 'Store Name', sortable: true },
    { key: 'email', title: 'Email', sortable: true },
    { key: 'phone', title: 'Mobile' },
    { key: 'createdAt', title: 'Date of Joining', render: (value) => new Date(value).toLocaleDateString('en-IN') },
    ...(user?.role !== 'distributor' && user?.role !== 'retailer' ? [{ key: 'DistributorId', title: 'Distributor', sortable: true }] : []),
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

  const handleAdd = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user) => {
    // Remove password from editing data for security
    const { password, ...userWithoutPassword } = user;
    // console.log("DDD:==>", userWithoutPassword.createdByEmail);
    setEditingUser({ ...userWithoutPassword, oldCreatedByEmail: userWithoutPassword?.createdByEmail });
    setIsModalOpen(true);
  };

  const handleDelete = (user) => {
    setDeletingUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      // Set default date of joining if not provided
      if (!formData.dateOfJoining) {
        formData.dateOfJoining = new Date().toISOString().split('T')[0];
      }

      if (activeTab === 'distributor') {
        if (editingUser) {
          setDistributors(prev => prev.map(d => d.id === editingUser.id ? { ...d, ...formData } : d));
          showToast('Distributor updated successfully', 'success');
        } else {
          const newDistributor = {
            id: Date.now().toString(),
            ...formData,
            walletBalance: 0,
            joinedDate: formData.dateOfJoining,
            totalRetailers: 0,
            totalAMCs: 0
          };
          setDistributors(prev => [...prev, newDistributor]);
          showToast('Distributor added successfully', 'success');
        }
      } else {
        const distributorId = user?.role === 'distributor' ? user.id : formData.distributorId;
        const distributor = distributors.find(d => d.id === distributorId);

        if (editingUser) {
          setRetailers(prev => prev.map(r => r._id === editingUser._id ? {
            ...r,
            ...formData,
            distributorId,
            assignedDistributor: distributor?.name || ''
          } : r));
          showToast('Retailer updated successfully', 'success');
        } else {
          const newRetailer = {
            id: Date.now().toString(),
            ...formData,
            distributorId,
            assignedDistributor: distributor?.name || '',
            walletBalance: 0,
            joinedDate: formData.dateOfJoining,
            totalAMCs: 0
          };
          setRetailers(prev => [...prev, newRetailer]);
          showToast('Retailer added successfully', 'success');
        }
      }

      setIsModalOpen(false);
    } catch (error) {
      showToast('Operation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    setLoading(true);
    try {
      // await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      const respons = await getData(`api/admin/delete-admin-user-by-admin/${deletingUser?._id}`);
      if (respons.status === true) {
        showToast('deleted successfully', 'success');
        setIsDeleteDialogOpen(false);
        setDeletingUser(null);
        setLoading(false);
        if (user?.role === 'admin') {
          fetchAdminData()
        }
        if (user?.role === 'distributor') {
          fetchAllRetailers()
        }
        if (user?.role === 'retailer') {
          fetchDistributorData()
        }

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
    </div>
  );

  // Check permissions
  if (user?.role === 'retailer') {
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
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        {canWrite && <Button onClick={handleAdd}>
          <i className="ri-add-line mr-2 w-4 h-4 flex items-center justify-center"></i>
          Add {activeTab === 'distributor' ? 'Distributor' : 'Retailer'}
        </Button>}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {user?.role !== 'distributor' && user?.role !== 'retailer' && (
            <button
              onClick={() => setActiveTab('distributor')}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap cursor-pointer ${activeTab === 'distributor'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Distributors ({totalData})
            </button>
          )}
          <button
            onClick={() => user?.role === 'distributor' ? '' : setActiveTab('retailer')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap cursor-pointer ${activeTab === 'retailer'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Retailers ({retailerTotal})
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
      <DataTable
        data={data}
        columns={activeTab === 'distributor' ? distributorColumns : retailerColumns}
        actions={canEdit === true || canDelete === true ? renderActions : ''}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={page}
        pageSize={pageSize}
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`${editingUser ? 'Edit' : 'Add'} ${activeTab === 'distributor' ? 'Distributor' : 'Retailer'}`}
        size="lg"
      >
        <SchemaForm
          fields={activeTab === 'distributor' ? distributorFields : retailerFields}
          initialData={editingUser || {}}
          distributors={distributors}
          editingUser={editingUser}
          onSubmit={handleSubmit}
          setIsModalOpen={setIsModalOpen}
          activeTab={activeTab}
          onCancel={() => setIsModalOpen(false)}
          loading={loading}
          fetchAdminData={user?.role === 'distributor' ? fetchAllRetailers : fetchAdminData}
        />
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
    </div>
  );
}
