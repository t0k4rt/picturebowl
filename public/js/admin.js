/**
 * Created by alexandre on 14/10/2014.
 */

var $tag = $('#tag');
var $msgContainer = $('#msg-container');
$('#submit').click(function(event){
  console.log($tag.val());
  $.post('/admin/tag', {tag: $tag.val()})
    .done(function(data) {
      console.log(data);
      $msgContainer.append('<div class="alert alert-success">Sauvegardé</div>')
    })
    .fail(function(data) {
      var error = JSON.parse(data.responseText);
      $msgContainer.append('<div class="alert alert-danger">'+error.error+'</div>')
    });
});
