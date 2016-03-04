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