import animationEnd from './modules/animationEnd';
import Tap, {supportOnlyTouch} from './modules/tap';

const tpl = `<div class="head"><a class="zoom-in">放大</a> <a class="zoom-out">缩小</a> <a class="rotate">旋转</a></div><div class="panel"><canvas></canvas></div><div class="foot"><a class="cancel">取消</a> <a class="done">选取</a></div><div class="loading"><ul class="spinner"><li></li><li></li><li></li><li></li><li></li></ul></div>`;

export default class CropCanvas {
    constructor(trigger, options) {
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

    setImage(img) {
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
    }

    _listener(bind) {
        let attr = bind ? 'addEventListener' : 'removeEventListener';

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
    }

    _rotate() {
        this.loading.style.display = 'block';
        this._trigger('_rotate');
    }

    _zoom(inOut) {
        if (!this.image) return;
        let width = this.config.image.width,
            height = this.config.image.height,
            ratio = inOut ? 1 + this.options.zoomRatio : 1 / (1 + this.options.zoomRatio);

        //重新计算放大缩小后的宽高以及xy
        this.config.image.width = Math.round(width * ratio);
        this.config.image.height = Math.round(height * ratio);
        this.config.image.x -= Math.floor((this.config.image.width - width) / 2);
        this.config.image.y -= Math.floor((this.config.image.height - height) / 2);

        this._draw()
    }

    _done() {
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
    }

    _cancel() {
        this._listener(false); //取消事件绑定
        this.elem.classList.add('z-close');
        animationEnd(this.elem, () => {
            document.body.removeChild(this.elem);
            this.elem = null;
        });
    }

    _verifyConfig() {
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
    }

    _reset() {
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
    }

    _draw() {
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
    }

    _getCanvasOffset() {
        let box = this.canvas.getBoundingClientRect();

        let scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
        let scrollLeft = window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft;

        let clientTop = document.documentElement.clientTop || document.body.clientTop || 0;
        let clientLeft = document.documentElement.clientLeft || document.body.clientLeft || 0;

        return {
            x: Math.round(box.left + scrollLeft - clientLeft),
            y: Math.round(box.top + scrollTop - clientTop)
        }
    }

    _getEventXY(e) {
        return (e.touches ? Array.prototype.slice.call(e.touches) : [e]).map((obj) => {
            return {
                x: obj.screenX - this.config.canvas.offset.x,
                y: obj.screenY - this.config.canvas.offset.y
            };
        });
    }

    _getTouchDistance(touch) {
        return touch.length == 2 ? Math.sqrt((touch[1].x - touch[0].x) * (touch[1].x - touch[0].x) + (touch[1].y - touch[0].y) * (touch[1].y - touch[0].y)) : 0;
    }

    _onTouchStart(e) {
        e.stopPropagation();
        e.preventDefault();
        if (!this.image || e.touches && e.touches.length > 2) return; //只允许2个手指和1个手指操作
        var points = this._getEventXY(e);
        this.touch = {
            state: true,
            points: points,
            distance: this._getTouchDistance(points)
        };
    }

    _onTouchMove(e) {
        e.stopPropagation();
        e.preventDefault();
        if (this.touch.state) {
            setTimeout(() => {
                var points = this._getEventXY(e);
                if (!e.touches || (e.touches.length == 1)) { //drag
                    this.config.image.x += points[0].x - this.touch.points[0].x;
                    this.config.image.y += points[0].y - this.touch.points[0].y;
                    this.touch.points[0].x = points[0].x;
                    this.touch.points[0].y = points[0].y;
                    this._draw();
                } else { //zoom
                    let displace = this._getTouchDistance(points) - this.touch.distance;
                    if (Math.abs(displace) > this.options.gap) { //每当间距差到达设置值就触发zoom
                        this.touch.distance += displace;
                        this._zoom(displace > 0);
                    }
                }
            }, 0);
        }
    }

    _onTouchEnd(e) {
        e.stopPropagation();
        if (!this.touch.state) return;
        this.touch.state = false;
    }

    _onResize() {
        let width = this.canvas.clientWidth,
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
            x: Math.floor(width / 2 - (areaWidth / 2)),
            y: Math.floor(height / 2 - (areaHeight / 2)),
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
    }
}
