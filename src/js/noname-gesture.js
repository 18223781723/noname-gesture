function NonameGesture(element, options) {
	this.element = element; // 绑定事件的元素
	this.options = options; // 配置项
	this.point = { x: 0, y: 0 }; // 第一根手指位置
	this.point2 = { x: 0, y: 0 }; // 第二根手指位置
	this.distance = { x: 0, y: 0 }; // 移动距离
	this.lastDistance = { x: 0, y: 0 }; // 上一次移动距离
	this.lastMove = { x: 0, y: 0 }; // 上一次移动位置
	this.lastCenter = { x: 0, y: 0 }; // 上一次中心位置
	this.lastRotate = 0; // 上一次旋转角度
	this.lastScale = 1; // 上一次缩放比例
	this.tapCount = 0; // 点击计数器
	this.points = []; // 移动位置数组
	this.singleTapTimeout = null;
	this.longTapTimeout = null;
	this.rafId = null; // 动画id
	this.event = {
		direction: '', // 滑动方向 left right up down
		stepX: 0, // x轴移动步长
		stepY: 0, // y轴移动步长
		distanceX: 0, // x轴移动距离
		distanceY: 0, // y轴移动距离
		rotate: 0, // 旋转角度 正值顺时针旋转，负值逆时针旋转
		scale: 1, // 缩放倍数 大于1放大，小于1缩小
		hasTriggerSwipe: false // 是否触发swipe
	};
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
	this.event = {
		direction: '',
		stepX: 0,
		stepY: 0,
		distanceX: 0,
		distanceY: 0,
		rotate: 0,
		scale: 1,
		hasTriggerSwipe: false
	};
	if (e.touches.length === 1) {
		this.points = [];
		this.tapCount++;
		clearTimeout(this.singleTapTimeout);
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
		this.lastRotate = 0;
		this.lastScale = 1;
		this.lastCenter = null;
	}
	if (this.options.touchStart) this.options.touchStart(e);
}
NonameGesture.prototype.handleTouchMove = function (e) {
	const point = { x: e.touches[0].clientX, y: e.touches[0].clientY };
	if (e.touches.length === 1) {
		this.distance = { x: point.x - this.point.x + this.lastDistance.x, y: point.y - this.point.y + this.lastDistance.y };
		this.tapCount = 0;
		clearTimeout(this.longTapTimeout);
		if (this.points.length === 20) this.points.pop();
		this.points.unshift({ x: point.x, y: point.y, timeStamp: e.timeStamp });
		this.event.stepX = point.x - this.lastMove.x;
		this.event.stepY = point.y - this.lastMove.y;
		this.event.distanceX = point.x - this.point.x + this.lastDistance.x;
		this.event.distanceY = point.y - this.point.y + this.lastDistance.y;
		if (this.options.drag) this.options.drag(e, this.event);
		this.lastMove = { x: point.x, y: point.y };
	} else if (e.touches.length === 2) {
		const point2 = { x: e.touches[1].clientX, y: e.touches[1].clientY };
		// rotate
		let totalAngle = this.getAngle(point, point2) - this.getAngle(this.point, this.point2);
		let stepAngle = totalAngle - this.lastRotate;
		this.lastRotate = totalAngle;
		if (this.options.rotate) this.options.rotate(totalAngle, stepAngle);
		// pinch
		this.handlePinch(point, point2);
		e.preventDefault();
	}
	if (this.options.touchMove) this.options.touchMove(e);

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
	this.event.distance = { x: this.distance.x, y: this.distance.y }
	if (this.options.touchEnd) this.options.touchEnd(e, this.event);
}
NonameGesture.prototype.handleTouchCancel = function (e) {
	this.tapCount = 0;
}
NonameGesture.prototype.handlePinch = function (point, point2) {
	let totalZoom = this.getDistance(point, point2) / this.getDistance(this.point, this.point2);
	let stepZoom = totalZoom / this.lastScale;

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
		lastScale: this.lastScale
	});
	this.lastScale = totalZoom;
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