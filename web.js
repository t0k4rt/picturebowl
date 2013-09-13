/**
 * Created with JetBrains PhpStorm.
 * User: alexandre
 * Date: 13/09/13
 * Time: 15:02
 * To change this template use File | Settings | File Templates.
 */

var express = require("express");

var app = express();
app.use(express.logger());

app.get('/', function(request, response) {
    response.send('Hello World!');
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
    console.log("Listening on " + port);
});