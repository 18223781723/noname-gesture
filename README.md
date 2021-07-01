# noname-gesture
基于JavaScript开发的移动端手势库，支持单击，双击，长按，滑动，拖拽，双指旋转，双指缩放。兼容主流浏览器，上手简单，零依赖。

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
<img id="pinch" src="xxx.png" alt="">

const divDom = document.getElementById('box');
new NonameGesture(divDom, {
	touchStart: function (e) { },
	touchMove: function (e) { },
	touchEnd: function (e) { },
	touchCancel: function (e) { },
	tap: function (e) { },
	singleTap: function (e) { },
	longTap: function (e) { },
	doubleTap: function (e) { },
	drag: function (e) { },
	swipe: function (e) { },
	rotate: function (e) { },
	pinch: function (e) { },
});

const pinchDom = document.getElementById('pinch');

let rotate = 0;
new NonameGesture(rotateDom, {
	rotate: function (e) {
		rotate += e._rotate;
		rotateDom.style.transform = 'rotate(' + rotate + 'deg)';
	}
});

let x = 0, y = 0, scale = 1;
const gesture = new NonameGesture(pinchDom, {
	pinch: function (e) {
		x -= (e._scale - 1) * (e._centerX - x) - (e._scale - 1) * result.width * 0.5 - (e._centerX - e._lastCenterX);
		y -= (e._scale - 1) * (e._centerY - x) - (e._scale - 1) * result.height * 0.5 - (e._centerY - e._lastCenterY);
		pinchDom.style.transform = 'translate3d(' + x + 'px, ' + y + 'px, 0px) scale(' + scale + ')';
	}
});
const result = pinchGesture.getImgSize(pinchDom.naturalWidth, pinchDom.naturalHeight, window.innerWidth, window.innerHeight);
pinchDom.style.width = result.width + 'px';
pinchDom.style.height = result.height + 'px';
pinchDom.style.transform = 'translate3d(' + x + 'px, ' + y + 'px, 0px) scale(1)';
```

# Options
| Params | Type | Defaults | Description |
| :---- | :---- | :---- | :---- |
| element | HTMLElement | null | 绑定事件的元素，必填参数 |
| options | object | null | 配置项 |
| options.touchStart | function | null | touchstart回调函数 |
| options.touchMove | function | null | touchmove回调函数 |
| options.touchEnd | function | null | touchend回调函数 |
| options.touchCancel | function | null | touchcancel回调函数 |
| options.tap | function | null | 单击回调函数 |
| options.singleTap | function | null | 点击回调函数，250ms延时 |
| options.longTap | function | null | 长按回调函数 |
| options.doubleTap | function | null | 双击回调函数，会触发两次tap |
| options.drag | function | null | 拖拽回调函数 |
| options.swipe | function | null | 滑动回调函数 |
| options.rotate | function | null | 双指旋转回调函数 |
| options.pinch | function | null | 双指缩放回调函数 |