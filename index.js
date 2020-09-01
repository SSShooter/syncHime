const app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

io.on('connection', (socket) => {
	console.log('connected：' + socket.id);
	socket.on('message', (msg) => {
		console.log(`${msg.type}
		from:${msg.from}
		to:${msg.to}`)
		io.to(msg.to).emit('message', msg);
	})
});

http.listen(process.env.PORT || 8080, () => {
	console.log('listening on *:' + process.env.PORT || 8080);
});