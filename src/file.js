export default class CropFile {
    constructor(trigger, quality) {
        this._trigger = trigger;
        this.quality = quality / 100; //新图片质量
        this.busy = false; //繁忙状态
        this.canvas = document.createElement('canvas'); //用于获取旋转和裁剪图片 获取dataUrl
        this.ctx = this.canvas.getContext("2d");
    }

    writeFile(file) {
        this.file = {}; //图片缓存
        this.fileKey = ''; //图片缓存key: n e s w
        this.fileName = file.type !== '' && file.name.indexOf('.') !== -1 ? file.name : file.name + '.jpg'; //文件名
        this.angle = 0; //当前图片旋转角度值
        this.mime = file.type || 'image/jpeg'; //mime类型
        this.busy = true;
        this._getImage(file, function(img) {
            this.fileKey = 'n'; //默认key:n 原图
            this.file[this.fileKey] = img; //存入缓存
            this.busy = false;
            this._trigger('_readFile', img);
        });
    }

    cropFile(sourceX, sourceY, sourceWidth, sourceHeight, cropWidth, cropHeight) {
        if (this.file && this.file[this.fileKey]) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.canvas.width = cropWidth;
            this.canvas.height = cropHeight;
            this.ctx.drawImage(this.file[this.fileKey], sourceX, sourceY, sourceWidth, sourceHeight);
            return this.canvas.toDataURL(this.mime, this.quality);
        } else {
            this._trigger('error', -1, '原图丢失, 请重新选择图片!');
        }
    }

    rotate() {
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
                let width = this.angle == 0 || this.angle == 180 ? this.file.n.width : this.file.n.height,
                    height = this.angle == 0 || this.angle == 180 ? this.file.n.height : this.file.n.width;

                //使用canvas.toDataURL重新获取图片
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.canvas.width = width;
                this.canvas.height = height;
                this.ctx.rotate(this.angle * Math.PI / 180);
                this.ctx.drawImage(this.file.n, this.angle == 180 ? -width : this.angle == 270 ? -height : 0, this.angle == 90 ? -width : this.angle == 180 ? -height : 0);

                this._getImage(this.canvas.toDataURL(this.mime, 1), function(img) {
                    this.file[this.fileKey] = img;
                    this.busy = false;
                    this._trigger('_readFile', img);
                });
            }
        } else {
            this._trigger('error', -1, '原图丢失, 请重新选择图片!');
        }
    }

    _getImage(source, callback) {
        var img = new Image();
        if (typeof(source) == "string") {
            img.src = source;
        } else {
            //用FileReader读取file
            var reader = new FileReader();
            reader.onload = function(e) {
                img.src = e.target.result;
            };
            reader.readAsDataURL(source);
        }

        img.addEventListener('load', () => {
            if (img.width == 0 || img.height == 0) {
                this._trigger('error', 3, '文件读取失败, 请重新选择图片!');
            } else {
                callback.call(this, img);
            }
        });
        img.addEventListener('error', function() {
            this._trigger('error', 4, '文件拒绝访问, 请重新选择图片!');
        });
    }
}
