const axios = require('axios');

async function testTopNVAPI() {
  try {
    // Login admin to get token
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'admin',
      password: '123456'
    });
    
    const token = loginRes.data.data.token;
    console.log('✅ Login successful\n');
    
    // Test API without month/year params
    const response = await axios.get('http://localhost:5000/api/baocao/top-nhanvien', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('API Response (No month/year):');
    console.log(JSON.stringify(response.data.data, null, 2));
    
    // Calculate total
    const total = response.data.data.reduce((sum, nv) => {
      return sum + parseFloat(nv.TongDoanhThu || 0);
    }, 0);
    
    console.log(`\nTotal revenue across all employees: ${total}`);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testTopNVAPI();
