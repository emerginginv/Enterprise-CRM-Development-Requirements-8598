// Comprehensive debugging utilities for upload flow analysis

import supabase from '../lib/supabase';

/**
 * Debug logger with timestamp and context
 */
export const debugLog = (context, message, data = null) => {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    context,
    message,
    ...(data && { data })
  };
  
  console.log(`🔍 [${context}] ${message}`, data || '');
  
  // Store in sessionStorage for later analysis
  const debugLogs = JSON.parse(sessionStorage.getItem('upload_debug_logs') || '[]');
  debugLogs.push(logData);
  sessionStorage.setItem('upload_debug_logs', JSON.stringify(debugLogs.slice(-50))); // Keep last 50 logs
};

/**
 * Clear debug logs
 */
export const clearDebugLogs = () => {
  sessionStorage.removeItem('upload_debug_logs');
  console.log('🔍 Debug logs cleared');
};

/**
 * Get all debug logs
 */
export const getDebugLogs = () => {
  return JSON.parse(sessionStorage.getItem('upload_debug_logs') || '[]');
};

/**
 * Verify user ID consistency across contexts
 */
export const debugUserIds = (authUser, currentUser) => {
  const userIdAnalysis = {
    authUser: {
      id: authUser?.id,
      idType: typeof authUser?.id,
      email: authUser?.email,
      fullObject: authUser
    },
    currentUser: {
      id: currentUser?.id,
      idType: typeof currentUser?.id,
      user_id: currentUser?.user_id,
      userIdType: typeof currentUser?.user_id,
      email: currentUser?.email,
      fullObject: currentUser
    },
    consistency: {
      authIdEqualsCurrentUserId: authUser?.id === currentUser?.user_id,
      authIdEqualsCurrentId: authUser?.id === currentUser?.id,
      bothIdsPresent: !!(authUser?.id && currentUser?.user_id)
    }
  };

  debugLog('USER_ID_ANALYSIS', 'User ID consistency check', userIdAnalysis);
  return userIdAnalysis;
};

/**
 * Verify database schema and accessibility
 */
export const verifyDatabaseSchema = async () => {
  debugLog('DB_SCHEMA', 'Starting database schema verification');
  
  try {
    // Test basic connection
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    debugLog('DB_SCHEMA', 'Auth session check', { 
      hasSession: !!sessionData?.session,
      error: sessionError?.message 
    });

    // Check if we can query the users table
    debugLog('DB_SCHEMA', 'Testing users table access');
    const { data: usersData, error: usersError } = await supabase
      .from('users_crm_2024')
      .select('id, user_id, email, avatar_url')
      .limit(1);

    if (usersError) {
      debugLog('DB_SCHEMA', 'Users table query failed', {
        error: usersError,
        errorCode: usersError.code,
        errorMessage: usersError.message,
        errorDetails: usersError.details
      });
      return { success: false, error: usersError };
    }

    debugLog('DB_SCHEMA', 'Users table accessible', {
      recordCount: usersData?.length || 0,
      sampleRecord: usersData?.[0] || null
    });

    // Try to get table schema information
    try {
      const { data: columnsData, error: columnsError } = await supabase
        .rpc('get_table_columns', { table_name: 'users_crm_2024' });
      
      debugLog('DB_SCHEMA', 'Table columns info', {
        columns: columnsData,
        error: columnsError?.message
      });
    } catch (rpcError) {
      debugLog('DB_SCHEMA', 'Could not get column info (RPC not available)', {
        error: rpcError.message
      });
    }

    return { success: true, data: usersData };
  } catch (error) {
    debugLog('DB_SCHEMA', 'Database verification failed', {
      error: error.message,
      stack: error.stack
    });
    return { success: false, error };
  }
};

/**
 * Verify storage configuration and permissions
 */
export const verifyStorageSetup = async () => {
  debugLog('STORAGE_SETUP', 'Starting storage verification');
  
  try {
    // List all buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      debugLog('STORAGE_SETUP', 'Failed to list buckets', {
        error: bucketsError,
        errorMessage: bucketsError.message
      });
      return { success: false, error: bucketsError };
    }

    debugLog('STORAGE_SETUP', 'Available buckets', {
      buckets: buckets?.map(b => ({ name: b.name, id: b.id, public: b.public })) || []
    });

    // Check for user-avatars bucket specifically
    const userAvatarsBucket = buckets?.find(b => b.name === 'user-avatars');
    debugLog('STORAGE_SETUP', 'User avatars bucket status', {
      exists: !!userAvatarsBucket,
      bucketInfo: userAvatarsBucket || 'Not found'
    });

    if (!userAvatarsBucket) {
      return { 
        success: false, 
        error: 'user-avatars bucket not found',
        availableBuckets: buckets?.map(b => b.name) || []
      };
    }

    // Test upload permissions with a tiny test file
    debugLog('STORAGE_SETUP', 'Testing upload permissions');
    const testFile = new Blob(['test'], { type: 'text/plain' });
    const testPath = `test-${Date.now()}.txt`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('user-avatars')
      .upload(testPath, testFile);

    if (uploadError) {
      debugLog('STORAGE_SETUP', 'Upload test failed', {
        error: uploadError,
        errorMessage: uploadError.message,
        errorCode: uploadError.statusCode
      });
      return { success: false, error: uploadError };
    }

    debugLog('STORAGE_SETUP', 'Upload test successful', { uploadData });

    // Clean up test file
    try {
      await supabase.storage.from('user-avatars').remove([testPath]);
      debugLog('STORAGE_SETUP', 'Test file cleaned up');
    } catch (cleanupError) {
      debugLog('STORAGE_SETUP', 'Test file cleanup failed', { error: cleanupError.message });
    }

    return { success: true, buckets };
  } catch (error) {
    debugLog('STORAGE_SETUP', 'Storage verification failed', {
      error: error.message,
      stack: error.stack
    });
    return { success: false, error };
  }
};

/**
 * Test database update operation with current user
 */
export const testDatabaseUpdate = async (authUserId, testData = { test_field: 'test_value' }) => {
  debugLog('DB_UPDATE_TEST', 'Testing database update operation', {
    authUserId,
    testData
  });

  try {
    // First, try to find the current user record
    const { data: userData, error: selectError } = await supabase
      .from('users_crm_2024')
      .select('*')
      .eq('user_id', authUserId)
      .single();

    if (selectError) {
      debugLog('DB_UPDATE_TEST', 'Failed to find user record', {
        authUserId,
        error: selectError,
        errorMessage: selectError.message,
        errorCode: selectError.code
      });
      return { success: false, error: selectError, stage: 'user_lookup' };
    }

    debugLog('DB_UPDATE_TEST', 'User record found', {
      userData: {
        id: userData.id,
        user_id: userData.user_id,
        email: userData.email,
        avatar_url: userData.avatar_url
      }
    });

    // Test update operation (using a harmless field update)
    const updateData = {
      updated_at: new Date().toISOString(),
      ...testData
    };

    const { data: updateResult, error: updateError } = await supabase
      .from('users_crm_2024')
      .update(updateData)
      .eq('user_id', authUserId)
      .select();

    if (updateError) {
      debugLog('DB_UPDATE_TEST', 'Update operation failed', {
        authUserId,
        updateData,
        error: updateError,
        errorMessage: updateError.message,
        errorCode: updateError.code
      });
      return { success: false, error: updateError, stage: 'update_operation' };
    }

    debugLog('DB_UPDATE_TEST', 'Update operation successful', {
      updateResult
    });

    return { success: true, userData, updateResult };
  } catch (error) {
    debugLog('DB_UPDATE_TEST', 'Database update test failed', {
      error: error.message,
      stack: error.stack
    });
    return { success: false, error, stage: 'exception' };
  }
};

/**
 * Comprehensive upload flow test
 */
export const runComprehensiveTest = async (authUser, currentUser) => {
  debugLog('COMPREHENSIVE_TEST', 'Starting comprehensive upload flow test');
  
  const results = {
    userIds: null,
    database: null,
    storage: null,
    dbUpdate: null,
    timestamp: new Date().toISOString()
  };

  try {
    // Test 1: User ID consistency
    results.userIds = debugUserIds(authUser, currentUser);

    // Test 2: Database schema and access
    results.database = await verifyDatabaseSchema();

    // Test 3: Storage setup and permissions
    results.storage = await verifyStorageSetup();

    // Test 4: Database update operation (if we have auth user ID)
    if (authUser?.id) {
      results.dbUpdate = await testDatabaseUpdate(authUser.id);
    }

    debugLog('COMPREHENSIVE_TEST', 'All tests completed', {
      results: {
        userIdsConsistent: results.userIds?.consistency?.bothIdsPresent,
        databaseAccessible: results.database?.success,
        storageReady: results.storage?.success,
        dbUpdateWorks: results.dbUpdate?.success
      }
    });

    return results;
  } catch (error) {
    debugLog('COMPREHENSIVE_TEST', 'Comprehensive test failed', {
      error: error.message,
      results
    });
    return { ...results, error };
  }
};

/**
 * Export debug logs for analysis
 */
export const exportDebugLogs = () => {
  const logs = getDebugLogs();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `upload-debug-${timestamp}.json`;
  
  const dataStr = JSON.stringify(logs, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  
  URL.revokeObjectURL(url);
  debugLog('DEBUG_EXPORT', 'Debug logs exported', { filename, logCount: logs.length });
};