Wu.RasterStyler = Wu.Class.extend({

	type       : 'cube',
	pixelWidth : 369,

	initialize : function (options) {

		this.options = options;

		// Default styling
		var defaultStops = [{val : 100, col : { r : 255, g : 255, b : 255, a : 0 } }, { val : 200, col : { r : 255, g : 255, b : 255, a : 1 } }];
		var defaultRange = { min : this.options.rangeMin, max : this.options.rangeMax };

		// Get stops
		this.styleJSON = _.isObject(options.carto) ? options.carto : defaultStops;

		// **************************************************************** //
		// **************************************************************** //
		// Fallback for earlier saved files. Can be deleted after debugging
		if ( !this.styleJSON.stops || !this.styleJSON.range ) {
			var temp = {};
			if ( !this.styleJSON.stops ) temp.stops = defaultStops;
			if ( !this.styleJSON.range ) temp.range = defaultRange;
			this.styleJSON = temp;
		}
		// **************************************************************** //
		// **************************************************************** //

		// Shorten
		this.stops = this.styleJSON.stops;
		this.range = this.styleJSON.range;

		// Create dom
		this._initContainer();
		
		// Add events
		this.addHooks();

	},

	_initContainer : function () {


		// Create divs
		this._wrapper = Wu.DomUtil.create('div', 'chrome-content-section-wrapper raster-styler', this.options.container);
		this._rangeMarks = Wu.DomUtil.create('div', 'raster-range-marks', this._wrapper);
		this._sliderContainer = Wu.DomUtil.create('div', 'raster-range-slider', this._wrapper);		
		this._rangeWrapper = Wu.DomUtil.create('div', 'raster-color-range-wrapper', this._wrapper);

		// Description
		this._descriptions = Wu.DomUtil.create('div', 'raster-styler-description', this._wrapper);
		this._descriptions.innerHTML = 'Double click the colored line to create a new handle.<br>Double click the handle to remove it.'

		// For list
		this._stopListContainer = Wu.DomUtil.create('div', 'raster-stop-list-container', this._wrapper);	
		this._stopListButtonContainer = Wu.DomUtil.create('div', 'raster-stops-button-container', this._wrapper);
		this._stopListButton = Wu.DomUtil.create('div', 'raster-stops-view-as-list-button', this._stopListButtonContainer, 'View details');
		
		// Render slider
		this._renderSlider();

		

		console.log('this', this);
		// this.predefinedRange(1);

	},

	addHooks : function () {
		Wu.DomEvent.on(this._stopListButton, 'click', this.toggleStoplist, this);
	},	

	predefinedRange : function (no) {

		var palette   = this.palettes[no];
		if ( !palette ) return;

		var minVal    = this.range.min;
		var maxVal    = this.range.max;
		var range     = maxVal-minVal;
		var noStops   = palette.length;
		var intervals = Math.floor(range/(noStops-1));

		this._clearErryzing();

		this.stops = [];

		palette.forEach(function (p, i) {
			
			// if ( i == 0 )		var val = minVal;
			// else if ( i == noStops-1 )	var val = maxVal;
			// else 			var val = i*intervals;

			var val = i*intervals;		

			var newStop = { val : val, col : p }
			this.stops[i] = newStop;
		}.bind(this));		
		
		this._renderSlider();
		this._renderStopList();

	
	},


	_clearErryzing : function () {

		this.stops.forEach( function (stop) {
			if ( stop.DOM ) this._clearStop(stop);
		}.bind(this));

	},

	_clearStop : function (stop) {

		var wrapperElement = Wu.Tools.isElement(stop.DOM.wrapper);
		if ( wrapperElement ) stop.DOM.wrapper.remove();
		stop.DOM.wrapper = null;

		var containerElement = Wu.Tools.isElement(stop.DOM.container);
		if ( containerElement ) stop.DOM.container.remove();
		stop.DOM.container = null;	

		var rangeElement = Wu.Tools.isElement(stop.DOM.range);
		if ( rangeElement ) stop.DOM.range.remove();
		stop.DOM.range = null;

		if ( stop.DOM.colorBall && stop.DOM.colorBall.color ) {
			var colorElement = Wu.Tools.isElement(stop.DOM.colorBall.color);
			if ( colorElement ) {
				stop.DOM.colorBall.color.remove();
				stop.DOM.colorBall.color = null;
			}
		} 
		stop.DOM.colorBall = null;

		stop.DOM = null;

	},



	// ███████╗██╗     ██╗██████╗ ███████╗██████╗ 
	// ██╔════╝██║     ██║██╔══██╗██╔════╝██╔══██╗
	// ███████╗██║     ██║██║  ██║█████╗  ██████╔╝
	// ╚════██║██║     ██║██║  ██║██╔══╝  ██╔══██╗
	// ███████║███████╗██║██████╔╝███████╗██║  ██║
	// ╚══════╝╚══════╝╚═╝╚═════╝ ╚══════╝╚═╝  ╚═╝

	_renderSlider : function () {

		// If slider exists, destroy it
		if ( this.slider ) this.slider.destroy();
		
		// SLIDER
		// SLIDER
		// SLIDER				

		var sliderStops = [];
		this.stops.forEach(function (stop) { sliderStops.push(stop.val+this.range.min) }.bind(this));

		// Create slider
		this.slider = noUiSlider.create(this._sliderContainer, {
			start: sliderStops,
			animate: false,
			step : 1,
			behaviour: 'hover',
			range: {
				'min': this.range.min,
				'max': this.range.max
			}
		});

		// Slide listner
		this.slider.on('slide', function( values, handle ) {

			var val    = Math.round(parseInt(values[handle]));
			var before = values[handle-1];
			var after  = values[handle+1];

			// There is a handle before this
			if ( before ) {
				// Difference between current handle and the one before
				var diffBefore = val - Math.round(parseInt(before));
				// If they overlap, add 1 to current handle
				if ( diffBefore == 0 ) val ++;
			}

			// There is a handle after this
			if ( after ) {
				// Difference between current handle and the one after
				var diffAfter = val - Math.round(parseInt(after));
				// If they overlap, remove 1 to current handle
				if ( diffAfter == 0 ) val --;
			}


			// Update current stop with adjusted values
			this.stops[handle].val = val - this.range.min;
			
			// Set slider position
			this._setSliderPosition();
			this._renderStopList();


		}.bind(this));

		// Hover listner
		this.slider.on('hover', function( value ) { this.hoverValue = value; }.bind(this));

		// Click event
		Wu.DomEvent.on(this.slider.target, 'dblclick', this.rangeClick, this);


		// EACH STOP
		// EACH STOP
		// EACH STOP

		this.stops.forEach(function (stop, i) { 

			// If DOM for this stop already exists, remove it
			if ( stop.DOM ) this._clearStop(stop);

			stop.DOM = {}

			// Outer wrapper
			stop.DOM.wrapper   = Wu.DomUtil.create('div', 'raster-color-selector-wrapper', this._rangeWrapper);
			
			// Content container
			stop.DOM.container = Wu.DomUtil.create('div', 'raster-color-selector', stop.DOM.wrapper);

			// Range container
			stop.DOM.range     = Wu.DomUtil.create('div', 'raster-color-range', stop.DOM.wrapper);

			// Number
			stop.DOM.number    = Wu.DomUtil.create('div', 'raster-color-number', stop.DOM.container, stop.val+this.range.min);

			// Color selector
			stop.DOM.colorBall = new Wu.button({
				appendTo  : stop.DOM.container,
				type      : 'colorball',
				id        : i,
				fn 	  : this._updateColor.bind(this),
				right     : false,
				value     : Wu.Tools.rgbaStyleStr(this.stops[i].col),
				className : 'raster-color',
				on        : true,
				showAlpha : true,
				format    : 'rgba'
			});

		}.bind(this));

		// Set poision of color selectors, ranges, etc
		this._setSliderPosition();

		// this._renderStopList();
		app.Tools.Styler.markChanged();


	},


	// ┌─┐┬  ┬┌┬┐┌─┐┬─┐  ┌─┐┌─┐┌┬┐┬┌─┐┌┐┌┌─┐
	// └─┐│  │ ││├┤ ├┬┘  ├─┤│   │ ││ ││││└─┐
	// └─┘┴─┘┴─┴┘└─┘┴└─  ┴ ┴└─┘ ┴ ┴└─┘┘└┘└─┘	

	// Update color
	_updateColor : function (col, key, wrapper) {
		this.stops[key].col = col;
		this._setSliderColor();
	},

	// Update color, and redraw slider
	// (Gets used when color from list is changed by spectrum)
	_forceUpdateColor : function (col, key, wrapper) {
		// Store color
		this.stops[key].col = col;
		// Update one line only
		this._updateListLine(key);
		// Redraw slider
		this._renderSlider();
	},

	// Updates values in one line of the list,
	// without redrawing the whole list
	_updateListLine : function (key) {

		var stop = this.stops[key];
		var v = stop.list.valInput.value = stop.val;
		var r = stop.list.rInput.value = stop.col.r;
		var g = stop.list.gInput.value = stop.col.g;
		var b = stop.list.bInput.value = stop.col.b;
		var a = stop.list.aInput.value = stop.col.a;	
	},


	// ONLY sets color elements position from left!
	// No width, nor color updates happens here...
	_setSliderPosition : function () {

		var span = this.range.max - this.range.min;

		this.stops.forEach(function (stop, i) {

			var pixelsFromLeft = Math.round((stop.val / span) * this.pixelWidth);
			var style = Wu.Tools.transformTranslate(pixelsFromLeft, 0);			
			stop.DOM.wrapper.setAttribute('style', style);

		}.bind(this));

		this._setSliderColor();

	},

	// Sets slider color + width + updates number above line
	_setSliderColor : function () {

		var span = this.range.max - this.range.min;

		this.stops.forEach(function (stop, i) {

			if ( this.stops[i+1] ) {

				// Stops
				var thisStop = stop;
				var nextStop = this.stops[i+1];

				// Calculate				
				var thisPercentFromLeft = Math.round((thisStop.val+this.range.min)/span * 100);
				var nextPercentFromLeft = Math.round((nextStop.val+this.range.min)/span * 100);

				// Values
				// var left  = thisPercentFromLeft;
				var perecentWidth = (nextPercentFromLeft-thisPercentFromLeft)/100;
				var width = Math.round(perecentWidth * this.pixelWidth);

				// Get start and end color
				var startColor = thisStop.col;
				var endColor = nextStop.col;

				// Get gradient style
				var gradientStyle = this.getGradient(startColor, endColor);

				// Set gradient style
				stop.DOM.range.setAttribute('style', gradientStyle);
				
			} else {
				var width = 0;
			}

			// Set width
			stop.DOM.range.style.width = width + 'px';

			// Write value
			stop.DOM.number.innerHTML = stop.val + this.range.min;

		}.bind(this));

		// this._renderStopList();
		
	},



	// Remove stop (by index)
	removeStop : function (no) {


		// Do not allow less than two stops
		if ( this.stops.length <= 2 ) return;

		// REMOVE FROM DOM
		this.stops[no].DOM.wrapper.remove();
		this.stops[no].DOM.wrapper = null;
		
		this.stops[no].DOM.container.remove();
		this.stops[no].DOM.container = null;	
		
		this.stops[no].DOM.range.remove();
		this.stops[no].DOM.range = null;
		
		this.stops[no].DOM.colorBall.color.remove();
		this.stops[no].DOM.colorBall.color = null;
		
		this.stops[no].DOM.colorBall = null;

		this.stops[no].DOM = null;

		// Remove from Array
		this.stops.splice(no, 1);

		// Redraw slider
		this._renderSlider();
		this._renderStopList();

	},

	// Add stop (by value and index)
	addStop : function (val, index) {

		// Get the two stops where we want to go between
		var stop1 = this.stops[index];
		var stop2 = this.stops[index+1];
		
		// If we're clicking before the first stop, or after the last
		if ( !stop1 ) return;
		if ( !stop2 ) return;

		// First stop values
		var val1 = stop1.val;
		var rgba1 = stop1.col;

		// Second stop values
		var val2 = stop2.val;
		var rgba2 = stop2.col;


		// CALCULATIONS
		// CALCULATIONS
		// CALCULATIONS


		// Range of new stop, minus previous stop
		var newValRange = val - val1;

		// Range between existing stops
		var valRange = val2 - val1;

		// How many percent of range between existing two 
		// stops are we located at ... [*][.*..][*] = 25%
		var percent = newValRange/valRange;

		// Mix colors
		var newRGB = Wu.Tools.mixColors(rgba1, rgba2, percent);

		// Data for new stop
		var newStop = {
			val : val,
			col : newRGB
		}

		// Inject new stop
		this.stops.splice(index+1, 0, newStop);

		// Render da sheeet
		this._renderSlider();
		this._renderStopList();

	},

	addStopBefore : function (val) {

		var nextStop = this.stops[0];
		var newStop = {
			val : val,
			col : nextStop.col
		}

		this.stops.splice(0,0,newStop);

		this._renderSlider();
		this._renderStopList();

	},

	addStopAfter : function (val) {

		var prevStop = this.stops[this.stops.length-1];
		var newStop = {
			val : val,
			col : prevStop.col
		}

		this.stops.push(newStop);

		this._renderSlider();
		this._renderStopList();


	},


	// ┌─┐┬  ┬┌─┐┬┌─  ┌─┐┬  ┬┌─┐┌┐┌┌┬┐┌─┐
	// │  │  ││  ├┴┐  ├┤ └┐┌┘├┤ │││ │ └─┐
	// └─┘┴─┘┴└─┘┴ ┴  └─┘ └┘ └─┘┘└┘ ┴ └─┘	

	rangeClick : function (e) {

		var target = e.target;
		var handleClick = Wu.DomUtil.hasClass(target, 'noUi-handle');

		// If we've clicked on a handle, remove stop
		// If we've clicked on the color strip, add stop
		handleClick ? this.rangeClickRemoveStop(e) : this.rangeClickAddStop(e);
	},

	rangeClickRemoveStop : function (e) {

		// This is a bit hacky, but what we're doing is to fetch
		// the latest "hoverValue", which is the position of the mouse.
		// Then we add a buffer, and figure out which stop we're closest to.
		var stop = false;

		var buffer = 0;
		this.stops.forEach(function (_stop, i) {

			if ( _stop.val >= (this.hoverValue-buffer) &&  _stop.val <= (this.hoverValue+buffer) ) {
				stop = i;
			}

		}.bind(this));

		if ( stop === false ) return;

		this.removeStop(stop);
	},

	rangeClickAddStop : function (e) {

		var val = Math.round(this.hoverValue) - this.range.min;
		var index = -1;
		var tooClose = false;
		// var buffer = 15;
		var buffer = 0;

		// Add stop before
		if ( val < ( this.stops[0].val - buffer) ) {
			this.addStopBefore(val);
			return;
		}

		// Add stop after
		if ( val > ( this.stops[this.stops.length-1].val + buffer ) ) {
			this.addStopAfter(val);
			return;
		}

		// Find out between which stops to place this stop...
		this.stops.forEach(function (stop, i) {

			// Stop value
			var stopVal = stop.val;

			// New value is LARGER than stop
			if ( val > stopVal ) index = i;
			var diff = Math.abs( stopVal - val);
			if ( diff < buffer ) tooClose = true;

		}.bind(this));

		// Need a buffer, so that we don't create a new handle when pulling a handle :P
		if ( tooClose ) { console.error('Too close!'); return; }

		// Add stop
		this.addStop(val, index);


	},










	// ██╗     ██╗███████╗████████╗
	// ██║     ██║██╔════╝╚══██╔══╝
	// ██║     ██║███████╗   ██║   
	// ██║     ██║╚════██║   ██║   
	// ███████╗██║███████║   ██║   
	// ╚══════╝╚═╝╚══════╝   ╚═╝   

	toggleStoplist : function () {
		this.viewStoplist ? this.disableStopList() : this.enableStopList();
	},

	disableStopList : function () {
		this._stopListContainer.innerHTML = '';
		this._stopListButton.innerHTML = 'View details';
		this.viewStoplist = false;
	}, 

	enableStopList : function () {
		this._stopListButton.innerHTML = 'Hide details';
		this.viewStoplist = true;
		this._renderStopList();
	},	

	_renderStopList : function () {

		if ( !this.viewStoplist ) return;
		
		this._stopListContainer.innerHTML = '';
		var tabIndex = 100;

		// CREATE DESCRIPTION LINE

		// LINE
		var line = Wu.DomUtil.create('div', 'stop-list-each', this._stopListContainer);

		// NUMBER
		var noWrap  = Wu.DomUtil.create('div', 'stop-list-no stop-list-item', line);
		var noTitle = Wu.DomUtil.create('div', 'stop-list-no-title', noWrap, '#');

		// VALUE
		var valWrap  = Wu.DomUtil.create('div',   'stop-list-val stop-list-item', line);
		var valInput = Wu.DomUtil.create('div', 'stop-list-title', valWrap, 'Value');

		// COLORS
		var colWrap = Wu.DomUtil.create('div', 'stop-list-color-wrapper stop-list-item', line);
		var rInput  = Wu.DomUtil.create('div', 'stop-color', colWrap, 'Red');						
		var gInput  = Wu.DomUtil.create('div', 'stop-color', colWrap, 'Green');
		var bInput  = Wu.DomUtil.create('div', 'stop-color', colWrap, 'Blue');

		// ALPHA
		var alphaWrap = Wu.DomUtil.create('div', 'stop-list-alpha-wrapper stop-list-item', line);			
		var aInput  = Wu.DomUtil.create('div', 'stop-color', alphaWrap, 'Opacity');

		// COLOR
		var colorWrap = Wu.DomUtil.create('div', 'stop-list-color-ball-wrapper', line);
		var color = Wu.DomUtil.create('div', 'stop-list-color-ball', colorWrap);





		// Only allow users to remove colors if there are more than two
		if ( this.stops.length >= 3 ) var allowKilling = true;

		// POPULATE
		this.stops.forEach(function (stop, i) {
		
			var _h = stop.list = {};

			var v = stop.val ? stop.val+this.range.min : this.range.min;
			var r = stop.col.r ? stop.col.r : '0';
			var g = stop.col.g ? stop.col.g : '0';
			var b = stop.col.b ? stop.col.b : '0';
			var a = stop.col.a ? stop.col.a : '0';

			// LINE
			_h.line = Wu.DomUtil.create('div', 'stop-list-each', this._stopListContainer);

			// ADD NEW STOP
			if ( this.stops[i+1] ) {
				var diff = parseInt(this.stops[i+1].val) - v;
				// Only allow to inject new stop if difference between stop before
				// and after is greater than two.
				if ( diff >= 2 ) {
					var icon = '<i class="fa fa-plus-circle" no="' + i + '"></i>';
					_h.addButton = Wu.DomUtil.create('div', 'stop-list-add-color target-add', _h.line, icon);				
					Wu.DomEvent.on(_h.addButton, 'click', this.addButtonClick, this);					
				}
			}

			// NUMBER
			_h.noWrap  = Wu.DomUtil.create('div', 'stop-list-no stop-list-item', _h.line);
			_h.noTitle = Wu.DomUtil.create('div', 'stop-list-no-title', _h.noWrap, '<b>' + (i+1) + '</b>');

			// VALUE
			_h.valWrap  = Wu.DomUtil.create('div',   'stop-list-val stop-list-item', _h.line);
			_h.valInput = Wu.DomUtil.create('input', 'stop-list-title', _h.valWrap, v);
			_h.valInput.value = v;
			_h.valInput.setAttribute('no', i);
			_h.valInput.setAttribute('type', 'v');
			_h.valInput.setAttribute('tabindex', tabIndex++);

			// COLORS
			_h.colWrap = Wu.DomUtil.create('div', 'stop-list-color-wrapper stop-list-item', _h.line);
			
			// RED
			_h.rInput  = Wu.DomUtil.create('input', 'stop-color', _h.colWrap, r);
			_h.rInput.value = r;
			_h.rInput.setAttribute('no', i);
			_h.rInput.setAttribute('type', 'r');
			_h.rInput.setAttribute('tabindex', tabIndex++);
				
			// GREEN		
			_h.gInput  = Wu.DomUtil.create('input', 'stop-color', _h.colWrap, g);
			_h.gInput.value = g;
			_h.gInput.setAttribute('no', i);
			_h.gInput.setAttribute('type', 'g');
			_h.gInput.setAttribute('tabindex', tabIndex++);

			// BLUE
			_h.bInput  = Wu.DomUtil.create('input', 'stop-color', _h.colWrap, b);
			_h.bInput.value = b;
			_h.bInput.setAttribute('no', i);
			_h.bInput.setAttribute('type', 'b');
			_h.bInput.setAttribute('tabindex', tabIndex++);
			
			// ALPHA
			_h.alphaWrap = Wu.DomUtil.create('div', 'stop-list-alpha-wrapper stop-list-item', _h.line);			
			_h.aInput  = Wu.DomUtil.create('input', 'stop-color', _h.alphaWrap, a);
			_h.aInput.value = a;
			_h.aInput.setAttribute('no', i);
			_h.aInput.setAttribute('type', 'a');
			_h.aInput.setAttribute('tabindex', tabIndex++);

			// COLOR
			_h.colorWrap = Wu.DomUtil.create('div', 'stop-list-color-ball-wrapper', _h.line);

			// Color selector
			_h.color = new Wu.button({
				appendTo  : _h.colorWrap,
				type      : 'colorball',
				id        : i,
				fn 	  : this._forceUpdateColor.bind(this),
				right     : false,
				value     : Wu.Tools.rgbaStyleStr(stop.col),
				className : 'stop-list-color-ball',
				on        : true,
				showAlpha : true,
				format    : 'rgba'
			});


			// Catch arrow movements			
			Wu.DomEvent.on(_h.valInput, 'keydown', this.routKey, this);
			Wu.DomEvent.on(_h.rInput,   'keydown', this.routKey, this);
			Wu.DomEvent.on(_h.gInput,   'keydown', this.routKey, this);
			Wu.DomEvent.on(_h.bInput,   'keydown', this.routKey, this);
			Wu.DomEvent.on(_h.aInput,   'keydown', this.routKey, this);

			// Force numeric value
			_h.valInput.onkeypress = Wu.Tools.forceNumeric;
			_h.rInput.onkeypress   = Wu.Tools.forceNumeric;
			_h.gInput.onkeypress   = Wu.Tools.forceNumeric;
			_h.bInput.onkeypress   = Wu.Tools.forceNumeric;
			_h.aInput.onkeypress   = Wu.Tools.forceNumeric;

			// Update
			Wu.DomEvent.on(_h.valInput, 'blur', this.rasterInputChange, this);
			Wu.DomEvent.on(_h.rInput, 'blur', this.rasterInputChange, this);
			Wu.DomEvent.on(_h.gInput, 'blur', this.rasterInputChange, this);
			Wu.DomEvent.on(_h.bInput, 'blur', this.rasterInputChange, this);
			Wu.DomEvent.on(_h.aInput, 'blur', this.rasterInputChange, this);


			if ( allowKilling ) {
				
				var icon = '<i class="fa fa-minus-circle" no="' + i + '"></i>';
				_h.killButton = Wu.DomUtil.create('div', 'stop-list-kill-color target-remove', _h.line, icon);
				Wu.DomEvent.on(_h.killButton, 'click', this.killStopClick, this);

			}

		}.bind(this));


		// Add line for adjusting range
		var rangeWrapper = Wu.DomUtil.create('div', 'raster-styler-range-wrapper', this._stopListContainer);
		
		var rangeTitle = Wu.DomUtil.create('div', 'raster-styler-range-title', rangeWrapper, 'Range:');

		var rangeMinWrapper = Wu.DomUtil.create('div', 'raster-styler-range-min-wrapper', rangeWrapper);
		var rangeMinDescr   = Wu.DomUtil.create('div', 'stop-color', rangeMinWrapper, 'min');
		var rangeMinInput   = Wu.DomUtil.create('input', 'raster-styler-range-min stop-color', rangeMinWrapper);

		var rangeMaxWrapper = Wu.DomUtil.create('div', 'raster-styler-range-max-wrapper', rangeWrapper);
		var rangeMaxDescr   = Wu.DomUtil.create('div', 'stop-color', rangeMaxWrapper, 'max');
		var rangeMaxInput   = Wu.DomUtil.create('input', 'raster-styler-range-max stop-color', rangeMaxWrapper);

		rangeMinInput.value = this.range.min;
		rangeMaxInput.value = this.range.max;

		Wu.DomEvent.on(rangeMinInput, 'blur', this._saveRange, this);
		Wu.DomEvent.on(rangeMaxInput, 'blur', this._saveRange, this);

		rangeMaxInput.onkeypress = Wu.Tools.forceNumeric;
		rangeMinInput.onkeypress = Wu.Tools.forceNumeric;

		this.rangeMinInput = rangeMinInput;
		this.rangeMaxInput = rangeMaxInput;

	},

	_saveRange : function () {

		// Get input values
		var minInput = parseInt(this.rangeMinInput.value);
		var maxInput = parseInt(this.rangeMaxInput.value);

		// If no input value, use min/max values
		var minRange = minInput ? minInput : this.range.min;
		var maxRange = maxInput ? maxInput : this.range.max;
		// If min input is zero, use it
		if ( minInput === 0 ) minRange = 0;

		// If max value is less than min value;
		if ( minRange >= maxRange ) {	
			maxRange = minRange+1;
			this.rangeMaxInput.value = maxRange;
		}

		// Do not allow range smaller than number of stops;
		if ( maxRange-minRange < this.stops.length ) {
			maxRange = minRange + this.stops.length;
		}


		// Store previous slider range
		var prevRange = this.range.max - this.range.min;

		// Set new slider range
		this.range.min = minRange;
		this.range.max = maxRange;

		// Get value from first and last stop
		var minVal = this.stops[0].val;
		var maxVal = this.stops[this.stops.length-1].val;
		
		// Get range of stops
		var valRange = maxVal - minVal;
		// Get range of slider
		var range = maxRange - minRange;

		// How many percent is range between stops of PREVIOUS slider range?
		var pp = valRange/prevRange;

		// Recalculate stops
		this.stops.forEach(function (stop, i) {	
			
			// Percent of value range
			var percent = stop.val/valRange * pp;
			var newVal  = Math.round(range * percent);
			
			// Store calculated value
			stop.val = newVal;

		}.bind(this));	

		// Update slider
		this._renderSlider();
		
		// Update list
		this._renderStopList();

	},

	// Rout key movement
	routKey : function (e) {

		var key = e.keyCode;

		// UP
		if ( key == 38 ) this.tab(e, 'up');

		// DOWN
		if ( key == 40 ) this.tab(e, 'down');

		// LEFT
		if ( key == 37 ) {
			var input = e.target;
			var cPos = Wu.Tools.getCursorPos(input);
			if ( cPos <= 0 ) this.tab(e, 'left');
		}		

		// RIGHT
		if ( key == 39 ) {	
			var input = e.target;
			var length = input.value.length;
			var cPos = Wu.Tools.getCursorPos(input);
			if ( cPos >= length ) this.tab(e, 'right')
		}

		// Blur on enter
		if ( key == 13 ) e.target.blur();		
		

	},

	// "Circular" tabbing in list
	tab : function (e, direction) {

		var no = parseInt(e.target.getAttribute('no'));
		var type = e.target.getAttribute('type');
		
		// TABBING UP OR DOWN
		// TABBING UP OR DOWN
		// TABBING UP OR DOWN

		if ( direction == 'up' || direction == 'down' ) {

			if ( direction == 'up' )    var _num = this.stops[no-1] ? no-1 : this.stops.length-1;
			if ( direction == 'down' )  var _num = this.stops[no+1] ? no+1 : 0;

			if ( type == 'v' ) this.stops[_num].list.valInput.focus();
			if ( type == 'r' ) this.stops[_num].list.rInput.focus();
			if ( type == 'g' ) this.stops[_num].list.gInput.focus();
			if ( type == 'b' ) this.stops[_num].list.bInput.focus();
			if ( type == 'a' ) this.stops[_num].list.aInput.focus();

			return;

		}

		// TABBING LEFT OR RIGHT
		// TABBING LEFT OR RIGHT
		// TABBING LEFT OR RIGHT

		if ( direction == 'left' || direction == 'right' ) {

			// Create an array of input fields
			var inputs = [
				{ type : 'v', input :  this.stops[no].list.valInput },
				{ type : 'r', input :  this.stops[no].list.rInput },
				{ type : 'g', input :  this.stops[no].list.gInput },
				{ type : 'b', input :  this.stops[no].list.bInput },
				{ type : 'a', input :  this.stops[no].list.aInput },
			]

			// Tab left or right
			inputs.forEach(function (input, i) {	
				if ( input.type == type ) {
					if ( direction == 'right' ) var _no = i == inputs.length-1 ? 0 : i+1;					
					if ( direction == 'left' )  var _no = i == 0 ? inputs.length-1 : i-1;
					inputs[_no].input.focus();
					return;					
				}
			}.bind(this));

			return;
		}

	},





	// Remove Stop
	killStopClick : function (e) {
		var no = e.target.getAttribute('no');
		this.removeStop(no);
	},

	// Add stop
	addButtonClick : function (e) {

		// Get current stop index
		var index  = parseInt(e.target.getAttribute('no'));
		
		// Get stops before and after
		var before = this.stops[index];
		var after  = this.stops[index+1];

		// If there are no stop either before or after, stop
		if ( !before || !after ) return;

		// Get values before and after
		var val1 = parseInt(before.val);
		var val2 = parseInt(after.val);

		// Figure out the difference (range)
		var diff = val2 - val1;

		// Figure out new position (50%)
		var val = Math.round(diff/2) + val1;

		// Add new stop
		this.addStop(val, index);

	},

	// Input change
	rasterInputChange : function (e) {

		var no = parseInt(e.target.getAttribute('no'));
		var type = e.target.getAttribute('type');
		var val  = parseFloat(e.target.value);

		// Make sure value is not more or less than maximum allowed
		if ( type == 'v' ) {

			if ( val < this.range.min ) val = this.range.min;
			if ( val > this.range.max ) val = this.range.max;

			// If val is less than stop before, force it to previous stop + 1
			if ( this.stops[no-1] && this.stops[no-1].val >= val ) {
				val = this.stops[no-1].val + 1;
			}

			// If val is more than stop after, force it to previous stop - 1
			if ( this.stops[no+1] && this.stops[no+1].val <= val ) {
				val = this.stops[no+1].val - 1;
			}

			// Update Object
			this.stops[no].val = val + this.range.min;
		}

		// Force RGB values to be between 255 and 0
		if ( type == 'r' || type == 'g' || type == 'b' ) {
			if ( val < 0 )   val = 0;
			if ( val > 255 ) val = 255;

			// Update Object
			this.stops[no].col[type] = val;

		}

		// Force ALPHA to be between 0 and 1
		if ( type == 'a' ) {
			if ( val < 0 ) val = 0;
			if ( val > 1 ) val = 1;

			// Update Object
			this.stops[no].col[type] = val;			
		}		

		// Rewrite input with new value
		e.target.value = val;


		// ****************************

		
		// If updating value

		if ( type == 'v' ) {

			// Set value
			this.stops[no].val = val;

			// Render slider
			this._renderSlider();

			// Stop
			return;			

		}



		// UPDATING COLOR

		// RGBA object
		var RGBA = this.stops[no].col;

		// Set value
		RGBA[type] = val;

		// get RGBA color
		var bgColor = Wu.Tools.rgbaStyleStr(RGBA)

		// Set spectrum
		var stop  = this.stops[no];
		var list  = this.stops[no].list;
		var color = list.color.color;

		color.style.background = bgColor;
		$(color).spectrum("set", bgColor);

		// Render slider
		this._renderSlider();
			
	},	



	// ████████╗ ██████╗  ██████╗ ██╗     ███████╗
	// ╚══██╔══╝██╔═══██╗██╔═══██╗██║     ██╔════╝
	//    ██║   ██║   ██║██║   ██║██║     ███████╗
	//    ██║   ██║   ██║██║   ██║██║     ╚════██║
	//    ██║   ╚██████╔╝╚██████╔╝███████╗███████║
	//    ╚═╝    ╚═════╝  ╚═════╝ ╚══════╝╚══════╝


	getGradient : function (c1, c2) {

		var inBetween = Wu.Tools.mixColors(c1, c2, 0.5);

		var _c1 = Wu.Tools.rgbaStyleStr(c1);
		var _c2 = Wu.Tools.rgbaStyleStr(inBetween);
		var _c3 = Wu.Tools.rgbaStyleStr(c2);

		var gradient = Wu.Tools.createGradient([_c1,_c2,_c3]);
		return gradient;
	},

	stops2cartocss : function (stops) {

		if ( !stops ) return;

		var minVal = this.range.min;
		var maxVal = this.range.max;	

		var firstStop = parseInt(stops[0].val);
		var lastStop = parseInt(stops[stops.length-1].val);

		// todo: add blur to stops
		var blur = false;
		var blurType = 'gaussian';

		// Default CSS
		var styleCSS = '#layer { ';
		styleCSS += 'raster-opacity: 1; ';
		styleCSS += 'raster-colorizer-default-mode: linear; ';
		styleCSS += 'raster-colorizer-default-color: transparent; ';
		styleCSS += 'raster-comp-op: color-dodge; ';
		if (blur) styleCSS += 'raster-scaling: ' + blurType + '; ';
		styleCSS += 'raster-colorizer-stops: ';

		// If the first stop is not equal to minVal,
		// create a stop for minVal
		if ( firstStop != minVal ) {
			styleCSS += ' stop(' + minVal + ', rgba(0,0,0,0))';
			styleCSS += ' stop(' + (firstStop-1) + ', rgba(0,0,0,0))';
		}

		// Create all the stops
		stops.forEach(function (stop, i) {
			var val = stop.val;
			var _RGBA = stop.col;
			var rgba = 'rgba(' + _RGBA.r + ',' + _RGBA.g + ',' + _RGBA.b + ',' + _RGBA.a + ')';
			styleCSS += ' stop(' + val + ', ' + rgba + ')';
		}.bind(this));		

		// If the last stop is not equal to maxVal,
		// create a stop for 
		if ( lastStop != maxVal ) {
			styleCSS += ' stop(' + (lastStop+1) + ', rgba(0,0,0,0))';
			styleCSS += ' stop(' + maxVal + ', rgba(0,0,0,0), exact)';
		}
		styleCSS += ';}';

		return styleCSS;
	},





	palettes : [

		// 0
		[
			{ r : 255, g : 0,   b :  0,   a : 1 },
			{ r : 255, g : 255, b :  0,   a : 1 },
			{ r : 0,   g : 255, b :  0,   a : 1 },
			{ r : 0,   g : 255, b :  255, a : 1 },
			{ r : 0,   g : 0,   b :  255, a : 1 }
		],

		// 1
		[
			{ r : 0,   g : 0,   b :  255, a : 1 },
			{ r : 0,   g : 255, b :  255, a : 1 },
			{ r : 0,   g : 255, b :  0,   a : 1 },
			{ r : 255, g : 255, b :  0,   a : 1 },
			{ r : 255, g : 0,   b :  0,   a : 1 }
		],

		// 2
		[
			{ r : 240, g : 249, b :  232, a : 1 },
			{ r : 123, g : 204, b :  196, a : 1 },
			{ r : 8,   g : 104, b :  172, a : 1 }
		],

		// 3
		[
			{ r : 8,   g : 104, b :  172, a : 1 },
			{ r : 123, g : 204, b :  196, a : 1 },
			{ r : 240, g : 249, b :  232, a : 1 }
		],

		// 4
		[
			{ r : 255, g : 255, b :  178, a : 1 },
			{ r : 253, g : 141, b :  60,  a : 1 },
			{ r : 189, g : 0,   b :  38,  a : 1 }
		],

		// 5
		[
			{ r : 189, g : 0,   b :  38,  a : 1 },
			{ r : 253, g : 141, b :  60,  a : 1 },
			{ r : 255, g : 255, b :  178, a : 1 }
		],

		// 6
		[
			{ r : 254, g : 235, b :  226, a : 1 },
			{ r : 122, g : 1,   b :  119, a : 1 }
		],

		// 7
		[
			{ r : 122, g : 1,   b :  119, a : 1 },
			{ r : 254, g : 235, b :  226, a : 1 }
		],

		// 8
		[

			{ r : 215, g : 25,  b :  28,  a : 1 },
			{ r : 253, g : 174, b :  97,  a : 1 },
			{ r : 255, g : 255, b :  191, a : 1 },
			{ r : 171, g : 221, b :  164, a : 1 },
			{ r : 43,  g : 131, b :  186, a : 1 }
		],

		// 9
		[
			{ r : 43,  g : 131, b :  186, a : 1 },
			{ r : 171, g : 221, b :  164, a : 1 },
			{ r : 255, g : 255, b :  191, a : 1 },
			{ r : 253, g : 174, b :  97,  a : 1 },
			{ r : 215, g : 25,  b :  28,  a : 1 }
		],

		// 10 
		[
			{ r : 208, g : 28,  b :  139, a : 1 },
			{ r : 241, g : 182, b :  218, a : 1 },
			{ r : 247, g : 247, b :  247, a : 1 },
			{ r : 184, g : 225, b :  134, a : 1 },
			{ r : 77,  g : 172, b :  38,  a : 1 }
		],

		// 11
		[
			{ r : 77,  g : 172, b :  38,  a : 1 },
			{ r : 247, g : 247, b :  247, a : 1 },
			{ r : 208, g : 28,  b :  139, a : 1 }
		],

		// 12
		[
			{ r : 230, g : 97,  b :  1,   a : 1 },
			{ r : 247, g : 247, b :  247, a : 1 },
			{ r : 94,  g : 60,  b :  153, a : 1 }
		],

		// 13
		[
			{ r : 94,  g : 60,  b :  153, a : 1 },
			{ r : 247, g : 247, b :  247, a : 1 },
			{ r : 230, g :  97, b :   1,  a : 1 }
		],

		// 14
		[
			{ r : 202, g : 0,   b :  32,  a : 1 },
			{ r : 247, g : 247, b :  247, a : 1 },
			{ r : 5,   g : 113, b :  176, a : 1 }
		],

		// 15
		[
			{ r : 5,   g : 113, b :  176, a : 1 },
			{ r : 247, g : 247, b :  247, a : 1 },
			{ r : 202, g : 0,   b :  32,  a : 1 }
		],

		// 16
		[
			{ r : 255, g : 0,   b :  255, a : 1 },
			{ r : 255, g : 255, b :  0,   a : 1 },
			{ r : 0,   g : 255, b :  255, a : 1 }
		],

		// 17
		[
			{ r : 0,   g : 255, b :  255, a : 1 },
			{ r : 255, g : 255, b :  0,   a : 1 },
			{ r : 255, g : 0,   b :  255, a : 1 }
		],

		// 18
		[
			{ r : 255, g : 0,   b :  0, a : 1 },
			{ r : 255, g : 255, b :  0, a : 1 },
			{ r : 0,   g : 255, b :  0, a : 1 }
		],

		// 19
		[
			{ r : 0,   g : 255, b :  0, a : 1 },
			{ r : 255, g : 255, b :  0, a : 1 },
			{ r : 255, g : 0,   b :  0, a : 1 }
		]

	]



});

