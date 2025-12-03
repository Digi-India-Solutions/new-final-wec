// import { useAuthStore } from '../../store/authStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { getData } from '../../services/FetchNodeServices';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {

  const [user, setUser] = useState(() => {
    const storedUser = sessionStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [amcs, setAmcs] = useState(0);
  const [salesData, setSalesData] = useState([]);
  const [productData, setProductData] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [totaleActiveAcount, setTotaleActiveAcount] = useState(0);
  const [totalExpiringThisMonth, setTotalExpiringThisMonth] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalDistributors, setTotalDistributors] = useState(0);
  const [totalRetailers, setTotalRetailers] = useState(0);
  const [totalDistributorWalletAmount, setTotalDistributorWalletAmount] = useState(0);
  const [totalRetailerWalletAmount, setTotalRetailerWalletAmount] = useState(0);
  const navigate = useNavigate();

  const StatCard = ({ title, value, icon, color, change, path }) => (
    <div className="bg-white rounded-lg shadow p-4 sm:p-5" >
      <div className="flex items-center justify-between cursor-pointer" onClick={() => navigate(path)}>
        <div>
          <p className="text-xs sm:text-sm font-medium text-gray-600">{title}</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <p className="text-xs sm:text-sm text-green-600 mt-1">
              <i className="ri-arrow-up-line w-4 h-4 inline-flex items-center justify-center"></i>
              {change}
            </p>
          )}
        </div>
        <div className={`w-10 h-10 sm:w-12 sm:h-12 ${color} rounded-lg flex items-center justify-center`}>
          <i className={`${icon} text-white text-lg sm:text-xl w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center`}></i>
        </div>
      </div>
    </div>
  );
  ///////////////////////////////////////////////////////////////////////////////
  const fetchAmc = async () => {
    try {
      if (!user?.id) return;

      const queryJson = new URLSearchParams({
        userId: user?.id?.toString() || "",
        role: user?.role?.toString() || "",
        createdByEmail: JSON.stringify({
          email: user?.role === "distributor" || user?.role === "retailer"
            ? user?.email?.toString() || ""
            : "Tanyasharma5535.ts@gmail.com",
          name: user?.role === "distributor" || user?.role === "retailer"
            ? user?.name?.toString() || ""
            : "Admin"
        })

      });

      const response = await getData(`api/dashboard/get-all-amc-total?${queryJson}`);
      console.log("response ===>", response);
      setAmcs(response?.data.totalAmc || 0);
      setTotaleActiveAcount(response?.data?.totalActiveAccount || 0);
      setTotalExpiringThisMonth(response?.data?.totalExpiringThisMonth || 0);
      setTotalDistributors(response?.data?.totalDistributors || 0);
      setTotalRetailers(response?.data?.totalRetailers || 0);
      setTotalRevenue(response?.data?.totalRevenue || 0);
      setSalesData(response?.data?.amcSalesData || []);
      setProductData(response?.data?.amcProductData || []);
      setRecentActivities(response?.data?.amcRecentActivities || []);
      setTotalDistributorWalletAmount(response?.data?.totalDistributorWalletAmounts || 0);
      setTotalRetailerWalletAmount(response?.data?.totalRetailerWalletAmounts || 0);

    } catch (error) {
      console.error("Error fetching AMC:", error);
    }
  };

  useEffect(() => {
    fetchAmc()
  }, [])
  ///////////////////////////////////////////////////////////////////////////////

  const formatAmount = (amount) => {
    if (amount >= 100000) return `${(amount / 100000).toFixed(2)}L`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(2)}k`;
    return amount.toString();
  };

  console.log("salesData ===>VVV", salesData)
  return (
    <div className="p-4 sm:p-5 space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex items-center space-x-3">
          {/* <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap">
            <i className="ri-download-line mr-2 w-4 h-4 inline-flex items-center justify-center"></i>
            Export Report
          </button> */}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Total WECs"
          value={amcs.toLocaleString()}
          icon="ri-file-shield-line"
          color="bg-blue-500"
          path="/amcs"
        // change="+12% from last month"
        />
        <StatCard
          title="Active Contracts"
          value={totaleActiveAcount.toLocaleString()}
          icon="ri-checkbox-circle-line"
          color="bg-green-500"
          path="/amcs"
        // change="+8% from last month"
        />
        <StatCard
          title="Expiring This Month"
          value={totalExpiringThisMonth.toLocaleString()}
          icon="ri-alarm-warning-line"
          color="bg-yellow-500"
        />
        <StatCard
          title="Total Revenue"
          // value={`₹${formatAmount(totalRevenue)}`}
          value={`₹${Math.round(totalRevenue).toLocaleString()}`}
          icon="ri-money-dollar-circle-line"
          color="bg-purple-500"
        // change="+15% from last month"
        />
      </div>

      {user?.role !== 'retailer' && user?.role !== 'distributor' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <StatCard
            title="Total Distributors"
            value={totalDistributors || 0}
            icon="ri-building-line"
            color="bg-indigo-500"
            path="/users"
          />

          <StatCard
            title="Distributors Wallets"
            // value={`₹${formatAmount(totalDistributorWalletAmount || 0).toLocaleString()}`}
            value={`₹${Math.round(totalDistributorWalletAmount).toLocaleString()}`}
            icon="ri-wallet-fill"
            color="bg-indigo-500"
            path="/users"
          // change="+12%"
          />

          <StatCard
            title="Total Retailers"
            value={totalRetailers || 0}
            icon="ri-store-line"
            color="bg-pink-500"
            path="/users"
          />

          <StatCard
            title="Retailers Wallets"
            // value={`₹${formatAmount(totalRetailerWalletAmount || 0).toLocaleString()}`}
            value={`₹${Math.round(totalRetailerWalletAmount)?.toLocaleString()}`}
            icon="ri-wallet-fill"
            color="bg-pink-500"
            path="/wallet"
          />
        </div>
      )}

      {user?.role === 'distributor' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <StatCard
            title="My Retailers"
            value={totalRetailers || 0}
            icon="ri-store-line"
            color="bg-indigo-500"
            path="/users"
          />

          <StatCard
            title="Retailers Wallets"
            // value={`₹${formatAmount(totalRetailerWalletAmount || 0).toLocaleString()}`}
            value={`₹${Math.round(totalRetailerWalletAmount)?.toLocaleString()}`}
            icon="ri-wallet-fill"
            color="bg-pink-500"
            path="/wallet"
          />
          {/* <StatCard
            title="Commission Earned"
            value={`₹${(25000).toLocaleString()}`}
            icon="ri-hand-coin-line"
            color="bg-pink-500"
          /> */}
        </div>
      )}

      {/* Charts */}
      {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-12"> */}
      {/* Sales Trend */}
      {salesData && salesData.length > 0 && <div className="bg-white rounded-lg shadow p-4 sm:p-5">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">WEC Sales Trend</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="sales" stroke="#3B82F6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>}

      {/* Revenue Chart */}
      {/* <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div> */}
      {/* </div> */}

      {/* Product Distribution */}
      {productData && productData?.length > 0 && <div className="bg-white rounded-lg shadow p-4 sm:p-5">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">WEC Distribution by Product Category</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={productData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {productData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>

          <div className="space-y-3">
            {productData.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div
                    className="w-3 h-3 sm:w-4 sm:h-4 rounded-full"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm font-medium text-gray-900">{item.name}</span>
                </div>
                <span className="text-sm text-gray-600">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>}

      {/* Recent Activity */}
      {recentActivities && recentActivities?.length > 0 && <div className="bg-white rounded-lg shadow p-4 sm:p-5">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {recentActivities.map((activity, index) => (
            <div key={index} className="flex items-center space-x-3 sm:space-x-4 p-2 sm:p-3 hover:bg-gray-50 rounded-lg">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-full flex items-center justify-center`}>
                <i className={`${activity.icon} ${activity.color} w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center`}></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{activity.action}</p>
                <p className="text-xs text-gray-500">{activity.user} • {activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>}
    </div>
  );
}