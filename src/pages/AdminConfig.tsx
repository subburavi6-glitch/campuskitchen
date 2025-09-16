import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Save, Database, Cog, Users } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';
import { showSuccess, showError, showConfirm } from '../utils/sweetAlert';

interface ConfigItem {
  id: string;
  name: string;
  symbol?: string;
  description?: string;
  active: boolean;
}

const AdminConfig: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('units');
  const [units, setUnits] = useState<ConfigItem[]>([]);
  const [storageTypes, setStorageTypes] = useState<ConfigItem[]>([]);
  const [vendorCategories, setVendorCategories] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ConfigItem | null>(null);
  const [modalType, setModalType] = useState('');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [unitsRes, storageRes, vendorCatRes] = await Promise.all([
        api.get('/admin-config/units'),
        api.get('/admin-config/storage-types'),
        api.get('/admin-config/vendor-categories')
      ]);
      
      setUnits(unitsRes.data);
      setStorageTypes(storageRes.data);
      setVendorCategories(vendorCatRes.data);
    } catch (error) {
      showError('Error', 'Failed to load configuration data');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = (type: string) => {
    setModalType(type);
    setSelectedItem(null);
    setShowModal(true);
  };

  const handleEdit = (item: ConfigItem, type: string) => {
    setModalType(type);
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleDelete = async (item: ConfigItem, type: string) => {
    const result = await showConfirm(
      'Delete Confirmation',
      `Are you sure you want to delete "${item.name}"?`
    );

    if (result.isConfirmed) {
      try {
        await api.delete(`/admin-config/${type}/${item.id}`);
        showSuccess('Success', `${type} deleted successfully`);
        fetchAllData();
      } catch (error) {
        showError('Error', `Failed to delete ${type}`);
      }
    }
  };

  const handleToggleStatus = async (item: ConfigItem, type: string) => {
    try {
      await api.put(`/admin-config/${type}/${item.id}`, {
        ...item,
        active: !item.active
      });
      showSuccess('Success', `${type} status updated`);
      fetchAllData();
    } catch (error) {
      showError('Error', `Failed to update ${type} status`);
    }
  };

  const tabs = [
    { id: 'units', label: 'Units', icon: Database },
    { id: 'storage-types', label: 'Storage Types', icon: Cog },
    { id: 'vendor-categories', label: 'Vendor Categories', icon: Users },
  ];

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Database size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-500">You don't have permission to access admin configuration.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getCurrentData = () => {
    switch (activeTab) {
      case 'units': return units;
      case 'storage-types': return storageTypes;
      case 'vendor-categories': return vendorCategories;
      default: return [];
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Admin Configuration</h1>
        <p className="text-gray-600">Manage system dropdowns and configurations</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {tabs.find(t => t.id === activeTab)?.label}
            </h3>
            <button
              onClick={() => handleAdd(activeTab)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>Add {tabs.find(t => t.id === activeTab)?.label.slice(0, -1)}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getCurrentData().map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{item.name}</h4>
                    {item.symbol && (
                      <p className="text-sm text-gray-500">Symbol: {item.symbol}</p>
                    )}
                    {item.description && (
                      <p className="text-sm text-gray-500">{item.description}</p>
                    )}
                    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full mt-2 ${
                      item.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {item.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => handleEdit(item, activeTab)}
                      className="text-blue-600 hover:text-blue-800 p-1 rounded"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(item, activeTab)}
                      className={`p-1 rounded ${
                        item.active 
                          ? 'text-red-600 hover:text-red-800' 
                          : 'text-green-600 hover:text-green-800'
                      }`}
                      title={item.active ? 'Deactivate' : 'Activate'}
                    >
                      <Cog size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(item, activeTab)}
                      className="text-red-600 hover:text-red-800 p-1 rounded"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {getCurrentData().length === 0 && (
            <div className="text-center py-8">
              <Database size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
              <p className="text-gray-500 mb-4">Add your first {tabs.find(t => t.id === activeTab)?.label.toLowerCase()}</p>
              <button
                onClick={() => handleAdd(activeTab)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Add {tabs.find(t => t.id === activeTab)?.label.slice(0, -1)}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Configuration Form Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`${selectedItem ? 'Edit' : 'Add'} ${tabs.find(t => t.id === modalType)?.label.slice(0, -1)}`}
        size="md"
      >
        <ConfigForm
          type={modalType}
          item={selectedItem}
          onSuccess={() => {
            setShowModal(false);
            fetchAllData();
          }}
          onCancel={() => setShowModal(false)}
        />
      </Modal>
    </div>
  );
};

// Configuration Form Component
const ConfigForm: React.FC<{
  type: string;
  item?: ConfigItem | null;
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ type, item, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    symbol: item?.symbol || '',
    description: item?.description || '',
    active: item?.active ?? true
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (item) {
        await api.put(`/admin-config/${type}/${item.id}`, formData);
        showSuccess('Success', `${type} updated successfully`);
      } else {
        await api.post(`/admin-config/${type}`, formData);
        showSuccess('Success', `${type} created successfully`);
      }
      onSuccess();
    } catch (error) {
      showError('Error', `Failed to save ${type}`);
    } finally {
      setLoading(false);
    }
  };

  const getFormFields = () => {
    switch (type) {
      case 'units':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Unit Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Kilogram"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Symbol *</label>
              <input
                type="text"
                required
                value={formData.symbol}
                onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., kg"
              />
            </div>
          </>
        );
      case 'storage-types':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Storage Type *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Refrigerated"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe storage conditions"
              />
            </div>
          </>
        );
      case 'vendor-categories':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Fresh Produce"
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {getFormFields()}
      
      <div>
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={formData.active}
            onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-700">Active</label>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
        >
          <Save size={16} />
          <span>{loading ? 'Saving...' : item ? 'Update' : 'Create'}</span>
        </button>
      </div>
    </form>
  );
};

export default AdminConfig;