
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/base/Button';

export default function Home() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  

  const handleDemoLogin = () => {
    // Auto-login as admin for quick demo
    const adminUser = { 
      id: '1', 
      name: 'Super Admin', 
      email: 'admin@amcmanagement.com', 
      role: 'admin'  
    };
    login(adminUser);
    navigate('/dashboard');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <i className="ri-file-shield-line text-white text-xl w-6 h-6 flex items-center justify-center"></i>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">WEC Management</h1>
                <p className="text-sm text-gray-500">System</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={handleLogin}
                className="whitespace-nowrap"
              >
                Login
              </Button>
              <Button
                onClick={handleDemoLogin}
                className="whitespace-nowrap"
              >
                Try Live Demo
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Complete WEC
            <span className="text-blue-600"> Management Solution</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Streamline your Annual Maintenance Contract operations with our comprehensive 
            management system for electronics products including ACs, Refrigerators, Mobile Phones, 
            Laptops, and more.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button
              size="lg"
              onClick={handleDemoLogin}
              className="whitespace-nowrap"
            >
              <i className="ri-play-circle-line mr-2 w-5 h-5 flex items-center justify-center"></i>
              Try Live Demo
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleLogin}
              className="whitespace-nowrap"
            >
              <i className="ri-login-circle-line mr-2 w-5 h-5 flex items-center justify-center"></i>
              Login to Account
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <i className="ri-shield-user-line text-blue-600 text-xl w-6 h-6 flex items-center justify-center"></i>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Multi-Role Access</h3>
            <p className="text-gray-600">
              Separate dashboards for Admin, Distributors, and Retailers with role-based permissions and features.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <i className="ri-file-shield-2-line text-green-600 text-xl w-6 h-6 flex items-center justify-center"></i>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">WEC Management</h3>
            <p className="text-gray-600">
              Create, track, and manage WECs with automated PDF generation, email notifications, and renewal alerts.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <i className="ri-wallet-3-line text-purple-600 text-xl w-6 h-6 flex items-center justify-center"></i>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Wallet System</h3>
            <p className="text-gray-600">
              Integrated wallet management with commission tracking, credit transfers, and transaction history.
            </p>
          </div>
        </div>

        {/* Demo Accounts */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Demo Accounts</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-red-50 rounded-xl">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-shield-user-line text-red-600 text-2xl w-8 h-8 flex items-center justify-center"></i>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Admin Panel</h3>
              <p className="text-sm text-gray-600 mb-3">Full system access with user management, reports, and settings</p>
              <p className="text-xs text-gray-500">admin@amcmanagement.com</p>
            </div>

            <div className="text-center p-6 bg-blue-50 rounded-xl">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-building-line text-blue-600 text-2xl w-8 h-8 flex items-center justify-center"></i>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Distributor Panel</h3>
              <p className="text-sm text-gray-600 mb-3">Manage retailers, create WECs, and handle wallet transfers</p>
              <p className="text-xs text-gray-500">contact@abcelectronics.com</p>
            </div>

            <div className="text-center p-6 bg-green-50 rounded-xl">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-store-line text-green-600 text-2xl w-8 h-8 flex items-center justify-center"></i>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Retailer Panel</h3>
              <p className="text-sm text-gray-600 mb-3">Create customer WECs, track commissions, and manage wallet</p>
              <p className="text-xs text-gray-500">owner@techstoremumbai.com</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500">
            <p>&copy; 2024 WEC Management System. Demo Application.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
