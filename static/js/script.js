/**
 * Created with JetBrains PhpStorm.
 * User: alexandre
 * Date: 21/10/13
 * Time: 18:54
 * To change this template use File | Settings | File Templates.
 */


var socket = io.connect('http://picturebowl.herokuapp.com');
//var socket = io.connect('http://localhost:5000');

var imgList = [];

var lastTen = [];

socket.on('debug', function (data) {
    console.log(data);
});

socket.on('imgs', function (data) {
    console.log(data);
    $.each(data, function(index, value) {

        imgList.push(value);
        if(lastTen.push(value) > 20)
            lastTen.shift();
    });
});


//state machine variables
var i = 0;
var j = 0;
var play = false;

var showImages = function showImages() {
    console.log("calling show images");
    var media = imgList.shift();

    var length = lastTen.length;

    var useLastTen = false;

    if(!media) {
        media = lastTen[i%length];
        useLastTen = true;
        console.log('last ten');
        console.log(media);
    }

    if(media) {
        var caption = $('<p class="caption"></p>');

        if(media.caption) {
            caption.html(media.caption.text);
        }


        var toLoad = $('<img/>');
        toLoad.attr('style', 'height: 100%;');
        toLoad[0].src = media.src;
        toLoad.load(function() {
            var container = $('<div style="height:100%; position: relative; display: none;"></div>');
            container.attr('id', 'img' + i).append(toLoad).append(caption);
            i++;
            $('#imgContainer').append(container);

            play = (i + 1) > j;

        }).error(function() {
                play = false;
                if(useLastTen) {
                    // we remove not working image in array at index i
                    lastTen.splice(i, 1);
                }
            });
    }

    if(play) {
        if(j > 0) {
            $('#img' + (j-1)).fadeOut('slow', function() {
                console.log("fade in now");
                console.log($('#img' + j));
                $('#img' + j).fadeIn('slow');
                $('#img' + (j-1)).remove();
                j++;
            });

        }
        else if(j == 0) {
            console.log('show image ' + j);
            console.log($('#img' + j));
            $('#img' + j).fadeIn();
            j++;
        }
    }

};

var show = setInterval(showImages, 2000);