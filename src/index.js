import assign from './modules/assign';
import Events from './modules/events';
import CropFile from './file';
import CropCanvas from './canvas';

export default class Crop extends Events {
    constructor(elem, options) {
        super();
        if (!elem || !/input/i.test(elem.tagName) || !/file/i.test(elem.type)) {
            this.trigger('error', 100, '请绑定正确的file标签');
        } else {
            this.elem = elem;
            this.elem.value = null; //清除
            this.file = new CropFile(this.trigger.bind(this), options.quality || 80);
            delete options.quality;
            this.canvas = new CropCanvas(this.trigger.bind(this), Object.assign({
                cropWidth: 200, //裁剪大小
                cropHeight: 200, //裁剪大小
                zoomRatio: 0.1, //缩放比
                gap: 20, //缩放触发值
                borderSize: 1, //裁剪区域border大小
                borderColor: '#fff', //裁剪区域border颜色
                background: 'rgba(0,0,0,.8)' //遮罩层颜色
            }, options));

            this._bindEvents();
            this._bindFileChange();
        }
    }

    _bindEvents() {
        this.on('_readFile', (file) => {
            this.elem.value = null;
            this.canvas.setImage(file);
        }).on('_rotate', () => {
            this.file.rotate();
        }).on('_crop', (sourceX, sourceY, sourceWidth, sourceHeight, cropWidth, cropHeight) => {
            var file = this.file.cropFile(sourceX, sourceY, sourceWidth, sourceHeight, cropWidth, cropHeight);
            this.trigger('crop', file, this.file.fileName);
        });
    }

    _bindFileChange() {
        this.elem.addEventListener('change', (e) => {
            if (!this.file.busy) {
                if (e.target.files) {
                    //有些低端机图片类型为空
                    if (e.target.files[0].type == '' || /image\/(jpeg|png|gif|bmp|tiff)/.test(e.target.files[0].type)) {
                        this.file.writeFile(e.target.files[0]);
                    } else {
                        this.trigger('error', 2, '请上传正确格式的图片, 仅支持[jpeg,png,gif,bmp,tiff)格式的图片!');
                    }
                } else {
                    this.trigger('error', 1, '浏览器缺陷, 不支持FileList!');
                }
            } else {
                this.trigger('error', 1, '请勿重复操作。');
            }
        });
    }
}
