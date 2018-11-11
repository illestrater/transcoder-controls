// const monitor = require('os-monitor');
const psList = require('ps-list');
const Telnet = require('telnet-client');
const express = require('express');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');

let usage = 0;

psList().then(data => {
	const info = data.find(process => {
		return process.name = 'liquidsoap';
	});

	console.log(info);
});

top.stdout.on('data', function (data) {
  console.log(data.toString());
});

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get('/health', (req, res) => {
	res.json({ usage });
});

app.post('/start', (req, res) => {
	const connection = new Telnet();

	const params = {
			host: 'localhost',
			port: 1234,
			shellPrompt: '',
			negotiationMandatory: false,
			timeout: 1500,
	};

	connection.connect(params)
	.then(() => {
			connection.exec(`sources.add ${ req.body.stream.public }`)
			.then((response) => {
					if (!timeout) {
							res.json('Testing initiated');
					}
			});
	}, (error) => {
		return res.status(409).json({ error });
	});
});

app.post('/stop', (req, res) => {
	const connection = new Telnet();

	const params = {
			host: 'localhost',
			port: 1234,
			shellPrompt: '',
			negotiationMandatory: false,
			timeout: 1500,
	};

	connection.connect(params)
	.then(() => {
			connection.exec(`sources.remove ${ req.body.stream.public }`)
			.then((response) => {
					console.log('TESTING SET: ', response);
					if (!timeout) {
							res.json('Testing initiated');
					}
			});
	}, (error) => {
		return res.status(409).json({ error });
	});
});

const server = http.createServer(app);
server.listen(8080);
