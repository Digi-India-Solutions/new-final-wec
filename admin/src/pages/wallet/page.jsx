
import { useState } from 'react';
// import { useAuthStore } from '../../store/authStore';
import DataTable from '../../components/base/DataTable';
import Modal from '../../components/base/Modal';
import Input from '../../components/base/Input';
import WalletCalculator from './WalletCalculator';
import { useToast } from '../../components/base/Toast';
import { getData, postData } from '../../services/FetchNodeServices';
import Button from '../../components/base/Button';


export default function WalletPage() {

  const [user, setUser] = useState(() => {
    const storedUser = sessionStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const { showToast, ToastContainer } = useToast();
  const [activeTab, setActiveTab] = useState(user?.role === 'retailer' ? 'transactions' : 'balance');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [transactionType, setTransactionType] = useState('credit');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalData, setTotalData] = useState(1);
  const [transactionUserId, setTransactionUserId] = useState([user?.id]);
  const [transactionCurrentPage, setTransactionCurrentPage] = useState(1);
  const [transactionPageSize, setTransactionPageSize] = useState(10);
  const [transactionTotalPages, setTransactionTotalPages] = useState(1);
  const [transactionTotalData, setTransactionTotalData] = useState(1);

  // Mock data
  const [distributors, setDistributors] = useState([]);
  const [retailers, setRetailers] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [totalBalance, setTotalBalance] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);
  const [totalDebit, setTotalDebit] = useState(0);
  const [rolePermissions, setRolePermissions] = useState([]);

  const [canRead, canWrite, canEdit, canDelete] = (() => {
    // Default admin/distributor/retailer logic
    if (['admin'].includes(user?.role)) return [true, true, true, true];
    if (['distributor'].includes(user?.role)) return [true, true, true, true];
    if (['retailer'].includes(user?.role)) return [false, false, false, false];

    // Dynamic staff role permissions
    const modulePerm = rolePermissions?.find(
      (m) => m.module === 'Wallet Management'
    );
    if (!modulePerm) return [false, false, false, false];

    return [
      modulePerm.permissions.includes('read'),
      modulePerm.permissions.includes('write'),
      modulePerm.permissions.includes('edit'),
      modulePerm.permissions.includes('delete'),
    ];
  })();

  const availableUsers = user.role === 'admin' ? [...retailers] : retailers;
  // console.log('availableUsers==>', availableUsers)
  // Filter transactions
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase());

    // Filter by user role
    if (user?.role === 'distributor') {
      return matchesSearch;
    }

    return matchesSearch;
  });

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
    { key: 'userName', title: 'User', sortable: true },
    {
      key: 'userType', title: 'Type', render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${value === 'distributor' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
          }`}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      )
    },
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

      // Update user balance
      if (selectedUser.role === 'distributor') {
        setDistributors(prev => prev.map(d =>
          d._id === selectedUser._id
            ? { ...d, walletBalance: d.walletBalance + transactionAmount }
            : d
        ));
      } else {
        setRetailers(prev => prev.map(r =>
          r._id === selectedUser._id
            ? { ...r, walletBalance: r.walletBalance + transactionAmount }
            : r
        ));
      }
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
        description: `Wallet ${transactionType} - ₹${finalAmount?.toLocaleString()}`,
        clientAmount,
        percentage,
        createdBy: user?.name || 'System',
        createdByEmail: { name: user?.name, email: user?.email, createdBy: user?.role },
        createdDate: new Date().toISOString(),
        balanceAfter: selectedUser?.walletBalance + transactionAmount
      };
      const response = await postData(`api/transaction/create-transaction-by-admin`, newTransaction);
      console.log("newTransactionnewTransaction:==>", response);
      if (response?.status === true) {
        setTransactions(prev => [newTransaction, ...prev]);
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
    </div>
  );


  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  const fetchDistributors = async () => {
    try {
      const response = await getData('api/admin/getDistributorsByAdmin');
      if (response?.status) {
        setDistributors(response.data);
      }
    } catch (e) {
      console.log(e)
    }
  }
  const fetchRetailers = async () => {
    try {
      const queryParams = new URLSearchParams({
        limit: pageSize.toString(),
        page: currentPage.toString(),
        // search: searchTerm || '',
        role: user?.role,
        // status: statusFilter || '',
        createdByEmail: user?.email || '',
        userId: user?.id
      }).toString();

      const response = await getData(`api/admin/getRetailersByDistributorwithPagination?${queryParams}`);
      console.log("response===>CCC", response)
      if (response?.status) {
        setRetailers(response?.data.filter((item) => item?.name != user?.name));
        setTransactionUserId((prev) => {
          const merged = [...prev, ...response?.data?.map((item) => item._id)];
          return [...new Set(merged)];
        });
        setTotalPages(response?.pagination.totalPages);
        setCurrentPage(response?.pagination.currentPage);
        setTotalData(response?.pagination.total - 1);
      }
    } catch (e) {
      console.log(e)
    }
  }
  console.log('user:==>user:==>', transactionUserId)

  const fetchTransactions = async () => {
    try {
      const queryParamsObj = {
        limit: transactionPageSize.toString(),
        page: transactionCurrentPage.toString(),
        role: user?.role,
        createdByEmail: user?.email || '',
      };

      // Conditionally add userId if retailers exist
      if (retailers?.length > 0) {
        queryParamsObj.userId = JSON.stringify(transactionUserId || user?.id);
      } else {
        queryParamsObj.userId = JSON.stringify([user?.id]);
      }


      const queryParams = new URLSearchParams(queryParamsObj).toString();
      console.log("transaction queryParams===>", queryParams, "transaction queryParams===>", user?.id);
      const response = await getData(`api/transaction/get-transaction-by-admin-with-pagination?${queryParams}`);
      console.log("transaction response===>", response);
      if (response?.status) {
        setTransactions(response?.data);
        setTransactionTotalPages(response?.pagination.totalPages);
        setTransactionCurrentPage(response?.pagination.currentPage);
        setTransactionTotalData(response?.pagination.totalTransactions);
      }
    } catch (e) {
      console.log(e)
    }
  }

  const fetchWalletManagement = async () => {
    try {
      const response = await getData(`api/transaction/getWalletManagementByAdmin/${user?.id}`);
      console.log("response===>Wallet=>", response);
      if (response?.status) {
        setTotalBalance(response?.totalBalance);
        setTotalCredit(response?.totalCredit);
        setTotalDebit(response?.totalDebit);
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
    fetchTransactions();

  }, [transactionUserId, transactionCurrentPage, currentPage,])

  useEffect(() => {
    fetchDistributors();
    fetchRetailers()
    // fetchTransactions();
    fetchWalletManagement()
    fetchUserRoleData()
  }, [transactionCurrentPage, currentPage,])
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  return (
    <div className="p-6 space-y-6">
      <ToastContainer />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Wallet Management</h1>
        {(user?.role !== 'retailer' && canWrite) && (
          <div className="flex space-x-3">
            <Button onClick={() => setIsCreditModalOpen(true)}>
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
          </div>
        )}
      </div>

      {/* Summary Cards */}
      {user?.role === 'distributor' || user?.role === 'retailer' ?
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Balance</p>
                <p className="text-2xl font-bold text-green-600">₹{totalBalance.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <i className="ri-wallet-line text-white text-xl w-6 h-6 flex items-center justify-center"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Credits</p>
                <p className="text-2xl font-bold text-blue-600">₹{totalCredit.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <i className="ri-arrow-up-circle-line text-white text-xl w-6 h-6 flex items-center justify-center"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Debits</p>
                <p className="text-2xl font-bold text-red-600">₹{totalDebit.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                <i className="ri-arrow-down-circle-line text-white text-xl w-6 h-6 flex items-center justify-center"></i>
              </div>
            </div>
          </div>
        </div> : ''}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {user.role === 'retailer' ? '' : <button
            onClick={() => setActiveTab('balance')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap cursor-pointer ${activeTab === 'balance'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Wallet Balances ({totalData})
          </button>}
          <button
            onClick={() => setActiveTab('transactions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap cursor-pointer ${activeTab === 'transactions'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Transactions ({transactionTotalData})
          </button>
        </nav>
      </div>

      {/* Search */}
      <div className="flex-1">
        <Input
          placeholder={activeTab === 'balance' ? "Search users..." : "Search transactions..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon="ri-search-line"
        />
      </div>

      {/* Content */}
      {activeTab === 'balance' && (
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
          totalPages={totalPages}
          totalData={totalData}
          pageSize={pageSize}
        />
      )}

      {activeTab === 'transactions' && (
        <DataTable
          data={filteredTransactions}
          columns={transactionColumns}
          // actions={renderBalanceActions}
          setCurrentPage={setTransactionCurrentPage}
          currentPage={transactionCurrentPage}
          totalPages={transactionTotalPages} // total records count from API
          pageSize={transactionPageSize}
          totalData={filteredTransactions.length}
        />
      )}

      {/* Transaction Modal */}
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

              <WalletCalculator
                onCredit={handleWalletTransaction}
                loading={loading}
                buttonText={transactionType === 'credit' ? 'Credit Wallet' : 'Debit Wallet'}
                buttonColor={transactionType === 'credit' ? 'primary' : 'danger'}
              />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}