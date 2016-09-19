# crop
> 移动web处理图片上传预览裁剪插件, 使用**Canvas**和**FileReader**来进行处理, 最终返回dataUrl, 不需要后端进行再次处理。

## 文档说明
```html
<div>
    <img id="js_img" src=""/>
    <input id="js_file" type="file" accept="image/*">
</div>
```
```javascript
var crop = new Crop(document.getElementById('js_file'), {
    cropWidth: 200, //裁剪大小
    cropHeight: 200, //裁剪大小
    quality: 80, //新图质量 [1-100]
    zoomRatio: 0.1, //缩放比
    gap: 20, //缩放触发值
    borderSize: 1, //裁剪区域border大小
    borderColor: '#fff', //裁剪区域border颜色
    background: 'rgba(0,0,0,.8)' //遮罩层颜色
});
crop.on('error', function (code, msg) {
    console.log(arguments);
}).on('crop', function (file, fileName) {
    document.getElementById('js_img').src = file;
});
```
**扩展**: [如何压缩 HTTP 请求正文](https://imququ.com/post/how-to-compress-http-request-body.html?utm_source=tuicool&utm_medium=referral)

## 浏览器支持

![Chrome](https://raw.github.com/alrra/browser-logos/master/chrome/chrome_48x48.png) | ![Firefox](https://raw.github.com/alrra/browser-logos/master/firefox/firefox_48x48.png) | ![IE](https://raw.github.com/alrra/browser-logos/master/internet-explorer/internet-explorer_48x48.png) | ![Opera](https://raw.github.com/alrra/browser-logos/master/opera/opera_48x48.png) | ![Safari](https://raw.github.com/alrra/browser-logos/master/safari/safari_48x48.png)
--- | --- | --- | --- | --- |
Latest ✔ | Latest ✔ | 10+ ✔ | Latest ✔ | Latest ✔ |