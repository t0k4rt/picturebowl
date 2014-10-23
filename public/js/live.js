/**
 * Created by alexandre on 14/10/2014.
 */
var socket = io.connect("//".domain);

var imgList = [];

var lastItems = [];
var maxItems = 20;

var preloadedItems = [];
var maxPreloadedItems = 4;

var delayIn = 400;
var delayOut = 400;


socket.on('debug', function (data) {
  console.log(data);
});

socket.on('control', function (data) {
  console.log(data);
});

socket.on('medias', function (data) {
  console.log(data);
  data.forEach(function(value, index) {
    imgList.push(value);
    if(lastItems.push(value) > maxItems)
      lastItems.shift();
  });
});


///state machine variables
var i = 0;
var play = false;
// current media index
var currentMedia;


var pickMedia = function pickMedia() {
  // init state
  var length = lastItems.length;

  // take the last element of the pile
  var media = imgList.pop();
  if(typeof media == "undefined") {
    console.log('got media from last items');
    console.log(i);
    media = lastItems[i%length];
    i++;
  }
  console.log('media picked', media);
  return media;
};

var preLoad = function preLoad(media, callback){
  var toLoad = $('<img/>');
  toLoad.attr('style', 'height: 100%;');
  toLoad[0].src = media.src.url;
  toLoad.load(function() {
    var slideshowContainer = $('<div class="slideshow-container" style="display: none;"></div>');
    slideshowContainer.attr('id', media.id);
    if(typeof media.caption != 'undefined') {
      slideshowContainer.append('<div class="slideshow-caption">'+media.caption+'</div>');
    }
    var $img = $('<div class="slideshow-img"></div>').append(toLoad);
    slideshowContainer.append($img);
    $('#container').append(slideshowContainer);
    callback.call(this, null, media);
  }).error(function(err) {
    callback.call(this, err);
  });
};

var $currentItem;

var showImages = function showImages() {
  for(var j = preloadedItems.length; j < maxPreloadedItems; j++) {
    console.log(preloadedItems.length);
    console.log(maxPreloadedItems);

    var pickedMedia = pickMedia();
    if(typeof pickedMedia != "undefined"){
      preLoad(pickedMedia, function(err, res){
        if(err)
          console.error(err);
        else {
          console.log('preloaded');
          preloadedItems.push(res);
        }
      });
    }
  }

  if(preloadedItems.length >= maxPreloadedItems) {
    console.log('can append content');
    if(typeof $currentItem != "undefined") {
      $currentItem.fadeOut(delayOut, function() {
        var nextItem = preloadedItems.shift();
        var $nextItem = $('#'+nextItem.id);
        $nextItem.fadeIn(delayIn);
        $currentItem.remove();
        $currentItem = $nextItem;
      });
    }
    else {
      var item = preloadedItems.shift();
      $currentItem = $('#'+item.id);
    }

  }
};


var show = setInterval(showImages, 500);