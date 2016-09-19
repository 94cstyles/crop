const SUPPORT_ONLY_TOUCH = ('ontouchstart' in window) && /mobile|tablet|ip(ad|hone|od)|android/i.test(navigator.userAgent);

export default class Tap {
    constructor(elem, handler) {
        this.elem = elem;
        this.handler = handler;

        if (SUPPORT_ONLY_TOUCH) {
            this.events = {
                touchStart: this.onTouchStart.bind(this),
                touchMove: this.onTouchMove.bind(this),
                touchEnd: this.onTouchEnd.bind(this),
                click: function (e) {
                    e.stopPropagation();
                }
            };
            this.cachedX = null;
            this.cachedY = null;
            this.currX = null;
            this.currY = null;
            this.time = null;
            elem.addEventListener('touchstart', this.events.touchStart, false);
            elem.addEventListener('touchmove', this.events.touchMove, false);
            elem.addEventListener('touchend', this.events.touchEnd, false);
            elem.addEventListener('click', this.events.click, false);
        } else {
            elem.addEventListener('click', handler, false);
        }
    }

    onTouchStart(e) {
        if (e.touches.length > 1) return;
        this.cachedX = this.currX = e.touches[0].pageX;
        this.cachedY = this.currY = e.touches[0].pageY;
        this.time = Date.now();
    }

    onTouchMove(e) {
        if (this.cachedX == null) return;
        this.currX = e.touches[0].pageX;
        this.currY = e.touches[0].pageY;
    }

    onTouchEnd(e) {
        if (this.cachedX == null) return;
        if (
            this.cachedX >= this.currX - 30 &&
            this.cachedX <= this.currX + 30 &&
            this.cachedY >= this.currY - 30 &&
            this.cachedY <= this.currY + 30 &&
            this.time + 250 - Date.now() >= 0
        ) {
            e.preventDefault();
            this.handler();
        }
        this.cachedX = null;
    }

    destroy() {
        if (SUPPORT_ONLY_TOUCH) {
            this.elem.removeEventListener('touchstart', this.events.touchStart);
            this.elem.removeEventListener('touchmove', this.events.touchMove);
            this.elem.removeEventListener('touchend', this.events.touchEnd);
            this.elem.removeEventListener('click', this.events.click);
        } else {
            this.elem.removeEventListener('click', this.handler);
        }
    }
}