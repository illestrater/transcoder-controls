const psList = require('ps-list');
const Telnet = require('telnet-client');
const express = require('express');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get('/health', (req, res) => {
	psList().then(data => {
		const info = data.find(process => {
			return (process.cmd === '/opt/transcoder-health-checker/liquidsoap /opt/transcoder-health-checker/transcoder.liq' && process.name === 'liquidsoap');
		});

		console.log(info);
	
		if (info) {
			res.json({ usage: info ? info.memory : null });
		} else {
			res.json({ error: 'LIQUIDSOAP_UNAVAILABLE' });
		}
	});
});

app.get('/start_liquidsoap', (req, res) => {
	psList().then(data => {
		const info = data.find(process => {
			return (process.cmd === '/opt/transcoder-health-checker/liquidsoap /opt/transcoder-health-checker/transcoder.liq' && process.name === 'liquidsoap');
		});

		if (info) {
			res.json({ error: 'LIQUIDSOAP_EXISTS' });
		} else {
			const { spawn } = require( 'child_process' );
			const start = spawn( '/opt/transcoder-health-checker/liquidsoap', [ '/opt/transcoder-health-checker/transcoder.liq' ] );
			start.stdout.on( 'data', data => {
				console.log( `stdout: ${data}` );
			} );

			start.stderr.on( 'data', data => {
				console.log( `stderr: ${data}` );
			} );

			start.on( 'close', code => {
				console.log( `child process exited with code ${code}` );
			} );
			res.json({ success: 'LIQUIDSOAP_STARTED' });
		}
	});
});

app.get('/stop_liquidsoap', (req, res) => {
	psList().then(data => {
		const info = data.find(process => {
			return (process.cmd === '/opt/transcoder-health-checker/liquidsoap /opt/transcoder-health-checker/transcoder.liq' && process.name === 'liquidsoap');
		});

		if (info) {
			const { spawn } = require( 'child_process' );
			const kill = spawn( 'kill', [ '-9', info.pid ] );
			kill.stdout.on( 'data', data => {
				console.log( `stdout: ${data}` );
			} );

			kill.stderr.on( 'data', data => {
				console.log( `stderr: ${data}` );
			} );

			kill.on( 'close', code => {
				console.log( `child process exited with code ${code}` );
			} );
			res.json({ success: 'LIQUIDSOAP_KILLED' });
		} else {
			res.json({ error: 'LIQUIDSOAP_UNAVAILABLE' });
		}
	});
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
			connection.exec(`sources.add ${ req.body.stream.private}-${ req.body.stream.public }`)
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
