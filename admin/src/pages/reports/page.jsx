
import { useState } from 'react';
import Button from '../../components/base/Button';
import Input from '../../components/base/Input';
import { useToast } from '../../components/base/Toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { getData } from '../../services/FetchNodeServices';

export const mockAMCs = [
  {
    id: 'AMC001',
    customerName: 'Rajesh Kumar',
    customerEmail: 'rajesh.kumar@email.com',
    customerMobile: '+91 9876543230',
    customerAddress: '123 Residential Complex, Mumbai, Maharashtra 400001',
    productCategory: 'Air Conditioner',
    productBrand: 'Samsung',
    productType: 'Split AC',
    productModel: 'AR18TY5QAWK',
    serialNumber: 'SAC2024001234',
    purchaseValue: 45000,
    amcPercentage: 8,
    amcAmount: 3600,
    purchaseProof: 'purchase_proof_rajesh.pdf',
    startDate: '2024-01-15',
    endDate: '2025-01-14',
    status: 'active',
    retailerId: '1',
    retailerName: 'Tech Store Mumbai',
    distributorId: '1',
    distributorName: 'ABC Electronics Pvt Ltd',
    createdDate: '2024-01-15',
    renewalCount: 0,
    lastServiceDate: '2024-06-15'
  },
  {
    id: 'AMC002',
    customerName: 'Priya Sharma',
    customerEmail: 'priya.sharma@email.com',
    customerMobile: '+91 9876543231',
    customerAddress: '456 Garden View, Bangalore, Karnataka 560001',
    productCategory: 'Refrigerator',
    productBrand: 'LG',
    productType: 'Double Door',
    productModel: 'GL-T292RPZY',
    serialNumber: 'LGR2024005678',
    purchaseValue: 32000,
    amcPercentage: 9,
    amcAmount: 2880,
    purchaseProof: 'purchase_proof_priya.jpg',
    startDate: '2024-02-01',
    endDate: '2025-01-31',
    status: 'active',
    retailerId: '3',
    retailerName: 'Electronics Plaza',
    distributorId: '2',
    distributorName: 'TechWorld Distribution',
    createdDate: '2024-02-01',
    renewalCount: 0,
    lastServiceDate: '2024-07-01'
  },
  {
    id: 'AMC003',
    customerName: 'Amit Patel',
    customerEmail: 'amit.patel@email.com',
    customerMobile: '+91 9876543232',
    customerAddress: '789 Tech Park, Pune, Maharashtra 411001',
    productCategory: 'Mobile Phone',
    productBrand: 'Apple',
    productType: 'iPhone',
    productModel: 'iPhone 15 Pro',
    serialNumber: '359123456789012',
    purchaseValue: 134900,
    amcPercentage: 8,
    amcAmount: 10792,
    purchaseProof: 'purchase_proof_amit.pdf',
    startDate: '2024-03-15',
    endDate: '2025-03-14',
    status: 'active',
    retailerId: '5',
    retailerName: 'Smart Solutions',
    distributorId: '3',
    distributorName: 'Digital Solutions Inc',
    createdDate: '2024-03-15',
    renewalCount: 0,
    lastServiceDate: '2024-08-15'
  },
  {
    id: 'AMC004',
    customerName: 'Sunita Reddy',
    customerEmail: 'sunita.reddy@email.com',
    customerMobile: '+91 9876543233',
    customerAddress: '321 IT Corridor, Chennai, Tamil Nadu 600001',
    productCategory: 'Laptop',
    productBrand: 'Dell',
    productType: 'Gaming',
    productModel: 'Alienware m15 R7',
    serialNumber: 'DELL2024789012',
    purchaseValue: 185000,
    amcPercentage: 9,
    amcAmount: 16650,
    purchaseProof: 'purchase_proof_sunita.png',
    startDate: '2023-12-01',
    endDate: '2024-11-30',
    status: 'expiring',
    retailerId: '7',
    retailerName: 'Tech Corner',
    distributorId: '5',
    distributorName: 'Smart Devices Hub',
    createdDate: '2023-12-01',
    renewalCount: 1,
    lastServiceDate: '2024-05-01'
  },
  {
    id: 'AMC005',
    customerName: 'Vikram Singh',
    customerEmail: 'vikram.singh@email.com',
    customerMobile: '+91 9876543234',
    customerAddress: '654 Business District, Delhi, Delhi 110001',
    productCategory: 'Washing Machine',
    productBrand: 'Samsung',
    productType: 'Front Load',
    productModel: 'WW80T504DAN',
    serialNumber: 'SWM2024345678',
    purchaseValue: 42000,
    amcPercentage: 8,
    amcAmount: 3360,
    purchaseProof: 'purchase_proof_vikram.pdf',
    startDate: '2023-10-15',
    endDate: '2024-10-14',
    status: 'expired',
    retailerId: '6',
    retailerName: 'Gadget Store',
    distributorId: '4',
    distributorName: 'Metro Electronics',
    createdDate: '2023-10-15',
    renewalCount: 0,
    lastServiceDate: '2024-03-15'
  },
  {
    id: 'AMC006',
    customerName: 'Meera Joshi',
    customerEmail: 'meera.joshi@email.com',
    customerMobile: '+91 9876543235',
    customerAddress: '987 Residential Area, Mumbai, Maharashtra 400050',
    productCategory: 'Television',
    productBrand: 'Samsung',
    productType: 'QLED',
    productModel: 'QA65Q80BAK',
    serialNumber: 'STV2024901234',
    purchaseValue: 89000,
    amcPercentage: 9,
    amcAmount: 8010,
    purchaseProof: 'purchase_proof_meera.jpg',
    startDate: '2024-04-01',
    endDate: '2025-03-31',
    status: 'active',
    retailerId: '2',
    retailerName: 'Mobile World',
    distributorId: '1',
    distributorName: 'ABC Electronics Pvt Ltd',
    createdDate: '2024-04-01',
    renewalCount: 0,
    lastServiceDate: '2024-09-01'
  },
  {
    id: 'AMC007',
    customerName: 'Arjun Nair',
    customerEmail: 'arjun.nair@email.com',
    customerMobile: '+91 9876543236',
    customerAddress: '147 Tech Hub, Bangalore, Karnataka 560002',
    productCategory: 'Air Conditioner',
    productBrand: 'LG',
    productType: 'Split AC',
    productModel: 'MS-Q18YNZA',
    serialNumber: 'LAC2024567890',
    purchaseValue: 38000,
    amcPercentage: 8,
    amcAmount: 3040,
    purchaseProof: 'purchase_proof_arjun.pdf',
    startDate: '2024-05-15',
    endDate: '2025-05-14',
    status: 'active',
    retailerId: '4',
    retailerName: 'Digital Hub',
    distributorId: '2',
    distributorName: 'TechWorld Distribution',
    createdDate: '2024-05-15',
    renewalCount: 0,
    lastServiceDate: null
  },
  {
    id: 'AMC008',
    customerName: 'Kavya Menon',
    customerEmail: 'kavya.menon@email.com',
    customerMobile: '+91 9876543237',
    customerAddress: '258 Shopping Complex, Chennai, Tamil Nadu 600002',
    productCategory: 'Mobile Phone',
    productBrand: 'Samsung',
    productType: 'Smartphone',
    productModel: 'Galaxy S23 Ultra',
    serialNumber: '358987654321098',
    purchaseValue: 124999,
    amcPercentage: 8,
    amcAmount: 9999,
    purchaseProof: 'purchase_proof_kavya.png',
    startDate: '2024-06-01',
    endDate: '2025-05-31',
    status: 'active',
    retailerId: '8',
    retailerName: 'Electronics Mart',
    distributorId: '5',
    distributorName: 'Smart Devices Hub',
    createdDate: '2024-06-01',
    renewalCount: 0,
    lastServiceDate: null
  }
];


export const mockDistributors = [
  {
    id: '1',
    name: 'ABC Electronics Pvt Ltd',
    email: 'contact@abcelectronics.com',
    mobile: '+91 9876543210',
    address: '123 Business Park, Mumbai, Maharashtra 400001',
    walletBalance: 125000,
    status: 'active',
    joinedDate: '2023-01-15',
    dateOfJoining: '2023-01-15',
    totalRetailers: 8,
    totalAMCs: 156,
    password: 'demo123'
  },
  {
    id: '2',
    name: 'TechWorld Distribution',
    email: 'info@techworld.com',
    mobile: '+91 9876543211',
    address: '456 Tech Hub, Bangalore, Karnataka 560001',
    walletBalance: 89000,
    status: 'active',
    joinedDate: '2023-02-20',
    dateOfJoining: '2023-02-20',
    totalRetailers: 12,
    totalAMCs: 203,
    password: 'demo123'
  },
  {
    id: '3',
    name: 'Digital Solutions Inc',
    email: 'sales@digitalsolutions.com',
    mobile: '+91 9876543212',
    address: '789 IT Park, Pune, Maharashtra 411001',
    walletBalance: 67500,
    status: 'active',
    joinedDate: '2023-03-10',
    dateOfJoining: '2023-03-10',
    totalRetailers: 6,
    totalAMCs: 98,
    password: 'demo123'
  },
  {
    id: '4',
    name: 'Metro Electronics',
    email: 'contact@metroelectronics.com',
    mobile: '+91 9876543213',
    address: '321 Commercial Street, Delhi, Delhi 110001',
    walletBalance: 45000,
    status: 'inactive',
    joinedDate: '2023-04-05',
    dateOfJoining: '2023-04-05',
    totalRetailers: 4,
    totalAMCs: 67,
    password: 'demo123'
  },
  {
    id: '5',
    name: 'Smart Devices Hub',
    email: 'info@smartdevices.com',
    mobile: '+91 9876543214',
    address: '654 Electronics Market, Chennai, Tamil Nadu 600001',
    walletBalance: 156000,
    status: 'active',
    joinedDate: '2023-01-30',
    dateOfJoining: '2023-01-30',
    totalRetailers: 15,
    totalAMCs: 289,
    password: 'demo123'
  }
];


export const mockRetailers = [
  {
    id: '1',
    name: 'Tech Store Mumbai',
    email: 'owner@techstoremumbai.com',
    mobile: '+91 9876543220',
    address: '12 Linking Road, Mumbai, Maharashtra 400050',
    assignedDistributor: 'ABC Electronics Pvt Ltd',
    distributorId: '1',
    walletBalance: 25000,
    status: 'active',
    joinedDate: '2023-02-01',
    dateOfJoining: '2023-02-01',
    totalAMCs: 45,
    password: 'demo123'
  },
  {
    id: '2',
    name: 'Mobile World',
    email: 'contact@mobileworld.com',
    mobile: '+91 9876543221',
    address: '34 Commercial Complex, Mumbai, Maharashtra 400001',
    assignedDistributor: 'ABC Electronics Pvt Ltd',
    distributorId: '1',
    walletBalance: 18500,
    status: 'active',
    joinedDate: '2023-02-15',
    dateOfJoining: '2023-02-15',
    totalAMCs: 32,
    password: 'demo123'
  },
  {
    id: '3',
    name: 'Electronics Plaza',
    email: 'info@electronicsplaza.com',
    mobile: '+91 9876543222',
    address: '56 Market Street, Bangalore, Karnataka 560002',
    assignedDistributor: 'TechWorld Distribution',
    distributorId: '2',
    walletBalance: 32000,
    status: 'active',
    joinedDate: '2023-03-01',
    dateOfJoining: '2023-03-01',
    totalAMCs: 67,
    password: 'demo123'
  },
  {
    id: '4',
    name: 'Digital Hub',
    email: 'sales@digitalhub.com',
    mobile: '+91 9876543223',
    address: '78 Tech Park, Bangalore, Karnataka 560001',
    assignedDistributor: 'TechWorld Distribution',
    distributorId: '2',
    walletBalance: 15000,
    status: 'active',
    joinedDate: '2023-03-15',
    dateOfJoining: '2023-03-15',
    totalAMCs: 28,
    password: 'demo123'
  },
  {
    id: '5',
    name: 'Smart Solutions',
    email: 'contact@smartsolutions.com',
    mobile: '+91 9876543224',
    address: '90 Business Center, Pune, Maharashtra 411002',
    assignedDistributor: 'Digital Solutions Inc',
    distributorId: '3',
    walletBalance: 22000,
    status: 'active',
    joinedDate: '2023-04-01',
    dateOfJoining: '2023-04-01',
    totalAMCs: 38,
    password: 'demo123'
  },
  {
    id: '6',
    name: 'Gadget Store',
    email: 'info@gadgetstore.com',
    mobile: '+91 9876543225',
    address: '12 Electronics Market, Delhi, Delhi 110002',
    assignedDistributor: 'Metro Electronics',
    distributorId: '4',
    walletBalance: 8500,
    status: 'inactive',
    joinedDate: '2023-04-20',
    dateOfJoining: '2023-04-20',
    totalAMCs: 15,
    password: 'demo123'
  },
  {
    id: '7',
    name: 'Tech Corner',
    email: 'owner@techcorner.com',
    mobile: '+91 9876543226',
    address: '34 Shopping Complex, Chennai, Tamil Nadu 600002',
    assignedDistributor: 'Smart Devices Hub',
    distributorId: '5',
    walletBalance: 28000,
    status: 'active',
    joinedDate: '2023-02-10',
    dateOfJoining: '2023-02-10',
    totalAMCs: 52,
    password: 'demo123'
  },
  {
    id: '8',
    name: 'Electronics Mart',
    email: 'contact@electronicsmart.com',
    mobile: '+91 9876543227',
    address: '56 Main Road, Chennai, Tamil Nadu 600001',
    assignedDistributor: 'Smart Devices Hub',
    distributorId: '5',
    walletBalance: 35000,
    status: 'active',
    joinedDate: '2023-02-25',
    dateOfJoining: '2023-02-25',
    totalAMCs: 73,
    password: 'demo123'
  }
];

export default function ReportsPage() {
  const [user, setUser] = useState(() => {
    const storedUser = sessionStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const { showToast, ToastContainer } = useToast();
  const [dateRange, setDateRange] = useState({ start: '2024-01-01', end: '2024-12-31' });
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [amcs, setAmcs] = useState(mockAMCs || 0);
  const [salesData, setSalesData] = useState([]);
  const [productData, setProductData] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [totaleActiveAcount, setTotaleActiveAcount] = useState(0);
  const [totalExpiringThisMonth, setTotalExpiringThisMonth] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalDistributors, setTotalDistributors] = useState(0);
  const [totalRetailers, setTotalRetailers] = useState(0);

  // Mock data

  const distributors = mockDistributors;
  const retailers = mockRetailers;

  // Filter data based on user role
  const getUserData = () => {
    if (user?.role === 'admin') {
      return { amcs, distributors, retailers };
    } else if (user?.role === 'distributor') {
      const filteredAMCs = amcs.filter(amc => amc.distributorId === user.id);
      const filteredRetailers = retailers.filter(r => r.distributorId === user.id);
      return { amcs: filteredAMCs, distributors: [distributors.find(d => d.id === user.id)], retailers: filteredRetailers };
    }
    return { amcs: [], distributors: [], retailers: [] };
  };

  const userData = getUserData();

  // Calculate summary stats
  const calculateStats = () => {
    const totalAMCs = userData.amcs.length;
    const activeAMCs = userData.amcs.filter(amc => amc.status === 'active').length;
    const expiringAMCs = userData.amcs.filter(amc => amc.status === 'expiring').length;
    const renewedAMCs = userData.amcs.filter(amc => amc.renewalCount > 0).length;
    const totalRevenue = userData.amcs.reduce((sum, amc) => sum + amc.amcAmount, 0);
    const avgAMCValue = totalAMCs > 0 ? totalRevenue / totalAMCs : 0;

    return {
      totalAMCs,
      activeAMCs,
      expiringAMCs,
      renewedAMCs,
      totalRevenue,
      avgAMCValue,
      renewalRate: totalAMCs > 0 ? (renewedAMCs / totalAMCs) * 100 : 0
    };
  };

  const stats = calculateStats();

  // Monthly sales data
  const getMonthlySalesData = () => {
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(2024, i).toLocaleDateString('en-US', { month: 'short' }),
      sales: 0,
      revenue: 0,
      count: 0
    }));

    userData.amcs.forEach(amc => {
      const month = new Date(amc.createdDate).getMonth();
      if (month >= 0 && month < 12) {
        monthlyData[month].sales += amc.amcAmount;
        monthlyData[month].revenue += amc.purchaseValue;
        monthlyData[month].count += 1;
      }
    });

    return monthlyData;
  };

  const monthlySalesData = getMonthlySalesData();

  // Product category distribution
  const getProductDistribution = () => {
    const categories = userData.amcs.reduce((acc, amc) => {
      acc[amc.productCategory] = (acc[amc.productCategory] || 0) + 1;
      return acc;
    }, {});

    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

    return Object.entries(categories).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length]
    }));
  };

  const productDistribution = getProductDistribution();

  // Distributor performance (Admin only)
  const getDistributorPerformance = () => {
    if (user?.role !== 'admin') return [];

    return userData.distributors.map(distributor => {
      const distributorAMCs = userData.amcs.filter(amc => amc.distributorId === distributor.id);
      const revenue = distributorAMCs.reduce((sum, amc) => sum + amc.amcAmount, 0);

      return {
        name: distributor.name,
        amcs: distributorAMCs.length,
        revenue,
        retailers: userData.retailers.filter(r => r.distributorId === distributor.id).length
      };
    });
  };

  const distributorPerformance = getDistributorPerformance();

  // Retailer performance
  const getRetailerPerformance = () => {
    return userData.retailers.map(retailer => {
      const retailerAMCs = userData.amcs.filter(amc => amc.retailerId === retailer.id);
      const revenue = retailerAMCs.reduce((sum, amc) => sum + amc.amcAmount, 0);

      return {
        name: retailer.name,
        amcs: retailerAMCs.length,
        revenue
      };
    }).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  };

  const retailerPerformance = getRetailerPerformance();

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
          email: user?.email?.toString() || "",
          name: user?.name?.toString() || "",
        }),
      });

      const response = await getData(`api/reports/get-all-reports-total?${queryJson}`);
      console.log("response ===>", response);
      // setAmcs(response?.data.totalAmc || 0);
      // setTotaleActiveAcount(response?.data?.totalActiveAccount || 0);
      // setTotalExpiringThisMonth(response?.data?.totalExpiringThisMonth || 0);
      // setTotalDistributors(response?.data?.totalDistributors || 0);
      // setTotalRetailers(response?.data?.totalRetailers || 0);
      // setTotalRevenue(response?.data?.totalRevenue || 0);
      // setSalesData(response?.data?.amcSalesData || []);
      // setProductData(response?.data?.amcProductData || []);
      // setRecentActivities(response?.data?.amcRecentActivities || []);

    } catch (error) {
      console.error("Error fetching AMC:", error);
    }
  };

  useEffect(() => {
    fetchReports()
  }, [])

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  return (
    <div className="p-6 space-y-6">
      <ToastContainer />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <div className="flex space-x-3">
          <Button
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
          </Button>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
            <div className="relative">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 pr-8"
              >
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
          </div>
          <div>
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
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total WECs"
          value={stats.totalAMCs.toLocaleString()}
          icon="ri-file-shield-line"
          color="bg-blue-500"
          change="+12% from last period"
        />
        <StatCard
          title="Active WECs"
          value={stats.activeAMCs.toLocaleString()}
          icon="ri-checkbox-circle-line"
          color="bg-green-500"
          change="+8% from last period"
        />
        <StatCard
          title="Total Revenue"
          value={`₹${(stats.totalRevenue / 100000).toFixed(1)}L`}
          icon="ri-money-dollar-circle-line"
          color="bg-purple-500"
          change="+15% from last period"
        />
        <StatCard
          title="Renewal Rate"
          value={`${stats.renewalRate.toFixed(1)}%`}
          icon="ri-refresh-line"
          color="bg-indigo-500"
          change="+5% from last period"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Sales Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly WEC Sales Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlySalesData}>
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
        </div>

        {/* Product Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">WEC Distribution by Product</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={productDistribution}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {productDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Tables */}
      {user?.role === 'admin' && distributorPerformance.length > 0 && (
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
                {distributorPerformance.map((distributor, index) => (
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

      {retailerPerformance.length > 0 && (
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
                {retailerPerformance.map((retailer, index) => (
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
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue Comparison</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={monthlySalesData}>
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
      </div>
    </div>
  );
}
