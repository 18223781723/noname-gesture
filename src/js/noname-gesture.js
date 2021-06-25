const nonameGesture = {
	element: null,
	start: { x: 0, y: 0 },
	start2: { x: 0, y: 0 },
	step: { x: 0, y: 0 },
	distance: { x: 0, y: 0 },
	lastDistance: { x: 0, y: 0 },
	lastMove: {},
	lastCenter: {},
	direction: '',
	tapCount: 0,
	points: [],
	tapTimeout: null,
	longTapTimeout: null,
	options: null,
	/**
	 * 初始化执行
	 * @param {HTMLElement} element 元素
	 * @param {object} options 配置项
	 */
	init: function (element, options) {
		this.element = element;
		this.options = options;
		this.bindEvent();
	},
	/**
	 * 处理touchstart
	 * @param {TouchEvent} e
	 */
	handleTouchStart: function (e) {
		this.start = { x: e.touches[0].clientX, y: e.touches[0].clientY };
		this.lastMove = { x: e.touches[0].clientX, y: e.touches[0].clientY };
		if (e.touches.length === 1) {
			this.points = [];
			this.tapCount++;
			clearTimeout(this.tapTimeout);
			if (this.tapCount === 1) {
				this.longTapTimeout = setTimeout(() => {
					this.tapCount = 0;
					if (this.options.longTap) this.options.longTap();
				}, 750);
			}
		} else if (e.touches.length === 2) {
			this.tapCount = 0;
			clearTimeout(this.longTapTimeout);
		}
	},
	/**
	 * 处理touchmove
	 * @param {TouchEvent} e
	 */
	handleTouchMove: function (e) {
		// console.log(e);
		const current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
		if (e.touches.length === 1) {
			this.step = { x: current.x - this.lastMove.x, y: current.y - this.lastMove.y };
			this.lastMove = { x: current.x, y: current.y };
			this.distance = { x: current.x - this.start.x + this.lastDistance.x, y: current.y - this.start.y + this.lastDistance.y };
			// 由于手指目标相对较大，偏移量<10认定为没有移动
			if (Math.abs(this.distance.x) > 10 || Math.abs(this.distance.y) > 10) {
				this.tapCount = 0;
				clearTimeout(this.longTapTimeout);
				if (this.points.length === 20) this.points.pop();
				this.points.unshift({ x: current.x, y: current.y, timeStamp: e.timeStamp });
				if (this.options.move) {
					this.options.move({ distance: { x: this.distance.x, y: this.distance.y }, step: { x: this.step.x, y: this.step.y } });
				}
			}
		} else {

		}
		e.preventDefault();
	},
	/**
	 * 处理touchend
	 * @param {TouchEvent} e
	 */
	handleTouchEnd: function (e) {
		if (e.touches.length === 0) {
			clearTimeout(this.longTapTimeout);
			if (this.tapCount === 0) {
				const swipeDistance = { x: 0, y: 0 };
				let direction = '';
				for (const item of this.points) {
					if (e.timeStamp - item.timeStamp > 100) break;
					swipeDistance.x = e.changedTouches[0].clientX - item.x;
					swipeDistance.y = e.changedTouches[0].clientY - item.y;
				}
				if (Math.abs(swipeDistance.x) > 30) {
					if (swipeDistance.x > 0) {
						direction = 'right';
					} else {
						direction = 'left'
					}
					if (this.options.swipe) this.options.swipe(direction);
				} else if (Math.abs(swipeDistance.y) > 30) {
					if (swipeDistance.y > 0) {
						direction = 'down';
					} else {
						direction = 'up'
					}
					if (this.options.swipe) this.options.swipe(direction);
				}
			} else if (this.tapCount === 1) {
				this.tapTimeout = setTimeout(() => {
					this.tapCount = 0;
					if (this.options.tap) this.options.tap();
				}, 300);
			} else if (this.tapCount > 1) {
				this.tapCount = 0;
				if (this.options.doubleTap) this.options.doubleTap();
			}
		} else if (e.touches.length === 1) {
			this.start = { x: e.touches[0].clientX, y: e.touches[0].clientY };
			this.lastMove = { x: e.touches[0].clientX, y: e.touches[0].clientY };
			this.lastDistance = { x: this.distance.x, y: this.distance.y };
		}
		// e.preventDefault();
	},
	/**
	 * 处理touchcancel
	 * @param {TouchEvent} e
	 */
	handleTouchCancel: function (e) {
		this.tapCount = 0;
	},
	/**
	 * 绑定事件
	 */
	bindEvent: function () {
		this.handleTouchStart = this.handleTouchStart.bind(this);
		this.handleTouchMove = this.handleTouchMove.bind(this);
		this.handleTouchEnd = this.handleTouchEnd.bind(this);
		this.handleTouchCancel = this.handleTouchCancel.bind(this);
		this.element.addEventListener('touchstart', this.handleTouchStart);
		this.element.addEventListener('touchmove', this.handleTouchMove);
		this.element.addEventListener('touchend', this.handleTouchEnd);
		this.element.addEventListener('touchcancel', this.handleTouchCancel);
	},
	/**
	 * 解绑事件
	 */
	unbindEvent: function () {
		this.element.removeEventListener('touchstart', this.handleTouchStart);
		this.element.removeEventListener('touchmove', this.handleTouchMove);
		this.element.removeEventListener('touchend', this.handleTouchEnd);
		this.element.removeEventListener('touchcancel', this.handleTouchCancel);
	},
	/**
	 * 销毁
	 */
	destroy: function () {
		this.unbindEvent();
	}
}
