/**
 * Test script for Branches API
 * Run with: node test-branches-api.js
 */

const BASE_URL = 'http://localhost:4000/api/v1';
const TENANT_ID = '507f1f77bcf86cd799439011';
const USER_ID = '507f1f77bcf86cd799439012';

let createdBranchId = null;

// Helper function to make HTTP requests
async function makeRequest(method, endpoint, body = null) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { status: 0, error: error.message };
  }
}

// Test 1: Create Branch
async function test1_CreateBranch() {
  console.log('\n📝 Test 1: Create Branch');
  console.log('='.repeat(50));

  // Generate unique code with timestamp
  const uniqueCode = `BR${Date.now().toString().slice(-6)}`;

  const branchData = {
    tenantId: TENANT_ID,
    userId: USER_ID,
    code: uniqueCode,
    name: 'Downtown Branch',
    address: {
      street: '123 Main Street',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'USA'
    },
    location: {
      type: 'Point',
      coordinates: [-73.935242, 40.730610]
    },
    phone: '+12125551234',
    email: 'downtown@restaurant.com',
    openingHours: [
      {
        day: 'MONDAY',
        isOpen: true,
        openTime: '09:00',
        closeTime: '22:00',
        breaks: [{ startTime: '14:00', endTime: '15:00' }]
      },
      {
        day: 'TUESDAY',
        isOpen: true,
        openTime: '09:00',
        closeTime: '22:00',
        breaks: []
      },
      {
        day: 'WEDNESDAY',
        isOpen: true,
        openTime: '09:00',
        closeTime: '22:00',
        breaks: []
      },
      {
        day: 'THURSDAY',
        isOpen: true,
        openTime: '09:00',
        closeTime: '22:00',
        breaks: []
      },
      {
        day: 'FRIDAY',
        isOpen: true,
        openTime: '09:00',
        closeTime: '23:00',
        breaks: []
      },
      {
        day: 'SATURDAY',
        isOpen: true,
        openTime: '10:00',
        closeTime: '23:00',
        breaks: []
      },
      {
        day: 'SUNDAY',
        isOpen: true,
        openTime: '10:00',
        closeTime: '21:00',
        breaks: []
      }
    ],
    capabilities: {
      hasDineIn: true,
      hasTakeaway: true,
      hasDelivery: true,
      hasDriveThru: false,
      hasKiosk: true
    },
    capacity: {
      seatingCapacity: 50,
      parkingSpots: 20,
      driveThruLanes: 0,
      maxConcurrentOrders: 30
    },
    deliverySettings: {
      deliveryRadius: 5.0,
      estimatedDeliveryTime: 30,
      minimumOrderValue: 15,
      deliveryCharge: 5
    }
  };

  const result = await makeRequest('POST', '/branches', branchData);
  
  if (result.status === 201 && result.data.isSuccess) {
    createdBranchId = result.data.data._id;
    console.log('✅ SUCCESS');
    console.log('Branch ID:', createdBranchId);
    console.log('Branch Code:', result.data.data.code);
    console.log('Branch Name:', result.data.data.name);
    console.log('Status:', result.data.data.status);
  } else {
    console.log('❌ FAILED');
    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.data, null, 2));
  }

  return result;
}

// Test 2: Get All Branches
async function test2_GetAllBranches() {
  console.log('\n📝 Test 2: Get All Branches');
  console.log('='.repeat(50));

  const result = await makeRequest('GET', `/branches?tenantId=${TENANT_ID}&page=1&limit=10`);
  
  if (result.status === 200 && result.data.isSuccess) {
    console.log('✅ SUCCESS');
    console.log('Total Branches:', result.data.total);
    console.log('Page:', result.data.page);
    console.log('Total Pages:', result.data.totalPages);
    console.log('Branches:', result.data.branches?.length || 0);
  } else {
    console.log('❌ FAILED');
    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.data, null, 2));
  }

  return result;
}

// Test 3: Get Branch by ID
async function test3_GetBranchById() {
  console.log('\n📝 Test 3: Get Branch by ID');
  console.log('='.repeat(50));

  if (!createdBranchId) {
    console.log('⚠️  SKIPPED - No branch ID available');
    return;
  }

  const result = await makeRequest('GET', `/branches/${createdBranchId}?tenantId=${TENANT_ID}`);
  
  if (result.status === 200 && result.data.isSuccess) {
    console.log('✅ SUCCESS');
    console.log('Branch ID:', result.data.data._id);
    console.log('Branch Name:', result.data.data.name);
    console.log('Branch Code:', result.data.data.code);
  } else {
    console.log('❌ FAILED');
    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.data, null, 2));
  }

  return result;
}

// Test 4: Get Branch by Code
async function test4_GetBranchByCode() {
  console.log('\n📝 Test 4: Get Branch by Code');
  console.log('='.repeat(50));

  const result = await makeRequest('GET', `/branches/code/BR001?tenantId=${TENANT_ID}`);
  
  if (result.status === 200 && result.data.isSuccess) {
    console.log('✅ SUCCESS');
    console.log('Branch Code:', result.data.data.code);
    console.log('Branch Name:', result.data.data.name);
  } else {
    console.log('❌ FAILED');
    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.data, null, 2));
  }

  return result;
}

// Test 5: Get Active Branches
async function test5_GetActiveBranches() {
  console.log('\n📝 Test 5: Get Active Branches');
  console.log('='.repeat(50));

  const result = await makeRequest('GET', `/branches/active?tenantId=${TENANT_ID}`);
  
  if (result.status === 200 && result.data.isSuccess) {
    console.log('✅ SUCCESS');
    console.log('Active Branches:', result.data.data?.length || 0);
  } else {
    console.log('❌ FAILED');
    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.data, null, 2));
  }

  return result;
}

// Test 6: Get Nearby Branches
async function test6_GetNearbyBranches() {
  console.log('\n📝 Test 6: Get Nearby Branches (Geolocation)');
  console.log('='.repeat(50));

  const longitude = -73.935242;
  const latitude = 40.730610;
  const maxDistance = 10000;

  const result = await makeRequest(
    'GET',
    `/branches/nearby?tenantId=${TENANT_ID}&longitude=${longitude}&latitude=${latitude}&maxDistance=${maxDistance}`
  );
  
  if (result.status === 200 && result.data.isSuccess) {
    console.log('✅ SUCCESS');
    console.log('Nearby Branches:', result.data.data?.length || 0);
  } else {
    console.log('❌ FAILED');
    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.data, null, 2));
  }

  return result;
}

// Test 7: Update Branch
async function test7_UpdateBranch() {
  console.log('\n📝 Test 7: Update Branch');
  console.log('='.repeat(50));

  if (!createdBranchId) {
    console.log('⚠️  SKIPPED - No branch ID available');
    return;
  }

  const updateData = {
    tenantId: TENANT_ID,
    userId: USER_ID,
    name: 'Downtown Branch - Updated',
    phone: '+12125559999',
    capacity: {
      seatingCapacity: 60,
      parkingSpots: 25,
      driveThruLanes: 0,
      maxConcurrentOrders: 35
    }
  };

  const result = await makeRequest('PUT', `/branches/${createdBranchId}`, updateData);
  
  if (result.status === 200 && result.data.isSuccess) {
    console.log('✅ SUCCESS');
    console.log('Updated Name:', result.data.data.name);
    console.log('Updated Phone:', result.data.data.phone);
    console.log('Updated Seating:', result.data.data.capacity.seatingCapacity);
  } else {
    console.log('❌ FAILED');
    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.data, null, 2));
  }

  return result;
}

// Test 8: Update Branch Status
async function test8_UpdateBranchStatus() {
  console.log('\n📝 Test 8: Update Branch Status');
  console.log('='.repeat(50));

  if (!createdBranchId) {
    console.log('⚠️  SKIPPED - No branch ID available');
    return;
  }

  const statusData = {
    tenantId: TENANT_ID,
    userId: USER_ID,
    status: 'INACTIVE' // Using valid status from APP_STATUS
  };

  const result = await makeRequest('PATCH', `/branches/${createdBranchId}/status`, statusData);
  
  if (result.status === 200 && result.data.isSuccess) {
    console.log('✅ SUCCESS');
    console.log('New Status:', result.data.data.status);
  } else {
    console.log('❌ FAILED');
    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.data, null, 2));
  }

  return result;
}

// Test 9: Update Branch Manager
async function test9_UpdateBranchManager() {
  console.log('\n📝 Test 9: Update Branch Manager');
  console.log('='.repeat(50));

  if (!createdBranchId) {
    console.log('⚠️  SKIPPED - No branch ID available');
    return;
  }

  const managerData = {
    tenantId: TENANT_ID,
    userId: USER_ID,
    managerId: '507f1f77bcf86cd799439099'
  };

  const result = await makeRequest('PATCH', `/branches/${createdBranchId}/manager`, managerData);
  
  if (result.status === 200 && result.data.isSuccess) {
    console.log('✅ SUCCESS');
    console.log('Manager ID:', result.data.data.managerId);
  } else {
    console.log('❌ FAILED');
    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.data, null, 2));
  }

  return result;
}

// Test 10: Delete Branch
async function test10_DeleteBranch() {
  console.log('\n📝 Test 10: Delete Branch (Soft Delete)');
  console.log('='.repeat(50));

  if (!createdBranchId) {
    console.log('⚠️  SKIPPED - No branch ID available');
    return;
  }

  const result = await makeRequest('DELETE', `/branches/${createdBranchId}?tenantId=${TENANT_ID}`);
  
  if (result.status === 200 && result.data.isSuccess) {
    console.log('✅ SUCCESS');
    console.log('Message:', result.data.message);
  } else {
    console.log('❌ FAILED');
    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.data, null, 2));
  }

  return result;
}

// Run all tests
async function runAllTests() {
  console.log('\n🚀 Starting Branches API Tests');
  console.log('='.repeat(50));
  console.log('Base URL:', BASE_URL);
  console.log('Tenant ID:', TENANT_ID);
  console.log('User ID:', USER_ID);

  try {
    await test1_CreateBranch();
    await test2_GetAllBranches();
    await test3_GetBranchById();
    await test4_GetBranchByCode();
    await test5_GetActiveBranches();
    await test6_GetNearbyBranches();
    await test7_UpdateBranch();
    await test8_UpdateBranchStatus();
    await test9_UpdateBranchManager();
    await test10_DeleteBranch();

    console.log('\n✅ All tests completed!');
    console.log('='.repeat(50));
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
  }
}

// Run tests
runAllTests();
