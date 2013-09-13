/**
 * Created with JetBrains PhpStorm.
 * User: alexandre
 * Date: 13/09/13
 * Time: 15:02
 * To change this template use File | Settings | File Templates.
 * Instagram :
 * Client ID 	110c9472f3c54eabb46c39e62fa67b94
 * Client Secret 	3554a233a50446cf84d5ed23cd50852b
 * Website URL 	http://picturebowl.herokuapp.com/
 * Redirect URI 	http://picturebowl.herokuapp.com/redirect
 */

var port = process.env.PORT || 5000;
var express = require("express");
var api = require('instagram-node').instagram();


var app = express();
app.use(express.logger());


/**** instagram features ***/
api.use({
    client_id: "110c9472f3c54eabb46c39e62fa67b94",
    client_secret: "3554a233a50446cf84d5ed23cd50852b"
});


var redirect_uri = 'http://picturebowl.herokuapp.com/redirect';

exports.authorize_user = function(req, res) {
    res.redirect(api.get_authorization_url(redirect_uri, { scope: ['likes'], state: 'a state' }));
};

exports.handleauth = function(req, res) {
    api.authorize_user(req.query.code, redirect_uri, function(err, result) {
        if (err) {
            console.log(err.body);
            res.send("Didn't work");
        } else {
            console.log('Yay! Access token is ' + result.access_token);
            res.send('You made it!!');
        }
    });
};

// This is where you would initially send users to authorize
app.get('/authorize_user', exports.authorize_user);

// This is your redirect URI
app.get('/redirect', exports.handleauth);


app.get('/hello', function(request, response) {
    io.sockets.emit('news', { hello: 'world' });
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

app.use(express.static(__dirname + '/static'));

var io = require('socket.io').listen(app.listen(port, function() {
    console.log("Listening on " + port);
}));

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
