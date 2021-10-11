# noname-gesture
基于JavaScript开发的移动端手势库，支持单击，双击，长按，滑动，拖拽，双指旋转，双指缩放，鼠标滚轮缩放。兼容主流浏览器，上手简单，零依赖。

Demo: http://nonamegesture.codeman.top

![二维码](http://nonamegesture.codeman.top/src/images/qrcode.png)

# Getting Started
In a browser:
```javascript
<script src="path/noname-gesture.js"></script>
```

# Example
```javascript
<div id="box"></div>
const divDom = document.getElementById('box');
const gesture = new NonameGesture(divDom, {
    pointerdown: function (e) { },
    pointermove: function (e) { },
    pointerup: function (e) { },
    pointercancel: function (e) { },
    wheel: function (e) { },
    tap: function (e) { },
    singleTap: function (e) { },
    longTap: function (e) { },
    doubleTap: function (e) { },
    drag: function (e) { },
    swipe: function (e) { },
    rotate: function (e) { },
    pinch: function (e) { }
});

// 双指旋转
<img id="rotateImage" alt="">
const rotateImage = document.getElementById('rotateImage');
let result, x = 0, y = 0, rotate = 0;
// 图片加载成功后再绑定事件
rotateImage.addEventListener('load', function () {
    const rotateGesture = new NonameGesture(rotateImage, {
        rotate: function (e) {
            // transform-origin相对于视口左上角的坐标
            const origin = {
                x: result.width * 0.5 + x,
                y: result.height * 0.5 + y
            };
            // 以双指中心为原点(0, 0)，计算transform-origin的相对坐标
            const a = {
                x: origin.x - e._centerX,
                y: e._centerY - origin.y
            };
            // 计算点a绕双指中心(0, 0)旋转e._rotate度后点b的坐标
            const b = {
                x: (a.x - 0) * Math.cos(e._rotate * Math.PI / 180) + (a.y - 0) * Math.sin(e._rotate * Math.PI / 180) + 0,
                y: (a.x - 0) * Math.sin(e._rotate * Math.PI / 180) - (a.y - 0) * Math.cos(e._rotate * Math.PI / 180) + 0
            }
            rotate = (rotate + e._rotate) % 360;
            x -= a.x - b.x;
            y += a.y + b.y;
            rotateImage.style.transform = 'translate3d(' + x + 'px, ' + y + 'px, 0px) rotate(' + rotate + 'deg)';
        }
    });
    result = rotateGesture.getImgSize(rotateImage.naturalWidth, rotateImage.naturalHeight, window.innerWidth, window.innerHeight);
    rotateImage.style.width = result.width + 'px';
    rotateImage.style.height = result.height + 'px';
    rotateImage.style.transform = 'translate3d(' + x + 'px, ' + y + 'px, 0px) rotate(' + rotate + 'deg)';
});
// 图片赋值需放在load回调之后，因为图片缓存后读取很快，有可能不执行load回调
rotateImage.src = 'xxx.jpg';

// 双指缩放
<img id="pinchImage" src="xxx.png" alt="">
const pinchImage = document.getElementById('pinchImage');
let result, x = 0, y = 0, scale = 1;
pinchImage.addEventListener('load', function () {
    const pinchGesture = new NonameGesture(pinchImage, {
        pinch: function (e) {
            scale *= e._scale;
            const origin = {
                x: (e._scale - 1) * result.width * 0.5,
                y: (e._scale - 1) * result.height * 0.5
            };
            // 以双指中心为缩放原点计算偏移量
            x -= (e._scale - 1) * (e._centerX - x) - origin.x - (e._centerX - e._lastCenterX);
            y -= (e._scale - 1) * (e._centerY - x) - origin.y - (e._centerY - e._lastCenterY);
            pinchImage.style.transform = 'translate3d(' + x + 'px, ' + y + 'px, 0px) scale(' + scale + ')';
        }
    });
    result = pinchGesture.getImgSize(pinchImage.naturalWidth, pinchImage.naturalHeight, window.innerWidth, window.innerHeight);
    pinchImage.style.width = result.width + 'px';
    pinchImage.style.height = result.height + 'px';
    pinchImage.style.transform = 'translate3d(' + x + 'px, ' + y + 'px, 0px) scale(' + scale + ')';
});
pinchImage.src = 'xxx.jpg';
```

# Options
| Params | Type | Defaults | Description |
| :---- | :---- | :---- | :---- |
| element | HTMLElement | null | 绑定事件的元素，必填参数 |
| options | object | null | 配置项 |
| options.pointerdown | function | null | pointerdown回调函数 |
| options.pointermove | function | null | pointermove回调函数 |
| options.pointerup | function | null | pointerup回调函数 |
| options.pointercancel | function | null | pointercancel回调函数 |
| options.wheel | function | null | 鼠标滚轮回调函数 |
| options.tap | function | null | 单击回调函数 |
| options.singleTap | function | null | 点击回调函数，250ms延时 |
| options.longTap | function | null | 长按回调函数 |
| options.doubleTap | function | null | 双击回调函数，会触发两次tap |
| options.drag | function | null | 拖拽回调函数 |
| options.swipe | function | null | 滑动回调函数 |
| options.rotate | function | null | 双指旋转回调函数 |
| options.pinch | function | null | 双指缩放回调函数 |
