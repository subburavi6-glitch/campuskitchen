import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, Download, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

interface CSVUpload {
  id: string;
  uploadType: string;
  filename: string;
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  errorLog?: any;
  createdAt: string;
  uploadedBy: { name: string };
}

const CSVUploadManager: React.FC = () => {
  const { user } = useAuth();
  const [uploads, setUploads] = useState<CSVUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState<string>('');

  useEffect(() => {
    fetchUploads();
  }, []);

  const fetchUploads = async () => {
    try {
      const response = await api.get('/csv-uploads');
      setUploads(response.data);
    } catch (error) {
      console.error('Failed to fetch uploads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File, type: string) => {
    const formData = new FormData();
    formData.append('csv', file);
    formData.append('type', type);

    try {
      const response = await api.post('/csv-uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success(response.data.message);
      setShowUploadModal(false);
      fetchUploads();
    } catch (error) {
      console.error(`Upload ${type} error:`, error);
    }
  };

  const downloadTemplate = (type: string) => {
    const templates = {
      items: [
        'name,sku,unit,category_name,preferred_vendor_name,moq,reorder_point,storage_type,perishable',
        'Rice Basmati,RICE001,kg,Grains,ABC Traders,100,50,Dry,false',
        'Onion,VEG001,kg,Vegetables,Fresh Produce,25,10,Cool & Dry,true'
      ],
      categories: [
        'name',
        'Vegetables',
        'Grains & Pulses',
        'Dairy Products',
        'Spices & Condiments'
      ],
      recipes: [
        'dish_name,item_name,qty_per_student',
        'Vegetable Curry,Onion,0.05',
        'Vegetable Curry,Tomato,0.08',
        'Rice,Rice Basmati,0.15'
      ],
      students: [
        'register_number,name,mobile_number,email,room_number,user_type,employee_id,department',
        'CS2021001,John Doe,9876543210,john@college.edu,A-101,STUDENT,,Computer Science',
        'EMP001,Dr. Smith,9876543211,smith@college.edu,,EMPLOYEE,EMP001,Mathematics'
      ]
    };

    const csvContent = templates[type as keyof typeof templates]?.join('\n') || '';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const uploadTypes = [
    { key: 'items', label: 'Items', description: 'Upload inventory items with categories and vendors' },
    { key: 'categories', label: 'Categories', description: 'Upload item categories' },
    { key: 'recipes', label: 'Recipes', description: 'Upload dish recipes with ingredients' },
    { key: 'students', label: 'Students', description: 'Upload student and employee data' }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle size={20} className="text-green-600" />;
      case 'FAILED':
        return <XCircle size={20} className="text-red-600" />;
      case 'PROCESSING':
        return <Clock size={20} className="text-yellow-600" />;
      default:
        return <FileText size={20} className="text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'PROCESSING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CSV Upload Manager</h1>
          <p className="text-gray-600">Bulk upload data using CSV files</p>
        </div>
      </div>

      {/* Upload Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {uploadTypes.map((type) => (
          <div key={type.key} className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <FileText size={32} className="mx-auto text-blue-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">{type.label}</h3>
              <p className="text-sm text-gray-600 mb-4">{type.description}</p>
              
              <div className="space-y-2">
                <button
                  onClick={() => downloadTemplate(type.key)}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm flex items-center justify-center space-x-1"
                >
                  <Download size={14} />
                  <span>Template</span>
                </button>
                
                <button
                  onClick={() => {
                    setUploadType(type.key);
                    setShowUploadModal(true);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm flex items-center justify-center space-x-1"
                >
                  <Upload size={14} />
                  <span>Upload</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upload History */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Upload History</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Filename</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Results</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uploaded By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {uploads.map((upload) => (
                <tr key={upload.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(upload.status)}
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {upload.uploadType}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {upload.filename}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(upload.status)}`}>
                      {upload.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <span className="text-green-600">{upload.successfulRows} success</span>
                      {upload.failedRows > 0 && (
                        <span className="text-red-600 ml-2">{upload.failedRows} failed</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      Total: {upload.totalRows} rows
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {upload.uploadedBy.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(upload.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {uploads.length === 0 && (
          <div className="text-center py-12">
            <Upload size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No uploads yet</h3>
            <p className="text-gray-500">Start by uploading your first CSV file</p>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title={`Upload ${uploadType} CSV`}
        size="md"
      >
        <CSVUploadForm
          type={uploadType}
          onUpload={handleFileUpload}
          onCancel={() => setShowUploadModal(false)}
        />
      </Modal>
    </div>
  );
};

// CSV Upload Form Component
const CSVUploadForm: React.FC<{
  type: string;
  onUpload: (file: File, type: string) => void;
  onCancel: () => void;
}> = ({ type, onUpload, onCancel }) => {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    if (file) {
      onUpload(file, type);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Upload {type} CSV</h4>
        <p className="text-sm text-blue-800">
          Make sure your CSV file follows the template format. Download the template first if needed.
        </p>
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {file ? (
          <div className="space-y-2">
            <FileText className="h-12 w-12 text-green-500 mx-auto" />
            <p className="text-lg font-medium text-gray-900">{file.name}</p>
            <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
            <button
              onClick={() => setFile(null)}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Remove file
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="h-12 w-12 text-gray-400 mx-auto" />
            <div>
              <label className="cursor-pointer">
                <span className="text-blue-600 hover:text-blue-800 font-medium">
                  Choose a CSV file
                </span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              <span className="text-gray-500"> or drag and drop</span>
            </div>
            <p className="text-sm text-gray-500">CSV files only</p>
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!file}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Upload {type}
        </button>
      </div>
    </div>
  );
};

export default CSVUploadManager;