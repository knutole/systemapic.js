Wu.Chrome.SettingsContent.Styler = Wu.Chrome.SettingsContent.extend({

	_carto : {},

	options : {
		dropdown : {
			staticText : 'Fixed value',
			staticDivider : '-'
		}
	},

	// todo: remove globesar name
	globesar : true,

	_initialize : function () {

		// init container
		this._initContainer();

		// add events
		this._addEvents();

		// shortcut
		this._shortcut();
		
	},
	
	_shortcut : function () {
		app.Tools = app.Tools || {};
		app.Tools.Styler = this;
	},

	_initContainer : function () {

		// Create container
		this._container = Wu.DomUtil.create('div', 'chrome chrome-content chrome-pane styler', this.options.appendTo);
	},

	_initLayout : function () {

		if (!this._project) return;

		// Scroller
		this._midSection 	= Wu.DomUtil.create('div', 'chrome-middle-section', this._container);
		this._midOuterScroller 	= Wu.DomUtil.create('div', 'chrome-middle-section-outer-scroller', this._midSection);		
		this._midInnerScroller 	= Wu.DomUtil.create('div', 'chrome-middle-section-inner-scroller', this._midOuterScroller);

		// Active layer
		this.layerSelector = this._initLayout_activeLayers(false, false, this._midInnerScroller); // appending to this._midSection

		// Style settings wrapper
		this._fieldsWrapper = Wu.DomUtil.create('div', 'chrome-field-wrapper', this._midInnerScroller);

		// Legends wrapper
		this._legendWrapper = Wu.DomUtil.create('dov', 'chrome-legend-wrapper', this._midInnerScroller);

		// update style button
		this._buttonWrapper = Wu.DomUtil.create('div', 'button-wrapper displayNone', this._container);
		this._updateStyleButton = Wu.DomUtil.create('div', 'smooth-fullscreen-save update-style', this._buttonWrapper, 'Update Style');

		// Event for click button
		Wu.DomEvent.on(this._updateStyleButton, 'click', this._updateStyle, this);		

		// Ability to save styling as a template
		this._initTemplateContent();

		// Mark inited
		this._inited = true;

	},


	_initStyle : function () {


		// Get layer meta
		this.getLayerMeta();

		// Init styling templates
		this._initTemplates();

		// Init styling options
		this._initStylingOptions();

		// Init legend options
		this._initLegendOptions();

	},


	_initCubeStyler : function () {

		this._carto = this._layer.getStyling();

		var options = {
			carto 	  : this._carto,
			layer 	  : this._layer,
			project   : this._project,
			styler 	  : this,
			meta 	  : this._meta,
			columns   : this._columns,
			container : this._fieldsWrapper
		};

		this._rasterStyler = new Wu.RasterStyler(options);

	},

	_initStylingOptions : function () {

		var options = {
			carto 	: this._carto,
			layer 	: this._layer,
			project : this._project,
			styler 	: this,
			meta 	: this._meta,
			columns : this._columns,
			container : this._fieldsWrapper
		};


		// create point styler
		this._pointStyler = new Wu.Styler.Point(options);

		// create polygon styler
		this._polygonStyler = new Wu.Styler.Polygon(options);

		// create line styler
		this._lineStyler = new Wu.Styler.Line(options);

	},

	_initLegendOptions : function () {

		var legendOptions = {			
			layer     : this._layer,
			carto     : this._carto,
			globesar  : this.globesar, 		// todo: remove client name, make truly customizable
			container : this._legendWrapper
		};

		this._legendStyler = new Wu.Legend(legendOptions);


		Wu.DomUtil.removeClass(this._legendStyler._legensOuter, 'displayNone');		
	},

	// Inits Save Template HTML
	_initTemplateContent : function () {

		// Save template stuff
		this._saveAsTemplateButton = Wu.DomUtil.create('div', 'save-as-template-button', this._buttonWrapper, 'Save as template');
		this._templateSaverWrapper = Wu.DomUtil.create('div', 'save-as-template-wrapper hidden-template-dialogue', this._buttonWrapper);
		this._templateSaverError = Wu.DomUtil.create('div', 'save-as-template-error', this._templateSaverWrapper);
		this._templateSaverInput = Wu.DomUtil.create('input', 'save-as-template-input-name', this._templateSaverWrapper);
		this._templateSaverInput.setAttribute('tabindex', -1);
		this._templateSaverInput.setAttribute('placeholder', 'template name');
		this._templateSaverInput.setAttribute('type', 'text');
		this._templateSaverOK = Wu.DomUtil.create('div', 'save-as-template-OK-button smooth-fullscreen-save', this._templateSaverWrapper, 'OK');
		this._templateSaverCancel = Wu.DomUtil.create('div', 'save-as-template-cancel-button', this._templateSaverWrapper, 'Cancel');

		// Open save template dialogue
		Wu.DomEvent.on(this._saveAsTemplateButton, 'click', this._openSaveTempateDialogue, this);

		// Cancel save template dialogie
		Wu.DomEvent.on(this._templateSaverCancel, 'click', this._cancelTemplateDialogue, this);

		// OK, save template button
		Wu.DomEvent.on(this._templateSaverOK, 'click', this._okSaveTemplate, this);
	},

	// Open Save Template Dialogue.
	_openSaveTempateDialogue : function () {
		Wu.DomUtil.removeClass(this._templateSaverWrapper, 'hidden-template-dialogue');
		this._templateSaverInput.innerHTML = '';
		this._templateSaverInput.value = '';
	},

	// Cancel save template
	_cancelTemplateDialogue : function () {
		Wu.DomUtil.addClass(this._templateSaverWrapper, 'hidden-template-dialogue');
		Wu.DomUtil.removeClass(this._templateSaverInput, 'error-template-input');

		this._templateSaverError.innerHTML = '';
		this._templateSaverInput.innerHTML = '';
		this._templateSaverInput.value = '';
	},

	// OK – save temlpate button
	_okSaveTemplate : function () {

		var error = false;

		// validate
		var val = this._templateSaverInput.value;
		if ( !val || val == '' ) {
			this._templateSaveError('No name given');
			error = true;
			return;
		}

		this.templates.forEach(function(t) {

			if ( t.name && t.name == val ) {
				this._templateSaveError('That name is already taken');
				error = true;
			}

		}.bind(this));


		if (error) return;
		
		// save
		this._saveTemplate(val);

	},


	// Save template error message
	_templateSaveError : function (message) {
		this._templateSaverError.innerHTML = message;
		Wu.DomUtil.addClass(this._templateSaverInput, 'error-template-input');
	},

	// Do save template
	_saveTemplate : function (name) {
		this._templateSaverError.innerHTML = '';
		Wu.DomUtil.removeClass(this._templateSaverInput, 'error-template-input');
		Wu.DomUtil.addClass(this._templateSaverWrapper, 'hidden-template-dialogue');

		this.saveStyleTemplate(name);
	},

	// *************************************************************** //
	// * TEMPLATES TEMPLATES TEMPLATES TEMPLATES TEMPLATES TEMPLATES * // 
	// *************************************************************** //

	_initTemplates : function () {	

		this._refreshTemplates();

		if ( this.templates.length < 1 ) return;

		// create dropdown
		var selectWrap = Wu.DomUtil.create('div', 'chrome chrome-content active-layer select-wrap', this._fieldsWrapper);
		var select = this._select = Wu.DomUtil.create('select', 'active-layer-select', selectWrap);

		// placeholder
		var option = Wu.DomUtil.create('option', '', select);
		option.innerHTML = 'Select styling templates';
		option.setAttribute('disabled', '');
		option.setAttribute('selected', '');

		// fill select options
		this.templates.forEach(function (template) {

			var option = Wu.DomUtil.create('option', 'active-layer-option', select);
			option.value = template.uuid;
			option.innerHTML = template.name;
		});

		// select event
		Wu.DomEvent.on(select, 'change', this._selectTemplate, this); // todo: mem leak?

	},


	_refreshTemplates : function () {

		this.templates = [];

		// Get file ID
		var fileId = this._layer.store.file;

		// Get file
		var file = app.Account.getFile(fileId);

		if (!file) return;

		// Get all styling templates
		var styleTemplates = file.getStyleTemplates();

		if (!styleTemplates) return;

		styleTemplates.forEach(function (t) {
			var tJ = JSON.parse(t);
			this.templates.push(tJ);
		}.bind(this));

	},	

	_selectTemplate : function (e) {		

		var selected = e.target.value;

		this.templates.forEach(function (template) {
			if ( template.uuid == selected ) {
				this._carto = template.carto;
				this._legend = template.legend;
			}
		}.bind(this));

		this._updateStyle(true);

		this._pointStyler._refresh();
		this._lineStyler._refresh();
		this._polygonStyler._refresh();		

	},

	saveStyleTemplate : function (name) {

		// Get file ID
		var fileId = this._layer.store.file;

		// Get file
		var file = app.Account.getFile(fileId);
		
		// Create template
		var template = {
		   uuid : Wu.Util.guid('style-template'),
		   timestamp : Date.now(),
		   carto : this._carto,
		   legend : this._layer.store.legends,
		   createdBy : app.Account.getUuid(),
		   name : name
		};

		var templateStr = JSON.stringify(template);

		// Set styling template
		file.setStyleTemplate(templateStr);

	},


	// Marks button to changed state
	markChanged : function () {
		Wu.DomUtil.addClass(this._updateStyleButton, 'marked-changed');
	},

	// Unmarks button to changed state
	unmarkChanged : function () {
		Wu.DomUtil.removeClass(this._updateStyleButton, 'marked-changed');
	},

	// Update style
	_updateStyle : function (newLegend) {

		if ( this._layer.isCube() ) {

			this.type = 'cube';
			this._rasterStyler.setCarto(this._rasterStyler.stops);
			this._updateCube();

			return;
		}

		// Update point
		this._pointStyler.setCarto(this._carto.point);
		this._pointStyler.updateStyle();

		// Update point
		this._lineStyler.setCarto(this._carto.line);
		this._lineStyler.updateStyle();

		// Update point
		this._polygonStyler.setCarto(this._carto.polygon);
		this._polygonStyler.updateStyle();

		var refresh = newLegend ? this._legend : false;
		this._legendStyler.refreshLegend(refresh);

		// Unmark changed
		this.unmarkChanged();
		
	},



	_updateCube : function () {

		var stops = this._rasterStyler.stops;

		// stops[0].val;
		// stops[0].col;
		// stops[0].opacity;

		// stops[1].val;
		// stops[1].col;
		// stops[1].opacity;

		if ( !stops[0].opacity ) stops[0].opacity = 1;
		var RGB_one = Wu.Tools.color2RGB(stops[0].col);
		var RGBA_one = 'rgba(' + RGB_one.r + ',' + RGB_one.g + ',' + RGB_one.b + ',' + stops[0].opacity + ')';

		if ( !stops[1].opacity ) stops[1].opacity = 1;			
		var RGB_two = Wu.Tools.color2RGB(stops[1].col);
		var RGBA_two = 'rgba(' + RGB_two.r + ',' + RGB_two.g + ',' + RGB_two.b + ',' + stops[1].opacity + ')';

		


		var styleCSS = 	'#layer {' +
				'raster-opacity: 1;' + 
				'raster-colorizer-default-mode: linear;' + 
				'raster-colorizer-default-color: transparent;' +
				'raster-comp-op: color-dodge;' +
				'raster-colorizer-stops:' +
				'stop(' + (stops[0].val-1) + ', rgba(0,0,0,0))' + 
				'stop(' + stops[0].val + ', ' + RGBA_one + ')' + 
				'stop(' + stops[1].val + ', ' + RGBA_two + ')' +
				'stop(255, rgba(0,0,0,0), exact);' +
				'}';



		// var styleJSON = JSON.stringify(stops);				
		var styleJSON = stops;				

		// update pile layer
		this._layer.updateStyle(styleCSS);


		// save JSON style to `model.style` -> https://github.com/systemapic/wu/blob/master/models/layer.js#L66
		this._layer.setStyling(stops); // will be stringified in setStyling fn

		// @jorgen: use `this._layer.getStyling() to get styleJSON 

		// todo: renmae setStyling to setStyleJSON... (must update many places)
	},

	_refresh : function () {
		this._flush();
		this._initLayout();
	},

	_flush : function () {
		this._container.innerHTML = '';
	},

	show : function () {
		if (!this._inited) this._initLayout();

		// hide others
		this.hideAll();
		
		this.showing = true;

		// show this
		this._container.style.display = 'block';

		// mark button
		Wu.DomUtil.addClass(this.options.trigger, 'active-tab');
		
		// Enable settings from layer we're working with
		var layerUuid = this._getActiveLayerUuid();
		if (layerUuid) this._selectedActiveLayer(false, layerUuid);		

		// Select layer we're working on
		var options = this.layerSelector.childNodes;
		for (var k in options) {
			if (options[k].value == layerUuid) options[k].selected = true;
		}
	},

	closed : function () {

		// clean up
		this._tempRemoveLayers();
	},	


	// event run when layer selected 
	_selectedActiveLayer : function (value, uuid) {

		Wu.DomUtil.removeClass(this._buttonWrapper, 'displayNone');

		// clear wrapper content
		this._fieldsWrapper.innerHTML = '';
		this._legendWrapper.innerHTML = '';

		// get layer_id
		this.layerUuid = uuid || value;

		// get layer
		this._layer = this._project.getLayer(this.layerUuid);

		// return if no layer
		if (!this._layer || !this._layer.isStylable()) return;

		// remember layer for other tabs
		this._storeActiveLayerUuid(this.layerUuid);		

		// get current style, returns default if none
		var style = this._layer.getStyling();

		// define tab
		this.tabindex = 1;

		// set local cartoJSON
		this._carto = style || {};

		// Clear legend objects
		this.oldLegendObj = false;
		this.legendObj = false;

		// if ( this._layer.isCube() ) {
		console.log('styleAsRaster??', this._layer.styleAsRaster(), this);
		if ( this._layer.styleAsRaster() ) {
			
			// add GUI for cube styling here!
			this._initCubeStyler();

		} else {

			// init style json
			this._initStyle();
		}

		// Add temp layer
		this._tempaddLayer();

	},

	
	// Get all metafields	
	getLayerMeta : function () {

		// Get layer
		var layer = this._project.getLayer(this.layerUuid);
		
		// Get layermeta
		var layerMeta = layer.getMeta();

		// Get columns
		this._columns = layerMeta.columns;

		// remove _columns key
		this._columns._columns = null;
		delete this._columns._columns;

		// get metafields
		this._meta = [this.options.dropdown.staticText, this.options.dropdown.staticDivider];

		// add non-date items
		for (var k in this._columns) {
			if ( k.substring(0, 7) != 'the_geo' ) this._meta.push(k);
		}
	},

	createCarto : function (json, callback) {

		var options = {
			style : json,
			columns : this._columns
		};

		// get carto from server
		app.api.json2carto(options, callback.bind(this));
	},

	// UNUSED Function
	//clearBuggyFiles : function () {
	//	// Get file ID
	//	var fileId = this._layer.store.file;
	//	// Get file
	//	var file = app.Account.getFile(fileId);
	//	file.setStyleTemplates([]);
	//}

 });
