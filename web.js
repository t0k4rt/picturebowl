/**
 * Created with JetBrains PhpStorm.
 * User: alexandre
 * Date: 13/09/13
 * Time: 15:02
 * To change this template use File | Settings | File Templates.
 */

var express = require("express")
    , io = require('socket.io').listen(app)
    , fs = require('fs');

var app = express();
app.use(express.logger());

app.get('/', function(request, response) {
    response.send('Hello World!');
});


app.get('/index.html', function(request, response) {
    fs.readFile(__dirname + '/index.html',
        function (err, data) {
            if (err) {
                return response.send('Error loading index.html');
            }

            response.send(data);
        });
});


io.configure(function () {
    io.set("transports", ["xhr-polling"]);
    io.set("polling duration", 10);
});


io.sockets.on('connection', function (socket) {
    socket.emit('news', { hello: 'world' });
    socket.on('my other event', function (data) {
        console.log(data);
    });
});


var port = process.env.PORT || 5000;
app.listen(port, function() {
    console.log("Listening on " + port);
});


