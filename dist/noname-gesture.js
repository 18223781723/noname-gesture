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
	this.point = { x: e.touches[0].clientX, y: e.touches[0].clientY };
	this.lastMove = { x: e.touches[0].clientX, y: e.touches[0].clientY };
	this.event.hasTriggerSwipe = false;
	if (e.touches.length === 1) {
		this.points = [];
		this.tapCount++;
		clearTimeout(this.tapTimeout);
		if (this.tapCount === 1) {
			this.longTapTimeout = setTimeout(() => {
				this.tapCount = 0;
				if (this.options.longTap) this.options.longTap();
			}, 500);
		}
	} else if (e.touches.length === 2) {
		this.tapCount = 0;
		clearTimeout(this.longTapTimeout);
		this.point2 = { x: e.touches[1].clientX, y: e.touches[1].clientY };
		this.lastAngle = 0;
		this.lastZoom = 1;
		this.lastCenter = null;
	}
	if (this.options.touchStart) this.options.touchStart(e);
}
NonameGesture.prototype.handleTouchMove = function (e) {
	const point = { x: e.touches[0].clientX, y: e.touches[0].clientY };
	if (e.touches.length === 1) {
		this.step = { x: point.x - this.lastMove.x, y: point.y - this.lastMove.y };
		this.lastMove = { x: point.x, y: point.y };
		this.distance = { x: point.x - this.point.x + this.lastDistance.x, y: point.y - this.point.y + this.lastDistance.y };
		// 由于手指目标相对较大，偏移量<10认定为没有移动
		if (Math.abs(this.distance.x) > 10 || Math.abs(this.distance.y) > 10) {
			this.tapCount = 0;
			clearTimeout(this.longTapTimeout);
			if (this.points.length === 20) this.points.pop();
			this.points.unshift({ x: point.x, y: point.y, timeStamp: e.timeStamp });
			if (this.options.move) {
				this.options.move({ distance: { x: this.distance.x, y: this.distance.y }, step: { x: this.step.x, y: this.step.y } });
			}
		}
	} else if (e.touches.length === 2) {
		const point2 = { x: e.touches[1].clientX, y: e.touches[1].clientY };
		// rotate
		let totalAngle = this.getAngle(point, point2) - this.getAngle(this.point, this.point2);
		let stepAngle = totalAngle - this.lastAngle;
		this.lastAngle = totalAngle;
		if (this.options.rotate) this.options.rotate(totalAngle, stepAngle);
		// pinch
		this.handlePinch(point, point2);
	}
	if (this.options.touchMove) this.options.touchMove(e);
	e.preventDefault();
}
NonameGesture.prototype.handleTouchEnd = function (e) {
	if (e.touches.length === 0) {
		clearTimeout(this.longTapTimeout);
		if (this.tapCount === 0) {
			const swipeDistance = { x: 0, y: 0 };
			const SWIPE_DISTANCE = 30;

			let direction = '';
			for (const item of this.points) {
				if (e.timeStamp - item.timeStamp > 250) break;
				swipeDistance.x = e.changedTouches[0].clientX - item.x;
				swipeDistance.y = e.changedTouches[0].clientY - item.y;
			}
			if (Math.abs(swipeDistance.x) > SWIPE_DISTANCE) {
				if (swipeDistance.x > 0) {
					direction = 'right';
				} else {
					direction = 'left'
				}
				this.event.hasTriggerSwipe = true;
				if (this.options.swipe) this.options.swipe(direction);
			} else if (Math.abs(swipeDistance.y) > SWIPE_DISTANCE) {
				if (swipeDistance.y > 0) {
					direction = 'down';
				} else {
					direction = 'up'
				}
				this.event.hasTriggerSwipe = true;
				if (this.options.swipe) this.options.swipe(direction);
			}
		} else if (this.tapCount === 1) {
			this.tapTimeout = setTimeout(() => {
				this.tapCount = 0;
				if (this.options.tap) this.options.tap();
			}, 250);
		} else if (this.tapCount > 1) {
			this.tapCount = 0;
			if (this.options.doubleTap) this.options.doubleTap();
		}
	} else if (e.touches.length === 1) {
		this.point = { x: e.touches[0].clientX, y: e.touches[0].clientY };
		this.lastMove = { x: e.touches[0].clientX, y: e.touches[0].clientY };
		this.lastDistance = { x: this.distance.x, y: this.distance.y };
	}

	this.event.distance = { x: this.distance.x, y: this.distance.y }
	if (this.options.touchEnd) this.options.touchEnd(e, this.event);
	e.preventDefault();
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
		lastZoom:this.lastZoom
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