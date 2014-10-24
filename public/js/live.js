/**
 * Created by alexandre on 14/10/2014.
 */
var socket = io.connect("//".domain);

var imgList = [];

var lastItems = [];
var maxItems = 20;

var preloadedItems = [];
var maxPreloadedItems = 4;

var delayIn = 300;
var delayOut = 200;


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
var $currentItem;



// pick one media from new items or stored items (lasItems)
var pickMedia = function pickMedia() {
  // init state
  var length = lastItems.length;
  // take the last element of the pile
  var media = imgList.pop();
  if(typeof media == "undefined" && length >= maxPreloadedItems) {
    console.log('got media from last items');
    console.log(i);
    i = i%length;
    media = lastItems[i];
    i++;
  }
  console.log('media picked', media);
  return media;
};

// preload content
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


var showImages = function showImages() {
  console.log('start loop');

  // preloading content until max preloaded items is reached
  for(var j = preloadedItems.length; j <= maxPreloadedItems; j++) {
    console.log('preloading');
    var pickedMedia = pickMedia();
    if(typeof pickedMedia != "undefined"){
      console.log('preloading media');
      preLoad(pickedMedia, function(err, res){
        if(err)
          console.error(err);
        else {
          preloadedItems.push(res);
        }
      });
    }
  }

  // only show content if enough content has been preloaded
  if(preloadedItems.length >= maxPreloadedItems) {
    console.log('Enough preloaded content, can append content');
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
      $currentItem.fadeIn(delayIn);
    }
  }
  else {
    console.log('Waiting for preloaded content');
  }
};

var interval = 3000;
var show = setInterval(showImages, interval);