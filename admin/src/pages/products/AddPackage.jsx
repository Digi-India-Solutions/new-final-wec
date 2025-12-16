import { useState } from 'react';
import Button from '../../components/base/Button';
import { postData } from '../../services/FetchNodeServices';
import { useToast } from '../../components/base/Toast';

export default function AddPackeges({
    fields,
    activeTab,
    initialData = {},
    editingItem,
    fetchCategoryData,
    fetchBrandData,
    fetchTypeData,
    onCancel,
    allCategories = [],
    allBrands = [],
    submitText = 'Save',
    cancelText = 'Cancel',
}) {
    const { showToast, ToastContainer } = useToast();
    const [formData, setFormData] = useState(initialData);
    const [typeNames, setTypeNames] = useState(initialData?.typeNames || ['']);
    const [categoryIds, setCategoryIds] = useState(initialData?.categoryId || []);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');

    // 🔹 Generic field handler
    const handleChange = (name, value) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    // 🔹 Dynamic type name handling
    const handleTypeNameChange = (index, value) => {
        const updated = [...typeNames];
        updated[index] = value;
        setTypeNames(updated);
    };
    const addTypeNameField = () => setTypeNames([...typeNames, '']);
    const removeTypeNameField = (index) => setTypeNames(typeNames.filter((_, i) => i !== index));

    // 🔹 Dynamic category handling for brands
    const handleCategoryChange = (index, value) => {
        if (categoryIds.includes(value)) {
            showToast('This category is already selected.', 'warning');
            return;
        }
        const updated = [...categoryIds];
        updated[index] = value;
        setCategoryIds(updated);
    };
    const addCategoryField = () => setCategoryIds([...categoryIds, '']);
    const removeCategoryField = (index) => setCategoryIds(categoryIds.filter((_, i) => i !== index));

    // 🔹 Submit logic
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        let data = {};
        let endpoint = '';

        try {
            if (activeTab === 'categories') {
                data = {
                    ...formData,
                    typeNames: typeNames.filter((n) => n.trim() !== ''),
                    createdByEmail: { name: user?.name, email: user?.email },
                };
                endpoint = editingItem
                    ? `api/category/update-category-by-admin/${editingItem?._id}`
                    : `api/category/create-category-by-admin`;
            } else if (activeTab === 'brands') {
                const selectedIds = categoryIds?.map((name) => allCategories?.find((c) => c?.name === name)?._id).filter(Boolean);
                const selectedId = categoryIds?.map((name) => allCategories?.find((c) => c?.name === name)?.name).filter(Boolean);
                console.log("SSS:==>SD", selectedId)
                data = {
                    ...formData,
                    categoryIds: selectedIds,
                    categoryId: selectedId,
                    createdByEmail: { name: user?.name, email: user?.email },
                };
                console.log("SSS:==>SD", data)

                endpoint = editingItem
                    ? `api/brand/update-brand-by-admin/${editingItem?._id}`
                    : `api/brand/create-brand-by-admin`;
            } else if (activeTab === 'types') {
                const category = allCategories.find((c) => c.name === formData?.categoryId);
                const brand = allBrands.find((b) => b.name === formData?.brandId);

                data = {
                    ...formData,
                    typeNames: typeNames.filter((n) => n.trim() !== ''),
                    categoryIds: category?._id,
                    brandIds: brand?._id,
                    createdByEmail: { name: user?.name, email: user?.email },
                };
                endpoint = editingItem
                    ? `api/type/update-type-by-admin/${editingItem?._id}`
                    : `api/type/create-type-by-admin`;
            }

            const response = await postData(endpoint, data);
            if (response?.status) {
                showToast(response?.message, 'success');
                fetchCategoryData?.();
                fetchBrandData?.();
                fetchTypeData?.();
                onCancel?.();
            } else {
                showToast(response?.message || 'Something went wrong', 'error');
            }
        } catch (err) {
            showToast('Error submitting form', 'error');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // 🔹 Reusable Field Renderer
    const renderField = (field) => {
        if (activeTab === 'types' && field.name === 'name') return null;

        const value = formData[field.name] || '';
        const error = errors[field.name];

        switch (field.type) {
            case 'select':
                return (
                    <div key={field.name}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        <select
                            value={value}
                            onChange={(e) => handleChange(field.name, e.target.value)}
                            className={`w-full rounded-lg border px-3 py-2 text-sm ${error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                }`}
                        >
                            <option value="">Select {field.label}</option>
                            {field.options?.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        {error && <p className="text-xs text-red-500">{error}</p>}
                    </div>
                );

            default:
                return (
                    <div key={field.name}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        <input
                            type={field.type}
                            value={value}
                            onChange={(e) => handleChange(field.name, e.target.value)}
                            placeholder={`Enter ${field.label}`}
                            className={`w-full rounded-lg border px-3 py-2 text-sm ${error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                }`}
                        />
                        {error && <p className="text-xs text-red-500">{error}</p>}
                    </div>
                );
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <ToastContainer />

            {/* 🔹 Dynamic Field Rendering */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{fields.map(renderField)}</div>

            {/* 🔹 Multiple Type Names for 'categories' */}
            {activeTab === 'categories' && (
                <div className="col-span-2 space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Type Names <span className="text-red-500">*</span>
                    </label>

                    {typeNames.map((name, idx) => (
                        <div key={idx} className="flex space-x-2">
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => handleTypeNameChange(idx, e.target.value)}
                                placeholder={`Enter Type Name ${idx + 1}`}
                                className="flex-1 rounded-lg border px-3 py-2 text-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                            />
                            {idx > 0 && (
                                <Button type="button" variant="danger" onClick={() => removeTypeNameField(idx)}>
                                    <i className="ri-delete-bin-line"></i>
                                </Button>
                            )}
                        </div>
                    ))}

                    <Button type="button" variant="secondary" onClick={addTypeNameField} className="mt-2">
                        <i className="ri-add-line mr-1"></i> Add More
                    </Button>
                </div>
            )}

            {/* 🔹 Multiple Categories for 'brands' */}
            {activeTab === 'brands' && (
                <div className="col-span-2 space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Categories <span className="text-red-500">*</span>
                    </label>

                    {categoryIds?.map((selected, idx) => (
                        <div key={idx} className="flex space-x-2">
                            <select
                                value={selected}
                                onChange={(e) => handleCategoryChange(idx, e.target.value)}
                                className="flex-1 rounded-lg border px-3 py-2 text-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Select Category</option>
                                {allCategories?.map((opt) => (
                                    <option key={opt?._id} value={opt?.name}>
                                        {opt?.name}
                                    </option>
                                ))}
                            </select>
                            {idx > 0 && (
                                <Button type="button" variant="danger" onClick={() => removeCategoryField(idx)}>
                                    <i className="ri-delete-bin-line"></i>
                                </Button>
                            )}
                        </div>
                    ))}

                    <Button type="button" variant="secondary" onClick={addCategoryField} className="mt-2">
                        <i className="ri-add-line mr-1"></i> Add More
                    </Button>
                </div>
            )}

            {/* 🔹 Actions */}
            <div className="flex justify-end space-x-3 pt-4">
                {onCancel && (
                    <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
                        {cancelText}
                    </Button>
                )}
                <Button type="submit" loading={loading} disabled={loading}>
                    {submitText}
                </Button>
            </div>
        </form>
    );
}
