const http = require('http');

http.get('http://localhost:5000/api/settings/featured-items', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Data:', data.substring(0, 500) + (data.length > 500 ? '...' : ''));
  });
}).on('error', (err) => {
  console.log('Error:', err.message);
});
