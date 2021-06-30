function NonameGesture(element, options) {
	this.element = element;
	this.options = options;
	this.point = { x: 0, y: 0 };
	this.point2 = { x: 0, y: 0 };
	this.step = { x: 0, y: 0 };
	this.distance = { x: 0, y: 0 };
	this.lastDistance = { x: 0, y: 0 };
	this.lastMove = { x: 0, y: 0 };
	this.lastCenter = { x: 0, y: 0 };
	this.lastAngle = 0;
	this.lastZoom = 1;
	this.direction = '';
	this.tapCount = 0;
	this.points = [];
	this.tapTimeout = null;
	this.longTapTimeout = null;
	this.rafId = null;
	this.event = {
		hasTriggerSwipe: false
	};
	this.bindEvent();
}
NonameGesture.prototype.init = function () {
	this.bindEvent();
}
NonameGesture.prototype.handleTouchStart = function (e) {
	
}
NonameGesture.prototype.handleTouchMove = function (e) {
	if (this.options.drag) this.options.drag(e);
}
NonameGesture.prototype.handleTouchEnd = function (e) {
	
}
NonameGesture.prototype.handleTouchCancel = function (e) {
	this.tapCount = 0;
}
NonameGesture.prototype.handlePinch = function (point, point2) {
	let totalZoom = this.getDistance(point, point2) / this.getDistance(this.point, this.point2);
	let stepZoom = totalZoom - this.lastZoom;

	let center = this.getCenter(point, point2);
	if (this.lastCenter === null) this.lastCenter = { x: center.x, y: center.y };
	let stepCenter = { x: center.x - this.lastCenter.x, y: center.y - this.lastCenter.y };
	this.lastCenter = center;
	if (this.options.pinch) this.options.pinch({
		x: stepZoom * stepCenter.x,
		y: stepZoom * stepCenter.y,
		totalZoom: totalZoom,
		stepZoom: stepZoom,
		centerX: center.x,
		centerY: center.y,
		stepCenterX: stepCenter.x,
		stepCenterY: stepCenter.y,
		lastZoom: this.lastZoom
	});
	this.lastZoom = totalZoom;
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
NonameGesture.prototype.getImgSize = function (naturalWidth, naturalHeight, containerWidth, containerHeight) {
	const imgRatio = naturalWidth / naturalHeight;
	const containerRatio = containerWidth / containerHeight;
	let width, height;
	// 如果图片实际宽高比例 >= 屏幕宽高比例
	if (imgRatio >= containerRatio) {
		if (naturalWidth > containerWidth) {
			width = containerWidth;
			height = containerWidth / naturalWidth * naturalHeight;
		} else {
			width = naturalWidth;
			height = naturalHeight;
		}
	} else {
		if (naturalHeight > containerHeight) {
			width = containerHeight / naturalHeight * naturalWidth;
			height = containerHeight;
		} else {
			width = naturalWidth;
			height = naturalHeight;
		}
	}
	return { width: width, height: height }
}