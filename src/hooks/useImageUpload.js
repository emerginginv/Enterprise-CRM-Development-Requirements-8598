import { useState } from 'react';
import { uploadUserAvatar, uploadContactPhoto, uploadCompanyLogo, testStorageConnection, updateUserAvatarInDB } from '../utils/uploadUtils';
import { debugLog } from '../utils/debugUtils';
import { toast } from 'react-hot-toast';

/**
 * Custom hook for handling image uploads with comprehensive debugging
 * @param {string} type - The type of entity (user, contact, company)
 * @param {string} entityId - The ID of the entity
 * @param {Function} onSuccess - Callback function to run on successful upload
 * @returns {Object} - Loading state, error state, upload function and reset function
 */
export const useImageUpload = (type, entityId, onSuccess = () => {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState(null);

  /**
   * Upload an image for the specified entity type
   * @param {File} file - The image file to upload
   */
  const uploadImage = async (file) => {
    debugLog('UPLOAD_HOOK', 'Upload initiated', {
      type,
      entityId,
      entityIdType: typeof entityId,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type
    });

    if (!file) {
      const errorMsg = 'No file provided';
      debugLog('UPLOAD_HOOK', 'Upload failed - no file', { error: errorMsg });
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (!entityId) {
      const errorMsg = 'No entity ID provided';
      debugLog('UPLOAD_HOOK', 'Upload failed - no entity ID', { 
        error: errorMsg,
        type,
        entityId,
        entityIdType: typeof entityId
      });
      setError(errorMsg);
      toast.error('Please save the record first before uploading an image');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      debugLog('UPLOAD_HOOK', 'Testing storage connection');
      
      // Test storage connection first
      const connectionTest = await testStorageConnection();
      if (!connectionTest.success) {
        throw new Error(connectionTest.error);
      }

      debugLog('UPLOAD_HOOK', 'Storage connection successful, starting upload');

      let result;
      
      switch (type) {
        case 'user':
          debugLog('UPLOAD_HOOK', 'Calling uploadUserAvatar', {
            entityId,
            entityIdType: typeof entityId
          });
          result = await uploadUserAvatar(file, entityId);
          break;
        case 'contact':
          debugLog('UPLOAD_HOOK', 'Calling uploadContactPhoto', {
            entityId,
            entityIdType: typeof entityId
          });
          result = await uploadContactPhoto(file, entityId);
          break;
        case 'company':
          debugLog('UPLOAD_HOOK', 'Calling uploadCompanyLogo', {
            entityId,
            entityIdType: typeof entityId
          });
          result = await uploadCompanyLogo(file, entityId);
          break;
        default:
          throw new Error(`Invalid entity type: ${type}`);
      }

      debugLog('UPLOAD_HOOK', 'Upload function returned', {
        success: result?.success,
        url: result?.url,
        error: result?.error?.message || result?.error
      });

      if (!result.success) {
        throw result.error;
      }

      debugLog('UPLOAD_HOOK', 'Upload successful, processing result');

      // For user avatars, also update the database
      if (type === 'user') {
        debugLog('UPLOAD_HOOK', 'Updating user avatar in database', {
          entityId,
          url: result.url
        });
        
        const dbUpdateResult = await updateUserAvatarInDB(entityId, result.url);
        
        debugLog('UPLOAD_HOOK', 'Database update result', {
          success: dbUpdateResult.success,
          error: dbUpdateResult.error?.message || dbUpdateResult.error
        });
        
        if (!dbUpdateResult.success) {
          debugLog('UPLOAD_HOOK', 'Database update failed but continuing', {
            error: dbUpdateResult.error
          });
          console.warn('⚠️ useImageUpload: Failed to update avatar URL in database:', dbUpdateResult.error);
        } else {
          debugLog('UPLOAD_HOOK', 'Database update successful');
        }
      }

      setUploadedUrl(result.url);
      debugLog('UPLOAD_HOOK', 'Calling onSuccess callback', { url: result.url });
      onSuccess(result.url);
      toast.success('Image uploaded successfully!');
      
      debugLog('UPLOAD_HOOK', 'Upload flow completed successfully');
      return result.url;
    } catch (err) {
      const errorMessage = err.message || `Failed to upload ${type} image`;
      
      debugLog('UPLOAD_HOOK', 'Upload failed with error', {
        error: err,
        errorMessage,
        errorStack: err.stack,
        type,
        entityId
      });
      
      console.error(`❌ useImageUpload: Error uploading ${type} image:`, err);
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
      debugLog('UPLOAD_HOOK', 'Upload process finished', { loading: false });
    }
  };

  /**
   * Reset the upload state
   */
  const reset = () => {
    debugLog('UPLOAD_HOOK', 'Resetting upload state');
    setLoading(false);
    setError(null);
    setUploadedUrl(null);
  };

  return {
    loading,
    error,
    uploadedUrl,
    uploadImage,
    reset
  };
};

export default useImageUpload;