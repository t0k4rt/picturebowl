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

/**
 *
 *
 curl -F 'client_id=110c9472f3c54eabb46c39e62fa67b94' \
 -F 'client_secret=3554a233a50446cf84d5ed23cd50852b' \
 -F 'object=tag' \
 -F 'aspect=media' \
 -F 'object_id=me' \
 -F 'callback_url=http://picturebowl.herokuapp.com/rtig' \
 https://api.instagram.com/v1/subscriptions/

 {"meta":{"code":200},"data":{"object":"tag","object_id":"me","aspect":"media","callback_url":"http:\/\/picturebowl.herokuapp.com\/rtig","type":"subscription","id":"3796777"}}

 curl -X DELETE https://api.instagram.com/v1/subscriptions?client_secret=3554a233a50446cf84d5ed23cd50852b&object=all&client_id=110c9472f3c54eabb46c39e62fa67b94

 https://api.instagram.com/v1/subscriptions?client_secret=3554a233a50446cf84d5ed23cd50852b&client_id=110c9472f3c54eabb46c39e62fa67b94
 */

var port = process.env.PORT || 5000;
var express = require("express");
var https = require('https');
var querystring = require('querystring');

var instagram = require('instagram-node').instagram();

/** paris ***/
var lat = 48.8534100, lng = 2.3488000, radius = 5000;
var lastfetch = new Date().getTime();

var app = express();
app.use(express.logger());


var client_id = '110c9472f3c54eabb46c39e62fa67b94';
var client_secret = '3554a233a50446cf84d5ed23cd50852b';
var access_token = '191558.110c947.741f112b6cb24e719db1fdb0bc70ee0f';
var redirect_uri = 'http://picturebowl.herokuapp.com/redirect';


var tag = 'me';

/**** instagram features ***/
instagram.use({
    client_id: client_id,
    client_secret: client_secret
});

instagram.use({ access_token: access_token });
/*55dff26eda57405cb1bbd4906149b475*/


exports.authorize_user = function(req, res) {
    res.redirect(instagram.get_authorization_url(redirect_uri, { scope: ['likes'], state: 'a state' }));
};

exports.handleauth = function(req, res) {
    instagram.authorize_user(req.query.code, redirect_uri, function(err, result) {
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


app.get('/rtig', function(request, response) {
    response.send(request.query['hub.challenge']);
});

app.post('/rtig', function(request, response) {

    io.sockets.emit('debug', {message: 'instagram post'});

    _lastfetch = new Date().getTime();
    //we fetch max every 2 seconds

    if(_lastfetch >= lastfetch + 2000) {

        console.log(parseInt(lastfetch / 1000));

        instagram.tag_media_recent(tag,  function(err, medias, pagination, limit) {
            if(err)
                console.error(err);
            else {
                var res = {};

                io.sockets.emit('debug', medias);
                for(index in medias) {
                    var media = medias[index];
                    /*
                    if(media.caption.created_time)
                        console.log(media.caption.created_time);*/

                    //if(media.caption && media.caption.created_time && media.caption.created_time >= parseInt(lastfetch / 1000))
                    res[media.id] = media.images.standard_resolution.url;
                }
                console.log(res);
                io.sockets.emit('imgs', res);
            }
        });

        if(_lastfetch > lastfetch)
            lastfetch = _lastfetch;
    }
    response.send('ok');
});


app.use(express.static(__dirname + '/static'));

var io = require('socket.io').listen(app.listen(port, function() {
    console.log("Listening on " + port);
}));

io.configure(function () {
    io.set("transports", ["xhr-polling"]);
    io.set("polling duration", 10);
});


/*
io.sockets.on('connection', function (socket) {
    socket.emit('news', { hello: 'world' });
    socket.on('my other event', function (data) {
        console.log(data);
    });
});*/


app.get('/subscribe/:tag', function(request, response) {

    if(request.params.tag) {
        tag = request.params.tag;

        console.log('tag is set with : ' + tag);

        var post_data = querystring.stringify({
            'client_id' : client_id,
            'client_secret': client_secret,
            'object': 'tag',
            'aspect' : 'media',
            'object_id' : tag,
            'callback_url': 'http://picturebowl.herokuapp.com/rtig'
        });

        var options = {
            hostname: 'api.instagram.com',
            path: '/v1/subscriptions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': post_data.length
            }
        };

        console.log(options);

        var req = https.request(options, function(res) {
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                response.send(res.statusCode);
            });
        });

        req.write(post_data);
        req.end();
    }
    else
        response.send('Tag cannot be blank');

});

app.get('/unsubscribe', function(request, response) {

    var post_data = querystring.stringify({
        'client_id' : client_id,
        'client_secret': client_secret,
        'object': 'all'
    });

    var options = {
        hostname: 'api.instagram.com',
        path: '/v1/subscriptions?' + post_data,
        method: 'DELETE'
    };

    var req = https.request(options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            response.send(res.statusCode);
        });
    });

    req.end();
});


app.get('/test/:word', function(request, response) {

    console.log(request.params.word);
    if(request.params.word) {
        instagram.tag_media_recent(request.params.word,  function(err, medias, pagination, limit) {
            if(err)
                console.error(err);
            else {
                console.log(medias.length)
            }
        });
        response.send(request.params.word);
    }
    else
        response.send('no word');
});