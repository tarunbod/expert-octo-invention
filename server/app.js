var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io')(server);
var path = require('path');
var bodyParser = require('body-parser');

var port = process.env.PORT || 3000;
app.set('port', port);
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

var routes = require('./routes');

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

var pairs = {};

io.on('connection', (socket) => {
	console.log('connection recieved');
	socket.emit('type_request');
	socket.on('type_response', (data) => {
		if (data.type === 'receiver') {
			pairs[data.key] = socket.id;
		}
	});
	socket.on('motion', (data) => {
		var pair = pairs[data.key];
		console.log(data);
		socket.broadcast.to(pair).emit('motion', data);
	});

	socket.on('disconnect', () => {
		console.log('disconnceted', socket.id);
		var keyToDelete;
		for (var key in pairs) {
			if (pairs[key] === socket.id) {
				keyToDelete = key;
			}
		}
		delete pairs[keyToDelete];
		socket.broadcast.emit('end', keyToDelete);
	});
});

server.listen(port, function() {
  console.log("Server started on port " + port);
});

setInterval(function() {
	console.log(pairs);
}, 1000);
