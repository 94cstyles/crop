/*!
 * crop.js v0.0.1
 * git+https://github.com/TOP-Chao/crop.git
 * License: MIT
 * Date: 2016-9-26 22:37
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.Crop = factory());
}(this, function () { 'use strict';

  Object.assign = Object.assign || function (target) {
      'use strict';
      // We must check against these specific cases.

      if (target === undefined || target === null) {
          throw new TypeError('Cannot convert undefined or null to object');
      }

      var output = Object(target);
      for (var index = 1; index < arguments.length; index++) {
          var source = arguments[index];
          if (source !== undefined && source !== null) {
              for (var nextKey in source) {
                  if (source.hasOwnProperty(nextKey)) {
                      output[nextKey] = source[nextKey];
                  }
              }
          }
      }
      return output;
  };

  var classCallCheck = function (instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  };

  var inherits = function (subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  };

  var possibleConstructorReturn = function (self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  };

  var Events = function () {
      function Events() {
          classCallCheck(this, Events);

          this._queue = [];
      }

      Events.prototype.on = function on(key, callback) {
          this._queue[key] = this._queue[key] || [];
          this._queue[key].push(callback);
          return this;
      };

      Events.prototype.off = function off(key, callback) {
          if (this._queue[key]) {
              var index = typeof callback === "undefined" ? -2 : this._queue[key].indexOf(callback);
              if (index === -2) {
                  delete this._queue[key];
              } else if (index !== -1) {
                  this._queue[key].splice(index, 1);
              }
              if (this._queue[key] && this._queue[key].length == 0) delete this._queue[key];
          }
          return this;
      };

      Events.prototype.has = function has(key) {
          return !!this._queue[key];
      };

      Events.prototype.trigger = function trigger(key) {
          if (this._queue[key]) {
              for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                  args[_key - 1] = arguments[_key];
              }

              for (var _iterator = this._queue[key], _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
                  var _ref;

                  if (_isArray) {
                      if (_i >= _iterator.length) break;
                      _ref = _iterator[_i++];
                  } else {
                      _i = _iterator.next();
                      if (_i.done) break;
                      _ref = _i.value;
                  }

                  var callback = _ref;

                  callback.apply(this, args);
              }
          }
          return this;
      };

      return Events;
  }();

  var CropFile = function () {
      function CropFile(trigger, quality) {
          classCallCheck(this, CropFile);

          this._trigger = trigger;
          this.quality = quality / 100; //新图片质量
          this.busy = false; //繁忙状态
          this.canvas = document.createElement('canvas'); //用于获取旋转和裁剪图片 获取dataUrl
          this.ctx = this.canvas.getContext("2d");
      }

      CropFile.prototype.writeFile = function writeFile(file) {
          this.file = {}; //图片缓存
          this.fileKey = ''; //图片缓存key: n e s w
          this.fileName = file.type != '' && file.name.indexOf('.') != -1 ? file.name : file.name + '.jpg'; //文件名
          this.angle = 0; //当前图片旋转角度值
          this.mime = file.type || 'image/jpeg'; //mime类型
          this.busy = true;
          this._getImage(file, function (img) {
              this.fileKey = 'n'; //默认key:n 原图
              this.file[this.fileKey] = img; //存入缓存
              this.busy = false;
              this._trigger('_readFile', img);
          });
      };

      CropFile.prototype.cropFile = function cropFile(sourceX, sourceY, sourceWidth, sourceHeight, cropWidth, cropHeight) {
          if (this.file && this.file[this.fileKey]) {
              this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
              this.canvas.width = cropWidth;
              this.canvas.height = cropHeight;
              this.ctx.drawImage(this.file[this.fileKey], sourceX, sourceY, sourceWidth, sourceHeight);
              return this.canvas.toDataURL(this.mime, this.quality);
          } else {
              this._trigger('error', -1, '原图丢失, 请重新选择图片!');
          }
      };

      CropFile.prototype.rotate = function rotate() {
          if (this.file && this.file.n) {
              this.angle = (this.angle + 90) % 360; //每次旋转90度 所以只有4个角度的图 0度 90度 180度 270度
              this.fileKey = this.angle == 0 ? 'n' : this.angle == 90 ? 'e' : this.angle == 180 ? 's' : 'w'; //对应key：n e s w

              this.busy = true;
              if (this.file[this.fileKey]) {
                  //如果有缓存 直接返回
                  this.busy = false;
                  this._trigger('_readFile', this.file[this.fileKey]);
              } else {
                  //根据旋转角度重新获得宽高
                  var width = this.angle == 0 || this.angle == 180 ? this.file.n.width : this.file.n.height,
                      height = this.angle == 0 || this.angle == 180 ? this.file.n.height : this.file.n.width;

                  //使用canvas.toDataURL重新获取图片
                  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                  this.canvas.width = width;
                  this.canvas.height = height;
                  this.ctx.rotate(this.angle * Math.PI / 180);
                  this.ctx.drawImage(this.file.n, this.angle == 180 ? -width : this.angle == 270 ? -height : 0, this.angle == 90 ? -width : this.angle == 180 ? -height : 0);

                  this._getImage(this.canvas.toDataURL(this.mime, 1), function (img) {
                      this.file[this.fileKey] = img;
                      this.busy = false;
                      this._trigger('_readFile', img);
                  });
              }
          } else {
              this._trigger('error', -1, '原图丢失, 请重新选择图片!');
          }
      };

      CropFile.prototype._getImage = function _getImage(source, callback) {
          var _this = this;

          var img = new Image();
          if (typeof source == "string") {
              img.src = source;
          } else {
              //用FileReader读取file
              var reader = new FileReader();
              reader.onload = function (e) {
                  img.src = e.target.result;
              };
              reader.readAsDataURL(source);
          }

          img.addEventListener('load', function () {
              if (img.width == 0 || img.height == 0) {
                  _this._trigger('error', 3, '文件读取失败, 请重新选择图片!');
              } else {
                  callback.call(_this, img);
              }
          });
          img.addEventListener('error', function () {
              this._trigger('error', 4, '文件拒绝访问, 请重新选择图片!');
          });
      };

      return CropFile;
  }();

  var animationEvent = function () {
      var el = document.createElement('div'),
          animations = {
          'animation': 'animationend',
          'webkitAnimation': 'webkitAnimationEnd',
          'msAnimation': 'MSAnimationEnd',
          'oAnimation': 'oanimationend'
      };

      for (var t in animations) {
          if (el.style[t] !== undefined) {
              return animations[t];
          }
      }

      return null;
  }();

  function animationEnd (el, callback) {
      var aniTime = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];

      function bind() {
          callback();
          el.removeEventListener(animationEvent, bind);
      }

      animationEvent ? el.addEventListener(animationEvent, bind) : setTimeout(callback, aniTime);
  }

  var SUPPORT_ONLY_TOUCH = 'ontouchstart' in window && /mobile|tablet|ip(ad|hone|od)|android/i.test(navigator.userAgent);

  var supportOnlyTouch = SUPPORT_ONLY_TOUCH;

  var Tap = function () {
      function Tap(el, handler, options) {
          classCallCheck(this, Tap);

          this.opts = Object.assign({
              time: 250,
              posThreshold: 10,
              stop: true,
              prevent: true
          }, options);

          this.el = el;
          this.handler = handler;

          if (SUPPORT_ONLY_TOUCH) {
              console.log('tap事件');
              this.events = {
                  start: this.onTouchStart.bind(this),
                  end: this.onTouchEnd.bind(this)
              };
              el.addEventListener('touchstart', this.events.start, false);
              el.addEventListener('touchend', this.events.end, false);
          } else {
              el.addEventListener('click', this.handler, false);
          }
      }

      Tap.prototype.destroy = function destroy() {
          if (SUPPORT_ONLY_TOUCH) {
              this.el.removeEventListener('touchstart', this.events.start);
              this.el.removeEventListener('touchend', this.events.end);
          } else {
              this.el.removeEventListener('click', this.handler);
          }
      };

      Tap.prototype.onTouchStart = function onTouchStart(e) {
          if (this.opts.stop) e.stopPropagation();
          if (this.opts.prevent) e.preventDefault();

          var touches = e.touches[0];
          this.pageX = touches.pageX;
          this.pageY = touches.pageY;
          this.time = Date.now();
      };

      Tap.prototype.onTouchEnd = function onTouchEnd(e) {
          //重写currentTarget
          Object.defineProperties(e, {
              "currentTarget": {
                  value: this.el,
                  writable: true,
                  enumerable: true,
                  configurable: true
              }
          });

          //目标没有被禁用
          if (!this.el.disabled) {
              var touches = e.changedTouches[0];
              if (this.pageX >= touches.pageX - this.opts.posThreshold && this.pageX <= touches.pageX + this.opts.posThreshold && this.pageY >= touches.pageY - this.opts.posThreshold && this.pageY <= touches.pageY + this.opts.posThreshold && this.time + this.opts.time - Date.now() >= 0) {
                  e.preventDefault();
                  this.handler(e);
              }
          }
      };

      return Tap;
  }();

  var tpl = '<div class="head"><a class="zoom-in">放大</a> <a class="zoom-out">缩小</a> <a class="rotate">旋转</a></div><div class="panel"><canvas></canvas></div><div class="foot"><a class="cancel">取消</a> <a class="done">选取</a></div><div class="loading"><ul class="spinner"><li></li><li></li><li></li><li></li><li></li></ul></div>';

  var CropCanvas = function () {
      function CropCanvas(trigger, options) {
          classCallCheck(this, CropCanvas);

          this._trigger = trigger;
          this.options = options;
          this.options.cropRatio = this.options.cropWidth / this.options.cropHeight;
          this.elem = null;
          this.config = {};
          this.tapEventCache = {};
          this.eventCache = {
              touchStart: this._onTouchStart.bind(this),
              touchMove: this._onTouchMove.bind(this),
              touchEnd: this._onTouchEnd.bind(this),
              resize: this._onResize.bind(this)
          };
      }

      CropCanvas.prototype.setImage = function setImage(img) {
          if (!this.elem) {
              this.elem = document.createElement('div');
              this.elem.classList.add('m-crop-image-canvas');
              this.elem.innerHTML = tpl;
              document.body.appendChild(this.elem);

              //canvas
              this.canvas = this.elem.querySelector('canvas');
              this.ctx = this.canvas.getContext("2d");

              //loading
              this.loading = this.elem.querySelector('.loading');

              //事件绑定
              this._listener(true);

              this._onResize();
          }
          //隐藏
          this.loading.style.display = 'none';

          this.image = img;
          this.config.image = {
              x: 0, //图片在画布中x值
              y: 0, //图片在画布中y值
              width: img.width, //当前图片宽度
              height: img.height, //当前图片宽度
              ratio: img.width / img.height //原图宽高比
          };

          this._reset();
          this._draw();
      };

      CropCanvas.prototype._listener = function _listener(bind) {
          var attr = bind ? 'addEventListener' : 'removeEventListener';

          if (bind) {
              this.tapEventCache.zoomIn = new Tap(this.elem.querySelector('.zoom-in'), this._zoom.bind(this, true));
              this.tapEventCache.zoomOut = new Tap(this.elem.querySelector('.zoom-out'), this._zoom.bind(this, false));
              this.tapEventCache.rotate = new Tap(this.elem.querySelector('.rotate'), this._rotate.bind(this));
              this.tapEventCache.cancel = new Tap(this.elem.querySelector('.cancel'), this._cancel.bind(this));
              this.tapEventCache.done = new Tap(this.elem.querySelector('.done'), this._done.bind(this));
          } else {
              this.tapEventCache.zoomIn.destroy();
              this.tapEventCache.zoomOut.destroy();
              this.tapEventCache.rotate.destroy();
              this.tapEventCache.cancel.destroy();
              this.tapEventCache.done.destroy();
          }

          this.canvas[attr](supportOnlyTouch ? 'touchstart' : 'mousedown', this.eventCache.touchStart, false);
          this.canvas[attr](supportOnlyTouch ? 'touchmove' : 'mousemove', this.eventCache.touchMove, false);
          if (supportOnlyTouch) {
              this.canvas[attr]('touchend', this.eventCache.touchEnd, false);
          } else {
              window[attr]('mouseup', this.eventCache.touchEnd, false);
          }
          window[attr]('resize', this.eventCache.resize);
      };

      CropCanvas.prototype._rotate = function _rotate() {
          this.loading.style.display = 'block';
          this._trigger('_rotate');
      };

      CropCanvas.prototype._zoom = function _zoom(inOut) {
          if (!this.image) return;
          var width = this.config.image.width,
              height = this.config.image.height,
              ratio = inOut ? 1 + this.options.zoomRatio : 1 / (1 + this.options.zoomRatio);

          //重新计算放大缩小后的宽高以及xy
          this.config.image.width = Math.round(width * ratio);
          this.config.image.height = Math.round(height * ratio);
          this.config.image.x -= Math.floor((this.config.image.width - width) / 2);
          this.config.image.y -= Math.floor((this.config.image.height - height) / 2);

          this._draw();
      };

      CropCanvas.prototype._done = function _done() {
          var image = this.config.image,
              area = this.config.area,
              widthRatio = this.options.cropWidth / area.width,
              heightRatio = this.options.cropHeight / area.height,
              sourceX = Math.floor((image.x - area.x) * widthRatio),
              sourceY = Math.floor((image.y - area.y) * heightRatio),
              sourceWidth = Math.round(image.width * widthRatio),
              sourceHeight = Math.round(image.height * heightRatio);
          this._trigger('_crop', sourceX, sourceY, sourceWidth, sourceHeight, this.options.cropWidth, this.options.cropHeight);
          this._cancel();
      };

      CropCanvas.prototype._cancel = function _cancel() {
          var _this = this;

          this._listener(false); //取消事件绑定
          this.elem.classList.add('z-close');
          animationEnd(this.elem, function () {
              document.body.removeChild(_this.elem);
              _this.elem = null;
          });
      };

      CropCanvas.prototype._verifyConfig = function _verifyConfig() {
          //验证config数据是否复合规则 并 修正
          //由于小数点问题导致最后可能会出现1px的误差 所以在极限值+1
          if (this.config.image.x + this.config.image.width < this.config.area.x + this.config.area.width + 1) {
              this.config.image.x = this.config.area.x + this.config.area.width - this.config.image.width + 1;
          }

          if (this.config.image.x > this.config.area.x) {
              this.config.image.x = this.config.area.x;
          }

          if (this.config.image.y + this.config.image.height < this.config.area.y + this.config.area.height + 1) {
              this.config.image.y = this.config.area.y + this.config.area.height - this.config.image.height + 1;
          }

          if (this.config.image.y > this.config.area.y) {
              this.config.image.y = this.config.area.y;
          }

          if (this.config.image.width < this.config.area.width) {
              this.config.image.width = this.config.area.width;
              this.config.image.height = Math.round(this.config.area.width / this.config.image.ratio);
          }

          if (this.config.image.height < this.config.area.height) {
              this.config.image.height = this.config.area.height;
              this.config.image.width = Math.round(this.config.area.height * this.config.image.ratio);
          }
      };

      CropCanvas.prototype._reset = function _reset() {
          if (!this.image) return;
          //重置图片及大小
          if (this.image.width > this.config.canvas.width) {
              this.config.image.width = this.config.canvas.width;
              this.config.image.height = this.config.canvas.width / this.config.image.ratio;
          } else if (this.image.width < this.config.area.width) {
              this.config.image.width = this.config.area.width;
              this.config.image.height = this.config.area.width / this.config.image.ratio;
          }

          if (this.image.height > this.config.canvas.height) {
              this.config.image.height = this.config.canvas.height;
              this.config.image.width = this.config.canvas.height * this.config.image.ratio;
          } else if (this.image.height < this.config.area.height) {
              this.config.image.height = this.config.area.height;
              this.config.image.width = this.config.area.height * this.config.image.ratio;
          }
          this.config.image.width = Math.round(this.config.image.width);
          this.config.image.height = Math.round(this.config.image.height);
          this.config.image.x = Math.floor((this.config.canvas.width - this.config.image.width) / 2);
          this.config.image.y = Math.floor((this.config.canvas.height - this.config.image.height) / 2);
      };

      CropCanvas.prototype._draw = function _draw() {
          if (!this.image) return;
          //验证并修正
          this._verifyConfig();
          //清除画布
          this.ctx.clearRect(0, 0, this.config.canvas.width, this.config.canvas.height);
          //绘制图
          this.ctx.drawImage(this.image, this.config.image.x, this.config.image.y, this.config.image.width, this.config.image.height);
          //绘制遮罩层
          this.ctx.save();
          this.ctx.fillStyle = this.options.background;
          this.ctx.fillRect(0, 0, this.config.canvas.width, this.config.canvas.height);
          this.ctx.restore();
          //绘制裁剪区域
          this.ctx.save();
          this.ctx.beginPath();
          this.ctx.strokeStyle = this.options.borderColor;
          this.ctx.lineWidth = this.options.borderSize;
          this.ctx.rect(this.config.area.x, this.config.area.y, this.config.area.width, this.config.area.height);
          if (this.options.borderSize > 0) this.ctx.stroke();
          this.ctx.clip();
          //补充绘制图
          this.ctx.drawImage(this.image, this.config.image.x, this.config.image.y, this.config.image.width, this.config.image.height);
          this.ctx.restore();
      };

      CropCanvas.prototype._getCanvasOffset = function _getCanvasOffset() {
          var box = this.canvas.getBoundingClientRect();

          var scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
          var scrollLeft = window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft;

          var clientTop = document.documentElement.clientTop || document.body.clientTop || 0;
          var clientLeft = document.documentElement.clientLeft || document.body.clientLeft || 0;

          return {
              x: Math.round(box.left + scrollLeft - clientLeft),
              y: Math.round(box.top + scrollTop - clientTop)
          };
      };

      CropCanvas.prototype._getEventXY = function _getEventXY(e) {
          var _this2 = this;

          return (e.touches ? Array.prototype.slice.call(e.touches) : [e]).map(function (obj) {
              return {
                  x: obj.screenX - _this2.config.canvas.offset.x,
                  y: obj.screenY - _this2.config.canvas.offset.y
              };
          });
      };

      CropCanvas.prototype._getTouchDistance = function _getTouchDistance(touch) {
          return touch.length == 2 ? Math.sqrt((touch[1].x - touch[0].x) * (touch[1].x - touch[0].x) + (touch[1].y - touch[0].y) * (touch[1].y - touch[0].y)) : 0;
      };

      CropCanvas.prototype._onTouchStart = function _onTouchStart(e) {
          e.stopPropagation();
          e.preventDefault();
          if (!this.image || e.touches && e.touches.length > 2) return; //只允许2个手指和1个手指操作
          var points = this._getEventXY(e);
          this.touch = {
              state: true,
              points: points,
              distance: this._getTouchDistance(points)
          };
      };

      CropCanvas.prototype._onTouchMove = function _onTouchMove(e) {
          var _this3 = this;

          e.stopPropagation();
          e.preventDefault();
          if (this.touch.state) {
              setTimeout(function () {
                  var points = _this3._getEventXY(e);
                  if (!e.touches || e.touches.length == 1) {
                      //drag
                      _this3.config.image.x += points[0].x - _this3.touch.points[0].x;
                      _this3.config.image.y += points[0].y - _this3.touch.points[0].y;
                      _this3.touch.points[0].x = points[0].x;
                      _this3.touch.points[0].y = points[0].y;
                      _this3._draw();
                  } else {
                      //zoom
                      var displace = _this3._getTouchDistance(points) - _this3.touch.distance;
                      if (Math.abs(displace) > _this3.options.gap) {
                          //每当间距差到达设置值就触发zoom
                          _this3.touch.distance += displace;
                          _this3._zoom(displace > 0);
                      }
                  }
              }, 0);
          }
      };

      CropCanvas.prototype._onTouchEnd = function _onTouchEnd(e) {
          e.stopPropagation();
          if (!this.touch.state) return;
          this.touch.state = false;
      };

      CropCanvas.prototype._onResize = function _onResize() {
          var width = this.canvas.clientWidth,
              height = this.canvas.clientHeight,
              areaWidth = (width < height ? width : height) * 0.7,
              areaHeight = areaWidth / this.options.cropRatio;

          if (areaHeight > height * 0.6) {
              areaHeight = height * 0.6;
              areaWidth = areaHeight * this.options.cropRatio;
          }

          //保持数值的整数性
          areaWidth = Math.round(areaWidth);
          areaHeight = Math.round(areaHeight);

          //设置配置
          this.config.canvas = {
              width: width,
              height: height,
              offset: this._getCanvasOffset() //画布offset
          };
          this.config.area = {
              x: Math.floor(width / 2 - areaWidth / 2),
              y: Math.floor(height / 2 - areaHeight / 2),
              width: areaWidth,
              height: areaHeight
          };
          this.touch = {
              state: false,
              points: null, //当前手势各自位置
              distance: 0 //当前2手指间距
          };

          this.canvas.width = width;
          this.canvas.height = height;

          this._reset();
          this._draw();
      };

      return CropCanvas;
  }();

  var Crop = function (_Events) {
      inherits(Crop, _Events);

      function Crop(elem, options) {
          classCallCheck(this, Crop);

          var _this = possibleConstructorReturn(this, _Events.call(this));

          if (!elem || !/input/i.test(elem.tagName) || !/file/i.test(elem.type)) {
              _this.trigger('error', 100, '请绑定正确的file标签');
          } else {
              _this.elem = elem;
              _this.elem.value = null; //清除
              _this.file = new CropFile(_this.trigger.bind(_this), options.quality || 80);
              delete options.quality;
              _this.canvas = new CropCanvas(_this.trigger.bind(_this), Object.assign({
                  cropWidth: 200, //裁剪大小
                  cropHeight: 200, //裁剪大小
                  zoomRatio: 0.1, //缩放比
                  gap: 20, //缩放触发值
                  borderSize: 1, //裁剪区域border大小
                  borderColor: '#fff', //裁剪区域border颜色
                  background: 'rgba(0,0,0,.8)' //遮罩层颜色
              }, options));

              _this._bindEvents();
              _this._bindFileChange();
          }
          return _this;
      }

      Crop.prototype._bindEvents = function _bindEvents() {
          var _this2 = this;

          this.on('_readFile', function (file) {
              _this2.elem.value = null;
              _this2.canvas.setImage(file);
          }).on('_rotate', function () {
              _this2.file.rotate();
          }).on('_crop', function (sourceX, sourceY, sourceWidth, sourceHeight, cropWidth, cropHeight) {
              var file = _this2.file.cropFile(sourceX, sourceY, sourceWidth, sourceHeight, cropWidth, cropHeight);
              _this2.trigger('crop', file, _this2.file.fileName);
          });
      };

      Crop.prototype._bindFileChange = function _bindFileChange() {
          var _this3 = this;

          this.elem.addEventListener('change', function (e) {
              if (!_this3.file.busy) {
                  if (e.target.files) {
                      //有些低端机图片类型为空
                      if (e.target.files[0].type == '' || /image\/(jpeg|png|gif|bmp|tiff)/.test(e.target.files[0].type)) {
                          _this3.file.writeFile(e.target.files[0]);
                      } else {
                          _this3.trigger('error', 2, '请上传正确格式的图片, 仅支持[jpeg,png,gif,bmp,tiff)格式的图片!');
                      }
                  } else {
                      _this3.trigger('error', 1, '浏览器缺陷, 不支持FileList!');
                  }
              } else {
                  _this3.trigger('error', 1, '请勿重复操作。');
              }
          });
      };

      return Crop;
  }(Events);

  return Crop;

}));