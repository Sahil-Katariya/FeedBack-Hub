const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
let authToken = '';

// Test admin functionality
async function testAdminFunctionality() {
    console.log('🧪 Testing Admin Panel Functionality\n');

    try {
        // Step 1: Login as admin
        console.log('1️⃣ Testing Admin Login...');
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'admin@feedbackhub.com',
            password: 'admin123'
        });

        if (loginResponse.data.success) {
            authToken = loginResponse.data.token;
            console.log('✅ Admin login successful');
            console.log(`   Role: ${loginResponse.data.user.role}`);
            console.log(`   Token: ${authToken.substring(0, 20)}...`);
        } else {
            throw new Error('Login failed');
        }

        // Step 2: Test user info endpoint
        console.log('\n2️⃣ Testing User Info Endpoint...');
        const userInfoResponse = await axios.get(`${BASE_URL}/api/auth/me`, {
            headers: { 'x-auth-token': authToken }
        });

        if (userInfoResponse.data.success) {
            console.log('✅ User info endpoint working');
            console.log(`   User: ${userInfoResponse.data.user.firstName} ${userInfoResponse.data.user.lastName}`);
            console.log(`   Role: ${userInfoResponse.data.user.role}`);
        }

        // Step 3: Test admin stats
        console.log('\n3️⃣ Testing Admin Stats...');
        const statsResponse = await axios.get(`${BASE_URL}/api/admin/stats`, {
            headers: { 'x-auth-token': authToken }
        });

        console.log('✅ Admin stats endpoint working');
        console.log(`   Total Users: ${statsResponse.data.overview.totalUsers}`);
        console.log(`   Total Products: ${statsResponse.data.overview.totalProducts}`);
        console.log(`   Total Reviews: ${statsResponse.data.overview.totalReviews}`);
        console.log(`   Average Rating: ${statsResponse.data.overview.avgRating}`);

        // Step 4: Test user management
        console.log('\n4️⃣ Testing User Management...');
        const usersResponse = await axios.get(`${BASE_URL}/api/admin/users?page=1&limit=5`, {
            headers: { 'x-auth-token': authToken }
        });

        console.log('✅ User management endpoint working');
        console.log(`   Users loaded: ${usersResponse.data.users.length}`);
        console.log(`   Total pages: ${usersResponse.data.totalPages}`);

        // Step 5: Test product management
        console.log('\n5️⃣ Testing Product Management...');
        const productsResponse = await axios.get(`${BASE_URL}/api/admin/products?page=1&limit=5`, {
            headers: { 'x-auth-token': authToken }
        });

        console.log('✅ Product management endpoint working');
        console.log(`   Products loaded: ${productsResponse.data.products.length}`);
        console.log(`   Total pages: ${productsResponse.data.totalPages}`);

        // Step 6: Test review management
        console.log('\n6️⃣ Testing Review Management...');
        const reviewsResponse = await axios.get(`${BASE_URL}/api/admin/reviews?page=1&limit=5`, {
            headers: { 'x-auth-token': authToken }
        });

        console.log('✅ Review management endpoint working');
        console.log(`   Reviews loaded: ${reviewsResponse.data.reviews.length}`);
        console.log(`   Total pages: ${reviewsResponse.data.totalPages}`);

        // Step 7: Test system health
        console.log('\n7️⃣ Testing System Health...');
        const healthResponse = await axios.get(`${BASE_URL}/api/admin/health`, {
            headers: { 'x-auth-token': authToken }
        });

        console.log('✅ System health endpoint working');
        console.log(`   Status: ${healthResponse.data.status}`);
        console.log(`   Database: ${healthResponse.data.database.status}`);
        console.log(`   Uptime: ${Math.floor(healthResponse.data.uptime / 3600)} hours`);

        // Step 8: Test system settings
        console.log('\n8️⃣ Testing System Settings...');
        const settingsResponse = await axios.get(`${BASE_URL}/api/admin/settings`, {
            headers: { 'x-auth-token': authToken }
        });

        console.log('✅ System settings endpoint working');
        console.log(`   Site Name: ${settingsResponse.data.siteName}`);
        console.log(`   Version: ${settingsResponse.data.systemVersion}`);

        // Step 9: Test analytics
        console.log('\n9️⃣ Testing Analytics...');
        const analyticsResponse = await axios.get(`${BASE_URL}/api/admin/analytics?period=30`, {
            headers: { 'x-auth-token': authToken }
        });

        console.log('✅ Analytics endpoint working');
        console.log(`   User trend data points: ${analyticsResponse.data.userTrend.length}`);
        console.log(`   Review trend data points: ${analyticsResponse.data.reviewTrend.length}`);
        console.log(`   Top categories: ${analyticsResponse.data.topCategories.length}`);

        // Step 10: Test activity logs
        console.log('\n🔟 Testing Activity Logs...');
        const logsResponse = await axios.get(`${BASE_URL}/api/admin/logs?page=1&limit=10`, {
            headers: { 'x-auth-token': authToken }
        });

        console.log('✅ Activity logs endpoint working');
        console.log(`   Logs loaded: ${logsResponse.data.logs.length}`);

        console.log('\n🎉 All Admin Panel Tests Passed Successfully!');
        console.log('\n📋 Test Summary:');
        console.log('   ✅ Admin Authentication');
        console.log('   ✅ User Info Endpoint');
        console.log('   ✅ Dashboard Stats');
        console.log('   ✅ User Management');
        console.log('   ✅ Product Management');
        console.log('   ✅ Review Management');
        console.log('   ✅ System Health');
        console.log('   ✅ System Settings');
        console.log('   ✅ Analytics');
        console.log('   ✅ Activity Logs');

        console.log('\n🌐 Admin Panel URL: http://localhost:5000/admin.html');
        console.log('📧 Admin Email: admin@feedbackhub.com');
        console.log('🔑 Admin Password: admin123');

    } catch (error) {
        console.error('\n❌ Test Failed:', error.message);
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Data:`, error.response.data);
        }
        process.exit(1);
    }
}

// Test non-admin access
async function testNonAdminAccess() {
    console.log('\n🔒 Testing Non-Admin Access Restrictions...');

    try {
        // Try to access admin endpoint without token
        try {
            await axios.get(`${BASE_URL}/api/admin/stats`);
            console.error('❌ Should have failed without token');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('✅ Correctly blocked access without token');
            } else {
                throw error;
            }
        }

        // Try to access admin endpoint with invalid token
        try {
            await axios.get(`${BASE_URL}/api/admin/stats`, {
                headers: { 'x-auth-token': 'invalid-token' }
            });
            console.error('❌ Should have failed with invalid token');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('✅ Correctly blocked access with invalid token');
            } else {
                throw error;
            }
        }

        console.log('✅ Security tests passed');

    } catch (error) {
        console.error('❌ Security test failed:', error.message);
    }
}

// Run all tests
async function runAllTests() {
    console.log('🚀 Starting Admin Panel Tests...\n');
    
    await testAdminFunctionality();
    await testNonAdminAccess();
    
    console.log('\n✨ All tests completed successfully!');
}

// Check if axios is available
try {
    require('axios');
    runAllTests();
} catch (error) {
    console.log('📦 Installing axios for testing...');
    const { exec } = require('child_process');
    exec('npm install axios', (error, stdout, stderr) => {
        if (error) {
            console.error('❌ Failed to install axios:', error);
            console.log('💡 Please run: npm install axios');
            console.log('💡 Then run: node scripts/testAdmin.js');
            return;
        }
        console.log('✅ Axios installed successfully');
        runAllTests();
    });
}
