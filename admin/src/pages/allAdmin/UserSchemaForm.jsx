
import { ReactNode, useState } from 'react';
import Button from '../../components/base/Button';
import Input from '../../components/base/Input';
import { clsx } from 'clsx';
import { postData } from '../../services/FetchNodeServices';
import { t } from 'i18next';
import { useToast } from '../../components/base/Toast';

export default function SchemaForm({
    fields,
    initialData = {},
    distributors,
    editingUser,
    fetchAdminData,
    onSubmit,
    onCancel,
    activeTab,
    setIsModalOpen,
    loading = false,
    submitText = 'Save',
    cancelText = 'Cancel'
}) {
    const { showToast, ToastContainer } = useToast();
    const [formData, setFormData] = useState(initialData);
    const [errors, setErrors] = useState({});
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    const [showPassword, setShowPassword] = useState(false);
    const handleChange = (name, value) => {
        // console.log("SSSSSSSS:==>", name, value)
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleFileChange = (name, file) => {
        if (file) {
            const fileName = `${name}_${Date.now()}_${file.name}`;
            setFormData(prev => ({ ...prev, [name]: fileName }));
        } else {
            setFormData(prev => ({ ...prev, [name]: '' }));
        }
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };
    console.log("SSSSSSSS:==>", formData)

    // console.log("SSSSSSSS:==>", { createdByEmail: { name: user?.name, email: user?.email } ,user })

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!editingUser && !formData?.password || formData?.password === '' || formData?.password?.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }
        if (!formData?.email) {
            showToast('Email is required', 'error');
            return;
        }
        if (!formData?.name) {
            showToast('Name is required', 'error');
            return;
        }
        if (!formData?.phone) {
            showToast('Phone is required', 'error');
            return;
        }
        if (!formData?.ownerName) {
            showToast('Distributor is required', 'error');
            return;
        }

        if (!formData?.address) {
            showToast('Address is required', 'error');
            return;
        }
        if (!formData?.url) {
            showToast('URL is required', 'error');
            return;
        }

        let data = {};
        if (activeTab === 'retailer') {

            const u = distributors.find((d) => d.name === formData?.DistributorId);
            // console.log('JSON.stringify( u.email)==>', u.email ,u.name)
            if (user.role === 'admin') {
                if (formData.DistributorId) {
                    if (editingUser) {
                        data = {
                            ...formData, oldCreatedByEmail: editingUser?.oldCreatedByEmail, role: activeTab === 'user-admin' ? 'admin' : activeTab, createdByEmail: { name: u?.name, email: u?.email }, admin: { name: user?.name, email: user?.email }
                        }
                    } else {
                        data = { ...formData, role: activeTab === 'user-admin' ? 'admin' : activeTab, createdByEmail: { name: u?.name, email: u?.email }, admin: { name: user?.name, email: user?.email } }
                    }
                } else {

                    data = { ...formData, role: activeTab === 'user-admin' ? 'admin' : activeTab, DistributorId: user?.name, createdByEmail: { name: user?.name, email: user?.email }, admin: { name: user?.name, email: user?.email } }
                }

            } else if (user.role === 'distributor') {
                data = { ...formData, role: activeTab === 'user-admin' ? 'admin' : activeTab, DistributorId: user?.name, createdByEmail: { name: user?.name, email: user?.email } }
            }

        } else {

            data = {
                ...formData, role: user?.role === 'distributor' ? 'retailer' : activeTab === 'user-admin' ? 'admin' : activeTab, DistributorId: user?.name, createdByEmail: { name: user?.name, email: user?.email }
            }
        }
        console.log("SSSSSSSS:==>SSSSSSSS:==>", data)


        const q = editingUser ? `api/user-admin/update-user-admin-by-admin/${editingUser?._id}` : 'api/user-admin/create-user-admin-by-admin'
        const respons = await postData(q, data);
        // console.log("SSSSSSSS:==>", respons)
        if (respons.status === true) {
            showToast(respons.message, 'success');
            fetchAdminData()
            setIsModalOpen(false);
        } else {
            showToast(respons.message, 'error');
        }
        fetchAdminData()
    };

    const renderField = (field) => {
        const value = formData[field.name] || '';
        const error = errors[field.name];

        switch (field.type) {
            case 'textarea':
                return (
                    <div key={field.name} className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        <textarea
                            value={value}
                            onChange={(e) => handleChange(field.name, e.target.value)}
                            className={`block w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${error
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                                }`}
                            rows={3}
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                        />
                        {error && <p className="text-sm text-red-600">{error}</p>}
                    </div>
                );

            case 'select':
                return (
                    <div key={field.name} className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        <div className="relative">
                            <select
                                value={value}
                                onChange={(e) => handleChange(field.name, e.target.value)}
                                className={`block w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 pr-8 ${error
                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                                    }`}
                            >
                                <option value="">Select {field.label}</option>
                                {field.options?.map(option => (
                                    <option key={option.name || option.value} value={option.name || option.value}>
                                        {option.name || option.label}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <i className="ri-arrow-down-s-line text-gray-400 w-4 h-4 flex items-center justify-center"></i>
                            </div>
                        </div>
                        {error && <p className="text-sm text-red-600">{error}</p>}
                    </div>
                );

            case 'date':
                return (
                    <div key={field.name} className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        <input
                            type="date"
                            value={value}
                            onChange={(e) => handleChange(field.name, e.target.value)}
                            className={`block w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${error
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                                }`}
                        />
                        {error && <p className="text-sm text-red-600">{error}</p>}
                    </div>
                );

            case 'file':
                return (
                    <div key={field.name} className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        <div className="flex items-center space-x-3">
                            <input
                                type="file"
                                accept={field.accept}
                                onChange={(e) => handleFileChange(field.name, e.target.files?.[0] || null)}
                                className={`block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 ${error ? 'border-red-300' : 'border-gray-300'
                                    }`}
                            />
                            {value && (
                                <div className="flex items-center space-x-2 text-sm text-green-600">
                                    <i className="ri-check-line w-4 h-4 flex items-center justify-center"></i>
                                    <span>Uploaded</span>
                                </div>
                            )}
                        </div>
                        {field.accept && (
                            <p className="text-xs text-gray-500">
                                Accepted formats: {field.accept.replace(/\./g, '').toUpperCase()}
                            </p>
                        )}
                        {error && <p className="text-sm text-red-600">{error}</p>}
                    </div>
                );

            default:
                return (
                    //   <div key={field.name} className="space-y-1">
                    //     <label className="block text-sm font-medium text-gray-700">
                    //       {field.label} {field.required && <span className="text-red-500">*</span>}
                    //     </label>
                    //     <input
                    //      type={field.type === 'password' ? (showPassword ? 'text' : 'password') : field.type}
                    // // type={field.type}
                    //       value={value}
                    //       onChange={(e) => handleChange(field.name, e.target.value)}
                    //       className={`block w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${error
                    //         ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    //         : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                    //         }`}
                    //       placeholder={`Enter ${field.label.toLowerCase()}`}
                    //     />
                    //     {error && <p className="text-sm text-red-600">{error}</p>}
                    //   </div>
                    <div key={field.name} className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>

                        <div className="relative">
                            <input
                                type={field.type === 'password' ? (showPassword ? 'text' : 'password') : field.type}
                                value={value}
                                onChange={(e) => handleChange(field.name, e.target.value)}
                                className={`block w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 pr-10 ${error
                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                                    }`}
                                placeholder={`Enter ${field.label.toLowerCase()}`}
                            />

                            {field.type === 'password' && (
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 focus:outline-none"
                                >
                                    <i
                                        className={`ri-${showPassword ? 'eye-off-line' : 'eye-line'} text-lg`}
                                    ></i>
                                </button>
                            )}
                        </div>
                        {field.type === 'password' && field?.oldpassword ? <div className="text-sm text-green-600"> old Password :- {field?.oldpassword}</div> : ''}
                        {error && <p className="text-sm text-red-600">{error}</p>}
                    </div>
                );
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <ToastContainer />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.map(renderField)}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
                {onCancel && (
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        {cancelText}
                    </Button>
                )}
                <Button
                    type="submit"
                    loading={loading}
                    disabled={loading}
                >
                    {submitText}
                </Button>
            </div>
        </form>
    );
}
