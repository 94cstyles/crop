const SUPPORT_ONLY_TOUCH = ('ontouchstart' in window) && /mobile|tablet|ip(ad|hone|od)|android/i.test(navigator.userAgent);

export var supportOnlyTouch = SUPPORT_ONLY_TOUCH;

export default class Tap {
    constructor(el, handler, options) {
        this.opts = Object.assign({
            time: 250,
            posThreshold: 10,
            stop: true,
            prevent: true
        }, options);

        this.el = el;
        this.handler = handler;

        if (SUPPORT_ONLY_TOUCH) {
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

    destroy() {
        if (SUPPORT_ONLY_TOUCH) {
            this.el.removeEventListener('touchstart', this.events.start);
            this.el.removeEventListener('touchend', this.events.end);
        } else {
            this.el.removeEventListener('click', this.handler);
        }
    }

    onTouchStart(e) {
        if (this.opts.stop) e.stopPropagation();
        if (this.opts.prevent) e.preventDefault();

        let touches = e.touches[0];
        this.pageX = touches.pageX;
        this.pageY = touches.pageY;
        this.time = Date.now();
    }

    onTouchEnd(e) {
        //重写currentTarget
        Object.defineProperties(e, {
            "currentTarget": {
                value: this.el,
                writable: true,
                enumerable: true,
                configurable: true
            },
        });

        //目标没有被禁用
        if (!this.el.disabled) {
            let touches = e.changedTouches[0];
            if (
                this.pageX >= touches.pageX - this.opts.posThreshold &&
                this.pageX <= touches.pageX + this.opts.posThreshold &&
                this.pageY >= touches.pageY - this.opts.posThreshold &&
                this.pageY <= touches.pageY + this.opts.posThreshold &&
                this.time + this.opts.time - Date.now() >= 0
            ) {
                e.preventDefault();
                this.handler(e);
            }
        }
    }
}