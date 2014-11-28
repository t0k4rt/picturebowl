
var express = require('express')
  , path = require('path')
  , url = require('url')
  , logger = require('morgan')
  , cookieParser = require('cookie-parser')
  , bodyParser = require('body-parser')
  , redis = require('redis')
  , debug = require('debug')('my-application')
  , session = require('express-session')
  , RedisSessionStore = require('connect-redis')(session)
  , passport = require('passport')
  , Q = require('q')
  , InstagramStrategy = require('passport-instagram').Strategy;

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
 * Redisstore setup
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

/**
 * Socket io
 */

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




// todo : ici lier la session websockets à la session utilisateur pour pouvoir envoyer les données à un user précis
sub.on('message', function(channel, message) {
  //var res = JSON.parse(message);
  console.log(channel, message);
  io.socket.emit('channel', res);
});

sub.on('subscribe', function(channel, count) {
  console.log('new subscription to channel : ', channel);
});

sub.subscribe('global', function(err, res){
  console.log('pictureSubscriber', err, res);
});


/**
 * Instagram app info
 */
app.set('CLIENT_ID', '94c4608d79df4d38a8a778dfb5b650bd');
app.set('CLIENT_SECRET', '302c9c161fc94c1db7be6ee5961bc8ab');


/**
 * Passport setup
 */

// serialize and deserialize
passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

// config
passport.use(new InstagramStrategy({
    clientID: app.get('CLIENT_ID'),
    clientSecret: app.get('CLIENT_SECRET'),
    callbackURL: "http://klerg.herokuapp.com/auth/redirect"
  },
  function(accessToken, refreshToken, profile, done) {
    console.log(profile);
    console.log(accessToken);
    //todo : use hset instead of set to store an object hash
    Q.npost(store, 'hgetall', ['user:ig:'+profile.id])
      .then(function(user){
        if(user == null) {
          user = {id: profile.id, accessToken: accessToken};
          Q.npost(store, 'hmset', ['user:ig:'+profile.id, 'accessToken', accessToken, 'id', profile.id])
            .done(function(){
              return Q.resolve(user);
            })
        }
        else
          return Q.resolve(user);
      })
      .done(function(user){
        return done(null, user);
      }, function(error){
        done(error);
      });
  }
));


/**
 * middleware
 */
app.use(logger('dev'));

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
//app.use(bodyParser.multipart()); // for parsing multipart/form-data
app.use(cookieParser());

app.use(session({
  saveUninitialized: false,
  resave: false,
  store: new RedisSessionStore({client: store, deb: 'session'}),
  secret: 'keyboard cat'
}));
// use passport sessions
app.use(passport.initialize());
app.use(passport.session());


app.use(require('less-middleware')(path.join(__dirname, '/public')));
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Routes
 */
var Auth = require('./routes/auth');
var Slideshow = require('./routes/slideshow');
var RealTimeEndpoint = require('./routes/realtimeendpoint');
var Admin = require('./routes/admin');

app.use('/instagram', new RealTimeEndpoint(app, store, pub));
app.use('/auth',  new Auth(app, passport));
app.use('/slideshow',  new Slideshow(app, store));
app.use('/',  new Admin(app, store, sub));




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
