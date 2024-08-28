'use strict';

(function() {
    var $win = $(window),
        $doc = $(document),
        $body = $('body'),
        resizeTimer = false,
        // function
        common, appear, parallax, modal, slider, formValidate,
        // variable
        appearLine;
    
    // -------------------------------------------------- スクロールアピアー
    Parente.AppearAction = function() {
        if (!this.dataSetted) {
            this.setData();
        }
    };
    
    Parente.AppearAction.prototype.setData = function() {
        this.appearedElm = $('[data-appeared]');
        this.appearedElmLen = this.appearedElm.length;
        this.appearElmData = [];
        
        for (var i = 0; i < this.appearedElmLen; i++) {
            this.appearElmData[i] = {
                element: this.appearedElm.eq(i),
                appeared: false,
                position: this.appearedElm.eq(i).offset().top
            }
        }
        this.dataSetted = true;
        //console.log('appearElmData', this.appearElmData);
    };
    
    Parente.AppearAction.prototype.onScroll = function() {
        var self = this;
        if (Modernizr.mq('(max-width: 767px)')) return;
        
        for (var i = 0; i < this.appearedElmLen; i++) {
            if (Parente.scrollTop + appearLine > this.appearElmData[i].position) {
                if (!this.appearElmData[i].appeared) {
                    //console.log(i);
                    this.appearElmData[i].appeared = true;
                    this.appearElmData[i].element.attr('data-appeared', true);
                }
            } else {
                if (this.appearElmData[i].appeared) {
                    //console.log(i);
                    this.appearElmData[i].appeared = false;
                    this.appearElmData[i].element.attr('data-appeared', false);
                }
            }
        }
    };
    
    // -------------------------------------------------- parallax
    // MEMO: パララックスする要素には [data-prlx] 属性を付与する
    Parente.Parallax = function() {
        this.parallaxActive = false;
        this.paraData = {};
        this.shift = []; // 要素のズレ
        
        this.init();
    };
    
    Parente.Parallax.prototype.init = function() {
        this.paraTarget = $('[data-prlx]');
        this.paraTargetLength = this.paraTarget.length;
        
        if (!Parente.ie.isIE) {
            if ($('[data-prlx]').length) {
                for (var i = 0; i < this.paraTargetLength; i++) {
                    this.shift.push(0);
                }
                this.setValue();
            }
        } else {
            for (var i = 0; i < this.paraTargetLength; i++) {
                if (this.paraTarget.eq(i).is('image')) {
                    this.svgYshift(this.paraTarget.eq(i));
                }
            }
        }
    };
    
    Parente.Parallax.prototype.onScroll = function() {
        //console.log(Parente.scrollTop);
        for (var i = 0; i < this.paraTargetLength; i++) {
            // キービジュアルなら画面上辺基準、背景イメージなら画面下辺基準、オブジェクトは画面中央基準
            var referencePosition = (this.paraData[i].kvj) ? Parente.scrollTop : (this.paraData[i].vbg) ? Parente.scrollCnt : Parente.scrollCnt;
            var distance = (referencePosition - this.paraData[i].pos) / this.paraData[i].frc;
            
            if (this.paraData[i].vbg) {
                /*if (!Parente.ie.isWindows) {
                    var shift = -(this.shift[i] + distance) / 20; // 「-」なら下にスライド
                    this.shift[i] = (Math.floor((this.shift[i] + shift) * 100) / 100) - 2.5;
                    $.Velocity.hook(this.paraData[i].elm, 'y', this.shift[i] + 'px');
                }*/
            } else {
                var shift = -(this.shift[i] + distance) / 20;
                this.shift[i] = Math.floor((this.shift[i] + shift) * 100) / 100;
                $.Velocity.hook(this.paraData[i].elm, 'translateY', this.shift[i] + 'px');
            }
        }
    };
    
    // 768px 未満は強制元通り
    Parente.Parallax.prototype.setValue = function() {
        if (Modernizr.mq('(min-width: 768px)')) {
            for (var i = 0; i < this.paraTargetLength; i++) {
                var $thisElm = this.paraTarget.eq(i),
                    isBg = $thisElm.is('image'),
                    isVisual = $thisElm.parent('svg').is('.visual_bg'),
                    elmPos = isVisual ? $thisElm.parent('svg').offset().top : $thisElm.offset().top,
                    friction = $thisElm.data('prlx') * 20;
                
                this.paraData[i] = {
                    elm: $thisElm,
                    vbg: isBg,
                    kvj: isVisual,
                    pos: elmPos,
                    frc: friction
                };
            }
            // パララックスしてなかったらパララックス開始
            if (!this.parallaxActive) {
                scrollLoop();
                this.parallaxActive = true;
            }
        } else if (this.parallaxActive) {
            this.parallaxActive = false;
            for (var i = 0; i < this.paraTargetLength; i++) {
                if (this.paraData[i].vbg) {
                    if (this.paraData[i].elm.is('image')) {
                        this.svgYshift(this.paraData[i].elm);
                    }
                } else {
                    this.paraData[i].elm.removeAttr('style');
                }
            }
        } else {
            for (var i = 0; i < this.paraTargetLength; i++) {
                this.svgYshift(this.paraTarget.eq(i));
            }
        }
        //console.log(this.paraData);
    };
    
    Parente.Parallax.prototype.svgYshift = function(elm) {
        if (elm.is('.sp-only')) {
            elm.attr('y', 0);
        } else if (elm.is('image')) {
            elm.attr('y', -50);
        }
    };
    
    // -------------------------------------------------- モーダル
    Parente.Modal = function() {
        this.modalContainer = $('#modalContainer');
        this.modalSection = this.modalContainer.find('.modal-section');
        this.modalLength = this.modalSection.length;
        this.modalOpened = false;
        
        if (this.modalLength > 0) {
            this.setUp();
        }
    };
    
    Parente.Modal.prototype.setUp = function() {
        var closerElm = '<a class="modalCloser" alt="×">';
            closerElm += '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12">';
            closerElm += '<path d="M12 .8l-.8-.8-5.2 5.2-5.2-5.2-.8.8 5.2 5.2-5.2 5.2.8.8 5.2-5.2 5.2 5.2.8-.8-5.2-5.2z"/>';
            closerElm += '</svg></a>';
        
        for (var i = 0; i < this.modalLength; i++) {
            this.modalSection.eq(i).append(closerElm);
        }
        
        this.opener = $('a.modalOpener');
        this.closer = $('a.modalCloser, #modalOverlay');
        this.overlay = $('#modalOverlay');
        this.container = $('#modalContainer');
        
        this.opener.on('click', this.open);
        this.closer.on('click', this.close);
    };
    
    Parente.Modal.prototype.open = function(e) {
        e.preventDefault();
        var self = modal;
        var index = $(this).parent('li').index();
        var elm = self.container.children('.flickity-slider');
        
        self.overlay.velocity('fadeIn', {
            'duration': 600,
            'queue': false
        });
        self.container.velocity('fadeIn', {
            'duration': 1000,
            'complete': function() {
                if (slider !== undefined) {
                    slider.reSet();
                    slider.toMove(elm, index);
                }
                $body.addClass('modalOpened');
                
                // スワイプでスクロールさせない
                if (Parente.iOS.isIPad) {
                    $('html').on('touchmove.noScroll', function(e) {
                        // MEMO: #modalContainer 上でスワイプすれば結局ページごとスクロールする
                        //if (!$(e.target).closest('#modalContainer').length) {
                            e.preventDefault();
                        //}
                    });
                }
            }
        });
        self.modalOpened = true;
    };
    
    Parente.Modal.prototype.close = function(e) {
        e.preventDefault();
        var self = modal;
        self.container.velocity('fadeOut', {
            'duration': 1000,
            'queue': false
        });
        self.overlay.velocity('fadeOut', {
            'duration': 600
        });
        self.modalOpened = false;
        $body.removeClass('modalOpened');
        
        if (Parente.iOS.isIPad) {
            $('html').off('touchmove.noScroll');
        }
    };
    
    // -------------------------------------------------- Flickity slider
    Parente.Slider = function() {
        this.sliderTarget = $('.flickity-slider');
        
        this.sliderTargetLength = this.sliderTarget.length;
        this.flickitySlider = [];
        
        this.sliderSeted = false;
        var draggable = !Modernizr.touchevents;
        
        if (this.sliderTargetLength > 0) {
            this.flickityOptions = {
                imagesLoaded: true,
                dragThreshold: 100,
                draggable: draggable,
                prevNextButtons: false,
                pageDots: false
            };
            this.setUp();
            this.scrollBar = new Parente.ScrollBar();
        }
    };
    
    Parente.Slider.prototype.setUp = function() {
        //console.log(this);
        for (var i = 0; i < this.sliderTargetLength; i++) {
            var $target = this.sliderTarget.eq(i);
            
            this.flickitySlider[i] = {
                'elm': $target,
                'nextArrow': $target.siblings('.slider_next'),
                'prevArrow': $target.siblings('.slider_prev')
            };
            
            this.flickitySlider[i].elm.flickity(this.flickityOptions);
            
            this.flickitySlider[i].nextArrow.on('click', function() {
                $target.flickity('next', true);
            });
            this.flickitySlider[i].prevArrow.on('click', function() {
                $target.flickity('previous', true);
            });
            
            if (i === this.sliderTargetLength - 1) {
                this.sliderSeted = true;
            }
        }
    };
    
    Parente.Slider.prototype.toMove = function(elm, index) {
        //console.log(elm, index);
        elm.flickity('select', index, false, true);
    };
    
    Parente.Slider.prototype.reSet = function() {
        if (this.sliderSeted) {
            for (var i = 0; i < this.sliderTargetLength; i++) {
                this.flickitySlider[i].elm.flickity('resize');
                this.scrollBar.update();
            }
        }
    };
    Parente.Slider.prototype.destroy = function() {
        if (this.sliderSeted) {
            for (var i = 0; i < this.sliderTargetLength; i++) {
                this.flickitySlider[i].elm.flickity('destroy');
            }
            this.sliderSeted = false;
        }
    };
    Parente.Slider.prototype.reSetUp = function() {
        if (!this.sliderSeted) {
            for (var i = 0; i < this.sliderTargetLength; i++) {
                this.flickitySlider[i].elm.flickity(this.flickityOptions);
                this.scrollBar.update();
            }
            this.sliderSeted = true;
        }
    };
    
    // -------------------------------------------------- Perfect scrollbar
    Parente.ScrollBar = function() {
        this.scrollContainer = $('.txt-wrap');
        this.scrollbarSetted = false;
        if (this.scrollContainer.length) {
            this.setUp();
        }
    };
    
    Parente.ScrollBar.prototype.setUp = function() {
        if (Modernizr.mq('(min-width: 768px)')) {
            this.scrollbarSetted = true;
            this.scrollContainer.perfectScrollbar();
        }
    };
    
    Parente.ScrollBar.prototype.update = function() {
        if (!this.scrollbarSetted) {
            this.setUp();
        } else if (Modernizr.mq('(min-width: 768px)')) {
            this.scrollContainer.perfectScrollbar('update');
        } else {
            this.scrollbarSetted = false;
            this.scrollContainer.perfectScrollbar('destroy');
        }
    };
    
    // -------------------------------------------------- スクロールループ
    function scrollLoop() {
        if (Modernizr.mq('(min-width: 768px)')) {
            if (parallax !== undefined) parallax.onScroll();
            requestAnimationFrame(scrollLoop);
        }
    };
    
    // -------------------------------------------------- フォームバリデーション
    Parente.FormValidate = function() {
        this.requiredCompleted = false;
        this.agreementChecked = false;
        this.beforeunloadSeted = false;
        
        this.requiredItem = $('[required]:not(#contact-agreement)');
        
        this.emailOrigin = {
            input: $('#contact-email'),
            value: ''
        };
        this.emailConfirm = {
            input: $('#contact-email-confirm'),
            value: ''
        };
        
        this.agreementCheckbox = $('#contact-agreement');
        this.submitButton = $('#contact-submit');
        this.resetButton = $('#contact-reset');
        
        this.requiredItemLength = this.requiredItem.length;
        this.requiredItems = {};
        
        for (var i = 0; i < this.requiredItemLength; i++) {
            this.requiredItems[i] = {
                elm: this.requiredItem.eq(i),
                type: this.requiredItem.eq(i).attr('type'),
                body: this.requiredItem.eq(i).parent('.form_body')
            };
        }
        
        // 同意チェック以外の必須項目に
        // フォーカス・内容を変更するたび、それが空なら、同意チェックを外す
        // ブラーするたび、それが空なら、エラー表示
        this.requiredItem.on({
            'focus': this.focusCheck,
            'change': this.changeCheck,
            'blur': this.blurCheck
        });
        // 同意チェックを切り替えるたび、必須項目を全チェック
        this.agreementCheckbox.on('change', this.agreementCheck);
        // オールリセット
        this.resetButton.on('click', this.allReset);
    };
    
    Parente.FormValidate.prototype.allReset = function() {
        var self = formValidate;
        self.requiredCompleted = false;
        self.agreementChecked = false;
        for (var i = 0; i < self.requiredItemLength; i++) {
            self.requiredItems[i].body.removeClass('match');
        }
        self.submitToggle();
    };
    
    Parente.FormValidate.prototype.windowCloseCheck = function() {
        this.beforeunloadSeted = true;
        
        $win.on('beforeunload', function (e) {
            var confirmationMessage = 'このサイトを離れてもよろしいですか？';
            e.returnValue = confirmationMessage;
            return confirmationMessage;
        });
        // 送信ボタンでの遷移では離脱アラート出さない → ※いかなる時も離脱アラート出さない
        //$('form').on('submit', function() {
            $win.off('beforeunload');
        //});
    };
    
    // フォーカスした時
    Parente.FormValidate.prototype.focusCheck = function() {
        var self = formValidate;
        
        self.getInputData(this);
        
        var inputed = self.valueCheck(this);
        
        if (self.agreementChecked && !inputed) {
            self.agreementCheckbox.prop('checked', false);
            self.agreementCheck();
        }
    };
    Parente.FormValidate.prototype.changeCheck = function() {
        var self = formValidate;
        
        self.getInputData(this);
        
        var inputed = self.valueCheck(this);
        
        if (self.agreementChecked && !inputed) {
            self.agreementCheckbox.prop('checked', false);
            self.agreementCheck();
        }
        // フォームに入力があった時点で、離脱アラート設置する
        if (inputed && !self.beforeunloadSeted) {
            self.windowCloseCheck();
        }
    };
    
    Parente.FormValidate.prototype.getInputData = function(input) {
        var inputType = $(input).attr('type');
        
        this.curInputData = {
            body: $(input).parent('.form_body'),
            id: $(input).attr('id'),
            type: inputType,
            isMultipleInput: $(input).siblings('input').length > 0,
            isCheckInput: inputType === 'radio' || inputType === 'checkbox'
        };
    };
    
    // ラジオボタンかチェックボックス・入力項目が複数・その他別に、入力があるかチェック
    Parente.FormValidate.prototype.valueCheck = function(input) {
        var inputed = true;
        if (this.curInputData.isCheckInput) {
            inputed = $(input).prop('checked');
        } else if (this.curInputData.isMultipleInput) {
            inputed = $(input).val() !== '' && $(input).siblings('input').val() !== '';
        } else {
            inputed = $(input).val() !== '';
        }
        // 入力があれば true、なければ false を返す
        //console.log(inputed);
        return inputed;
    };
    
    // ブラーした時
    Parente.FormValidate.prototype.blurCheck = function() {
        var self = formValidate,
            inputed = self.valueCheck(this);
        
        //if (!self.curInputData.isCheckInput && self.curInputData.isMultipleInput && !$(this).is(':last-of-type')) return;
        
        // 入力があれば、メールアドレス・電話番号は判別、その他はアラート解除
        if (inputed) {
            if (self.curInputData.id === 'contact-zip') {
                self.zipCheck(this);
            } else if (self.curInputData.type === 'email') {
                self.mailCheck(this);
            } else if (self.curInputData.type === 'tel') {
                self.telCheck(this);
            } else {
                self.inputedCheck(inputed, '※この項目は必須です。');
            }
        } else {
            self.inputedCheck(inputed, '※この項目は必須です。');
        }
    };
    Parente.FormValidate.prototype.inputedCheck = function(bool, msg, body) {
        var formBody = !body ? this.curInputData.body : body;
        //console.log(formBody);
        if (bool) {
            formBody.addClass('match').removeAttr('data-error');
        } else {
            formBody.removeClass('match').attr('data-error', msg);
        }
    };
    
    // ハイフンを強制削除し、電話番号かどうかチェック
    Parente.FormValidate.prototype.telCheck = function(input) {
        var val = $(input).val().replace(/[━.*‐.*―.*－.*\?.*ー.*\-]/gi,'');
        $(input).val(val);
        
        var isTel = val.match(/^[0-9]+$/) && val.match(/^\d{10}$|^\d{11}$/);
        this.inputedCheck(isTel, '正しい電話番号を入力してくださいませ。');
    };
    
    // ハイフンを強制削除し、郵便番号から住所自動入力
    Parente.FormValidate.prototype.zipCheck = function(input) {
        var val = $(input).val().replace(/[━.*‐.*―.*－.*\?.*ー.*\-]/gi,'');
        $(input).val(val);
        
        var isZip = val.match(/^[0-9]+$/) && val.match(/^\d{7}$/);
        this.inputedCheck(isZip, '正しい郵便番号を入力してくださいませ。');
        
        AjaxZip3.zip2addr(input, '', 'prefecture', 'address');
    };
    
    // メールアドレスかどうかチェック
    Parente.FormValidate.prototype.mailCheck = function() {
        var msg = '',
            val = this.emailOrigin.input.val(),
            reVal = this.zen2han(val);
        
        this.emailOrigin.input.val(reVal);
        this.emailOrigin.value = this.emailOrigin.input.val();
        
        if (this.emailOrigin.value !== '') {
            if (!this.emailOrigin.value.match( /.+@.+\..+/ )) {
                msg = '入力されたメールアドレスに間違いはありませんか？';
            }
            if (this.emailOrigin.value.match( /,/ )) {
                msg = '「,(カンマ)」が含められていますが「.(ドット)」ではありませんか？';
            }
            
            this.inputedCheck(msg === '', msg, this.emailOrigin.input.parent('.form_body'));
        }
        this.mailConfirmCheck();
    };
    
    // 確認用メールアドレスが合ってるかどうかチェック
    Parente.FormValidate.prototype.mailConfirmCheck = function() {
        var msg = '確認用メールアドレスが一致しません。どちらかに間違いはありませんか？',
            val = this.emailConfirm.input.val(),
            reVal = this.zen2han(val);
        
        this.emailConfirm.input.val(reVal);
        this.emailConfirm.value = this.emailConfirm.input.val();
        
        if (this.emailConfirm.value !== '') {
            this.inputedCheck(this.emailOrigin.value === this.emailConfirm.value, msg, this.emailConfirm.input.parent('.form_body'));
        }
    };
    
    // 同意チェック・必須項目が空でないか全チェック
    Parente.FormValidate.prototype.agreementCheck = function() {
        var self = formValidate,
            completeLength = 0;
        
        self.agreementChecked = $(this).prop('checked');
        
        for (var i = 0; i < self.requiredItemLength; i++) {
            //console.log(self.requiredItem.eq(i).val());
            if (self.requiredItems[i].elm.val() !== '') {
                self.requiredItems[i].body.removeAttr('data-error');
                completeLength++;
            } else {
                //console.log(self.agreementChecked);
                if (self.agreementChecked) {
                    var msg = '※必須項目が未入力です。';
                    self.requiredItems[i].body.attr('data-error', msg);
                }
            }
        }
        self.requiredCompleted = completeLength === self.requiredItemLength;
        if (!self.requiredCompleted) {
            $('[data-error]').eq(0).velocity('scroll', {
                duration: 600,
                easing: 'easeOutExpo',
                offset: -25
            }).find('[name]').eq(0).focus();
        }
        self.submitToggle();
    };
    
    // 入力フォームが全部埋まってて、同意してたら、送信ボタンを活性化
    Parente.FormValidate.prototype.submitToggle = function() {
        console.log(this);
        var self = formValidate;
        
        //console.log(self.requiredCompleted, self.agreementChecked);
        if (self.requiredCompleted && self.agreementChecked) {
            self.submitButton.removeClass('disabled').prop('disabled', false);
        } else {
            if (!self.submitButton.hasClass('disabled')) {
                self.submitButton.addClass('disabled').prop('disabled', true);
            }
        }
    };
    
    // 全角を半角に変換
    Parente.FormValidate.prototype.zen2han = function(str) {
        str = str.replace(/[\uff21-\uff3a\uff41-\uff5a\uff10-\uff19]/g, function(s){
            return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
        });
        // spaces remove
        str = str.replace(/\u0020|\u3000/g, '');
        return str;
    };
    
    // -------------------------------------------------- ウィンドウイベント
    function onLoad() {
        onResize();
        onScroll();
        Parente.Common();
        
        modal = new Parente.Modal();
        slider = new Parente.Slider();
        
        if ($('form').length > 0) {
            formValidate = new Parente.FormValidate();
        }
        
        // アピアーとパララックスは 768px 以上の IE 以外だけ、パララックスはノータッチデバイスだけ
        if (Modernizr.mq('(min-width: 768px)')) {
            appear = new Parente.AppearAction();
            if (!Modernizr.touchevents) {
                parallax = new Parente.Parallax();
            }
        }
    }
    
    function onResize() {
        Parente.winW = $win.width();
        Parente.winH = $win.height();
        appearLine = Parente.winH * 0.95;
        
        if (resizeTimer !== false) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            onResized();
        }, 200);
    }
    
    function onResized() {
        if (appear !== undefined) {
            appear.setData();
            appear.onScroll();
        } else {
            if (Modernizr.mq('(min-width: 768px)')) {
                appear = new Parente.AppearAction();
            }
        }
        
        if (parallax !== undefined) {
            if (!Parente.ie.isIE) {
                parallax.setValue();
            }
        } else {
            parallax = new Parente.Parallax();
        }
        
        if (slider !== undefined) {
            slider.reSet();
        }
        
        if (Parente.init !== undefined && Modernizr.mq('(min-width: 768px)')) {
            Parente.init.changeHeaderHeight();
        }
    }
    
    function onScroll() {
        Parente.scrollTop = $win.scrollTop();
        Parente.scrollBtm = Parente.scrollTop + Parente.winH;
        Parente.scrollCnt = Parente.scrollTop + Parente.winH / 2;
        
        if (appear !== undefined) appear.onScroll();
        if (Parente.init !== undefined && Modernizr.mq('(min-width: 768px)')) {
            Parente.init.changeHeaderHeight();
        }
    }
    
    $win.on({ 'load': onLoad, 'resize': onResize, 'scroll': onScroll });
})();
