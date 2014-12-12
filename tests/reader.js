var worque = require('../');

var client = new worque.Client({
	login: 'reader',
	password: 'reader'
});

client.subscribe('a', function (m, ack) {
	console.log('received a', m);
	setTimeout(function () {
		ack();
		console.log('acked a');
	}, 10);
});

client.subscribe('b', function (m, ack) {
	console.log('received b', m);
	setTimeout(function () {
		ack();
		console.log('acked b');
	}, 15);
});
