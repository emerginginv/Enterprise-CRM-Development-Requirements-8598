# Debug Implementation Plan

## Phase 1: Comprehensive Logging

### Add Debug Logging to Key Functions

#### 1. useImageUpload Hook
```javascript
const uploadImage = async (file) => {
  console.log('🔍 DEBUG: Upload started', {
    type,
    entityId,
    fileName: file.name,
    fileSize: file.size,
    timestamp: new Date().toISOString()
  })
  
  // ... existing code with detailed logging at each step
}
```

#### 2. uploadUserAvatar Function
```javascript
export const uploadUserAvatar = async (file, userId) => {
  console.log('🔍 DEBUG: uploadUserAvatar called', {
    userId,
    userIdType: typeof userId,
    fileName: file.name,
    fileSize: file.size
  })
  
  // ... add logging after each major step
}
```

#### 3. updateUserAvatarInDB Function
```javascript
export const updateUserAvatarInDB = async (userId, avatarUrl) => {
  console.log('🔍 DEBUG: updateUserAvatarInDB called', {
    userId,
    userIdType: typeof userId,
    avatarUrl,
    timestamp: new Date().toISOString()
  })
  
  // ... add detailed query logging
}
```

### Phase 2: Infrastructure Verification

#### Database Schema Check
```javascript
const verifyDatabaseSchema = async () => {
  try {
    // Check if table exists
    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'users_crm_2024')
    
    console.log('🔍 Table exists:', tables)
    
    // Check column structure
    const { data: columns } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'users_crm_2024')
    
    console.log('🔍 Table columns:', columns)
  } catch (error) {
    console.error('🔍 Schema check failed:', error)
  }
}
```

#### Storage Configuration Check
```javascript
const verifyStorageSetup = async () => {
  try {
    // List all buckets
    const { data: buckets, error } = await supabase.storage.listBuckets()
    console.log('🔍 Available buckets:', buckets)
    
    // Check specific bucket
    const userAvatarBucket = buckets?.find(b => b.name === 'user-avatars')
    console.log('🔍 User avatars bucket:', userAvatarBucket)
    
    // Test upload permissions
    const testResult = await testStorageConnection()
    console.log('🔍 Storage test result:', testResult)
  } catch (error) {
    console.error('🔍 Storage verification failed:', error)
  }
}
```

## Phase 3: User ID Verification

#### Check All User ID Sources
```javascript
const debugUserIds = () => {
  console.log('🔍 DEBUG: User ID Analysis', {
    'AuthContext.user?.id': user?.id,
    'AuthContext.user?.id type': typeof user?.id,
    'UserContext.currentUser?.id': currentUser?.id,
    'UserContext.currentUser?.id type': typeof currentUser?.id,
    'UserContext.currentUser?.user_id': currentUser?.user_id,
    'UserContext.currentUser?.user_id type': typeof currentUser?.user_id,
    'currentUser full object': currentUser
  })
}
```

## Phase 4: Step-by-Step Isolation

#### Test Each Component Separately
```javascript
const testStorageUploadOnly = async (file, userId) => {
  // Test just the storage upload without database update
}

const testDatabaseUpdateOnly = async (userId, avatarUrl) => {
  // Test just the database update with a mock URL
}

const testUserResolution = async () => {
  // Test user ID resolution and database queries
}
```

## Expected Findings

Based on this analysis, the issue is most likely:

1. **User ID Type Mismatch** (80% probability)
   - Auth user ID vs Database primary key confusion
   - String vs UUID type issues

2. **Database Schema Issues** (15% probability)
   - Missing table or columns
   - Incorrect field names

3. **Storage/RLS Configuration** (5% probability)
   - Missing bucket or policies
   - Permission issues

The comprehensive logging will reveal the exact failure point and error details needed for a targeted fix.