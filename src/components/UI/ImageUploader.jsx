import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import Button from './Button';
import SafeIcon from '../../common/SafeIcon';
import { testStorageConnection, createStorageBuckets } from '../../utils/uploadUtils';
import * as FiIcons from 'react-icons/fi';

const { FiUpload, FiImage, FiX, FiCheck, FiTrash2, FiAlertCircle, FiCheckCircle, FiRefreshCw, FiSettings } = FiIcons;

const ImageUploader = ({
  onUpload,
  onCancel,
  currentImageUrl = null,
  title = 'Upload Image',
  shape = 'circle', // 'circle' or 'square'
  className = '',
  size = 'md',
  maxSizeMB = 5,
  previewMode = true
}) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(currentImageUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [storageStatus, setStorageStatus] = useState('unknown'); // 'unknown', 'checking', 'ready', 'error'
  const [storageError, setStorageError] = useState(null);
  const fileInputRef = useRef(null);

  // Size mappings
  const sizeClasses = {
    sm: shape === 'circle' ? 'w-24 h-24' : 'w-36 h-24',
    md: shape === 'circle' ? 'w-32 h-32' : 'w-48 h-32',
    lg: shape === 'circle' ? 'w-40 h-40' : 'w-64 h-40'
  };

  // Test storage connection when component mounts and when status changes
  useEffect(() => {
    checkStorageConnection();
  }, []);

  // Test storage connection
  const checkStorageConnection = async () => {
    if (storageStatus === 'checking' || storageStatus === 'ready') return;
    
    setStorageStatus('checking');
    setStorageError(null);
    
    try {
      console.log('🔧 ImageUploader: Testing storage connection...');
      const result = await testStorageConnection();
      
      if (result.success) {
        setStorageStatus('ready');
        setStorageError(null);
        console.log('✅ ImageUploader: Storage connection ready');
      } else {
        setStorageStatus('error');
        setStorageError(result.error);
        console.error('❌ ImageUploader: Storage connection failed:', result.error);
      }
    } catch (error) {
      setStorageStatus('error');
      setStorageError('Failed to check storage connection');
      console.error('❌ ImageUploader: Error checking storage:', error);
    }
  };

  // Attempt to fix storage setup
  const attemptStorageFix = async () => {
    setStorageStatus('checking');
    setStorageError(null);
    
    try {
      console.log('🔧 Attempting to fix storage setup...');
      toast.loading('Setting up storage...', { id: 'storage-fix' });
      
      const result = await createStorageBuckets();
      
      if (result.success) {
        // Re-test connection after attempting fix
        await checkStorageConnection();
        toast.success('Storage setup completed!', { id: 'storage-fix' });
      } else {
        throw new Error(result.error || 'Failed to create storage buckets');
      }
    } catch (error) {
      setStorageStatus('error');
      setStorageError(error.message);
      toast.error('Storage setup failed. Please check Supabase Dashboard.', { id: 'storage-fix' });
      console.error('❌ Storage fix failed:', error);
    }
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  // Handle file drop
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  // Validate the file and set it
  const validateAndSetFile = (selectedFile) => {
    console.log('📄 Validating file:', {
      name: selectedFile.name,
      size: selectedFile.size,
      type: selectedFile.type
    });

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(selectedFile.type)) {
      toast.error('Please upload a PNG, JPG, JPEG, or WebP image');
      return;
    }

    // Validate file size (convert maxSizeMB to bytes)
    const maxSize = maxSizeMB * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      toast.error(`Image size should be less than ${maxSizeMB}MB`);
      return;
    }

    // Set the file and create a preview
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      console.log('📷 Preview created for file');
    };
    reader.readAsDataURL(selectedFile);
  };

  // Handle drag events
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // Handle upload
  const handleUploadClick = async () => {
    if (!file) {
      toast.error('No file selected');
      return;
    }

    // Check storage connection first
    if (storageStatus !== 'ready') {
      console.log('🔧 Storage not ready, checking again...');
      await checkStorageConnection();
      if (storageStatus !== 'ready') {
        toast.error('Storage is not ready. Please try again.');
        return;
      }
    }

    setIsUploading(true);
    console.log('🚀 Starting upload process...');

    try {
      await onUpload(file);
      console.log('✅ Upload completed successfully');
      
      // Reset state if not in preview mode
      if (!previewMode) {
        setFile(null);
        setPreview(null);
      }
    } catch (error) {
      console.error('❌ Upload error in ImageUploader:', error);
      
      // Check if it's a storage-related error
      if (error.message && error.message.includes('Storage')) {
        setStorageStatus('error');
        setStorageError(error.message);
      }
      
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle cancel
  const handleCancelClick = () => {
    setFile(null);
    setPreview(currentImageUrl);
    if (onCancel) onCancel();
  };

  // Handle remove current image
  const handleRemoveImage = () => {
    setFile(null);
    setPreview(null);
    // If there's an onRemove callback, call it
    if (onCancel) onCancel(true); // passing true indicates it's a removal
  };

  // Handle click to upload
  const handleClickToUpload = async () => {
    if (storageStatus === 'unknown' || storageStatus === 'error') {
      await checkStorageConnection();
    }
    
    if (storageStatus === 'ready') {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {title && (
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {title}
        </h3>
      )}

      {/* Storage status indicator */}
      {storageStatus === 'checking' && (
        <div className="mb-2 flex items-center space-x-2 text-xs text-yellow-600">
          <div className="animate-spin w-3 h-3 border border-yellow-600 border-t-transparent rounded-full"></div>
          <span>Checking storage...</span>
        </div>
      )}

      {storageStatus === 'error' && (
        <div className="mb-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start space-x-2 text-xs text-red-600 dark:text-red-400">
            <SafeIcon icon={FiAlertCircle} className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-medium">Storage Issue</div>
              <div className="mt-1">{storageError}</div>
              <div className="mt-2 flex space-x-2">
                <button
                  onClick={checkStorageConnection}
                  className="text-xs underline hover:no-underline flex items-center space-x-1"
                >
                  <SafeIcon icon={FiRefreshCw} className="w-3 h-3" />
                  <span>Retry</span>
                </button>
                <button
                  onClick={attemptStorageFix}
                  className="text-xs underline hover:no-underline flex items-center space-x-1"
                >
                  <SafeIcon icon={FiSettings} className="w-3 h-3" />
                  <span>Auto-Fix</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {storageStatus === 'ready' && (
        <div className="mb-2 flex items-center space-x-2 text-xs text-green-600">
          <SafeIcon icon={FiCheckCircle} className="w-3 h-3" />
          <span>Storage ready</span>
        </div>
      )}

      <div
        className={`relative ${sizeClasses[size]} ${
          shape === 'circle' ? 'rounded-full' : 'rounded-lg'
        } overflow-hidden border-2 ${
          isDragging
            ? 'border-primary-500 border-dashed bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-300 dark:border-gray-600'
        } ${!preview ? 'bg-gray-100 dark:bg-gray-700' : ''} transition-all duration-200 ${
          storageStatus === 'ready' ? 'cursor-pointer' : ''
        }`}
        onDragOver={storageStatus === 'ready' ? handleDragOver : undefined}
        onDragLeave={storageStatus === 'ready' ? handleDragLeave : undefined}
        onDrop={storageStatus === 'ready' ? handleDrop : undefined}
        onClick={storageStatus === 'ready' ? handleClickToUpload : undefined}
      >
        {preview ? (
          <div className="relative w-full h-full">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            {storageStatus === 'ready' && (
              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-40 transition-opacity flex items-center justify-center opacity-0 hover:opacity-100">
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClickToUpload();
                    }}
                    className="p-2 bg-white rounded-full hover:bg-primary-100 transition-colors"
                    title="Change image"
                  >
                    <SafeIcon icon={FiUpload} className="w-5 h-5 text-primary-600" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage();
                    }}
                    className="p-2 bg-white rounded-full hover:bg-red-100 transition-colors"
                    title="Remove image"
                  >
                    <SafeIcon icon={FiTrash2} className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4">
            {storageStatus === 'ready' ? (
              <>
                <SafeIcon icon={FiImage} className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                  {isDragging ? 'Drop image here' : 'Drag & drop or click to upload'}
                </p>
                <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-1">
                  PNG, JPG, JPEG, WebP (max {maxSizeMB}MB)
                </p>
              </>
            ) : (
              <>
                <SafeIcon icon={FiAlertCircle} className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                  Storage not ready
                </p>
              </>
            )}
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png,image/jpeg,image/jpg,image/webp"
          className="hidden"
          disabled={storageStatus !== 'ready'}
        />
      </div>

      {/* Preview mode controls */}
      {previewMode && file && storageStatus === 'ready' && (
        <div className="flex mt-4 space-x-3">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleCancelClick}
            icon={FiX}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleUploadClick}
            loading={isUploading}
            icon={FiCheck}
            disabled={storageStatus !== 'ready'}
          >
            {isUploading ? 'Uploading...' : 'Confirm Upload'}
          </Button>
        </div>
      )}

      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 text-xs text-gray-500 space-y-1">
          <div>Storage: {storageStatus}</div>
          {file && <div>File: {file.name} ({(file.size / 1024).toFixed(1)} KB)</div>}
          {storageError && <div className="text-red-500">Error: {storageError}</div>}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;