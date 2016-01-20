(function($) {
    var TextBox = function(element, options) {
        this.$text = $(element);
        this.settings = options;
        this.text = this.$text[0];
        this.$preview = null;
        this.$textBox = this.$text.closest('.text-box');
        this.isPreview = false;
    };

    TextBox.Defaults = {
        autoGrow: true,
        markDown: false,
        onEdit: null,
        onPreview: null,
        content: '<div class="text-box-container"><div class="text-box"><div class="text-box-options"></div></div></div>'
    };

    TextBox.prototype.notify = function(name) {
        var notification = 'on' + name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

        if (this.settings && typeof this.settings[notification] === 'function') {
            this.settings[notification]();
        }

        return this;
    };

    TextBox.prototype.refresh = function(state) {
        state = state || this.state.REFRESH;

        for (var feature in this.settings) {
            if (this.settings[feature] && typeof this.Features[feature] === 'function') {
                this.Features[feature](this, state);
            }
        }

        return this;
    };

    TextBox.prototype.edit = function() {
        if (this.$preview) {
            var markDown = this.Features.markDown(this, this.state.IDLE);
            markDown.showText();
        }

        return this;
    };

    TextBox.prototype.preview = function() {
        if (this.$preview) {
            var markDown = this.Features.markDown(this, this.state.IDLE);
            markDown.showPreview();
        }

        return this;
    };

    TextBox.prototype.inPreview = function() {
        return this.isPreview;
    };

    TextBox.prototype.state = {
        IDLE: 0,
        REFRESH: 1,
        INIT: 2
    };

    TextBox.prototype.Features = {
        autoGrow: function(ctx, state) {
            var that = ctx;

            function resize() {

                that.text.style.height = 'auto';
                var textHeight = that.text.scrollHeight + 30;
                that.text.style.height = textHeight + 'px';

                if (that.$preview) {
                    that.$preview[0].style.minHeight = textHeight + 'px';
                }
            }

            function delayedResize() {
                window.setTimeout(resize, 0);
            }

            if (state === ctx.state.INIT) {

                that.$text.on('keydown', delayedResize);
                resize();

            } else if (state === ctx.state.REFRESH) {

                if ($.trim(that.$text.val()) === '') {
                    if (that.$preview) {
                        that.$preview.html('').css('');
                    }
                } else {
                    window.setTimeout(function() {
                        that.$text.show();
                        resize();
                        that.$text.blur();
                    }, 0);
                }

            }

            return {
                resize: resize,
                delayedResize: delayedResize
            };

        },
        markDown: function(ctx, state) {

            var that = ctx;
            var util = that.Util;

            function showText() {
                var selection = getSelection().toString();
                if (!selection) {
                    that.isPreview = false;
                    that.$text.show().focus().keydown().select();
                    that.$preview.hide();
                    that.notify('edit');
                }
            }

            function showPreview() {
                var html = util.textToMarkDownHtml(that.$text.val());
                var value = util.nl2br(html);
                that.isPreview = true;
                that.$preview.show();
                that.$preview.html(value);
                that.$text.hide();
                that.notify('preview');
            }

            function isTextBoxActive() {
                var isActive = false;

                $('.text-box-options-item', that.$textBox).each(function() {
                    if (this === document.activeElement) {
                        isActive = true;
                        return false;
                    }
                });

                if (!isActive && that.text === document.activeElement) {
                    isActive = true;
                }

                return isActive;
            }

            function delayedShowPreview() {
                window.setTimeout(function() {
                    if (!isTextBoxActive()) {
                        showPreview();
                    }
                }, 0);
            }

            function registerTextAndPreviewEvent() {
                that.$preview.off('click')
                        .on('click', showText);

                that.$textBox.on('focusout', delayedShowPreview);
                showPreview();
            }

            if (state === that.state.INIT) {
                that.$preview = $('<div class="inplace-preview" />');
                $(that.$preview).insertBefore(that.$text);

                registerTextAndPreviewEvent();
            } else if (state === that.state.REFRESH) {
                registerTextAndPreviewEvent();
            }

            return {
                showText: showText,
                showPreview: showPreview
            };

        }
    };

    TextBox.prototype.Util = {
        textToMarkDownHtml: function(phrase) {
            var html = phrase;
            var pattern = [
                [/\[\[(.+?)\]\][ ]*\((\S+?)\)/g, '<table class="buttonwrapper" cellpadding="0"><tr><td class="button"><a href="{2}">{1}</a></td></tr></table>'],
                [/\[(.+?)\][ ]*\((\S+?)\)/g, '<a href="{2}">{1}</a>'],
                [/(\*\*|__)([\S].*?)\1/g, '<strong>{2}</strong>'],
                [/(\*|_)([\S].*?)\1/g, '<em>{2}</em>'],
                [/^(#+)[\s]+([^#]*)(\s+#+)?$/g, '<h{1:l}>{1}</h{1:l}>']
            ];
            var text0,
                    text1,
                    text2,
                    text1L,
                    re,
                    template,
                    m;
            var matches = [];
            var htmlReplace = [];
            for (var i = 0, l = pattern.length; i < l; i++) {

                re = pattern[i][0];
                template = pattern[i][1];
                while ((m = re.exec(phrase)) !== null) {
                    text0 = m[0];
                    text1 = m[1];
                    text2 = m[2];
                    text1L = text1.length;
                    matches.push(text0);
                    htmlReplace.push(this.replaceArray(['{0}', '{1}', '{2}', '{1:l}'], [text0, text1, text2, text1L], template));
                }
            }

            if (matches.length > 0) {
                html = this.replaceArray(matches, htmlReplace, html);
            }

            return html;
        },
        nl2br: function(text) {
            return text.replace(/\n/g, "<br>");
        },
        replaceArray: function(search, replace, subject) {
            var replaceString = subject;
            for (var i = 0; i < search.length; i++) {
                replaceString = replaceString.replace(search[i], replace[i]);
            }
            return replaceString;
        }
    };

    function plugin(option) {
        return this.each(function() {
            var $this = $(this);
            var data = $this.data('textbox');
            var options = $.extend({}, TextBox.Defaults, $this.data(), typeof option === 'object' && option);

            if (!data) {
                var $formGroup, $content;
                $formGroup = $this.closest('.form-group');

                if ($('.text-box-container', $formGroup).length < 1) {
                    $content = $(TextBox.Defaults.content);
                    $('.text-box', $content).prepend($this);

                    var $label = $('<label class="has-error"/>');
                    $label.attr('for', $this.attr('id')).hide();

                    $formGroup.append($content).append($label);
                }

                $this.data('textbox', (data = new TextBox(this, options)));
                data.refresh(data.state.INIT);
            }
        });
    }

    $.fn.textBox = plugin;
    $.fn.textBox.Constructor = TextBox;
})(jQuery);