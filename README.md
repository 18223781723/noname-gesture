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
<img id="rotate" src="xxx.png" alt="">
const rotateDom = document.getElementById('pinch');
let rotate = 0;
new NonameGesture(rotateDom, {
	rotate: function (e) {
		rotate += e._rotate;
		rotateDom.style.transform = 'rotate(' + rotate + 'deg)';
	}
});

// 双指缩放
<img id="pinch" src="xxx.png" alt="">
const pinchDom = document.getElementById('pinch');
let x = 0, y = 0, scale = 1;
const pinchGesture = new NonameGesture(pinchDom, {
	pinch: function (e) {
		scale *= e._scale;
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