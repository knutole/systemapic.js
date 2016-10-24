Wu.Dropdown = Wu.Class.extend({
    
    // this function will run automatically on new Wu.Dropdown()
	initialize : function (options) {
  		Wu.setOptions(this, options); // will put options in this.options
    	this._initLayout();
	},

	_initLayout : function () {
		// set class name
		var className = 'base-layer-dropdown-container ';
		if (this.options.className) className += this.options.className;

		this._baseLayerDropdownContainer = Wu.DomUtil.create('div', className, this.options.appendTo);
		this._initLayoutActiveLayers();
		this._initEventsListners();
	},

	_initLayoutActiveLayers : function (options) {
		
		this._activeLayersWrap = Wu.DomUtil.create('div', 'baselayer-dropdown-wrapper', this._baseLayerDropdownContainer);
		this._selectWrap = Wu.DomUtil.create('div', 'chrome chrome-content active-layer select-wrap', this._activeLayersWrap);
		this._select = Wu.DomUtil.create('div', 'form-combobox_inner', this._selectWrap);
		this._form_combobox_input = Wu.DomUtil.create('div', 'form-combobox_input', this._select);
		this._form_combobox__options_wrapper = Wu.DomUtil.create('div', 'form-combobox_options_wrapper', this._select);
		this._form_combobox__options = Wu.DomUtil.create('ul', 'form-combobox_options', this._form_combobox__options_wrapper);


		this.options.options = [];

		// Create select options
		this.options.content.forEach(function(selectOption, i) {
			var option = this.options.options[i] = Wu.DomUtil.create('li', 'form-combobox_option item', this._form_combobox__options, selectOption.title);

			if (selectOption.disabled) {
				Wu.DomUtil.addClass(option, "disabled-option");
				Wu.DomEvent.on(option, 'click', function (e) {
					Wu.DomEvent.stop(e);
				}, this);
				return;
			}

			option.setAttribute('data-value', selectOption.value);
			option.id = selectOption.value;

			if ( selectOption.isSelected ) {
				Wu.DomUtil.addClass(option, 'hover');
				this._selectOption = option;
				this._hoverItem = option;
				this._form_combobox_input.setAttribute('data-value', selectOption.value);
				this._form_combobox_input.innerHTML = selectOption.title;
			}

			Wu.DomEvent.on(option, 'click', this._changeActive, this);
			Wu.DomEvent.on(option, 'mouseover', this._optionHover, this);
			Wu.DomEvent.on(option, 'mousemove', this._optionHover, this);

		}.bind(this));

		if (!this._selectOption && this.options.placeholder) {
			this._form_combobox_input.setAttribute('data-value', null);
			this._form_combobox_input.innerHTML = this.options.placeholder;				
		}

		this._form_combobox_input.setAttribute("tabindex", 1);
		Wu.DomEvent.on(this._form_combobox_input, 'keydown', this._onKeydown, this);
		
	},



	setFromUuid : function (layerUuid) {
	
		// Select layer we're working on
		// var options = this.layerSelector.options.options;
		var options = this.options.options;

		for (var k in options) {

			var isElem = Wu.Tools.isElement(options[k]);
			if ( !isElem ) return;

			var uuid = options[k].getAttribute('data-value');
			if ( uuid == layerUuid ) {
				var title = options[k].innerHTML;
				this.setValue({
					value: uuid,
					title: title
				});
			}
		}

	},





	_initEventsListners : function () {
		Wu.DomEvent.on(this._select, 'click', this._toggleListItems, this);
		Wu.DomEvent.on(this._selectWrap, 'click', function (e) {
			Wu.DomEvent.stop(e);
		}, this);
		Wu.Mixin.Events.on('appClick', this._hideListItems, this);
	},

	_toggleListItems : function () {
		if (Wu.DomUtil.hasClass(this._form_combobox__options_wrapper, "open")) {
			Wu.DomUtil.removeClass(this._form_combobox__options_wrapper, "open");
		} else {
			Wu.DomUtil.addClass(this._form_combobox__options_wrapper, "open");
		}
	},

	_showListItems : function () {
		if (!Wu.DomUtil.hasClass(this._form_combobox__options_wrapper, "open")) {
			Wu.DomUtil.addClass(this._form_combobox__options_wrapper, "open");
		}
	},

	_hideListItems : function () {
		if (Wu.DomUtil.hasClass(this._form_combobox__options_wrapper, "open")) {
			Wu.DomUtil.removeClass(this._form_combobox__options_wrapper, "open");
		}
	},

	_changeActive : function (e) {
		Wu.DomEvent.stop(e);
		this._toggleListItems();
		this.setValue({
			value: e.currentTarget.getAttribute('data-value'),
			title: e.currentTarget.innerHTML
		});
	},

	getValue: function () {
		return {
			value: this._form_combobox_input.getAttribute('data-value'),
			title: this._form_combobox_input.innerHTML
		}
	},

	setValue: function (selectOption) {

		this._form_combobox_input.setAttribute('data-value', selectOption.value);
		this._form_combobox_input.innerHTML = selectOption.title;

		if (this._selectOption && Wu.DomUtil.hasClass(this._selectOption, "hover")) {
			Wu.DomUtil.removeClass(this._selectOption, 'hover');
		}
		
		this._selectOption = document.getElementById(selectOption.value);
		Wu.DomUtil.addClass(this._selectOption, 'hover');
		this._hoverItem = this._selectOption;
		this.options.fn(selectOption.value);
	},

	_optionHover: function (e) {
		if (this._hoverItem && Wu.DomUtil.hasClass(this._hoverItem, "hover")) {
			Wu.DomUtil.removeClass(this._hoverItem, "hover");	
		}
		this._hoverItem = e.currentTarget;
		Wu.DomUtil.addClass(e.currentTarget, "hover");
	},

	_hoverDown: function () {
		if (this._hoverItem.nextSibling && Wu.DomUtil.hasClass(this._hoverItem.nextSibling, "form-combobox_option")) {
			Wu.DomUtil.removeClass(this._hoverItem, "hover");
			this._hoverItem = this._hoverItem.nextSibling;
			if (this._hoverItem && Wu.DomUtil.hasClass(this._hoverItem, "disabled-option")) {
				this._hoverDown();
				return;
			}
			Wu.DomUtil.addClass(this._hoverItem, "hover");
		}
	},

	_hoverUp: function () {
		if (this._hoverItem.previousSibling && Wu.DomUtil.hasClass(this._hoverItem.previousSibling, "form-combobox_option")) {
			Wu.DomUtil.removeClass(this._hoverItem, "hover");
			this._hoverItem = this._hoverItem.previousSibling;
			if (this._hoverItem && Wu.DomUtil.hasClass(this._hoverItem, "disabled-option")) {
				this._hoverUp();
				return;
			}
			Wu.DomUtil.addClass(this._hoverItem, "hover");
		}
	},

	_onKeydown: function (e) {

		var key = event.which ? event.which : event.keyCode;

		if (key === 32) {
			this._showListItems();
		}

		if (key === 27) {
			this._hideListItems();
		}

		if (key === 40) {
			this._hoverDown();
		}

		if (key === 38) {
			this._hoverUp();
		}

		if (key === 13) {
			this.setValue({
				value: this._hoverItem.id,
				title: this._hoverItem.innerHTML
			});
			this._hideListItems();
		}
		if (key === 38 || key === 40 || key === 27 || key === 32 || key === 13) {
			Wu.DomEvent.stop(e);	
		}


		if ( key > 48 && key < 90 ) {
			this._setKey(key);
		}

		
	},

	_setKey : function (key) {

		// Get character
		var _char = Wu.Tools.keyMap(key).toUpperCase();

		// Go through list of options, jump to first hit
	 	for ( var k in this.options.content ) {

	 		var c = this.options.content[k];

	 		// Stop if list item is not an object for some reason
	 		if ( typeof c !== 'object' ) return;

	 		// Get first character in option
	 		var _firstChar = c.title.charAt(0).toUpperCase();

	 		// If it's a match
			if ( _char == _firstChar ) {

				// Set value on list
				this.setValue({
					value: c.value,
					title: c.title
				});

				// Stop
				return;
			}		
	 	}
		
	}


});