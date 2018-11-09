const monitor = require('os-monitor');
const express = require('express');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');

let usage = 0;

monitor.start({
	delay: 3000
});

monitor.on('monitor', (event) => {
	usage = event.loadavg[0];
	console.log(usage);
});

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get('/health', (req, res) => {
	res.json({ usage });
});

const server = http.createServer(app);
server.listen(8080);
