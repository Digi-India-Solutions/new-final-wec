import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/base/Button';
import Input from '../../components/base/Input';
import { useToast } from '../../components/base/Toast';
import { getData, postData } from '../../services/FetchNodeServices';
import ForgotPasswordCom from './ForgotPassword';

export default function Login() {
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'admin',
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // 👁️ toggle state
  const [forgotPassword, setForgotPassword] = useState(false);
  const [companySettings, setCompanySettings] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const respons = await postData('api/admin/admin-login', formData);
      if (respons.status === true) {
        sessionStorage.setItem('token', respons.data.token);
        sessionStorage.setItem('isAuthenticated', 'true');
        sessionStorage.setItem('user', JSON.stringify(respons.data.user));
        showToast('Login successful!', 'success');
        setTimeout(() => {
          navigate('/dashboard');
        }, 500);
      }
      else {
        showToast('Invalid credentials. Please use demo accounts below.', 'error');
      }
    }
    catch (error) {
      showToast('Login failed', 'error');
    }
    finally {
      setLoading(false);
    }
  };

  const fetchCompanySettings = async () => {
    try {
      const response = await getData(`api/company/get-company-settings`);
      const respons2 = await getData(`api/company/get-AMC-settings`);

      if (response.status === true) {
        setCompanySettings(response.data);
        sessionStorage.setItem('companySettings', JSON.stringify(response?.data));
      }
      // if (respons2.status === true) {
      //   setAmcSettings(respons2.data);
      // }
    } catch (error) {
      console.error('Error fetching company settings:', error);
    }
  }
  useEffect(() => {
    fetchCompanySettings();
  }, []);

  return (<>{
    forgotPassword ?
      <ForgotPasswordCom emails={formData?.email} />
      : <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <ToastContainer />
        <div className="max-w-md w-full space-y-8">
          {/* Logo / Title */}
          <div className="text-center flex flex-col items-center">
            {companySettings?.logo ? (
              <img
                src={companySettings.logo}
                alt="Logo"
                className="h-96 w-96 object-contain" // ⬅ 3x bigger logo
              />
            ) : (
              <i className="ri-file-shield-line text-gray-700 text-[200px]"></i> // bigger fallback icon
            )}

            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              {companySettings?.name ? companySettings?.name : 'WEC Management System'}
            </h2>

            <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
          </div>

          {/* Login Form */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Email */}
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="Enter your email"
                icon="ri-mail-line"
                required
              />

              {/* Password with Eye Toggle */}
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter your password"
                  icon="ri-lock-line"
                  required
                />

                {/* Eye / Eye-off toggle button */}
                <button
                  type="button"
                  className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label="Toggle password visibility"
                >
                  <i className={`ri-eye${showPassword ? '-off' : ''}-line text-lg`} />
                </button>
              </div>

              {/* Forgot Password link */}
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setForgotPassword(true)}
                  className="text-sm text-blue-600 hover:underline focus:outline-none"
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button type="submit" loading={loading} disabled={loading} className="w-full">
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
        </div>
      </div>
  }</>
  );
}
