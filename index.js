const psList = require('ps-list');
const Telnet = require('telnet-client');
const express = require('express');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const TIME_UNTIL_DESTROY = 60000 * 60 * 3;
let drainingStart;
let draining = false;

app.get('/health', (req, res) => {
	psList().then(data => {
		const info = data.find(process => {
			return (process.cmd === '/opt/transcoder-health-checker/liquidsoap /opt/transcoder-health-checker/transcoder.liq' && process.name === 'liquidsoap');
		});
	
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

function killLiquidsoap() {
	psList().then(data => {
		const info = data.find(process => {
			return (process.cmd === '/opt/transcoder-health-checker/liquidsoap /opt/transcoder-health-checker/transcoder.liq' && process.name === 'liquidsoap');
		});

		if (info) {
			const { spawn } = require( 'child_process' );
			const kill = spawn( 'kill', [ '-9', info.pid ] );
			kill.stdout.on('data', data => {
				console.log( `stdout: ${data}` );
			});

			kill.stderr.on('data', data => {
				console.log( `stderr: ${data}` );
			});

			kill.on('close', code => {
				console.log( `child process exited with code ${code}` );
			});

			drainingStart = null;
			draining = false;
		}
	});
}

function getTimeLeft() {
	if (drainingStart) {
		return (TIME_UNTIL_DESTROY - (Date.now() - drainingStart)) / 1000;
	} else {
		return '0';
	}
}

app.get('/stop_liquidsoap', (req, res) => {
	const info = data.find(process => {
		return (process.cmd === '/opt/transcoder-health-checker/liquidsoap /opt/transcoder-health-checker/transcoder.liq' && process.name === 'liquidsoap');
	});

	if (!info) {
		res.json({ error: 'LIQUIDSOAP UNAVAILABLE' });
	} else if (!draining) {
		drainingStart = Date.now();
		draining = setTimeout(() => {
			killLiquidsoap();
		}, TIME_UNTIL_DESTROY);
		res.json({ success: `DESTROYING IN ${ TIME_UNTIL_DESTROY } SECONDS` });
	} else {
		res.json({ success: `DESTROYING IN ${ getTimeLeft() } SECONDS` });
	}
});

app.get('/forcestop_liquidsoap', (req, res) => {
	killLiquidsoap();
});

app.get('/time_til_destroy', (req, res) => {
	res.json({ success: `DESTROYING IN ${ getTimeLeft() } SECONDS` });
});

app.post('/start', (req, res) => {
	if (!draining) {
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
								res.json({ success: 'Transcoding started' });
						}
				});
		}, (error) => {
			return res.status(409).json({ error });
		});
	} else {
		res.json({ success: `DESTROYING IN ${ getTimeLeft() } SECONDS` });
	}
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
							res.json('Transcoder stopped');
					}
			});
	}, (error) => {
		return res.status(409).json({ error });
	});
});

const server = http.createServer(app);
server.listen(8080);
