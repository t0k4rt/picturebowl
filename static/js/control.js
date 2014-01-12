(function($){
    $('#subscribe').click(function()  {
        var tag = $('#tag').val();

        if(tag && tag != '') {
            console.log('subscribe to : ', tag);

            $.get('/unsubscribe')
                .done(function() {
                    $.get('/subscribe/'+tag)
                        .done(function() {
                            $('#result').html('subscribed to tag ' + tag);
                        });
                });
        }


    });

    $('#unsubscribe').click(function()  {

        console.log('unsubscribe');
        $.get('/unsubscribe')
            .done(function() {
                $('#result').html('unsubscribed');
            });
    });
})(jQuery)