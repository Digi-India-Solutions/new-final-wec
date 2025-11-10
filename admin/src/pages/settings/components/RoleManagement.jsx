
import { useEffect, useState } from 'react';
import DataTable from '../../../components/base/DataTable';
import Modal from '../../../components/base/Modal';
import Button from '../../../components/base/Button';
import Input from '../../../components/base/Input';
import { useToast } from '../../../components/base/Toast';
import { getData, postData } from '../../../services/FetchNodeServices';
// import {
//   // mockRoles,
//   // availableModules,
//   availablePermissions,
//   Role,
//   ModulePermission,
// } from '../../../mocks/roles';

export const availablePermissions = ['read', 'write', 'edit', 'delete'];


export const availableModules = [
  'Dashboard',
  // 'Distributors',
  // 'Retailers',
  'User Management',
  'Products',
  'WEC Management',
  'Wallet Management',
  'Reports',
  'Claims Management',
  'Staff Management',
  'Settings'
];


export default function RoleManagement() {
  const { showToast } = useToast();
  const [roles, setRoles] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({ name: '', description: '', permissions: [], status: 'active', ExistRole: '' });

  const handleAdd = () => {
    setEditingRole(null);
    setFormData({
      name: '',
      description: '',
      permissions: availableModules.map((module) => ({
        module,
        permissions: [],
      })),
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      ExistRole: role.name,
      description: role.description,
      permissions: availableModules.map((module) => {
        const existingPermission = role.permissions.find(
          (p) => p.module === module,
        );
        return {
          module,
          permissions: existingPermission
            ? existingPermission.permissions
            : [],
        };
      }),
      status: role.status,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (role) => {
    if (role.name === 'Super Admin') {
      showToast('Cannot delete Super Admin role', 'error');
      return;
    }

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const response = await getData(`api/role/delete-roles-by-admin/${role?._id}`);
      if (response?.status === true) {
        fetchRoles()
        setRoles((prev) => prev.filter((r) => r?._id !== role?._id));
        showToast('Role deleted successfully', 'success');
      }
    } catch (error) {
      showToast('Failed to delete role', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showToast('Role name is required', 'error');
      return;
    }

    // Check for duplicate role names
    const existingRole = roles.find((r) => r?.name?.toLowerCase() === formData?.name?.toLowerCase() && r?._id !== editingRole?._id);

    if (existingRole) {
      showToast('Role name already exists', 'error');
      return;
    }

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const roleData = {
        id: editingRole?._id || Date.now().toString(),
        name: formData.name,
        ExistRole: formData.ExistRole,
        description: formData.description,
        permissions: formData.permissions.filter(
          (p) => p.permissions.length > 0,
        ),
        status: formData?.status,
        createdDate:
          editingRole?.createdDate ||
          new Date().toISOString().split('T')[0],
        createdBy: editingRole?.createdBy || 'Super Admin',
      };

      if (editingRole) {
        const respons = await postData(`api/role/update-roles-by-admin/${editingRole?._id}`, roleData);
        if (respons?.status === true) {
          fetchRoles()
          setRoles((prev) => prev.map((r) => (r?._id === editingRole?._id ? roleData : r)));
          showToast('Role updated successfully', 'success');
        }
        fetchRoles();
      } else {
        const respons = await postData('api/role/create-roles-by-admin', roleData);
        console.log("SSSSS:==>AAAA", respons)
        if (respons?.status === true) {
          fetchRoles()
          setRoles((prev) => [...prev, roleData]);
          showToast('Role created successfully', 'success');
        }
        fetchRoles();
      }

      setIsModalOpen(false);
    } catch (error) {
      showToast('Failed to save role', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (
    moduleIndex,
    permission,
    checked,
  ) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.map((p, index) => {
        if (index === moduleIndex) {
          const newPermissions = checked
            ? [...p.permissions, permission]
            : p.permissions.filter((perm) => perm !== permission);
          return { ...p, permissions: newPermissions };
        }
        return p;
      }),
    }));
  };

  const getPermissionsSummary = (permissions) => {
    const activePermissions = permissions.filter(
      (p) => p.permissions.length > 0,
    );
    if (activePermissions.length === 0) return 'No permissions';
    if (activePermissions.length <= 2) {
      return activePermissions
        .map((p) => `${p.module} (${p.permissions.join(', ')})`)
        .join(', ');
    }
    return `${activePermissions.length} modules configured`;
  };

  const columns = [
    {
      key: 'name',
      title: 'Role Name',
      render: (value, role) => (
        <div className="flex items-center space-x-3">
          <div
            className={`w-3 h-3 rounded-full ${role.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
              }`}
          ></div>
          <div>
            <div className="font-medium text-gray-900">{role.name}</div>
            <div className="text-sm text-gray-500">{role.description}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'permissions',
      title: 'Assigned Permissions',
      render: (value, role) => (
        <div className="text-sm text-gray-600">
          {getPermissionsSummary(role.permissions)}
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (value, role) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${role.status === 'active'
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'
            }`}
        >
          {role.status === 'active' ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'createdDate',
      title: 'Created Date',
      render: (value, role) => (
        <div className="text-sm text-gray-600">
          <div>{new Date(role.createdDate).toLocaleDateString()}</div>
          <div className="text-xs text-gray-500">by {role.createdBy}</div>
        </div>
      ),
    },
  ];
  ///////////////////////////////////////////////////////////////////////////////////////
  const fetchRoles = async () => {
    try {
      const response = await getData('api/role/get-all-roles');
      console.log("response==>response==> response==>", response)
      if (response?.status === true) {
        setRoles(response?.data);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  }

  useEffect(() => {
    fetchRoles();
  }, [])

  //////////////////////////////////////////////////////////////////////////////////////
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Role Management
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Create and manage user roles with specific permissions
          </p>
        </div>
        <Button onClick={handleAdd}>
          <i className="ri-add-line mr-2 w-4 h-4 flex items-center justify-center"></i>
          Add Role
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <i className="ri-shield-user-line text-blue-600 text-xl w-6 h-6 flex items-center justify-center"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Roles</p>
              <p className="text-2xl font-semibold text-gray-900">
                {roles.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <i className="ri-checkbox-circle-line text-green-600 text-xl w-6 h-6 flex items-center justify-center"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Roles</p>
              <p className="text-2xl font-semibold text-gray-900">
                {roles.filter((r) => r.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <i className="ri-apps-line text-purple-600 text-xl w-6 h-6 flex items-center justify-center"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Available Modules
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {availableModules.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <i className="ri-key-line text-orange-600 text-xl w-6 h-6 flex items-center justify-center"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Permission Types
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {availablePermissions.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Roles Table */}
      <div className="bg-white rounded-lg shadow">
        <DataTable
          data={roles}
          columns={columns}
          loading={loading}
          actions={(role) => (
            <div className="flex items-center space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleEdit(role)}
              >
                <i className="ri-edit-line w-4 h-4 flex items-center justify-center"></i>
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDelete(role)}
                disabled={role?.name === 'Super Admin'}
              >
                <i className="ri-delete-bin-line w-4 h-4 flex items-center justify-center"></i>
              </Button>
            </div>
          )}
        />
      </div>

      {/* Add/Edit Role Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRole ? 'Edit Role' : 'Add New Role'}
        size="xl"
      >
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Role Name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Enter role name"
              required
              disabled={editingRole?.name === 'Super Admin'}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: e.target.value,
                  }))
                }
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 pr-8"
                disabled={editingRole?.name === 'Super Admin'}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={3}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter role description"
            />
          </div>

          {/* Permissions Matrix */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-4">
              Module Permissions
            </h4>
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <div className="grid grid-cols-5 gap-4">
                  <div className="font-medium text-sm text-gray-700">
                    Module
                  </div>
                  {availablePermissions.map((permission) => (
                    <div
                      key={permission}
                      className="font-medium text-sm text-gray-700 capitalize text-center"
                    >
                      {permission}
                    </div>
                  ))}
                </div>
              </div>

              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {formData.permissions.map((modulePermission, moduleIndex) => (
                  <div key={modulePermission.module} className="px-4 py-3">
                    <div className="grid grid-cols-5 gap-4 items-center">
                      <div className="font-medium text-sm text-gray-900">
                        {modulePermission.module}
                      </div>
                      {availablePermissions.map((permission) => (
                        <div key={permission} className="text-center">
                          <input
                            type="checkbox"
                            checked={modulePermission.permissions.includes(
                              permission,
                            )}
                            onChange={(e) =>
                              handlePermissionChange(
                                moduleIndex,
                                permission,
                                e.target.checked,
                              )
                            }
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            disabled={editingRole?.name === 'Super Admin'}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} loading={loading}>
              {editingRole ? 'Update Role' : 'Create Role'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
