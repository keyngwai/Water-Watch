const axios = require('axios');

(async () => {
  try {
    const loginResp = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'konahamaru566@gmail.com',
      password: '@Candice2017!'
    });
    const token = loginResp.data.data.token;

    const stats = await axios.get('http://localhost:3000/api/reports/admin/stats', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('stats', stats.data.data);

    const reports = await axios.get('http://localhost:3000/api/reports/admin/all', {
      headers: { Authorization: `Bearer ${token}` },
      params: { limit: 10, page: 1 }
    });
    console.log('reports count', reports.data.meta.total);
  } catch (err) {
    console.error('ERR', err.response?.data || err.message);
    process.exit(1);
  }
})();
