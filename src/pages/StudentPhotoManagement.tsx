import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Search, User, Camera, Edit, Trash2, Plus } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

interface Student {
  id: string;
  name: string;
  registerNumber: string;
  photoUrl?: string;
  userType: string;
  department?: string;
}

const StudentPhotoManagement: React.FC = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await api.get('/fnb-manager/students');
      setStudents(response.data);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    if (!selectedStudent) return;

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('studentId', selectedStudent.id);

      await api.post('/fnb-manager/upload-student-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Student photo uploaded successfully');
      setShowUploadModal(false);
      setSelectedStudent(null);
      fetchStudents();
    } catch (error) {
      console.error('Failed to upload photo:', error);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async (student: Student) => {
    if (window.confirm(`Remove photo for ${student.name}?`)) {
      try {
        await api.delete(`/fnb-manager/students/${student.id}/photo`);
        toast.success('Photo removed successfully');
        fetchStudents();
      } catch (error) {
        console.error('Failed to delete photo:', error);
      }
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.registerNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canManage = user?.role === 'FNB_MANAGER' || user?.role === 'ADMIN';

  if (!canManage) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Camera size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-500">You don't have permission to manage student photos.</p>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Photo Management</h1>
          <p className="text-gray-600">Upload and manage student photos for scanner verification</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredStudents.map((student, index) => (
          <motion.div
            key={student.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
          >
            <div className="text-center">
              <div className="relative mb-4">
                {student.photoUrl ? (
                  <img
                    src={student.photoUrl}
                    alt={student.name}
                    className="w-20 h-20 rounded-full object-cover mx-auto border-4 border-gray-200"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center mx-auto">
                    <User size={32} className="text-gray-500" />
                  </div>
                )}
                
                <button
                  onClick={() => {
                    setSelectedStudent(student);
                    setShowUploadModal(true);
                  }}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700"
                >
                  {student.photoUrl ? <Edit size={14} /> : <Plus size={14} />}
                </button>
              </div>

              <h3 className="font-semibold text-gray-900 mb-1">{student.name}</h3>
              <p className="text-sm text-gray-600 mb-1">{student.registerNumber}</p>
              <p className="text-xs text-gray-500">{student.userType}</p>
              {student.department && (
                <p className="text-xs text-gray-500">{student.department}</p>
              )}

              {student.photoUrl && (
                <button
                  onClick={() => handleDeletePhoto(student)}
                  className="mt-3 text-red-600 hover:text-red-800 p-1 rounded"
                  title="Remove Photo"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Photo Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title={`Upload Photo for ${selectedStudent?.name}`}
        size="md"
      >
        <PhotoUploadForm
          student={selectedStudent}
          onUpload={handlePhotoUpload}
          onCancel={() => setShowUploadModal(false)}
          uploading={uploadingPhoto}
        />
      </Modal>
    </div>
  );
};

// Photo Upload Form Component
const PhotoUploadForm: React.FC<{
  student: Student | null;
  onUpload: (file: File) => void;
  onCancel: () => void;
  uploading: boolean;
}> = ({ student, onUpload, onCancel, uploading }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (selectedFile: File) => {
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

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
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = () => {
    if (file) {
      onUpload(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h4 className="text-lg font-medium text-gray-900">{student?.name}</h4>
        <p className="text-sm text-gray-600">{student?.registerNumber}</p>
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
        {preview ? (
          <div className="space-y-4">
            <img
              src={preview}
              alt="Preview"
              className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-gray-200"
            />
            <p className="text-sm text-gray-600">{file?.name}</p>
            <button
              onClick={() => {
                setFile(null);
                setPreview(null);
              }}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Remove photo
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Camera className="h-12 w-12 text-gray-400 mx-auto" />
            <div>
              <label className="cursor-pointer">
                <span className="text-blue-600 hover:text-blue-800 font-medium">
                  Choose a photo
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                  className="hidden"
                />
              </label>
              <span className="text-gray-500"> or drag and drop</span>
            </div>
            <p className="text-sm text-gray-500">PNG, JPG up to 5MB</p>
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
          disabled={!file || uploading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : 'Upload Photo'}
        </button>
      </div>
    </div>
  );
};

export default StudentPhotoManagement;