/**
 * Created by zhangxiaopeng on 2013/8/19.
 */
(function($, window){

    /**
     * 遮罩层jquery对象
     * @type {jQuery object}
     */
    var $overlay = $('<div>'),

        /**
         * 滑动区域jquery对象
         * @type {jQuery object}
         */
        $slider = $('<div>'),

        $prevBtn = $('<a class="prev-btn"></a>'),
        $nextBtn = $('<a class="next-btn"></a>'),



        /**
         * 默认选项配置
         * @type {Object}
         */
        _defaultOptions = {
            items: [],
            firstIndex: 0,
            overlayBackground: 'rgba(0,0,0,0.8)',
            zIndex: 100000,
            urlAttrName: 'image-url',
            loadingGif: 'images/preloader.gif',
            cycle: false,

            init: function(carousel){},
            flipOver: function(carousel, is_forword){},
            close: function(carousel){},
            nomore: function(carousel, is_forword){}
        };

    $.fn.MbCarousel = function(options){

        var $this = $(this);
        _options = $.extend(_defaultOptions, options),
            _currentNode = null,
            _active = false,
            _self = null,
            // _threeDomObj = [],
            _className = {
                overlay: 'tc-overlay',
                slider: 'tc-slider',
                imgBox: 'tc-img-box'
            }

        /**
         * 遮罩层css
         * @type {Object}
         */
        _overlayCss = {
            'background': _options.overlayBackground,
            'z-index': _options.zIndex
        },

        /**
         * 图片容器css
         * @type {Object}
         */
            _imgBoxCss = {
                'background': 'url("' + _options.loadingGif + '") no-repeat center center',
            },

        /**
         * 轮播的图片列表，数据结构为一个双向链表
         * @type {LinkedList}
         */
            _items = new LinkedList(),

            _appendItems = function(items){
                $.each(items, function(index, item){
                    _items.add(item);
                });
                console.log(this);
                console.log('已添加' + items.length.toString() + '个，当前在第' + this.currentPos().toString() + '个');
            },

            _prependItems = function(items){
                $.each(items.reverse(), function(index, item){
                    _items.insertBefore(_items.getHead().getValue(), item);
                });
                console.log('已在前添加' + items.length.toString() + '个，当前在第' + this.currentPos().toString() + '个');
            },

            _spring = function(is_left){
                var shift = is_left ? '30px' : '-30px';
                $slider.animate({'margin-left': shift}, 150, 'linear', function(){
                    $slider.animate({'margin-left': 0}, 150, 'linear');
                });
            },

            _makeImgBox = function(obj){
                var imgBox = $('<div>').addClass(_className.imgBox).css(_imgBoxCss);
                if(obj == null){
                    return imgBox.attr('image-url', '');
                }
                imgBox.attr('image-url', obj.imageUrl);
                var img = $('<img>').on('load', function(){
                    imgBox.append($(this));
                });
                img.attr('src',obj.imageUrl);
                return imgBox;
            },

            _goToPage = function(node){
                _currentNode = node || _items.getHead();

                _threeDomObj = [];
                var sliderLeft = '-100%',
                    left = _currentNode.getPrevious(),
                    right = _currentNode.getNext();
                if(_options.cycle){
                    left = left || _items.getTail();
                    right = right || _items.getHead();
                }
                var threeDomObj = [left, _currentNode, right];


                $slider.empty().css('left', sliderLeft);
                $.each(threeDomObj, function(index, item){
                    _makeImgBox(item == null ? null : item.getValue()).appendTo($slider);
                });
            },

            _showOverlay = function(node){
                if (_active){
                    return false;
                }

                $overlay.show();

                setTimeout(function(){
                    $overlay.css('opacity', 1);
                }, 100);

                _goToPage(node);

                _active = true;
            },

            _hideOverlay = function (){
                if(!_active){
                    return false;
                }


                $overlay.css('opacity', 0);
                _active = false;

                $('.placeholder').empty();

                $slider.empty();

                _options.close(this);
            },


            _init = function(){
                var self = this;
                // 数据加载
                if(_options.items && _options.items.length > 0){
                    $.each(_options.items, function(index, item){
                        _items.add(item);
                    });
                }
                else{
                    $($this).each(function(index, item){
                        _items.add({'imageUrl': $(this).attr(_options.urlAttrName)});
                    })
                }

                // 设置基本样式
                $overlay.css(_overlayCss);

                // _goToPage(_items.getHead());
                $slider.addClass(_className.slider);
                $overlay.addClass(_className.overlay).append($slider);
                $('body').append($overlay);

                _showOverlay(_items.getHead());

                _options.init(self);

                if ( !("ontouchstart" in window) ){
                    $overlay.append($prevBtn).append($nextBtn);

                    $prevBtn.click(function(e){
                        e.preventDefault();
                        self.prev();
                    });

                    $nextBtn.click(function(e){
                        e.preventDefault();
                        self.next();
                    });
                }
            },
            _currentPos = function(){
                return _currentNode.getPos();
            },
            _length = function(){
                return _items.getSize();
            },
            _showNext = function(){
                _currentNode = _currentNode.getNext();
                var nextNode = null;
                if(_options.cycle){
                    _currentNode = _currentNode || _items.getHead();
                    nextNode = _currentNode.getNext() || _items.getHead();
                }
                if(_currentNode != null){
                    $($slider.find('.tc-img-box').get(2)).replaceWith(_makeImgBox(_currentNode.getValue()));
                    $($slider.find('.tc-img-box').get(0)).animate({'margin-left': '-100%'}, 400, 'linear', function(){
                        $(this).remove();
                        $slider.append(_makeImgBox(nextNode == null ? null : nextNode.getValue()));
                    });

                    _options.flipOver(this, true);
                }
                else{
                    _spring(false);
                    _options.nomore(this, true);
                    _currentNode = _items.getTail();
                }
            },

            _showPrevious = function(){
                _currentNode = _currentNode.getPrevious();
                var prevNode = null;
                if(_options.cycle){
                    _currentNode = _currentNode || _items.getTail();
                    prevNode = _currentNode.getPrevious() || _items.getTail();
                }
                if(_currentNode != null){
                    $($slider.find('.tc-img-box').get(0)).replaceWith(_makeImgBox(_currentNode.getValue()));
                    $($slider.find('.tc-img-box').get(2)).remove();
                    var prevDom = _makeImgBox(prevNode == null ? null : prevNode.getValue()).css('margin-left', '-100%');
                    $slider.prepend(prevDom);
                    prevDom.animate({'margin-left': '0'}, 400, 'linear');

                    _options.flipOver(this, false);
                }
                else{
                    _spring(true);
                    _options.nomore(this, false);
                    _currentNode = _items.getHead();
                }
            };




        $('body').on('touchstart', '.tc-slider', function(e){

            var touch = e.originalEvent,
                startX = touch.changedTouches[0].pageX;

            $slider.on('touchmove',function(e){

                e.preventDefault();

                touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];

                if(touch.pageX - startX > 10){

                    $slider.off('touchmove');
                    _showPrevious();
                }

                else if (touch.pageX - startX < -10){

                    $slider.off('touchmove');
                    _showNext();
                }
            });

            // Return false to prevent image
            // highlighting on Android
            return false;

        }).on('touchend',function(){

            slider.off('touchmove');

        });

        return {
            init: _init,
            next: _showNext,
            prev: _showPrevious,
            currentPos: _currentPos,
            length: _length,
            appendItems: _appendItems,
            prependItems: _prependItems,
            close: _hideOverlay
        };
    };


})(jQuery, window)