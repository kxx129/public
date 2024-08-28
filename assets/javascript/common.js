'use strict';

var Parente = Parente || {};

/* requestAnimationFrame */
;(function(w, r) {
    w['r'+r] = w['r'+r] || w['webkitR'+r] || w['mozR'+r] || w['msR'+r] || w['oR'+r] || function(c){ w.setTimeout(c, 1000 / 60); };
})(this, 'equestAnimationFrame');

(function() {
    var ua = navigator.userAgent.toLowerCase(),
        ver = navigator.appVersion.toLowerCase(),
        isMSIE = (ua.indexOf('msie') > -1) && (ua.indexOf('opera') == -1),
        isIE11 = (ua.indexOf('trident/7') > -1);
    
    Parente.ie = {
        isIE8: isMSIE && (ver.indexOf('msie 8.') > -1),
        isIE9: isMSIE && (ver.indexOf('msie 9.') > -1),
        isIE10: isMSIE && (ver.indexOf('msie 10.') > -1),
        isIE11: isIE11,
        isIE: isMSIE || isIE11,
        isEdge: (ua.indexOf('edge') > -1),
        isWindows: (ua.indexOf('windows') > -1)
    };
    
    Parente.iOS = {
        isIPhone: (ua.indexOf('iphone') > 0),
        isIPod: (ua.indexOf('ipod') > 0),
        isIPad: (ua.indexOf('ipad') > 0)
    };
    
    Parente.hasScrollbar = window.innerWidth !== document.body.clientWidth;
    if (Parente.hasScrollbar) {
        $('html').addClass('hasScrollbar');
    }
    
    
    if (Parente.iOS.isIPhone || Parente.iOS.isIPod || Parente.iOS.isIPad) {
        $('html').addClass('isIOS');
    }
    
    //console.log('8:'+isIE8, ' 9:'+isIE9, ' 10:'+isIE10, ' 11:'+isIE11, ' IE:'+isIE);
    if (Parente.ie.isIE8) $.getScript('/js/vendor/respond.js');
    if (Parente.ie.isIE9) $('html').addClass('isIE9');
    if (Parente.ie.isIE) $('html').addClass('isIE');
    if (Parente.ie.isEdge) $('html').addClass('isEdge');
    if (Parente.ie.isWindows) $('html').addClass('isWindows');
    
    // -------------------------------------------------- header / footer
    Parente.Common = function() {
        var pageType = $('#header').attr('class');
        var headerUrl = (pageType === 'recruit') ? '/recruit/recruit_header.html' : '/header.html';
        var footerUrl = '/footer.html';
        
        $.when(
            $.ajax({
               type: 'GET',
               url: headerUrl,
               dataType: 'html',
               success: function(data) {
                   $('#header').append(data);
               }
            }),
            $.ajax({
               type: 'GET',
               url: footerUrl,
               dataType: 'html',
               success: function(data) {
                   $('#footer').append(data);
               }
            })
        ).done(function() {
            Parente.init = new Parente.Init();
        });
    };
    
    // -------------------------------------------------- 初期化
    Parente.Init = function() {
        this.navOpened = false;
        this.loadingOverlay = $('#overlay');
        this.loader = $('#overlay .loader');
        
        this.header = $('#header');
        this.headerFixed = false;
        
        //this.setPageId(location.href);
        this.heightMatch();
        this.setAnchorScroll();
        
        $('#nav-toggle').on('click', this.navToggle);
        
        //console.log($('a[href="#news-section"]').length);
        $('a[href="#news-section"]').on('click', this.toNewsSectionLink);
        $('body').addClass('loaded');
        
        if (!Modernizr.cssanimations) {
            this.loadingOverlay.velocity('slideUp', 300);
        }
        if (Modernizr.mq('(min-width: 768px)')) {
            this.fixingHeader();
        }
        if (Modernizr.touchevents && Modernizr.mq('(min-width: 768px)')) {
            this.tabletNavTouch();
        }
    };
    
    // body に data-page を指定する
    Parente.Init.prototype.setPageId = function(url) {
        var path = url.split('/'),
            last = path.length - 2,
            pageId = path[last].indexOf('.') > 0 ? 'home' : path[last];
        
        $('body').attr('data-page', pageId);
        this.pageId = pageId;
        //console.log(this.pageId);
    };
    
    // ナビが閉じてたら開く、開いてたら閉じる
    Parente.Init.prototype.navToggle = function() {
        Parente.init.navOpened = !Parente.init.navOpened;
        $('body').toggleClass('nav-opened');
    };
    
    // jquery.matchHeight で要素の高さを揃える
    Parente.Init.prototype.heightMatch = function() {
        if ($('.matchHeight').length) {
            $('.matchHeight').matchHeight();
        }
    };
    
    // ニュース一覧へのリンクのため
    Parente.Init.prototype.toNewsSectionLink = function() {
        var url = $(this).attr('href');
        if (!$(url).length) {
            location.href = '/' + url;
        }
    };
    
    // タブレットは第一階層タップでリンクしないでプルダウン
    Parente.Init.prototype.tabletNavTouch = function() {
        this.navItem = $(".nav-item > a");
        this.navItem.on("touchend", this.tabletNavFocus);
        $(document).on("touchstart", this.tabletNavBlur);
    };
    
    Parente.Init.prototype.tabletNavFocus = function(e) {
        var isHasSub = $(this).siblings(".sub-nav-list").length > 0;
        if (isHasSub) {
            e.preventDefault();
            $(this).focus();
        }
    };
    
    Parente.Init.prototype.tabletNavBlur = function(e) {
        var isNavHover = $(e.target).closest("#header a").length > 0;
        if (!isNavHover) {
            Parente.init.navItem.filter(":focus").blur();
        }
    }
    
    // -------------------------------------------------- ついてくるヘッダー
    Parente.Init.prototype.fixingHeader = function() {
        this.changeHeaderHeight();
    };
    
    Parente.Init.prototype.changeHeaderHeight = function() {
        if (Parente.scrollTop > 300) {
            if (!this.headerFixed) {
                this.header.addClass("min");
                this.headerFixed = true;
            }
        } else {
            if (this.headerFixed) {
                this.header.removeClass("min");
                this.headerFixed = false;
            }
        }
    };
    
    // -------------------------------------------------- アンカーリンク
    Parente.Init.prototype.setAnchorScroll = function() {
        var anchorLink = $('a[href^="#"]');
        
        anchorLink.on('click', function(e) {
            e.preventDefault();
            
            var id = $(this).attr('href');
            id = (id.indexOf('#top') >= 0) ? '#wrapper' : id;
            
            //console.log(id);
            $(id).velocity('scroll', {
                duration: 1000,
                easing: 'easeOutExpo'
            });
        });
    };
})();
