Wu.button = Wu.Class.extend({

	initialize : function (options) {

		this.options = options;

		if ( options.type == 'switch' )     this.initSwitch();
		if ( options.type == 'set' ) 	    this.initSet();
		if ( options.type == 'setclear' )   this.initSetClear();
		if ( options.type == 'radio' )	    this.initRadio();
		if ( options.type == 'input' )      this.initInput();
		if ( options.type == 'miniInput' )  this.initMiniInput();
		if ( options.type == 'dropdown')    this.initMiniDropDown();
		if ( options.type == 'colorball')   this.initColorBall();
		if ( options.type == 'colorrange')  this.initColorRange();
		if ( options.type == 'dualinput')   this.initDualInput();
		if ( options.type == 'toggle')      this.initToggleButton();
		if ( options.type == 'clicker')     this.initClicker();

	},

	
	// ┌┬┐┬ ┬┌─┐┬    ┬┌┐┌┌─┐┬ ┬┌┬┐
	//  │││ │├─┤│    ││││├─┘│ │ │ 
	// ─┴┘└─┘┴ ┴┴─┘  ┴┘└┘┴  └─┘ ┴ 

	initDualInput : function () {

		var appendTo    = this.options.appendTo;
		var key         = this.options.id;
		var right       = this.options.right;
		var value       = this.options.value;
		var minmax 	 	= this.options.minmax;
		var tabindex    = this.options.tabindex;
		var className   = this.options.className;
		var fn          = this.options.fn;


		var prefix = 'chrome-field-mini-input mini-input-dual ';
		if ( className ) prefix += className;



		// create max input
		var miniInputMax = Wu.DomUtil.createId('input', 'field_mini_input_max_' + key, appendTo);
		miniInputMax.className = prefix;
		miniInputMax.setAttribute('placeholder', 'auto');
		miniInputMax.setAttribute('tabindex', tabindex[1]);
		if (minmax) miniInputMax.setAttribute('placeholder', minmax[1]);
		if (value) miniInputMax.value = value[1];

		// set blur save event
		Wu.DomEvent.on(miniInputMax, 'blur', function () { 
			this.saveDualBlur(miniInputMax, miniInputMin, minmax[1], minmax[0], this.options);  // todo: mem leak
		}.bind(this), this);

		// Force numeric
		miniInputMax.onkeypress = Wu.Tools.forceNumeric;
		
		// remember
		this.max = miniInputMax;



		// create min input
		var miniInputMin = Wu.DomUtil.createId('input', 'field_mini_input_min_' + key, appendTo);
		miniInputMin.className = 'chrome-field-mini-input mini-input-dual';
		miniInputMin.setAttribute('placeholder', 'auto');
		miniInputMin.setAttribute('tabindex', tabindex[0]);
		if (minmax) miniInputMin.setAttribute('placeholder', minmax[0]);
		if (value) miniInputMin.value = value[0];

		// set blur save event
		Wu.DomEvent.on(miniInputMin, 'blur', function () { 
			this.saveDualBlur(miniInputMax, miniInputMin, minmax[1], minmax[0], this.options);  	// todo: mem leak
		}.bind(this), this);

		// Force numeric
		miniInputMin.onkeypress = Wu.Tools.forceNumeric;

		// remember
		this.min = miniInputMin;

	},

	saveDualBlur : function (maxElem, minElem, absoluteMax, absoluteMin, options) {
		var fn      = options.fn;
		var key     = options.key;

		fn(maxElem.value, minElem.value, absoluteMax, absoluteMin)
	},


	// ┌─┐┌─┐┬  ┌─┐┬─┐  ┬─┐┌─┐┌┐┌┌─┐┌─┐
	// │  │ ││  │ │├┬┘  ├┬┘├─┤││││ ┬├┤ 
	// └─┘└─┘┴─┘└─┘┴└─  ┴└─┴ ┴┘└┘└─┘└─┘

	initColorRange : function () {

		var appendTo    = this.options.appendTo;
		var key         = this.options.id;
		var right       = this.options.right;
		var value       = this.options.value;
		var presetFn    = this.options.presetFn;
		var className   = this.options.className;
		var customFn    = this.options.customFn;

		// Set styling
		var gradientStyle = this._gradientStyle(value);

		var _class = 'chrome-color-range-wrapper ';
		if ( className ) _class += className;

		var colorRangeWrapper = Wu.DomUtil.create('div', _class, appendTo)
		    colorRangeWrapper.setAttribute('key', key);


		var color = Wu.DomUtil.create('div', 'chrome-color-range', colorRangeWrapper);
		color.id = 'chrome-color-range_' + key;
		color.setAttribute('key', key);
		color.setAttribute('style', gradientStyle);

		// rememeber
		this._color = color;



		var clickCatcher = Wu.DomUtil.create('div', 'click-catcher displayNone', appendTo);
		clickCatcher.id = 'click-catcher-' + key;
		clickCatcher.setAttribute('key', key);

		// remember
		this._clicker = clickCatcher;





		var colorSelectorWrapper = Wu.DomUtil.create('div', 'chrome-color-selector-wrapper displayNone', colorRangeWrapper);
		colorSelectorWrapper.id = 'chrome-color-selector-wrapper-' + key;

		// remember;
		this._colorSelectorWrapper = colorSelectorWrapper;





		var colorBallWrapper = Wu.DomUtil.create('div', 'chrome-color-ball-wrapper', colorSelectorWrapper)

		var colorBall_3 = Wu.DomUtil.create('div', 'chrome-color-ball color-range-ball rangeball-3', colorBallWrapper);
		colorBall_3.id = 'color-range-ball-3-' + key;
		colorBall_3.style.background = value[4];
		colorBall_3.setAttribute('hex', value[4]);

		// remember
		this._colorball3 = colorBall_3;
		    


		var colorBall_2 = Wu.DomUtil.create('div', 'chrome-color-ball color-range-ball rangeball-2', colorBallWrapper);
		colorBall_2.id = 'color-range-ball-2-' + key;
		colorBall_2.style.background = value[2];
		colorBall_2.setAttribute('hex', value[2]);

		// remember
		this._colorball2 = colorBall_2;


		var colorBall_1 = Wu.DomUtil.create('div', 'chrome-color-ball color-range-ball rangeball-1', colorBallWrapper);
		colorBall_1.id = 'color-range-ball-1-' + key;
		colorBall_1.style.background = value[0];
		colorBall_1.setAttribute('hex', value[0]);

		// remember
		this._colorball1 = colorBall_1;


		this.initSpectrum(this, value[0], colorBall_1, key, customFn);
		this.initSpectrum(this, value[2], colorBall_2, key, customFn);
		this.initSpectrum(this, value[4], colorBall_3, key, customFn);


		// Color range presets
		// Color range presets
		// Color range presets

		var colorRangePresetWrapper = Wu.DomUtil.create('div', 'color-range-preset-wrapper', colorSelectorWrapper);

		// colorbrewer2.org
		var colorRangesPresets = this.options.colors;

		// remember presets
		this._presets = [];

		colorRangesPresets.forEach(function(preset, i) {

			var gradientStyle = this._gradientStyle(preset);
			var colorRangePreset = Wu.DomUtil.create('div', 'color-range-preset', colorRangePresetWrapper);
			colorRangePreset.id = 'color-range-preset-' + i;
			colorRangePreset.setAttribute('style', gradientStyle);
			colorRangePreset.setAttribute('hex', preset.join(','));

			this._presets.push(colorRangePreset);

			Wu.DomEvent.on(colorRangePreset, 'click', presetFn);

		}.bind(this));

		// select color on range
		Wu.DomEvent.on(color, 'click', function (e) {
			Wu.DomUtil.removeClass(colorSelectorWrapper, 'displayNone');
			Wu.DomUtil.removeClass(clickCatcher, 'displayNone');

		}, this);

		Wu.DomEvent.on(clickCatcher, 'click', function (e) {
			Wu.DomUtil.addClass(colorSelectorWrapper, 'displayNone');
			Wu.DomUtil.addClass(clickCatcher, 'displayNone');

		}, this);


		// Wu.DomEvent.on(clickCatcher, 'click', this.stopEditingColorRange, this);

	},

	toggleColorRange : function (e) {
	        
		var key = e.target.getAttribute('key');

		var rangeSelector = Wu.DomUtil.get('chrome-color-selector-wrapper-' + key);
		var clickCatcher = Wu.DomUtil.get('click-catcher-' + key);

		Wu.DomUtil.removeClass(rangeSelector, 'displayNone');
		Wu.DomUtil.removeClass(clickCatcher, 'displayNone');

	},

	stopEditingColorRange : function (e) {

		var key = e.target.getAttribute('key');

		var rangeSelector = Wu.DomUtil.get('chrome-color-selector-wrapper-' + key);
		var clickCatcher = Wu.DomUtil.get('click-catcher-' + key);

		Wu.DomUtil.addClass(rangeSelector, 'displayNone');
		Wu.DomUtil.addClass(clickCatcher, 'displayNone');

	},

	_gradientStyle : function (colorArray) {

		var gradientStyle = 'background: -webkit-linear-gradient(left, ' + colorArray.join() + ');';
		gradientStyle    += 'background: -o-linear-gradient(right, '     + colorArray.join() + ');';
		gradientStyle    += 'background: -moz-linear-gradient(right, '   + colorArray.join() + ');';
		gradientStyle    += 'background: linear-gradient(to right, '     + colorArray.join() + ');';

		return gradientStyle;

	},		


	// ┌─┐┌─┐┬  ┌─┐┬─┐  ┌┐ ┌─┐┬  ┬  
	// │  │ ││  │ │├┬┘  ├┴┐├─┤│  │  
	// └─┘└─┘┴─┘└─┘┴└─  └─┘┴ ┴┴─┘┴─┘

	initColorBall : function () {

		var appendTo    = this.options.appendTo;
		var key         = this.options.id;
		var fn          = this.options.fn;
		var right       = this.options.right;
		var on          = this.options.isOn;
		var className   = this.options.className;
		var value       = this.options.value;
		var showAlpha   = this.options.showAlpha;
		var showInput   = this.options.showInput;
		var format      = this.options.format;
		var _class 	= 'chrome-color-ball ';

		if ( className ) _class += className;

		this.color = Wu.DomUtil.create('div', _class, appendTo);
		this.color.id = 'color_ball_' + key;
		this.color.style.background = value;

		if ( !on ) Wu.DomUtil.addClass(this.color, 'disable-color-ball');
		if ( !right ) Wu.DomUtil.addClass(this.color, 'left-ball');

		
		// var that = this;
		this.initSpectrum({
			value     : value, 
			color     : this.color, 
			key       : key, 
			fn        : fn, 
			showAlpha : showAlpha, 
			showInput : showInput, 
			format    : format
		})


		// $(this.color).spectrum('set', '#660000');

	},


	initSpectrum : function (options) {

		var col = options.value;
		var wrapper = options.color;
		var key = options.key;
		var fn = options.fn;
		var showAlpha = options.showAlpha;
		var showInput = options.showInput;
		var format = options.format;

		if ( !format ) var format = 'hex';

		$(wrapper).spectrum({
			color: col,
			preferredFormat: format,
			showInitial: true,
			showInput: showInput,
			showAlpha: showAlpha,
			chooseText: 'Choose',
			cancelText: 'Cancel',
			containerClassName: 'dark clip',
			change: function(col) {

				if ( showAlpha ) {

					var color = {
						r : Math.round(col._r),
						g : Math.round(col._g),
						b : Math.round(col._b),
						a : col._a
					}

					var bg = Wu.Tools.rgbaStyleStr(color);


				} else {

					var r = Math.round(col._r).toString(16);
					var g = Math.round(col._g).toString(16);
					var b = Math.round(col._b).toString(16);

					if ( r.length == 1 ) r += '0';
					if ( g.length == 1 ) g += '0';
					if ( b.length == 1 ) b += '0';

					var color = '#' + r + g + b;
					var bg = color;

				}

				wrapper.style.background = bg;
				fn(color, key, wrapper);

			}		

		});

	},	


	// ┌┬┐┬┌┐┌┬  ┌┬┐┬─┐┌─┐┌─┐┌┬┐┌─┐┬ ┬┌┐┌
	// ││││││││   ││├┬┘│ │├─┘ │││ │││││││
	// ┴ ┴┴┘└┘┴  ─┴┘┴└─└─┘┴  ─┴┘└─┘└┴┘┘└┘

	initMiniDropDown : function () {

		var appendTo    = this.options.appendTo;
		var key         = this.options.id;
		var fn          = this.options.fn;
		var right       = this.options.right;
		var array 	= this.options.array;
		var selected    = this.options.selected;
		var reversed    = this.options.reversed;
		var className   = this.options.className;
		var _class = 'chrome chrome-mini-dropdown active-field select-field-wrap ';

		if ( className ) _class += className;

		// create dropdown
		var selectWrap = this.container = Wu.DomUtil.create('div', _class, appendTo);
		var select = this._select = Wu.DomUtil.create('select', 'active-field-select', selectWrap);
		select.setAttribute('key', key);

		// if ( selected ) 
		if ( reversed ) {
			if ( !selected ) Wu.DomUtil.addClass(selectWrap, 'full-width');
		} else {
			if ( selected )  Wu.DomUtil.addClass(selectWrap, 'full-width');
		}


		// WITHOUT PLACEHOLDER!!!
		// WITHOUT PLACEHOLDER!!!
		// WITHOUT PLACEHOLDER!!!

		// fill select options
		array.forEach(function (field, i) {
			var option = Wu.DomUtil.create('option', 'active-layer-option', select);
			option.value = field;		
			option.innerHTML = field;

			if ( !selected ) {
				if ( i == 0 ) option.selected = true;
			} else {
				if ( field == selected ) option.selected = true;	
			}
			
		});


		// WITH PLACEHOLDER!!!
		// WITH PLACEHOLDER!!!
		// WITH PLACEHOLDER!!!

		// // placeholder
		// var option = Wu.DomUtil.create('option', '', select);
		// option.innerHTML = 'Select column...';
		// option.setAttribute('disabled', '');
		// option.setAttribute('selected', '');

		// // fill select options
		// array.forEach(function (field, i) {
		// 	var option = Wu.DomUtil.create('option', 'active-layer-option', select);
		// 	option.value = field;		
		// 	option.innerHTML = field;
		// 	if ( field == selected ) option.selected = true;
		// });

		// select event
		Wu.DomEvent.on(select, 'change', fn); // todo: mem leak?

	},


	// ┬┌┐┌┌─┐┬ ┬┌┬┐
	// ││││├─┘│ │ │ 
	// ┴┘└┘┴  └─┘ ┴ 

	initInput : function  () {
		
		var appendTo    = this.options.appendTo;
		var key         = this.options.id;
		var fn          = this.options.fn;
		var value       = this.options.value;
		var placeholder = this.options.placeholder;
		var tabindex    = this.options.tabindex;
		var right       = this.options.right;
		var className   = this.options.className;
		var isOn        = this.options.isOn;
		var allowText   = this.options.allowText;
		var _class = 'chrome-field-input ';

		if ( className ) _class += className;

		// create
		var input = Wu.DomUtil.createId('input', 'field_input_' + key, appendTo);
		input.className = _class;
		input.setAttribute('placeholder', placeholder);
		input.setAttribute('tabindex', tabindex);

		this.input = input;
		
		// set value
		if (value) input.value = value;
		if (value == 0) input.value = value;
		if (!value) input.value = placeholder;

		// other options
		if ( !right ) Wu.DomUtil.addClass(input, 'left-input');
		if ( !isOn  ) Wu.DomUtil.addClass(input, 'left-input-kill');

		// set event
		// Wu.DomEvent.on(input, 'blur', fn);

		// Force numeric
		if ( !allowText ) input.onkeypress = Wu.Tools.forceNumeric;

		Wu.DomEvent.on(input, 'blur', this.blurInput, this);

		return input;	
	},

	blurInput : function (e) {
	
		this.options.fn(e);
	},

	// ┌┬┐┬┌┐┌┬  ┬┌┐┌┌─┐┬ ┬┌┬┐
	// ││││││││  ││││├─┘│ │ │ 
	// ┴ ┴┴┘└┘┴  ┴┘└┘┴  └─┘ ┴ 

	initMiniInput : function () {

		var appendTo    = this.options.appendTo;
		var key         = this.options.id;
		var fn          = this.options.fn;
		var value       = this.options.value;
		var placeholder = this.options.placeholder;
		var tabindex    = this.options.tabindex;
		var right       = this.options.right;
		var className   = this.options.className;
		var isOn        = this.options.isOn;
		var allowText   = this.options.allowText;


		var _class = 'chrome-field-mini-input ';
		if ( className ) _class += className;

		// create
		var miniInput = Wu.DomUtil.createId('input', 'field_mini_input_' + key, appendTo);
		miniInput.className = _class;
		miniInput.setAttribute('placeholder', placeholder);
		miniInput.setAttribute('tabindex', tabindex);

		this.input = miniInput;
		
		// set value
		if (value) miniInput.value = value;
		if (value == 0) miniInput.value = value;

		// console.log('miniInput value => ', value);
		// if (!value) miniInput.value = 1;		

		// other options
		if ( !right ) Wu.DomUtil.addClass(miniInput, 'left-mini');
		if ( !isOn  ) Wu.DomUtil.addClass(miniInput, 'left-mini-kill');

		// set event
		Wu.DomEvent.on(miniInput, 'blur', fn);

		// Force numeric
		if ( !allowText ) miniInput.onkeypress = Wu.Tools.forceNumeric;		    

	},


	initClicker : function () {

		var appendTo = this.options.appendTo;
		var id = this.options.id;
		var type = this.options.type;
		var fn = this.options.fn;
		var array = this.options.array;
		var selected = this.options.selected || '=';
		var className = this.options.className;



		// set index
		this._cidx = _.findIndex(array, selected);
		if (this._cidx > 0) this._cidx = 1;

		// create button
		var button = this._button = Wu.DomUtil.create('div', 'clicker-button ' + className, appendTo, selected);

		// click event, toggle array content
		Wu.DomEvent.on(button, 'click', function (e) {

			// set index
			this._cidx = this._cidx + 1;
			if (this._cidx == array.length) this._cidx = 0;

			// get content
			var content = array[this._cidx];

			// set content
			button.innerHTML = content;

			// callback
			fn(e, content);

		}, this);



	},


	forceNumeric : function (e) {

		// only allow '0-9' + '.' and '-'
		return e.charCode >= 45 && e.charCode <= 57 && e.charCode != 47;

	},	

	
	// ┬─┐┌─┐┌┬┐┬┌─┐
	// ├┬┘├─┤ ││││ │
	// ┴└─┴ ┴─┴┘┴└─┘			

	initRadio : function () {

		var appendTo  = this.options.appendTo;
		var key       = this.options.id;
		var fn        = this.options.fn;
		var className = this.options.className;
		var on        = this.options.isOn;
		var _class = 'layer-radio ';

		if ( className ) _class += className;

		var radio = Wu.DomUtil.create('div', _class, appendTo);
		radio.id = 'radio_' + key;

		if ( on ) {
			Wu.DomUtil.addClass(radio, 'radio-on');
			radio.setAttribute('state', 'true');
		} else {
			radio.setAttribute('state', 'false');
		}

		Wu.DomEvent.on(radio, 'click', this.toggleRadio, this);

		return radio;

	},

	toggleRadio : function (e) {

		var elem = e.target,
		    key = elem.getAttribute('key'),
		    on = elem.getAttribute('state');

		if ( on == 'false' ) {
			Wu.DomUtil.addClass(elem, 'radio-on');
			elem.setAttribute('state', 'true');
		} else {
			Wu.DomUtil.removeClass(elem, 'radio-on');
			elem.setAttribute('state', 'false');
		}

		this.options.fn(e);

	},


	// ┌─┐┌─┐┌┬┐
	// └─┐├┤  │ 
	// └─┘└─┘ ┴ 	

	initSet : function () {

		var appendTo  = this.options.appendTo;
		var key       = this.options.id;
		var className = this.options.className;
		var fn        = this.options.fn;
		var _class = 'chrome-set ';

		if ( className ) _class += className;

		// create
		var set = Wu.DomUtil.create('div', _class, appendTo);
		set.setAttribute('key', key);
		set.innerHTML = 'SET';

		Wu.DomEvent.on(set, 'click', this.toggleSet, this);

		return set;

	},


	toggleSet : function (e) {

		var elem = e.target;
		var key = elem.getAttribute('key');

		this.options.fn(key);

	},


	// ┌─┐┌─┐┌┬┐  ┌─┐┬  ┌─┐┌─┐┬─┐
	// └─┐├┤  │   │  │  ├┤ ├─┤├┬┘
	// └─┘└─┘ ┴   └─┘┴─┘└─┘┴ ┴┴└─

	initSetClear : function () {

		var appendTo  = this.options.appendTo;
		var key       = this.options.id;
		var fn        = this.options.fn;
		var className = this.options.className;
		var isOn      = this.options.isOn;
		var _class = 'setClear ';

		if ( className ) _class += className;

		// create
		var setClear = Wu.DomUtil.create('div', _class, appendTo);
		setClear.setAttribute('key', key);
		setClear.innerHTML = 'SET';

		// if on, mark
		if (isOn) {
			Wu.DomUtil.addClass(setClear, 'setClear-on');
			setClear.setAttribute('state', 'true');
			setClear.innerHTML = 'CLEAR';
		} else {
			setClear.setAttribute('state', 'false');
		}

		Wu.DomEvent.on(setClear, 'click', this.toggleSetClear, this);

		return setClear;

	},


	toggleSetClear : function (e) {

		var elem  = e.target;
		var id    = elem.id;
		var key   = elem.getAttribute('key');
		var state = elem.getAttribute('state');
		var on 	  = (state == 'true');

		if (on) {
			Wu.DomUtil.removeClass(elem, 'setClear-on');
			elem.setAttribute('state', 'false');
			elem.innerHTML = 'SET';
			var isOn = false;
		} else {
			Wu.DomUtil.addClass(elem, 'setClear-on');
			elem.setAttribute('state', 'true');
			elem.innerHTML = 'CLEAR';
			var isOn = true;
		}

		this.options.fn(key, isOn);
	},	


	// ┌─┐┬ ┬┬┌┬┐┌─┐┬ ┬
	// └─┐││││ │ │  ├─┤
	// └─┘└┴┘┴ ┴ └─┘┴ ┴

	initSwitch : function () {

		var isOn      = this.options.isOn;
		var right     = this.options.right;
		var id        = this.options.id;
		var appendTo  = this.options.appendTo;
		var fn        = this.options.fn;
		var className = this.options.className;
		var disabled  = this.options.disabled;

		this.value = id;

		// Create classname
		var divclass = 'chrome-switch-container';
		if (isOn) divclass += ' switch-on';
		if (right) divclass += ' right-switch';
		if (disabled) divclass += ' disabled-switch';
		if (className) divclass += ' ' + className;

		// Create button
		var _switch = this._switch = Wu.DomUtil.create('div', divclass, appendTo);
		_switch.setAttribute('key', id);
		_switch.id = 'switch_' + id;

		// Set on/off state
		if (isOn) {
			_switch.setAttribute('state', 'true');
		} else {
			_switch.setAttribute('state', 'false');
		}

		// Add hooks
		if ( !disabled ) Wu.DomEvent.on(_switch, 'click', this.toggleSwitch, this);

		return _switch;

	},


	// Toggle switch
	toggleSwitch : function (e) {

		var stateAttrib = e.target.getAttribute('state');
		var on          = (stateAttrib == 'true');
		var key         = e.target.getAttribute('key');

		if (on) {
			e.target.setAttribute('state', 'false');
			Wu.DomUtil.removeClass(e.target, 'switch-on');
			var isOn = false;

		} else {
			e.target.setAttribute('state', 'true');
			Wu.DomUtil.addClass(e.target, 'switch-on');
			var isOn = true;
		}	

		// save
		this.options.fn(e, isOn)
	},	


	// ┌┬┐┌─┐┌─┐┌─┐┬  ┌─┐  ┌┐ ┬ ┬┌┬┐┌┬┐┌─┐┌┐┌
	//  │ │ ││ ┬│ ┬│  ├┤   ├┴┐│ │ │  │ │ ││││
	//  ┴ └─┘└─┘└─┘┴─┘└─┘  └─┘└─┘ ┴  ┴ └─┘┘└┘

	initToggleButton : function (e) {

		var option1   = this.options.option1;
		var option2   = this.options.option2;
		var id        = this.options.id;
		var appendTo  = this.options.appendTo;
		var fn        = this.options.fn;
		var className = this.options.className;
		var selected  = this.options.selected;


		// Create classname
		var divclass = 'chrome-toggle-button-container';
		if (className) divclass += ' ' + className;

		// Create button
		var _toggleButton = this._toggleButton = Wu.DomUtil.create('div', divclass, appendTo);
		_toggleButton.setAttribute('key', id);
		_toggleButton.id = 'togglebutton_' + id;

		var _option1 = Wu.DomUtil.create('div', 'toggle-button-option-one', _toggleButton, option1)
		var _option2 = Wu.DomUtil.create('div', 'toggle-button-option-one', _toggleButton, option2)

		

	}

});









Wu.fieldLine = Wu.Class.extend({

	initialize : function (options) {

		this._initContent(options);

		// return this;

	},

	_initContent : function (options) {

		var key          = options.id;
		var appendTo     = options.appendTo;
		var title        = options.title;
		var fn           = options.fn;
		var input        = options.input;
		var className    = options.className ? options.className : '';
		var childWrapper = options.childWrapper;
		var cName = 'chrome-metafield-line ' + className;

		this.container = Wu.DomUtil.create('div', cName, appendTo);
		this.container.id = 'field_wrapper_' + key;

		// Children container
		if ( childWrapper ) {
			this.childWrapper = Wu.DomUtil.create('div', 'chrome-metafield-line-children', appendTo);
			this.childWrapper.id = childWrapper;
		}

		// Create input field
		if ( input ) {
			
			// create
			var fieldName = Wu.DomUtil.createId('input', 'field_input_' + key, this.container);
			fieldName.className = 'chrome-field-input';
			fieldName.setAttribute('name', 'field_input_' + key);
			fieldName.setAttribute('placeholder', key);

			// set title 
			if (title) fieldName.value = title;

			// set event
			Wu.DomEvent.on(fieldName, 'blur', fn);
		
		
		} else {

			// Create "normal" text line
			var fieldName = Wu.DomUtil.create('div', 'chrome-field-line', this.container);
			fieldName.innerHTML = title ? title : key;
		}

		return this.container;
	}

});








