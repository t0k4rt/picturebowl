/**
 * Created by alexandre on 14/10/2014.
 */

var $tag = $('#tag');
var $msgContainer = $('#msg-container');
$('#subscribe').click(function(event){
  console.log($tag.val());
  $.post('/tag', {tag: $tag.val()})
    .done(function(data) {
      console.log(data);
      $msgContainer.append('<div class="alert alert-success">Sauvegardé</div>')
    })
    .fail(function(data) {
      var error = JSON.parse(data.responseText);
      $msgContainer.append('<div class="alert alert-danger">'+error.error+'</div>')
    });
});

$('#unsubscribe').click(function(event){
  console.log($tag.val());
  $.get('/unsubscribe')
    .done(function(data) {
      console.log(data);
      $msgContainer.append("<div class='alert alert-success'>Le tag n'est plus surveillé</div>")
    })
    .fail(function(data) {
      var error = JSON.parse(data.responseText);
      $msgContainer.append('<div class="alert alert-danger">'+error.error+'</div>')
    });
});