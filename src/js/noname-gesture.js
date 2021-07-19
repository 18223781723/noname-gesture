/**
 * 使用PointerEvent实现的手势库
 * @param {HTMLElement} element
 * @param {object} options
 */
function NonameGesture(element, options) {
	this.element = element; // 绑定事件的元素
	this.options = options; // 配置项
	this.point = { x: 0, y: 0 }; // 第一根手指位置
	this.point2 = { x: 0, y: 0 }; // 第二根手指位置
	this.lastPoint = { x: 0, y: 0 }; // 上一次手指位置
	this.distance = { x: 0, y: 0 }; // 移动距离
	this.lastDistance = { x: 0, y: 0 }; // 上一次移动距离
	this.lastMove = { x: 0, y: 0 }; // 上一次移动位置
	this.lastCenter = { x: 0, y: 0 }; // 上一次中心位置
	this.lastRotate = 0; // 上一次旋转角度
	this.lastScale = 1; // 上一次缩放比例
	this.tapCount = 0; // 点击计数器
	this.points = []; // 移动位置数组 长度20 用于计算是否触发swipe
	this.pointers = []; // 触摸点数组
	this.dragDirection = ''; // 拖拽方向
	this.isPointerDown = false; // 按下标识
	this.singleTapTimeout = null;
	this.longTapTimeout = null;
	this.rafId = null; // 动画id 用于停止动画
	this.bindEventListener();
}
/**
 * 处理pointerdown
 * @param {PointerEvent} e 
 */
NonameGesture.prototype.handlePointerDown = function (e) {
	// 禁止拖拽图片
	e.preventDefault();
	if (e.button !== 0) { return; }
	this.element.setPointerCapture(e.pointerId);
	this.isPointerDown = true;
	this.dragDirection = '';
	this.points = [];
	this.pointers.push(e);
	this.point = { x: this.pointers[0].clientX, y: this.pointers[0].clientY };
	if (this.pointers.length === 1) {
		this.tapCount++;
		clearTimeout(this.singleTapTimeout);
		this.distance = { x: 0, y: 0 };
		this.lastMove = { x: this.pointers[0].clientX, y: this.pointers[0].clientY };
		// 双击两次距离不超过30
		if (this.tapCount > 1) {
			if (Math.abs(this.point.x - this.lastPoint.x) > 30 || Math.abs(this.point.y - this.lastPoint.y) > 30) {
				this.tapCount = 1;
			}
		}
		if (this.tapCount === 1) {
			// 按住500ms触发长按事件
			this.longTapTimeout = setTimeout(() => {
				this.tapCount = 0;
				if (this.options.longTap) {
					this.options.longTap();
				}
			}, 500);
		}
	} else if (this.pointers.length === 2) {
		this.tapCount = 0;
		clearTimeout(this.longTapTimeout);
		this.point2 = { x: this.pointers[1].clientX, y: this.pointers[1].clientY };
		this.lastDistance = { x: this.distance.x, y: this.distance.y };
		this.lastCenter = this.getCenter(this.point, this.point2);
		this.lastRotate = 0;
		this.lastScale = 1;
	}
	this.lastPoint = { x: this.point.x, y: this.point.y };
	if (this.options.pointerDown) {
		this.options.pointerDown(e);
	}
}
/**
 * 处理pointermove
 * @param {PointerEvent} e
 */
NonameGesture.prototype.handlePointerMove = function (e) {
	if (!this.isPointerDown) { return; }
	this.handlePointers(e, 'update');
	const current = { x: this.pointers[0].clientX, y: this.pointers[0].clientY };
	if (this.pointers.length === 1) {
		this.distance = { x: current.x - this.point.x + this.lastDistance.x, y: current.y - this.point.y + this.lastDistance.y };
		// 偏移量大于10表示移动
		if (Math.abs(this.distance.x) > 10 || Math.abs(this.distance.y) > 10) {
			this.tapCount = 0;
			clearTimeout(this.longTapTimeout);
			if (this.dragDirection === '') {
				this.dragDirection = this.getDragDirection();
			}
		}
		this.points.unshift({ x: current.x, y: current.y, timeStamp: e.timeStamp });
		if (this.points.length > 20) {
			this.points.pop();
		}
		// drag
		this.handleDrag(e, current);
		this.lastMove = { x: current.x, y: current.y };
	} else if (this.pointers.length === 2) {
		const current2 = { x: this.pointers[1].clientX, y: this.pointers[1].clientY };
		// rotate
		this.handleRotate(e, current, current2);
		// pinch
		this.handlePinch(e, current, current2);
	}
	if (this.options.pointerMove) {
		this.options.pointerMove(e);
	}
}
/**
 * 处理pointerup
 * @param {PointerEvent} e
 */
NonameGesture.prototype.handlePointerUp = function (e) {
	if (!this.isPointerDown) { return; }
	this.handlePointers(e, 'delete');
	if (this.pointers.length === 0) {
		this.isPointerDown = false;
		e._hasTriggerSwipe = false;
		clearTimeout(this.longTapTimeout);
		if (this.tapCount === 0) {
			this.handleSwipe(e);
		} else {
			if (this.options.tap) {
				this.options.tap();
			}
			if (this.tapCount === 1) {
				this.singleTapTimeout = setTimeout(() => {
					this.tapCount = 0;
					if (this.options.singleTap) {
						this.options.singleTap();
					}
				}, 250);
			} else if (this.tapCount > 1) {
				this.tapCount = 0;
				if (this.options.doubleTap) {
					this.options.doubleTap();
				}
			}
		}
	} else if (this.pointers.length === 1) {
		this.point = { x: this.pointers[0].clientX, y: this.pointers[0].clientY };
		this.lastMove = { x: this.pointers[0].clientX, y: this.pointers[0].clientY };
	}
	e._distanceX = this.distance.x;
	e._distanceY = this.distance.y;
	if (this.options.pointerUp) {
		this.options.pointerUp(e);
	}
}
/**
 * 处理pointercancel
 * @param {PointerEvent} e
 */
NonameGesture.prototype.handlePointerCancel = function (e) {
	this.isPointerDown = false;
	this.tapCount = 0;
	clearTimeout(this.longTapTimeout);
	this.pointers = [];
	if (this.options.pointerCancel) {
		this.options.pointerCancel(e);
	}
}
/**
 * 更新或删除指针
 * @param {PointerEvent} e
 * @param {string} type
 */
NonameGesture.prototype.handlePointers = function (e, type) {
	for (let i = 0; i < this.pointers.length; i++) {
		if (this.pointers[i].pointerId === e.pointerId) {
			if (type === 'update') {
				this.pointers[i] = e;
			} else if (type === 'delete') {
				this.pointers.splice(i, 1);
			}
		}
	}
}
/**
 * 获取拖拽方向
 * @returns 
 */
NonameGesture.prototype.getDragDirection = function () {
	let dragDirection = '';
	if (Math.abs(this.distance.x) > Math.abs(this.distance.y)) {
		dragDirection = this.distance.x > 0 ? 'right' : 'left';
	} else {
		dragDirection = this.distance.y > 0 ? 'down' : 'up';
	}
	return dragDirection;
}
/**
 * 处理拖拽
 * @param {PointerEvent} e
 * @param {object} point
 */
NonameGesture.prototype.handleDrag = function (e, point) {
	e._dragDirection = this.dragDirection;
	e._diffX = point.x - this.lastMove.x;
	e._diffY = point.y - this.lastMove.y;
	e._distanceX = point.x - this.point.x + this.lastDistance.x;
	e._distanceY = point.y - this.point.y + this.lastDistance.y;
	if (this.options.drag) {
		this.options.drag(e);
	}
}
/**
 * 处理swipe
 * @param {PointerEvent} e
 */
NonameGesture.prototype.handleSwipe = function (e) {
	let x, y;
	// 如果200ms内移动距离大于20
	for (const item of this.points) {
		if (e.timeStamp - item.timeStamp > 200) break;
		x = e.clientX - item.x;
		y = e.clientY - item.y;
	}
	if (Math.abs(x) > 20) {
		e._swipeDirection = x > 0 ? 'right' : 'left';
		e._hasTriggerSwipe = true;
	} else if (Math.abs(y) > 20) {
		e._swipeDirection = y > 0 ? 'down' : 'up';
		e._hasTriggerSwipe = true;
	}
	if (e._hasTriggerSwipe && this.options.swipe) {
		this.options.swipe(e);
	}
}
/**
 * 处理rotate
 * @param {PointerEvent} e
 * @param {object} point
 * @param {object} point2
 */
NonameGesture.prototype.handleRotate = function (e, point, point2) {
	let rotate = this.getAngle(point, point2) - this.getAngle(this.point, this.point2);
	e._rotate = rotate - this.lastRotate;
	this.lastRotate = rotate;
	if (this.options.rotate) {
		this.options.rotate(e);
	}
}
/**
 * 处理pinch
 * @param {PointerEvent} e
 * @param {object} point
 * @param {object} point2
 */
NonameGesture.prototype.handlePinch = function (e, point, point2) {
	let scale = this.getDistance(point, point2) / this.getDistance(this.point, this.point2);
	let center = this.getCenter(point, point2);
	e._scale = scale / this.lastScale;
	e._centerX = center.x;
	e._centerY = center.y;
	e._lastCenterX = this.lastCenter.x;
	e._lastCenterY = this.lastCenter.y;
	this.lastCenter = center;
	this.lastScale = scale;
	if (this.options.pinch) {
		this.options.pinch(e);
	}
}
/**
 * 绑定事件
 */
NonameGesture.prototype.bindEventListener = function () {
	this.handlePointerDown = this.handlePointerDown.bind(this);
	this.handlePointerMove = this.handlePointerMove.bind(this);
	this.handlePointerUp = this.handlePointerUp.bind(this);
	this.handlePointerCancel = this.handlePointerCancel.bind(this);
	this.element.addEventListener('pointerdown', this.handlePointerDown);
	this.element.addEventListener('pointermove', this.handlePointerMove);
	this.element.addEventListener('pointerup', this.handlePointerUp);
	this.element.addEventListener('pointercancel', this.handlePointerCancel);
}
/**
 * 解绑事件
 */
NonameGesture.prototype.unbindEventListener = function () {
	this.element.removeEventListener('pointerdown', this.handlePointerDown);
	this.element.removeEventListener('pointermove', this.handlePointerMove);
	this.element.removeEventListener('pointerup', this.handlePointerUp);
	this.element.removeEventListener('pointercancel', this.handlePointerCancel);
}
/**
 * 销毁
 */
NonameGesture.prototype.destroy = function () {
	this.unbindEventListener();
}
/**
 * 获取旋转角度
 * @param {object} point 
 * @param {object} point2 
 * @returns 
 */
NonameGesture.prototype.getAngle = function (point, point2) {
	const x = point.x - point2.x;
	const y = point.y - point2.y;
	return Math.atan2(y, x) * 180 / Math.PI;
}
/**
 * 获取两点距离
 * @param {object} point
 * @param {object} point2
 * @returns
 */
NonameGesture.prototype.getDistance = function (point, point2) {
	const x = point.x - point2.x;
	const y = point.y - point2.y;
	return Math.hypot(x, y); // Math.sqrt(x * x + y * y);
}
/**
 * 获取两点中心点
 * @param {object} point
 * @param {object} point2
 * @returns
 */
NonameGesture.prototype.getCenter = function (point, point2) {
	const x = (point.x + point2.x) / 2;
	const y = (point.y + point2.y) / 2;
	return { x: x, y: y }
}
/**
 * 获取图片缩放尺寸
 * @param {number} naturalWidth 
 * @param {number} naturalHeight 
 * @param {number} maxWidth 
 * @param {number} maxHeight 
 * @returns 
 */
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
/**
 * 减速动画函数
 * @param {number} from 
 * @param {number} to 
 * @param {number} time 
 * @param {number} duration 
 * @returns 
 */
NonameGesture.prototype.easeOut = function (from, to, time, duration) {
	let change = to - from;
	return -change * (time /= duration) * (time - 2) + from;
}
/**
 * 动画
 * @param {function} func 
 * @param {number} duration
 */
NonameGesture.prototype.raf = function (func, duration = 300) {
	const self = this;
	let startTime;
	let count = 0;
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