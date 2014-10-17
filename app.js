
var express = require('express')
  , path = require('path')
  , url = require('url')
  , logger = require('morgan')
  , cookieParser = require('cookie-parser')
  , bodyParser = require('body-parser')
  , redis = require('redis')
  , debug = require('debug')('my-application');

var app = express();
app.set('redis_url', process.env.REDISCLOUD_URL || 'redis://127.0.0.1:6379');
app.set('domain', process.env.APP_DOMAIN || 'localhost:3000');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
console.log(app.get('redis_url'));


/// start server
app.set('port', process.env.PORT || 3000);
var server = app.listen(app.get('port'), function() {
  debug('Express server listening on port ' + server.address().port);
});


/**
 * socket io + Redisstore setup
 */
var redisUrl = url.parse(app.get('redis_url'));
var pub = redis.createClient(redisUrl.port, redisUrl.hostname);
var sub = redis.createClient(redisUrl.port, redisUrl.hostname);
var store = redis.createClient(redisUrl.port, redisUrl.hostname);

if(redisUrl.auth) {
  var auth = (redisUrl.auth.split(':'))[1]
  pub.auth(auth, function(){console.log("adentro! pub")});
  sub.auth(auth, function(){console.log("adentro! sub")});
  store.auth(auth, function(){console.log("adentro! store")});
}

var io = require('socket.io').listen(server);
io.configure( function(){
  io.enable('browser client minification');  // send minified client
  io.enable('browser client etag');          // apply etag caching logic based on version number
  io.enable('browser client gzip');          // gzip the file
  io.set('log level', 1);                    // reduce logging
  io.set('transports', ['websocket'
    , 'flashsocket'
    , 'htmlfile'
    , 'xhr-polling'
    , 'jsonp-polling'
  ]);
  var RedisStore = require('socket.io/lib/stores/redis');
  io.set('store', new RedisStore({redisPub: pub, redisSub: sub, redisClient: store, redis: redis}));
});


/**
 * redis setup
 */
var pictureStore = redis.createClient(redisUrl.port, redisUrl.hostname);
var pictureSubscriber = redis.createClient(redisUrl.port, redisUrl.hostname);
pictureSubscriber.subscribe('sio');
pictureSubscriber.on('message', function(channel, message) {
  console.log(channel, message);
  io.sockets.emit('content', message)
});

/**
 * Instagram app info
 */
app.set('CLIENT_ID', '110c9472f3c54eabb46c39e62fa67b94');
app.set('CLIENT_SECRET', '3554a233a50446cf84d5ed23cd50852b');



/**
 * middleware
 */
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(require('less-middleware')(path.join(__dirname, '/public')));
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Routes
 */
var Index = require('./routes/index');
var Auth = require('./routes/auth');
var RealTimeEndpoint = require('./routes/realtimeendpoint');


app.use('/', new RealTimeEndpoint(app, io, pictureSubscriber));
app.use('/auth',  new Auth(app, pictureStore));
//app.use('/rtig',  index);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
