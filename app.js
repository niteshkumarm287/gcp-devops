const http = require('http');
const server = http.createServer((req, res) => {
res.end(`Hello from build: ${process.env.BUILD_ID || 'local'}\n`);
});
server.listen(8080, () => console.log('Server on port 8080'));
