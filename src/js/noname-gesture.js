/**
 * 使用PointerEvent实现的手势库
 * @param {HTMLElement} element 绑定事件的元素
 * @param {object} options 配置项
 */
function NonameGesture(element, options) {
	this.element = element; // 绑定事件的元素
	this.options = options; // 配置项
	this.point1 = { x: 0, y: 0 }; // 第一个触摸点位置
	this.point2 = { x: 0, y: 0 }; // 第二个触摸点位置
	this.lastPoint1 = { x: 0, y: 0 }; // 上一次第一个触摸点位置
	this.lastPoint2 = { x: 0, y: 0 }; // 上一次第二个触摸点位置
	this.distance = { x: 0, y: 0 }; // 移动距离
	this.lastDistance = { x: 0, y: 0 }; // 上一次移动距离
	this.lastPointermove = { x: 0, y: 0 }; // 上一次移动位置
	this.lastCenter = { x: 0, y: 0 }; // 上一次中心位置
	this.tapCount = 0; // 点击计数器
	this.points = []; // 移动位置数组 长度20 用于计算是否触发swipe
	this.pointers = []; // 触摸点数组
	this.dragDirection = ''; // 拖拽方向
	this.isPointerdown = false; // 按下标识
	this.singleTapTimeout = null; // 单击延时器
	this.longTapTimeout = null; // 长按延时器
	this.rafId = null; // 动画id 用于停止动画
	// 绑定事件
	this.bindEventListener();
}
/**
 * 处理pointerdown
 * @param {PointerEvent} e 
 */
NonameGesture.prototype.handlePointerdown = function (e) {
	// 如果是鼠标点击，只响应左键
	if (e.pointerType === 'mouse' && e.button !== 0) {
		return;
	}
	this.pointers.push(e);
	this.point1.x = this.pointers[0].clientX;
	this.point1.y = this.pointers[0].clientY;
	if (this.pointers.length === 1) {
		this.isPointerdown = true;
		this.element.setPointerCapture(e.pointerId);
		this.tapCount++;
		this.dragDirection = '';
		this.points.length = 0;
		clearTimeout(this.singleTapTimeout);
		this.distance.x = 0;
		this.distance.y = 0;
		this.lastDistance.x = 0;
		this.lastDistance.y = 0;
		this.lastPointermove.x = this.pointers[0].clientX;
		this.lastPointermove.y = this.pointers[0].clientY;
		// 双击两次距离不超过30
		if (this.tapCount > 1) {
			if (Math.abs(this.point1.x - this.lastPoint1.x) > 30 || Math.abs(this.point1.y - this.lastPoint1.y) > 30) {
				this.tapCount = 1;
			}
		}
		if (this.tapCount === 1) {
			// 按住500ms触发长按事件
			this.longTapTimeout = setTimeout(() => {
				this.tapCount = 0;
				if (this.options.longTap) {
					this.options.longTap(e);
				}
			}, 500);
		}
	} else if (this.pointers.length === 2) {
		this.tapCount = 0;
		clearTimeout(this.longTapTimeout);
		this.point2.x = this.pointers[1].clientX;
		this.point2.y = this.pointers[1].clientY;
		this.lastPoint2.x = this.pointers[1].clientX;
		this.lastPoint2.y = this.pointers[1].clientY;
		this.lastDistance.x = this.distance.x;
		this.lastDistance.y = this.distance.y;
		const center = this.getCenter(this.point1, this.point2);
		this.lastCenter.x = center.x;
		this.lastCenter.y = center.y;
	}
	this.lastPoint1 = { x: this.pointers[0].clientX, y: this.pointers[0].clientY };
	if (this.options.pointerdown) {
		this.options.pointerdown(e);
	}
}
/**
 * 处理pointermove
 * @param {PointerEvent} e
 */
NonameGesture.prototype.handlePointermove = function (e) {
	if (!this.isPointerdown) {
		return;
	}
	this.handlePointers(e, 'update');
	const current1 = { x: this.pointers[0].clientX, y: this.pointers[0].clientY };
	if (this.pointers.length === 1) {
		this.distance.x = current1.x - this.point1.x + this.lastDistance.x;
		this.distance.y = current1.y - this.point1.y + this.lastDistance.y;
		// 偏移量大于10表示移动
		if (Math.abs(this.distance.x) > 10 || Math.abs(this.distance.y) > 10) {
			this.tapCount = 0;
			clearTimeout(this.longTapTimeout);
			if (this.dragDirection === '') {
				this.dragDirection = this.getDragDirection();
			}
		}
		this.points.unshift({ x: current1.x, y: current1.y, timeStamp: e.timeStamp });
		if (this.points.length > 20) {
			this.points.pop();
		}
		// drag
		this.handleDrag(e, current1);
		this.lastPointermove.x = current1.x;
		this.lastPointermove.y = current1.y;
	} else if (this.pointers.length === 2) {
		const current2 = { x: this.pointers[1].clientX, y: this.pointers[1].clientY };
		const center = this.getCenter(current1, current2);
		e._centerX = center.x;
		e._centerY = center.y;
		e._lastCenterX = this.lastCenter.x;
		e._lastCenterY = this.lastCenter.y;
		// rotate
		this.handleRotate(e, current1, current2);
		// pinch
		this.handlePinch(e, current1, current2);
		this.lastPoint1.x = current1.x;
		this.lastPoint1.y = current1.y;
		this.lastPoint2.x = current2.x;
		this.lastPoint2.y = current2.y;
		this.lastCenter.x = center.x;
		this.lastCenter.y = center.y;
	}
	if (this.options.pointermove) {
		this.options.pointermove(e);
	}
	// 阻止默认行为，例如图片拖拽
	e.preventDefault();
}
/**
 * 处理pointerup
 * @param {PointerEvent} e
 */
NonameGesture.prototype.handlePointerup = function (e) {
	if (!this.isPointerdown) {
		return;
	}
	this.handlePointers(e, 'delete');
	if (this.pointers.length === 0) {
		this.isPointerdown = false;
		e._hasTriggerSwipe = false;
		clearTimeout(this.longTapTimeout);
		if (this.tapCount === 0) {
			this.handleSwipe(e);
		} else {
			if (this.options.tap) {
				this.options.tap(e);
			}
			if (this.tapCount === 1) {
				this.singleTapTimeout = setTimeout(() => {
					this.tapCount = 0;
					if (this.options.singleTap) {
						this.options.singleTap(e);
					}
				}, 250);
			} else if (this.tapCount > 1) {
				this.tapCount = 0;
				if (this.options.doubleTap) {
					this.options.doubleTap(e);
				}
			}
		}
	} else if (this.pointers.length === 1) {
		this.point1.x = this.pointers[0].clientX;
		this.point1.y = this.pointers[0].clientY;
		this.lastPointermove.x = this.pointers[0].clientX;
		this.lastPointermove.y = this.pointers[0].clientY;
	}
	e._distanceX = this.distance.x;
	e._distanceY = this.distance.y;
	if (this.options.pointerup) {
		this.options.pointerup(e);
	}
}
/**
 * 处理pointercancel
 * @param {PointerEvent} e
 */
NonameGesture.prototype.handlePointercancel = function (e) {
	this.isPointerdown = false;
	this.tapCount = 0;
	clearTimeout(this.longTapTimeout);
	this.pointers.length = 0;
	if (this.options.pointercancel) {
		this.options.pointercancel(e);
	}
}
/**
 * 更新或删除指针
 * @param {PointerEvent} e
 * @param {string} type update delete
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
 * @param {object} a 第一个点的位置
 */
NonameGesture.prototype.handleDrag = function (e, a) {
	e._dragDirection = this.dragDirection;
	e._diffX = a.x - this.lastPointermove.x;
	e._diffY = a.y - this.lastPointermove.y;
	e._distanceX = a.x - this.point1.x + this.lastDistance.x;
	e._distanceY = a.y - this.point1.y + this.lastDistance.y;
	if (this.options.drag) {
		this.options.drag(e);
	}
}
/**
 * 处理swipe
 * @param {PointerEvent} e
 */
NonameGesture.prototype.handleSwipe = function (e) {
	const MIN_SWIPE_DISTANCE = 20;
	let x = 0, y = 0;
	// 如果200ms内移动距离大于20
	for (const item of this.points) {
		if (e.timeStamp - item.timeStamp < 200) {
			x = e.clientX - item.x;
			y = e.clientY - item.y;
		} else {
			break;
		};
	}
	if (Math.abs(x) > MIN_SWIPE_DISTANCE) {
		e._swipeDirection = x > 0 ? 'right' : 'left';
		e._hasTriggerSwipe = true;
	} else if (Math.abs(y) > MIN_SWIPE_DISTANCE) {
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
 * @param {object} a 第一个点的位置
 * @param {object} b 第二个点的位置
 */
NonameGesture.prototype.handleRotate = function (e, a, b) {
	const angle = this.getAngle(a, b);
	const lastAngle = this.getAngle(this.lastPoint1, this.lastPoint2);
	let num = 1;
	// 使用乘法判断两数同号或异号（一正一负）
	if (angle * lastAngle < 0) {
		num = -1;
	}
	e._rotate = angle * num - lastAngle;
	if (this.options.rotate) {
		this.options.rotate(e);
	}
}
/**
 * 处理pinch
 * @param {PointerEvent} e
 * @param {object} a 第一个点的位置
 * @param {object} b 第二个点的位置
 */
NonameGesture.prototype.handlePinch = function (e, a, b) {
	e._scale = this.getDistance(a, b) / this.getDistance(this.lastPoint1, this.lastPoint2);
	if (this.options.pinch) {
		this.options.pinch(e);
	}
}
/**
 * 鼠标滚轮缩放
 * @param {WheelEvent} e 
 */
NonameGesture.prototype.handleWheel = function (e) {
	e._scale = 1.1;
	if (e.deltaY > 0) {
		e._scale = 1 / 1.1;
	}
	if (this.options.wheel) {
		this.options.wheel(e);
	}
}
/**
 * 绑定事件
 */
NonameGesture.prototype.bindEventListener = function () {
	this.handlePointerdown = this.handlePointerdown.bind(this);
	this.handlePointermove = this.handlePointermove.bind(this);
	this.handlePointerup = this.handlePointerup.bind(this);
	this.handlePointercancel = this.handlePointercancel.bind(this);
	this.handleWheel = this.handleWheel.bind(this);
	this.element.addEventListener('pointerdown', this.handlePointerdown);
	this.element.addEventListener('pointermove', this.handlePointermove);
	this.element.addEventListener('pointerup', this.handlePointerup);
	this.element.addEventListener('pointercancel', this.handlePointercancel);
	this.element.addEventListener('wheel', this.handleWheel);
}
/**
 * 解绑事件
 */
NonameGesture.prototype.unbindEventListener = function () {
	this.element.removeEventListener('pointerdown', this.handlePointerdown);
	this.element.removeEventListener('pointermove', this.handlePointermove);
	this.element.removeEventListener('pointerup', this.handlePointerup);
	this.element.removeEventListener('pointercancel', this.handlePointercancel);
	this.element.removeEventListener('wheel', this.handleWheel);
}
/**
 * 销毁
 */
NonameGesture.prototype.destroy = function () {
	this.unbindEventListener();
}
/**
 * 获取旋转角度
 * @param {object} a 第一个点的位置
 * @param {object} b 第二个点的位置
 * @returns 
 */
NonameGesture.prototype.getAngle = function (a, b) {
	const x = a.x - b.x;
	const y = a.y - b.y;
	return Math.atan2(y, x) * 180 / Math.PI;
}
/**
 * 获取两点距离
 * @param {object} a 第一个点的位置
 * @param {object} b 第二个点的位置
 * @returns
 */
NonameGesture.prototype.getDistance = function (a, b) {
	const x = a.x - b.x;
	const y = a.y - b.y;
	return Math.hypot(x, y); // Math.sqrt(x * x + y * y);
}
/**
 * 获取两点中心点
 * @param {object} a 第一个点的位置
 * @param {object} b 第二个点的位置
 * @returns
 */
NonameGesture.prototype.getCenter = function (a, b) {
	const x = (a.x + b.x) / 2;
	const y = (a.y + b.y) / 2;
	return { x: x, y: y };
}
/**
 * 获取图片缩放尺寸
 * @param {number} naturalWidth 图片自然宽度
 * @param {number} naturalHeight 图片自然高度
 * @param {number} maxWidth 最大显示宽度
 * @param {number} maxHeight 最大显示高度
 * @returns 
 */
NonameGesture.prototype.getImgSize = function (naturalWidth, naturalHeight, maxWidth, maxHeight) {
	const imgRatio = naturalWidth / naturalHeight;
	const maxRatio = maxWidth / maxHeight;
	let width, height;
	// 如果图片实际宽高比例 >= 显示宽高比例
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
	return { width: width, height: height };
}
/**
 * 减速动画函数
 * @param {number} from 开始位置
 * @param {number} to 结束位置
 * @param {number} time 动画已执行的时间
 * @param {number} duration 动画时长
 * @returns 
 */
NonameGesture.prototype.easeOut = function (from, to, time, duration) {
	const change = to - from;
	const t = time / duration;
	return -change * t * (t - 2) + from;
}
/**
 * 动画
 * @param {function} func 回调
 * @param {number} duration 动画时长
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
		func(time);
		if (count <= 1) {
			self.rafId = window.requestAnimationFrame(step);
		}
	}
	this.rafId = window.requestAnimationFrame(step);
}