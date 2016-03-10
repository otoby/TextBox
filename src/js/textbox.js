(function($) {
    var TextBox = function(element, options) {
        this.settings = options;
        this.$text = $(element);
        this.text = this.$text[0];
        this.$textBox = this.$text.closest('.text-box');
        this.$preview = null;
        this.isPreview = false;
        this.activeFeatures = {};

        // Register for common events like keydown etc
        this.observer = {
            keydown: $.Callbacks('unique')
        };

        this.$text.on('keydown', this.observer.keydown.fire);
    };

    TextBox.prototype.notify = function(name) {
        var notification = 'on' + name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

        if (this.settings && typeof this.settings[notification] === 'function') {
            this.settings[notification]();
        }

        return this;
    };

    TextBox.prototype.refresh = function(state) {
        state = state || TextBox.State.REFRESH;

        for (var feature in TextBox.Features) {
            if (this.settings[feature]) {
                this.activeFeatures[feature] = TextBox.Features[feature](this, state);
            }
        }

        return this;
    };

    TextBox.prototype.edit = function() {
        if (this.$preview && this.activeFeatures.markDown) {
            this.activeFeatures.markDown.showText();
        }

        return this;
    };

    TextBox.prototype.preview = function() {
        if (this.$preview && this.activeFeatures.markDown) {
            this.activeFeatures.markDown.showPreview();
        }

        return this;
    };

    TextBox.prototype.inPreview = function() {
        return this.isPreview;
    };


    TextBox.State = {
        IDLE: 0,
        REFRESH: 1,
        INIT: 2
    };

    TextBox.Defaults = {
        autoGrow: true,
        markDown: false,
        onEdit: null,
        onPreview: null,
        content: '<div class="text-box-container"><div class="text-box"><div class="text-box-options"></div></div></div>',
        hideClass: 'text-box-hide',
        mirrorClass: 'text-box-textarea-mirror'
    };

    TextBox.Features = {
        autoGrow: function(that, state) {

            var util = TextBox.Util;

            var plusHeight = 0;
            var cssMinHeight = 0;
            var mirror;

            function _createTextAreaMirror($textarea) {

                var $mirror = $textarea.next('.' + that.settings.mirrorClass);

                if ($mirror.length > 0) {
                    mirror = $mirror[0];
                } else {

                    $textarea.after('<div class="' + that.settings.mirrorClass + '"></div>');
                    mirror = $textarea.next('.' + that.settings.mirrorClass)[0];

                    mirror.style.display = 'none';
                    mirror.style.wordWrap = 'break-word';
                    mirror.style.whiteSpace = 'normal';
                    mirror.style.padding = $textarea.css('paddingTop') + ' ' +
                            $textarea.css('paddingRight') + ' ' +
                            $textarea.css('paddingBottom') + ' ' +
                            $textarea.css('paddingLeft');

                    mirror.style.width = $textarea.css('width');
                    mirror.style.fontFamily = $textarea.css('font-family');
                    mirror.style.fontSize = $textarea.css('font-size');
                    mirror.style.lineHeight = $textarea.css('line-height');
                }
            }

            function _updateHeight() {
                plusHeight += parseInt(that.$text.css('paddingTop'), 10) +
                        parseInt(that.$text.css('paddingBottom'), 10);

                cssMinHeight += parseInt(that.$text.css('min-height'), 10);
            }

            function _getHeight($textarea) {

                mirror.innerHTML = util.htmlEntities(String($textarea.val())) + '<br />';

                var mirrorHeight = $(mirror).height();

                if (mirrorHeight < (cssMinHeight - plusHeight)) {
                    return cssMinHeight;
                } else if ($textarea.height() !== mirrorHeight) {
                    return mirrorHeight + plusHeight;
                } else {
                    return $textarea.height() + plusHeight;
                }
            }

            function resize() {
                var height = _getHeight(that.$text);
                that.text.style.height = height + 'px';

                if (that.$preview) {
                    that.$preview[0].style.minHeight = height + 'px';
                }
            }

            function _delayedResize(e) {
                var keycode = e.keyCode;

                var isPrintable =
                        (keycode > 47 && keycode < 58) || // Number keys
                        keycode === 32 || keycode === 13 || // Spacebar & return key(s) (if you want to allow carriage returns)
                        (keycode > 64 && keycode < 91) || // Letter keys
                        (keycode > 95 && keycode < 112) || // Numpad keys
                        (keycode > 185 && keycode < 193) || // ;=,-./` (in order)
                        (keycode > 218 && keycode < 223) || // [\]' (in order)
                        keycode === 8 || keycode === 46; // Backspace and Del

                if (!isPrintable) {
                    return;
                }

                window.setTimeout(resize, 0);
            }

            if (state === TextBox.State.INIT) {

                _createTextAreaMirror(that.$text);
                _updateHeight();

                that.observer.keydown.add(_delayedResize);
                resize();

            } else if (state === TextBox.State.REFRESH) {

                window.setTimeout(function() {
                    if (that.$text.hasClass(that.settings.hideClass)) {
                        that.$text.removeClass(that.settings.hideClass);

                        _createTextAreaMirror(that.$text);
                        _updateHeight();

                        resize();
                        that.$text.addClass(that.settings.hideClass);
                    } else {
                        _createTextAreaMirror(that.$text);
                        _updateHeight();

                        resize();
                    }
                }, 0);

            }

            return {
                resize: resize
            };

        },
        markDown: function(that, state) {

            var util = TextBox.Util;

            function showText() {
                var selection = getSelection().toString();
                if (!selection) {
                    that.isPreview = false;
                    that.$text.removeClass(that.settings.hideClass).select();
                    that.$preview.addClass(that.settings.hideClass); // Hide
                    that.notify('edit');
                }
            }

            function showPreview() {
                var html = util.textToMarkDownHtml(that.$text.val());
                var value = util.nl2br(html);
                that.isPreview = true;
                that.$preview.removeClass(that.settings.hideClass); //Show
                that.$preview.html(value);
                that.$text.addClass(that.settings.hideClass);
                that.notify('preview');
            }

            function isTextBoxActive() {
                var isActive = false;

                $('.text-box-options-item', that.$textBox).each(function() {
                    if (this === document.activeElement) {
                        isActive = true;
                        // jQuery Break
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

            if (state === TextBox.State.INIT) {
                that.$preview = $('<div class="inplace-preview" />');
                $(that.$preview).insertBefore(that.$text);

                registerTextAndPreviewEvent();
            } else if (state === TextBox.State.REFRESH) {
                registerTextAndPreviewEvent();
            }

            return {
                showText: showText,
                showPreview: showPreview
            };

        }
    };

    TextBox.Util = {
        textToMarkDownHtml: function(phrase) {
            var html = phrase;
            var pattern = [
                [/\[\[(.+?)\]\][ ]*\((\S+?)\)/g, '<table class="buttonwrapper" cellpadding="0"><tr><td class="button"><a href="{2}">{1}</a></td></tr></table>'],
                [/\[(.+?)\][ ]*\((\S+?)\)/g, '<a href="{2}">{1}</a>'],
                [/(\*\*|__)([\S].*?)\1/g, '<strong>{2}</strong>'],
                [/(\*|_)([\S].*?)\1/g, '<em>{2}</em>'],
                [/(#+)+([^#\n]*)(\s*#+)?/g, '<h{1:l}>{2}</h{1:l}>']
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
        htmlEntities: function(html) {

            if (!html) {
                return;
            }

            var escapeMap = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#x27;',
                '`': '&#x60;',
                '\n': '<br />',
                ' ': '&nbsp;'
            };

            var source = '(?:' + Object.keys(escapeMap).join('|') + ')';
            return !(new RegExp(source)).test(html) ? html : html.replace(new RegExp(source, 'g'), function(match) {
                return escapeMap[match];
            });

        },
        replaceArray: function(search, replace, subject) {
            var replaceString = subject;
            var index = 0;
            var length = search.length;

            for (; index < length; index++) {
                replaceString = replaceString.replace(search[index], replace[index]);
                replaceString = replaceString.replace(search[index], replace[index]);
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
                var $parent, $content;
                $parent = $this.closest('.form-group');

                if ($parent.length < 1) {
                    $parent = $this.closest('div,form');
                }

                if ($('.text-box-container', $parent).length < 1) {
                    $content = $(TextBox.Defaults.content);
                    $('.text-box', $content).prepend($this);

                    var $label = $('<label class="has-error"/>');
                    $label.attr('for', $this.attr('id')).hide();

                    $parent.append($content).append($label);
                }

                $this.data('textbox', (data = new TextBox(this, options)));
                data.refresh(TextBox.State.INIT);
            } else {
                $this.data('textbox').refresh();
            }
        });
    }

    $.fn.textBox = plugin;
    $.fn.textBox.Constructor = TextBox;
})(jQuery);