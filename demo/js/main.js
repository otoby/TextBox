$(document).ready(function() {
    $('#textarea-one').textBox({
        onEdit: function() {
            $('#toggle_btn').text("Preview");
        },
        onPreview: function() {
            $('#toggle_btn').text("Edit");
        }
    });

    $('#textarea-two').textBox();
    $('#textarea-three').textBox();

    $('#nbs-textarea-one').textBox();
    $('#nbs-textarea-two').textBox();
    $('#nbs-textarea-three').textBox();

    $('[data-toggle]').popover();


    $('#toggle_btn').click(function() {
        var textBox = $('#textarea-one').data('textbox');

        if (textBox.inPreview()) {
            textBox.edit();
        } else {
            textBox.preview();
        }
    });

});

function refreshNBSTextBox() {
    // A refresh occurs if the .data('textbox') has being set in a textarea
    // This is a transparent functionality

    // 100 refresh
    var num = 100;
    while (num-- > 0) {
        $('#nbs-textarea-one').val('Random data to see the effect of refreshing ONE').textBox();
        $('#nbs-textarea-two').val('Random data to see the effect of refreshing TWO').textBox();
        $('#nbs-textarea-three').val('Random data to see the effect of refreshing THREE').textBox();
    }
}