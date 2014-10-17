/**
 * Created by alexandre on 14/10/2014.
 */
var socket = io.connect("//".domain);


socket.on('connect', function () {
  console.log('connected');
});


socket.on('content', function (data) {
  console.log(data);
});
