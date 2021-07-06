function NonameGesture(element, options) {
	this.element = element; // 绑定事件的元素
	this.options = options; // 配置项
	this.point = { x: 0, y: 0 }; // 第一根手指位置
	this.point2 = { x: 0, y: 0 }; // 第二根手指位置
	this.lastPoint = { x: 0, y: 0 }; // 上一次单击位置
	this.distance = { x: 0, y: 0 }; // 移动距离
	this.lastDistance = { x: 0, y: 0 }; // 上一次移动距离
	this.lastMove = { x: 0, y: 0 }; // 上一次移动位置
	this.lastCenter = { x: 0, y: 0 }; // 上一次中心位置
	this.lastRotate = 0; // 上一次旋转角度
	this.lastScale = 1; // 上一次缩放比例
	this.tapCount = 0; // 点击计数器
	this.points = []; // 移动位置数组
	this.dragDirection = ''; // 拖拽方向
	this.singleTapTimeout = null;
	this.longTapTimeout = null;
	this.rafId = null; // 动画id
	this.init();
}
/**
 * 初始化
 */
NonameGesture.prototype.init = function () {
	this.bindEvent();
}
NonameGesture.prototype.handleTouchStart = function (e) {
	this.point = { x: e.touches[0].clientX, y: e.touches[0].clientY };
	this.lastMove = { x: e.touches[0].clientX, y: e.touches[0].clientY };
	this.dragDirection = '';
	this.points = [];
	if (e.touches.length === 1) {
		this.tapCount++;
		clearTimeout(this.singleTapTimeout);
		if (this.tapCount === 1) {
			this.longTapTimeout = setTimeout(() => {
				this.tapCount = 0;
				if (this.options.longTap) this.options.longTap();
			}, 500);
		}
		if (this.tapCount > 1) {
			if (Math.abs(this.point.x - this.lastPoint.x) > 30 || Math.abs(this.point.y - this.lastPoint.y) > 30) {
				this.tapCount = 1;
			}
		}
	} else if (e.touches.length === 2) {
		this.tapCount = 0;
		clearTimeout(this.longTapTimeout);
		this.point2 = { x: e.touches[1].clientX, y: e.touches[1].clientY };
		this.lastRotate = 0;
		this.lastScale = 1;
		this.lastCenter = null;
	}
	this.lastPoint = { x: this.point.x, y: this.point.y };
	if (this.options.touchStart) this.options.touchStart(e);
}
NonameGesture.prototype.handleTouchMove = function (e) {
	const point = { x: e.touches[0].clientX, y: e.touches[0].clientY };
	if (e.touches.length === 1) {
		this.distance = { x: point.x - this.point.x + this.lastDistance.x, y: point.y - this.point.y + this.lastDistance.y };
		this.tapCount = 0;
		clearTimeout(this.longTapTimeout);
		// swipe
		if (this.points.length === 20) this.points.pop();
		this.points.unshift({ x: point.x, y: point.y, timeStamp: e.timeStamp });
		// drag
		if (this.dragDirection === '') {
			if (Math.abs(this.distance.x) > 10 || Math.abs(this.distance.y) > 10) {
				if (Math.abs(this.distance.x) > Math.abs(Math.abs(this.distance.y))) {
					this.dragDirection = 'left';
					if (this.distance.x > 0) {
						this.dragDirection = 'right';
					}
				} else {
					this.dragDirection = 'up';
					if (this.distance.y > 0) {
						this.dragDirection = 'down';
					}
				}
			}
		}
		e._stepX = point.x - this.lastMove.x;
		e._stepY = point.y - this.lastMove.y;
		e._distanceX = point.x - this.point.x + this.lastDistance.x;
		e._distanceY = point.y - this.point.y + this.lastDistance.y;
		e._dragDirection = this.dragDirection;
		if (this.options.drag) this.options.drag(e);
		this.lastMove = { x: point.x, y: point.y };
	} else if (e.touches.length === 2) {
		const point2 = { x: e.touches[1].clientX, y: e.touches[1].clientY };
		// rotate
		this.handleRotate(e, point, point2);
		if (this.options.rotate) this.options.rotate(e);
		// pinch
		this.handlePinch(e, point, point2);
		if (this.options.pinch) this.options.pinch(e);
	}
	if (this.options.touchMove) this.options.touchMove(e);

}
NonameGesture.prototype.handleTouchEnd = function (e) {
	if (e.touches.length === 0) {
		clearTimeout(this.longTapTimeout);
		if (this.tapCount === 0) {
			this.handleSwipe(e);
		} else {
			if (this.options.tap) this.options.tap();
			if (this.tapCount === 1) {
				this.singleTapTimeout = setTimeout(() => {
					this.tapCount = 0;
					if (this.options.singleTap) this.options.singleTap();
				}, 250);
			} else if (this.tapCount > 1) {
				this.tapCount = 0;
				if (this.options.doubleTap) this.options.doubleTap();
			}
		}
	} else if (e.touches.length === 1) {
		this.point = { x: e.touches[0].clientX, y: e.touches[0].clientY };
		this.lastMove = { x: e.touches[0].clientX, y: e.touches[0].clientY };
		this.lastDistance = { x: this.distance.x, y: this.distance.y };
	}
	e._distanceX = this.distance.x;
	e._distanceY = this.distance.y;
	if (this.options.touchEnd) this.options.touchEnd(e);
}
NonameGesture.prototype.handleTouchCancel = function (e) {
	this.tapCount = 0;
}
NonameGesture.prototype.handleSwipe = function (e) {
	const swipeDistance = { x: 0, y: 0 };
	const SWIPE_DISTANCE = 20;
	e._hasTriggerSwipe = false;
	for (const item of this.points) {
		if (e.timeStamp - item.timeStamp > 250) break;
		swipeDistance.x = e.changedTouches[0].clientX - item.x;
		swipeDistance.y = e.changedTouches[0].clientY - item.y;
	}
	if (Math.abs(swipeDistance.x) > SWIPE_DISTANCE) {
		if (swipeDistance.x > 0) {
			e._swipeDirection = 'right';
		} else {
			e._swipeDirection = 'left'
		}
		e._hasTriggerSwipe = true;
		if (this.options.swipe) this.options.swipe(e);
	} else if (Math.abs(swipeDistance.y) > SWIPE_DISTANCE) {
		if (swipeDistance.y > 0) {
			e._swipeDirection = 'down';
		} else {
			e._swipeDirection = 'up'
		}
		e._hasTriggerSwipe = true;
		if (this.options.swipe) this.options.swipe(e);
	}
}
NonameGesture.prototype.handleRotate = function (e, point, point2) {
	let rotate = this.getAngle(point, point2) - this.getAngle(this.point, this.point2);
	e._rotate = rotate - this.lastRotate;
	this.lastRotate = rotate;
}
NonameGesture.prototype.handlePinch = function (e, point, point2) {
	let scale = this.getDistance(point, point2) / this.getDistance(this.point, this.point2);
	e._scale = scale / this.lastScale;
	let center = this.getCenter(point, point2);
	if (this.lastCenter === null) this.lastCenter = { x: center.x, y: center.y };
	e._centerX = center.x;
	e._centerY = center.y;
	e._lastCenterX = this.lastCenter.x;
	e._lastCenterY = this.lastCenter.y;
	this.lastCenter = center;
	this.lastScale = scale;
}
NonameGesture.prototype.bindEvent = function () {
	this.handleTouchStart = this.handleTouchStart.bind(this);
	this.handleTouchMove = this.handleTouchMove.bind(this);
	this.handleTouchEnd = this.handleTouchEnd.bind(this);
	this.handleTouchCancel = this.handleTouchCancel.bind(this);
	this.element.addEventListener('touchstart', this.handleTouchStart);
	this.element.addEventListener('touchmove', this.handleTouchMove);
	this.element.addEventListener('touchend', this.handleTouchEnd);
	this.element.addEventListener('touchcancel', this.handleTouchCancel);
}
NonameGesture.prototype.unbindEvent = function () {
	this.element.removeEventListener('touchstart', this.handleTouchStart);
	this.element.removeEventListener('touchmove', this.handleTouchMove);
	this.element.removeEventListener('touchend', this.handleTouchEnd);
	this.element.removeEventListener('touchcancel', this.handleTouchCancel);
}
NonameGesture.prototype.destroy = function () {
	this.unbindEvent();
}
NonameGesture.prototype.easeOut = function (from, to, time, duration) {
	let change = to - from;
	return -change * (time /= duration) * (time - 2) + from;
}
NonameGesture.prototype.raf = function (func) {
	const self = this;
	let startTime;
	let count = 0;
	let duration = 300;
	function step(timestamp) {
		if (startTime === undefined) {
			startTime = timestamp;
		}
		let time = timestamp - startTime;
		if (time > duration) {
			time = duration;
			count++;
		}
		if (count <= 1) {
			func(time);
			self.rafId = window.requestAnimationFrame(step);
		}
	}
	this.rafId = window.requestAnimationFrame(step);
}
NonameGesture.prototype.getAngle = function (point, point2) {
	const x = point2.x - point.x;
	const y = point2.y - point.y;
	return Math.atan2(y, x) * 180 / Math.PI;
}
NonameGesture.prototype.getDistance = function (point, point2) {
	const x = point2.x - point.x;
	const y = point2.y - point.y;
	return Math.hypot(x, y); // Math.sqrt(x * x + y * y);
}
NonameGesture.prototype.getCenter = function (point, point2) {
	const x = (point.x + point2.x) / 2;
	const y = (point.y + point2.y) / 2;
	return { x: x, y: y }
}
NonameGesture.prototype.getImgSize = function (naturalWidth, naturalHeight, maxWidth, maxHeight) {
	const imgRatio = naturalWidth / naturalHeight;
	const maxRatio = maxWidth / maxHeight;
	let width, height;
	// 如果图片实际宽高比例 >= 屏幕宽高比例
	if (imgRatio >= maxRatio) {
		if (naturalWidth > maxWidth) {
			width = maxWidth;
			height = maxWidth / naturalWidth * naturalHeight;
		} else {
			width = naturalWidth;
			height = naturalHeight;
		}
	} else {
		if (naturalHeight > maxHeight) {
			width = maxHeight / naturalHeight * naturalWidth;
			height = maxHeight;
		} else {
			width = naturalWidth;
			height = naturalHeight;
		}
	}
	return { width: width, height: height }
}