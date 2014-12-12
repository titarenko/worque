var worque = require('../');

var client = new worque.Client({
	login: 'failing-reader',
	password: 'failing-reader'
});

client.subscribe('a', function (m, ack) {
	console.log('received a', m);
	setTimeout(function () {
		console.log('exiting without acking a');
		process.exit();
	}, 17);
});

client.subscribe('b', function (m, ack) {
	console.log('received b', m);
	setTimeout(function () {
		console.log('exiting without acking b');
		process.exit();
	}, 29);
});
