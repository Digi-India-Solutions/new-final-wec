
import { useState } from 'react';
import Button from '../../components/base/Button';
import Input from '../../components/base/Input';
import { useToast } from '../../components/base/Toast';
import RoleManagement from './components/RoleManagement';
import { getData, postData } from '../../services/FetchNodeServices';
import JoditEditor from 'jodit-react';
import { useRef } from 'react';

export default function SettingsPage() {
  // const { user } = useAuthStore();
  const editor = useRef(null);
  const [user, setUser] = useState(() => {
    const storedUser = sessionStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const { showToast, ToastContainer } = useToast();
  const [activeTab, setActiveTab] = useState('company');
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState('');

  // Company Settings
  const [companySettings, setCompanySettings] = useState({
    name: 'WEC Management System',
    email: 'contact@amcmanagement.com',
    phone: '+91 9876543200',
    address: '123 Business Park, Mumbai, Maharashtra 400001',
    website: 'https://amcmanagement.com',
    logo: ''
  });

  // Email Settings
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUsername: 'noreply@amcmanagement.com',
    smtpPassword: '',
    fromName: 'WEC Management System',
    fromEmail: 'noreply@amcmanagement.com'
  });

  // AMC Settings
  const [amcSettings, setAmcSettings] = useState({
    defaultPercentage: 8,
    minPercentage: 5,
    maxPercentage: 15,
    defaultDuration: 12,
    termsAndConditions: `1. This WEC covers maintenance and repair services for the specified product.
2. Service will be provided within 24-48 hours of request.
3. Parts replacement is covered under this contract.
4. Customer must provide proper access to the product for service.
5. This contract is non-transferable and valid for the specified duration.
6. Any misuse or damage due to negligence is not covered.
7. Service charges for areas beyond city limits may apply.
8. Contract renewal must be done before expiry date.
9. All disputes are subject to local jurisdiction.
10. Terms and conditions are subject to change with prior notice.`
  });

  // Theme Settings
  const [themeSettings, setThemeSettings] = useState({
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981',
    accentColor: '#F59E0B',
    theme: 'light'
  });

  const handleSave = async (section) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      // console.log('companySettings===>', companySettings?.logo)
      if (section === 'Company') {
        const formData = new FormData();
        formData.append('name', companySettings?.name || '');
        formData.append('email', companySettings?.email || '');
        formData.append('phone', companySettings?.phone || '');
        formData.append('address', companySettings?.address || '');
        formData.append('website', companySettings?.website || '');

        // ✅ Append logo only if it’s a File object (not a string URL)
        if (companySettings?.logo && typeof companySettings.logo !== 'string') {
          formData.append('logo', companySettings.logo);
        }

        // ✅ Send formData instead of companySettings
        const respons = await postData(`api/company/create-or-update-settings`, formData, true);
        console.log('respons===>', respons);

        if (respons.status === true) {
          fetchCompanySettings()
          showToast(`Company settings saved successfully`, 'success');
        } else {
          showToast('Failed to save settings', 'error');
        }
      } else if (section === 'Email') {
        showToast(`${section} settings saved successfully`, 'success');
      } else if (section === 'WEC') {
        const respons = await postData(`api/company/create-or-update-amc-settings`, amcSettings, true);
        if (respons.status === true) {
          fetchCompanySettings()
          showToast(`${section} settings saved successfully`, 'success');
        } else {
          showToast('Failed to save settings', 'error');
        }
      } else if (section === 'Theme') {
        showToast(`${section} settings saved successfully`, 'success');
      } else {
        showToast(`${section} settings saved successfully`, 'success');
      }

    } catch (error) {
      showToast('Failed to save settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target.result);
        setCompanySettings(prev => ({ ...prev, logo: file, }));
      };
      reader.readAsDataURL(file);
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
      if (respons2.status === true) {
        setAmcSettings(respons2.data);
      }
    } catch (error) {
      console.error('Error fetching company settings:', error);
    }
  }
  useEffect(() => {
    fetchCompanySettings();
  }, []);


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
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-full overflow-hidden">
      <ToastContainer />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'company', label: 'Company Details', icon: 'ri-building-line' },
            // { key: 'email', label: 'Email Settings', icon: 'ri-mail-settings-line' },
            { key: 'amc', label: 'WEC Configuration', icon: 'ri-file-shield-line' },
            // { key: 'theme', label: 'Theme & Branding', icon: 'ri-palette-line' },
            { key: 'roles', label: 'Role Management', icon: 'ri-shield-user-line' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap cursor-pointer flex items-center space-x-2 ${activeTab === tab.key
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <i className={`${tab.icon} w-4 h-4 flex items-center justify-center`}></i>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Company Details Tab */}
      {activeTab === 'company' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Company Information</h3>

          <div className="space-y-6">
            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
              <div className="flex items-center space-x-6">
                <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    companySettings.logo ?
                      <img src={companySettings?.logo} alt="Logo" className="w-full h-full object-cover" /> :
                      <i className="ri-image-line text-gray-400 text-2xl w-8 h-8 flex items-center justify-center"></i>
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label
                    htmlFor="logo-upload"
                    className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <i className="ri-upload-line mr-2 w-4 h-4 flex items-center justify-center"></i>
                    Upload Logo
                  </label>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 2MB</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Company Name"
                value={companySettings.name}
                onChange={(e) => setCompanySettings(prev => ({ ...prev, name: e.target.value }))}
                icon="ri-building-line"
              />

              <Input
                label="Email"
                type="email"
                value={companySettings.email}
                onChange={(e) => setCompanySettings(prev => ({ ...prev, email: e.target.value }))}
                icon="ri-mail-line"
              />

              <Input
                label="Phone"
                type="tel"
                value={companySettings.phone}
                onChange={(e) => setCompanySettings(prev => ({ ...prev, phone: e.target.value }))}
                icon="ri-phone-line"
              />

              <Input
                label="Website"
                value={companySettings.website}
                onChange={(e) => setCompanySettings(prev => ({ ...prev, website: e.target.value }))}
                icon="ri-global-line"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea
                value={companySettings.address}
                onChange={(e) => setCompanySettings(prev => ({ ...prev, address: e.target.value }))}
                rows={3}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => handleSave('Company')}
                loading={loading}
              >
                Save Company Details
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Email Settings Tab */}
      {/* {activeTab === 'email' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">SMTP Configuration</h3>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="SMTP Host"
                value={emailSettings.smtpHost}
                onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpHost: e.target.value }))}
                icon="ri-server-line"
              />

              <Input
                label="SMTP Port"
                type="number"
                value={emailSettings.smtpPort}
                onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpPort: e.target.value }))}
                icon="ri-router-line"
              />

              <Input
                label="Username"
                value={emailSettings.smtpUsername}
                onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpUsername: e.target.value }))}
                icon="ri-user-line"
              />

              <Input
                label="Password"
                type="password"
                value={emailSettings.smtpPassword}
                onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpPassword: e.target.value }))}
                icon="ri-lock-line"
              />

              <Input
                label="From Name"
                value={emailSettings.fromName}
                onChange={(e) => setEmailSettings(prev => ({ ...prev, fromName: e.target.value }))}
                icon="ri-user-heart-line"
              />

              <Input
                label="From Email"
                type="email"
                value={emailSettings.fromEmail}
                onChange={(e) => setEmailSettings(prev => ({ ...prev, fromEmail: e.target.value }))}
                icon="ri-mail-send-line"
              />
            </div>

            <div className="flex justify-between">
              <Button
                variant="secondary"
                onClick={() => showToast('Test email sent successfully', 'success')}
              >
                <i className="ri-send-plane-line mr-2 w-4 h-4 flex items-center justify-center"></i>
                Send Test Email
              </Button>
              <Button
                onClick={() => handleSave('Email')}
                loading={loading}
              >
                Save Email Settings
              </Button>
            </div>
          </div>
        </div>
      )} */}

      {/* AMC Configuration Tab */}
      {activeTab === 'amc' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">WEC Default Settings</h3>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Input
                label="Default WEC Percentage"
                type="text"
                value={amcSettings.defaultPercentage}
                min="0"
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || (/^\d+$/.test(value) && Number(value) >= 0)) {
                    setAmcSettings((prev) => ({ ...prev, defaultPercentage: value }));
                  }
                }}
                icon="ri-percent-line"
              />
              <Input
                label="Default Duration (Months)"
                type="text"
                value={amcSettings.defaultDuration}
                min="0"
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || (/^\d+$/.test(value) && Number(value) >= 0)) {
                    setAmcSettings(prev => ({ ...prev, defaultDuration: value }))
                  }
                }}
                icon="ri-calendar-line"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Terms & Conditions</label>
              
              <JoditEditor
                ref={editor}
                value={amcSettings.termsAndConditions}
                config={{
                  height: 400,
                  placeholder: 'Enter default terms and conditions for WEC contracts...',
                }}
                onChange={(newContent) =>
                  setAmcSettings((prev) => ({
                    ...prev,
                    termsAndConditions: newContent,
                  }))
                }
              />
              <p className="text-xs text-gray-500 mt-1">These terms will be included in all WEC certificates</p>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => handleSave('WEC')}
                loading={loading}
              >
                Save WEC Settings
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Theme & Branding Tab */}
      {/* {activeTab === 'theme' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Theme & Brand Colors</h3>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Theme Mode</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="theme"
                      value="light"
                      checked={themeSettings.theme === 'light'}
                      onChange={(e) => setThemeSettings(prev => ({ ...prev, theme: e.target.value }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Light</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="theme"
                      value="dark"
                      checked={themeSettings.theme === 'dark'}
                      onChange={(e) => setThemeSettings(prev => ({ ...prev, theme: e.target.value }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Dark</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={themeSettings.primaryColor}
                    onChange={(e) => setThemeSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <Input
                    value={themeSettings.primaryColor}
                    onChange={(e) => setThemeSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={themeSettings.secondaryColor}
                    onChange={(e) => setThemeSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <Input
                    value={themeSettings.secondaryColor}
                    onChange={(e) => setThemeSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Accent Color</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={themeSettings.accentColor}
                    onChange={(e) => setThemeSettings(prev => ({ ...prev, accentColor: e.target.value }))}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <Input
                    value={themeSettings.accentColor}
                    onChange={(e) => setThemeSettings(prev => ({ ...prev, accentColor: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-6">
              <h4 className="text-sm font-medium text-gray-700 mb-4">Preview</h4>
              <div className="space-y-4">
                <div className="flex space-x-4">
                  <button
                    style={{ backgroundColor: themeSettings.primaryColor }}
                    className="px-4 py-2 text-white rounded-lg font-medium"
                  >
                    Primary Button
                  </button>
                  <button
                    style={{ backgroundColor: themeSettings.secondaryColor }}
                    className="px-4 py-2 text-white rounded-lg font-medium"
                  >
                    Secondary Button
                  </button>
                  <button
                    style={{ backgroundColor: themeSettings.accentColor }}
                    className="px-4 py-2 text-white rounded-lg font-medium"
                  >
                    Accent Button
                  </button>
                </div>

                <div className="flex items-center space-x-4">
                  <div
                    style={{ backgroundColor: themeSettings.primaryColor }}
                    className="w-8 h-8 rounded-full"
                  ></div>
                  <span className="text-sm text-gray-600">Primary color will be used for main actions and highlights</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button
                variant="secondary"
                onClick={() => setThemeSettings({
                  primaryColor: '#3B82F6',
                  secondaryColor: '#10B981',
                  accentColor: '#F59E0B',
                  theme: 'light'
                })}
              >
                Reset to Default
              </Button>
              <Button
                onClick={() => handleSave('Theme')}
                loading={loading}
              >
                Save Theme Settings
              </Button>
            </div>
          </div>
        </div>
      )} */}

      {/* Role Management Tab */}
      {activeTab === 'roles' && (
        <div className="bg-white rounded-lg shadow p-6">
          <RoleManagement />
        </div>
      )}
    </div>
  );
}
