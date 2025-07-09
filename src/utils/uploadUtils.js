import supabase from '../lib/supabase';
import { debugLog } from './debugUtils';

/**
 * Test storage connection and bucket access
 */
export const testStorageConnection = async () => {
  debugLog('STORAGE_TEST', 'Starting storage connection test');
  
  try {
    // Test if we can access the storage service
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      debugLog('STORAGE_TEST', 'Failed to access storage service', {
        error: bucketsError,
        errorMessage: bucketsError.message
      });
      return { success: false, error: 'Cannot access storage service: ' + bucketsError.message };
    }

    debugLog('STORAGE_TEST', 'Storage service accessible', {
      bucketCount: buckets?.length || 0,
      buckets: buckets?.map(b => b.name) || []
    });

    // Check required buckets exist
    const requiredBuckets = ['user-avatars', 'contact-photos', 'company-logos'];
    const existingBuckets = buckets.map(b => b.name);
    const missingBuckets = requiredBuckets.filter(bucket => !existingBuckets.includes(bucket));

    if (missingBuckets.length > 0) {
      debugLog('STORAGE_TEST', 'Missing required buckets', {
        missing: missingBuckets,
        existing: existingBuckets
      });
      return {
        success: false,
        error: `Missing storage buckets: ${missingBuckets.join(', ')}. Please create them in Supabase Dashboard.`,
        missingBuckets
      };
    }

    // Test upload permissions with a small test file
    try {
      const testFile = new Blob(['test-connection'], { type: 'text/plain' });
      const testPath = `connection-test-${Date.now()}.txt`;
      
      debugLog('STORAGE_TEST', 'Testing upload permissions', { testPath });

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-avatars')
        .upload(testPath, testFile);

      if (uploadError) {
        debugLog('STORAGE_TEST', 'Upload permission test failed', {
          error: uploadError,
          errorMessage: uploadError.message,
          errorCode: uploadError.statusCode
        });
        
        if (uploadError.message.includes('new row violates row-level security')) {
          return {
            success: false,
            error: 'Storage buckets exist but RLS policies need to be configured. Please check the setup guide.'
          };
        }
        
        debugLog('STORAGE_TEST', 'Upload test failed but continuing', {
          error: uploadError.message
        });
      } else {
        debugLog('STORAGE_TEST', 'Upload test successful', { uploadData });
        
        // Clean up test file
        try {
          await supabase.storage.from('user-avatars').remove([testPath]);
          debugLog('STORAGE_TEST', 'Test file cleaned up');
        } catch (cleanupError) {
          debugLog('STORAGE_TEST', 'Test file cleanup failed', {
            error: cleanupError.message
          });
        }
      }
    } catch (testError) {
      debugLog('STORAGE_TEST', 'Upload test error (continuing anyway)', {
        error: testError.message
      });
    }

    debugLog('STORAGE_TEST', 'Storage connection test completed successfully');
    return { success: true, buckets: existingBuckets };
  } catch (error) {
    debugLog('STORAGE_TEST', 'Storage connection test failed', {
      error: error.message,
      stack: error.stack
    });
    return { success: false, error: error.message };
  }
};

/**
 * Upload a user avatar to Supabase Storage
 * @param {File} file - The image file to upload
 * @param {string} userId - The user ID
 * @returns {Promise<{success: boolean, url: string|null, error: Error|null}>}
 */
export const uploadUserAvatar = async (file, userId) => {
  debugLog('UPLOAD_USER_AVATAR', 'Starting user avatar upload', {
    userId,
    userIdType: typeof userId,
    fileName: file?.name,
    fileSize: file?.size,
    fileType: file?.type
  });

  try {
    // Validate file type
    if (!validateImageType(file)) {
      throw new Error('Invalid file type. Please upload a PNG, JPG, JPEG, or WebP image.');
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size too large. Please upload an image smaller than 5MB.');
    }

    // Get file extension
    const fileExt = file.name.split('.').pop().toLowerCase();
    const timestamp = Date.now();
    const fileName = `profile-${timestamp}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    debugLog('UPLOAD_USER_AVATAR', 'Prepared upload parameters', {
      fileExt,
      fileName,
      filePath,
      timestamp
    });

    // Upload the file to Supabase Storage
    debugLog('UPLOAD_USER_AVATAR', 'Attempting storage upload');
    
    const { data, error } = await supabase.storage
      .from('user-avatars')
      .upload(filePath, file, {
        upsert: true,
        cacheControl: '3600',
        contentType: file.type
      });

    if (error) {
      debugLog('UPLOAD_USER_AVATAR', 'Storage upload failed', {
        error,
        errorMessage: error.message,
        errorCode: error.statusCode,
        filePath
      });

      // Provide more specific error messages
      if (error.message.includes('new row violates row-level security')) {
        throw new Error('Storage permissions not set up. Please check the bucket policies in Supabase Dashboard.');
      }
      if (error.message.includes('The resource was not found')) {
        throw new Error('Storage bucket "user-avatars" not found. Please create it in Supabase Dashboard.');
      }
      throw new Error(`Upload failed: ${error.message}`);
    }

    debugLog('UPLOAD_USER_AVATAR', 'Storage upload successful', { data });

    // Get the public URL for the file
    const { data: urlData } = supabase.storage
      .from('user-avatars')
      .getPublicUrl(filePath);

    debugLog('UPLOAD_USER_AVATAR', 'Generated public URL', {
      publicUrl: urlData.publicUrl
    });

    // Verify the URL is accessible (optional check)
    try {
      const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
      if (!response.ok) {
        debugLog('UPLOAD_USER_AVATAR', 'Uploaded file may not be accessible', {
          status: response.status,
          statusText: response.statusText
        });
      } else {
        debugLog('UPLOAD_USER_AVATAR', 'File is publicly accessible');
      }
    } catch (fetchError) {
      debugLog('UPLOAD_USER_AVATAR', 'Could not verify file accessibility', {
        error: fetchError.message
      });
    }

    debugLog('UPLOAD_USER_AVATAR', 'Upload completed successfully', {
      url: urlData.publicUrl
    });

    return {
      success: true,
      url: urlData.publicUrl,
      error: null
    };
  } catch (error) {
    debugLog('UPLOAD_USER_AVATAR', 'Upload failed with exception', {
      error: error.message,
      stack: error.stack,
      userId
    });
    
    console.error('❌ Error uploading user avatar:', error);
    return {
      success: false,
      url: null,
      error: error
    };
  }
};

/**
 * Update user profile with avatar URL in database
 * @param {string} userId - The user ID
 * @param {string} avatarUrl - The avatar URL
 * @returns {Promise<{success: boolean, error: Error|null}>}
 */
export const updateUserAvatarInDB = async (userId, avatarUrl) => {
  debugLog('UPDATE_USER_AVATAR_DB', 'Starting database update', {
    userId,
    userIdType: typeof userId,
    avatarUrl,
    avatarUrlLength: avatarUrl?.length
  });

  try {
    // First, check if user exists
    debugLog('UPDATE_USER_AVATAR_DB', 'Checking if user exists');
    
    const { data: existingUser, error: selectError } = await supabase
      .from('users_crm_2024')
      .select('id, user_id, email, avatar_url')
      .eq('user_id', userId)
      .single();

    if (selectError) {
      debugLog('UPDATE_USER_AVATAR_DB', 'Failed to find user', {
        userId,
        error: selectError,
        errorMessage: selectError.message,
        errorCode: selectError.code
      });
      
      if (selectError.code === 'PGRST116') {
        throw new Error(`No user found with user_id: ${userId}`);
      }
      throw selectError;
    }

    debugLog('UPDATE_USER_AVATAR_DB', 'User found, proceeding with update', {
      existingUser: {
        id: existingUser.id,
        user_id: existingUser.user_id,
        email: existingUser.email,
        currentAvatarUrl: existingUser.avatar_url
      }
    });

    // Update the avatar URL
    const updateData = {
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString()
    };

    debugLog('UPDATE_USER_AVATAR_DB', 'Executing update query', {
      updateData,
      userId
    });

    const { data, error } = await supabase
      .from('users_crm_2024')
      .update(updateData)
      .eq('user_id', userId)
      .select();

    if (error) {
      debugLog('UPDATE_USER_AVATAR_DB', 'Update query failed', {
        error,
        errorMessage: error.message,
        errorCode: error.code,
        updateData,
        userId
      });
      throw error;
    }

    debugLog('UPDATE_USER_AVATAR_DB', 'Database update successful', {
      updatedRecord: data?.[0] || null,
      recordCount: data?.length || 0
    });

    return { success: true, error: null, data };
  } catch (error) {
    debugLog('UPDATE_USER_AVATAR_DB', 'Database update failed', {
      error: error.message,
      stack: error.stack,
      userId,
      avatarUrl
    });
    
    console.error('❌ Error updating user avatar in database:', error);
    return { success: false, error: error };
  }
};

/**
 * Upload a contact photo to Supabase Storage
 */
export const uploadContactPhoto = async (file, contactId) => {
  debugLog('UPLOAD_CONTACT_PHOTO', 'Starting contact photo upload', {
    contactId,
    fileName: file?.name,
    fileSize: file?.size
  });

  try {
    if (!validateImageType(file)) {
      throw new Error('Invalid file type. Please upload a PNG, JPG, JPEG, or WebP image.');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size too large. Please upload an image smaller than 5MB.');
    }

    const fileExt = file.name.split('.').pop().toLowerCase();
    const timestamp = Date.now();
    const fileName = `photo-${timestamp}.${fileExt}`;
    const filePath = `${contactId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('contact-photos')
      .upload(filePath, file, {
        upsert: true,
        cacheControl: '3600',
        contentType: file.type
      });

    if (error) {
      debugLog('UPLOAD_CONTACT_PHOTO', 'Upload failed', { error });
      if (error.message.includes('new row violates row-level security')) {
        throw new Error('Storage permissions not set up. Please check the bucket policies in Supabase Dashboard.');
      }
      if (error.message.includes('The resource was not found')) {
        throw new Error('Storage bucket "contact-photos" not found. Please create it in Supabase Dashboard.');
      }
      throw new Error(`Upload failed: ${error.message}`);
    }

    const { data: urlData } = supabase.storage
      .from('contact-photos')
      .getPublicUrl(filePath);

    debugLog('UPLOAD_CONTACT_PHOTO', 'Upload successful', { url: urlData.publicUrl });

    return {
      success: true,
      url: urlData.publicUrl,
      error: null
    };
  } catch (error) {
    debugLog('UPLOAD_CONTACT_PHOTO', 'Upload failed', { error: error.message });
    console.error('❌ Error uploading contact photo:', error);
    return {
      success: false,
      url: null,
      error: error
    };
  }
};

/**
 * Upload a company logo to Supabase Storage
 */
export const uploadCompanyLogo = async (file, companyId) => {
  debugLog('UPLOAD_COMPANY_LOGO', 'Starting company logo upload', {
    companyId,
    fileName: file?.name,
    fileSize: file?.size
  });

  try {
    if (!validateImageType(file)) {
      throw new Error('Invalid file type. Please upload a PNG, JPG, JPEG, or WebP image.');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size too large. Please upload an image smaller than 5MB.');
    }

    const fileExt = file.name.split('.').pop().toLowerCase();
    const timestamp = Date.now();
    const fileName = `logo-${timestamp}.${fileExt}`;
    const filePath = `${companyId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('company-logos')
      .upload(filePath, file, {
        upsert: true,
        cacheControl: '3600',
        contentType: file.type
      });

    if (error) {
      debugLog('UPLOAD_COMPANY_LOGO', 'Upload failed', { error });
      if (error.message.includes('new row violates row-level security')) {
        throw new Error('Storage permissions not set up. Please check the bucket policies in Supabase Dashboard.');
      }
      if (error.message.includes('The resource was not found')) {
        throw new Error('Storage bucket "company-logos" not found. Please create it in Supabase Dashboard.');
      }
      throw new Error(`Upload failed: ${error.message}`);
    }

    const { data: urlData } = supabase.storage
      .from('company-logos')
      .getPublicUrl(filePath);

    debugLog('UPLOAD_COMPANY_LOGO', 'Upload successful', { url: urlData.publicUrl });

    return {
      success: true,
      url: urlData.publicUrl,
      error: null
    };
  } catch (error) {
    debugLog('UPLOAD_COMPANY_LOGO', 'Upload failed', { error: error.message });
    console.error('❌ Error uploading company logo:', error);
    return {
      success: false,
      url: null,
      error: error
    };
  }
};

/**
 * Validate if the file is an acceptable image type
 * @param {File} file - The file to validate
 * @returns {boolean}
 */
const validateImageType = (file) => {
  const acceptableTypes = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp'
  ];
  return acceptableTypes.includes(file.type);
};

/**
 * Create storage buckets programmatically (for setup)
 */
export const createStorageBuckets = async () => {
  debugLog('CREATE_BUCKETS', 'Starting bucket creation');
  
  try {
    const buckets = [
      { id: 'user-avatars', name: 'User Avatars' },
      { id: 'contact-photos', name: 'Contact Photos' },
      { id: 'company-logos', name: 'Company Logos' }
    ];

    for (const bucket of buckets) {
      try {
        const { data, error } = await supabase.storage.createBucket(bucket.id, {
          public: true,
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
        });

        if (error && !error.message.includes('already exists')) {
          debugLog('CREATE_BUCKETS', `Error creating bucket ${bucket.id}`, { error });
        } else {
          debugLog('CREATE_BUCKETS', `Bucket ${bucket.id} ready`);
        }
      } catch (bucketError) {
        debugLog('CREATE_BUCKETS', `Bucket ${bucket.id} might already exist`, {
          error: bucketError.message
        });
      }
    }

    debugLog('CREATE_BUCKETS', 'Bucket creation completed');
    return { success: true };
  } catch (error) {
    debugLog('CREATE_BUCKETS', 'Bucket creation failed', {
      error: error.message,
      stack: error.stack
    });
    return { success: false, error: error.message };
  }
};