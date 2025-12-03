
import { useState } from 'react';
import Button from '../../components/base/Button';
import Input from '../../components/base/Input';
import { useToast } from '../../components/base/Toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { getData } from '../../services/FetchNodeServices';

export default function ReportsPage() {
  const [user, setUser] = useState(() => {
    const storedUser = sessionStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const { showToast, ToastContainer } = useToast();
  const [dateRange, setDateRange] = useState({ start: '2025-01-01', end: '2025-12-31' });
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [amcs, setAmcs] = useState(0);
  const [salesData, setSalesData] = useState([]);
  const [productData, setProductData] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [totaleActiveAcount, setTotaleActiveAcount] = useState(0);
  const [totalExpiringThisMonth, setTotalExpiringThisMonth] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [distributorPerformances, setDistributorPerformances] = useState([]);
  const [retailerPerformances, setRetailerPerformance] = useState(0);
  const [monthlySalesDatas, setMonthlySalesDatas] = useState([]);



  const handleExport = (format) => {
    showToast(`Report exported as ${format.toUpperCase()} successfully`, 'success');
  };

  const StatCard = ({ title, value, icon, color, change }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className="text-sm text-green-600 mt-1">
              <i className="ri-arrow-up-line w-4 h-4 inline-flex items-center justify-center"></i>
              {change}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center`}>
          <i className={`${icon} text-white text-xl w-6 h-6 flex items-center justify-center`}></i>
        </div>
      </div>
    </div>
  );

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  const fetchReports = async () => {
    try {
      if (!user?.id) return;

      const queryJson = new URLSearchParams({
        userId: user?.id?.toString() || "",
        role: user?.role?.toString() || "",
        createdByEmail: JSON.stringify({
          email: user?.role === "distributor" || user?.role === "retailer" ? user?.email?.toString() || "" : "Tanyasharma5535.ts@gmail.com",
          name: user?.role === "distributor" || user?.role === "retailer" ? user?.name?.toString() || "" : "Admin"
        }),
        startDate: dateRange?.start,
        endDate: dateRange?.end,
        productCategory: selectedProduct,
        period: selectedPeriod
      });

      const response = await getData(`api/reports/get-all-reports-total?${queryJson}`);
      console.log("response ===>", response);
      setAmcs(response?.data.totalAmc || 0);
      setTotaleActiveAcount(response?.data?.totalActiveAccount || 0);
      setTotalExpiringThisMonth(response?.data?.totalExpiringThisMonth || 0);
      setDistributorPerformances(response?.data?.distributorPerformances.filter((item) => item.name) || 0);
      setRetailerPerformance(response?.data?.retailerPerformances.filter((item) => item.name) || 0);
      console.log("SSSS::=>MMM", response?.data?.formattedData);
      setMonthlySalesDatas(response?.data?.formattedData || []);

      setTotalRevenue(response?.data?.totalRevenue || 0);
      setSalesData(response?.data?.amcSalesData || []);
      setProductData(response?.data?.amcProductData || []);
      setRecentActivities(response?.data?.amcRecentActivities || []);

    } catch (error) {
      console.error("Error fetching AMC:", error);
    }
  };

  useEffect(() => {
    fetchReports()
  }, [dateRange, selectedPeriod, selectedProduct]);


  const formatAmount = (amount) => {
    if (amount >= 100000) return `${(amount / 100000).toFixed(2)}L`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(2)}k`;
    return amount.toString();
  };

  console.log("monthlySalesDatas ===>", totalRevenue);
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-full overflow-hidden">
      <ToastContainer />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <div className="flex space-x-3">
          {/* <Button
            variant="secondary"
            onClick={() => handleExport('excel')}
          >
            <i className="ri-file-excel-line mr-2 w-4 h-4 flex items-center justify-center"></i>
            Export Excel
          </Button>
          <Button
            onClick={() => handleExport('pdf')}
          >
            <i className="ri-file-pdf-line mr-2 w-4 h-4 flex items-center justify-center"></i>
            Export PDF
          </Button> */}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            type="date"
            label="Start Date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
          />
          <Input
            type="date"
            label="End Date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
          />
          {/* <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
            <div className="relative">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 pr-8"
              >
                <option value="all">All</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <i className="ri-arrow-down-s-line text-gray-400 w-4 h-4 flex items-center justify-center"></i>
              </div>
            </div>
          </div> */}
          {/* <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Category</label>
            <div className="relative">
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 pr-8"
              >
                <option value="all">All Products</option>
                <option value="Air Conditioner">Air Conditioner</option>
                <option value="Refrigerator">Refrigerator</option>
                <option value="Mobile Phone">Mobile Phone</option>
                <option value="Laptop">Laptop</option>
                <option value="Washing Machine">Washing Machine</option>
                <option value="Television">Television</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <i className="ri-arrow-down-s-line text-gray-400 w-4 h-4 flex items-center justify-center"></i>
              </div>
            </div>
          </div> */}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total WECs"
          value={amcs?.toLocaleString()}
          icon="ri-file-shield-line"
          color="bg-blue-500"
        // change="+12% from last period"
        />
        <StatCard
          title="Active WECs"
          value={totaleActiveAcount?.toLocaleString()}
          icon="ri-checkbox-circle-line"
          color="bg-green-500"
        // change="+8% from last period"
        />
        <StatCard
          title="Total Revenue"
          // value={formatAmount(totalRevenue)}
          value={`₹${Math.round(totalRevenue).toLocaleString()}`}
          icon="ri-money-dollar-circle-line"
          color="bg-purple-500"
        // change="+15% from last period"
        />

      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Sales Trend */}
        {salesData && salesData.length > 0 && <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly WEC Sales Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value, name) => [
                name === 'sales' ? `₹${Number(value).toLocaleString()}` : Number(value).toLocaleString(),
                name === 'sales' ? 'WEC Revenue' : 'WEC Count'
              ]} />
              <Line type="monotone" dataKey="sales" stroke="#3B82F6" strokeWidth={2} name="sales" />
              <Line type="monotone" dataKey="count" stroke="#10B981" strokeWidth={2} name="count" />
            </LineChart>
          </ResponsiveContainer>
        </div>}

        {/* Product Distribution */}
        {productData && productData.length > 0 && <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">WEC Distribution by Product</h3>
          <ResponsiveContainer width="100%" height={300}>
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
        </div>}
      </div>

      {/* Performance Tables */}
      {user?.role === 'admin' && distributorPerformances.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distributor Performance</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distributor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total WECs</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Retailers</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg per Retailer</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {distributorPerformances.map((distributor, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {distributor.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {distributor.amcs}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{distributor.revenue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {distributor.retailers}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{distributor.retailers > 0 ? Math.round(distributor.revenue / distributor.retailers).toLocaleString() : 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {retailerPerformances && retailerPerformances.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Retailers</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Retailer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total WECs</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg WEC Value</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {retailerPerformances.map((retailer, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                          index === 2 ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'
                        }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {retailer.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {retailer.amcs}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{retailer.revenue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{retailer.amcs > 0 ? Math.round(retailer.revenue / retailer.amcs).toLocaleString() : 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Revenue Chart */}
      {/* <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue Comparison</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={monthlySalesDatas}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value, name) => [
              `₹${Number(value).toLocaleString()}`,
              name === 'sales' ? 'WEC Revenue' : 'Product Revenue'
            ]} />
            <Bar dataKey="sales" fill="#3B82F6" name="sales" />
            <Bar dataKey="revenue" fill="#10B981" name="revenue" />
          </BarChart>
        </ResponsiveContainer>
      </div> */}
    </div>
  );
}
