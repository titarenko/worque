var worque = require('../');

var client = new worque.Client({
	login: 'writer',
	password: 'writer'
});

setInterval(function () {
	client.publish('a', {a: new Date()});
	console.log('published a');
}, 20);

setInterval(function () {
	client.publish('b', {b: new Date()});
	console.log('published b');
}, 25);

setInterval(function () {
	process.exit();
}, 1500)