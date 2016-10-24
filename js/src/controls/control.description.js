// app.MapPane._controls.description
L.Control.Description = Wu.Control.extend({
	
	type : 'description',

	options: {
		position : 'bottomright' 
	},

	
	onAdd : function (map) {

		if ( app.options.customizations && app.options.customizations.satelliteView ) {
			this.satelliteView = true;
		}

		var className = 'leaflet-control-description',
		    container = L.DomUtil.create('div', className),
		    options   = this.options;

		// Wrapper for multiple layers
		this._multipleLegendOuter = Wu.DomUtil.create('div', 'description-multiple-toggle-wrapper', container);
		this._multipleLegendInner = Wu.DomUtil.create('div', 'description-multiple-toggle-inner', this._multipleLegendOuter);
		this._multipleLegendInnerContent = Wu.DomUtil.create('div', 'description-multiple-toggle-inner-content', this._multipleLegendInner);
		this._content = Wu.DomUtil.create('div', 'description-control-content', container);
		this._outer = Wu.DomUtil.create('div', 'description-control-content-box', this._content);	

		return container; // turns into this._container on return
	},

	_initContainer : function () {          

		// hide by default
		this._container.style.display = "none";

		// create scroller 
		this._inner = Wu.DomUtil.create('div', 'description-control-inner', this._outer);

		// header
		this._header = Wu.DomUtil.create('div', 'description-control-header-section', this._inner);

		// toggle
		this._toggle = Wu.DomUtil.create('div', 'description-control-minimize', this._multipleLegendOuter, '<i class="fa fa-arrow-down"></i>');

		// SINGLE LEGEND VIEW WRAPPER
		this._singleLegendViewWrapper = Wu.DomUtil.create('div', 'single-legend-view-wrapper', this._inner);

		// description
		this._description = Wu.DomUtil.create('div', 'description-control-description displayNone', this._singleLegendViewWrapper);

		// Toggle open
		this._toggeOpener = Wu.DomUtil.create('div', 'description-control-toggle-opener displayNone', this._singleLegendViewWrapper);
			
		// Description box title
		this._metaTitle = Wu.DomUtil.create('div', 'description-control-meta-title', this._singleLegendViewWrapper);
		this._metaOuterContainer = Wu.DomUtil.create('div', 'description-meta-outer-container', this._singleLegendViewWrapper);

		// COMPACT LEGEND VIEW WRAPPER		
		this._compactLegendViewWrapper = Wu.DomUtil.create('div', 'compact-legend-view-wrapper displayNone', this._inner);
		this._compactExpand = Wu.DomUtil.create('div', 'compact-legends-expand displayNone', this._outer, '<i class="fa fa-arrow-up"></i>');
		this._compactLegendInnerScroller = Wu.DomUtil.create('div', 'compact-legend-scroll-wrapper', this._compactLegendViewWrapper);

		// Meta
		this._metaContainer = Wu.DomUtil.create('div', 'description-control-meta-container', this._metaOuterContainer);

		// Init satellite path container
		this.satelliteAngle = new Wu.satelliteAngle({angle : false, path: false, appendTo : this._metaOuterContainer});
		
		// Opacity 
		this._opacityWrapper = Wu.DomUtil.create('div', 'description-opacity-wrapper', this._metaOuterContainer);
		this._opacityTitle = Wu.DomUtil.create('div', 'description-control-opacity-title', this._opacityWrapper, 'Opacity:');
		this._opacityContainer = Wu.DomUtil.create('div', 'description-control-opacity-container', this._opacityWrapper);

		// legend
		this._legendContainer = Wu.DomUtil.create('div', 'description-control-legend-container', this._singleLegendViewWrapper);

		// copyright
		this._copyright = Wu.DomUtil.create('div', 'description-copyright', this._outer, '');

		// If mobile: enable complete collapse of legend
		this._legendCollapsed = Wu.DomUtil.create('div', 'legend-collapsed-mobile displayNone', this._container, 'Legend');

		// add event hooks
		// this._addHooks();
		this._listeners();
	},

	_addHooks : function () {
		
		var isMobile = L.Browser.mobile;
		
		if ( app.isMobile || isMobile ) { // app.isMobile is not ready yet...


			// Toggle while clicking on the container on toch devices
			Wu.DomEvent.on(this._container, 'click', this.closeMobile, this);
			Wu.DomEvent.on(this._legendCollapsed, 'click', this.openMobile, this);
			Wu.DomEvent.on(this._legendCollapsed, 'click',  Wu.DomEvent.stop, this);
			Wu.DomEvent.on(this._legendCollapsed, 'onscroll scroll mousewheel', Wu.DomEvent.stopPropagation, this);

			
		} else {
			// collapsers
			Wu.DomEvent.on(this._toggle, 'click', this.toggle, this);
		}

		// prevent map double clicks
		Wu.DomEvent.on(this._container, 'mousedown click dblclick',  Wu.DomEvent.stop, this);

		Wu.DomEvent.on(this._multipleLegendInnerContent, 'onscroll scroll mousewheel', Wu.DomEvent.stopPropagation, this);

		Wu.DomEvent.on(this._inner, 'onscroll scroll mousewheel', Wu.DomEvent.stopPropagation, this);

		Wu.DomEvent.on(this._compactExpand, 'click', this.toggle, this);

		Wu.DomEvent.on(this._toggeOpener, 'click', this.toggleOpen, this);


	},

	closeMobile : function () {
		Wu.DomUtil.addClass(this._inner, 'displayNone');
		Wu.DomUtil.removeClass(this._legendCollapsed, 'displayNone');
	},

	openMobile : function () {
		Wu.DomUtil.removeClass(this._inner, 'displayNone');
		Wu.DomUtil.addClass(this._legendCollapsed, 'displayNone');
	},

	_listeners : function () {
		Wu.Mixin.Events.on('updateLegend', this._legendIsBeingUpdated, this);
		Wu.Mixin.Events.on('phantomjs', this.compactLegend, this);
		Wu.Mixin.Events.on('toggleLeftChrome', this._toggleLeftChrome, this);
	},

	_toggleLeftChrome : function (e) {

		// Stopping computers and pads
		if ( !app.isMobile || !app.isMobile.mobile ) return;

		var isOpen = e.detail.leftPaneisOpen;
		var display = isOpen ? "none" : "block";
		this._container.style.display = display;
	},


	_legendIsBeingUpdated : function (e) {

		// If we are showing all legends at once!
		if ( this.miniLegend ) {
			return this.compactLegend();
		}

		// If we are showing one and one legend
		var layerID = e.detail.layerUuid;
		if (layerID == this.legendUuid) {
			this.setHTMLfromStore(layerID);
		}
	},
	
	_isActive : function () {
		if (!this._project) return false;
		return this._project.getControls()[this.type];
	},

	show : function () {
		if (!this._container) return;
		this._isActive() ? this._show() : this._hide();
		this.toggleScale(true);
	},

	hide : function () {
		if (!this._container) return;
		this._hide();
	},

	_show : function () {

		this.refresh();
	},

	refresh : function () {
		this.showHide();
		this._calculateHeight();
	},

	_layerEnabled : function (e) {

		// console.log('control.description layerEnabled', e, this.layers);
	},

	_layerDisabled : function (e) {
		// console.log('layer _layerDisabled', e);
	},	

	showHide : function () {
		// console.error('showHide', this);

		// Hide if empty
		if ( !this.layers || this.isEmpty(this.layers) ) {
			this._hide();
			return;
		}

		this._container.style.display = 'block';
		this.isOpen = true;
	},

	_hide : function () {	
		// console.error('TODO: hide/show not working. refactor!');
		this._container.style.display = 'none'; 
		this.isOpen = false;

		this.toggleScale(false);
	},

	_flush : function () {
		this.layers = {};
		this._clear();
	},

	_clear : function () {
		this.isOpen = false;
		this.toggleScale(false);
	},

	_refresh : function () {

		// should be active
		if (!this._added) this._addTo();

		// get control active setting from project
		var active = this._project.getControls()[this.type];

		// if not active in project, hide
		if (!active) return this._hide();

		// remove old content
		this._flush();

		// show
		this._show();

	},

	_addTo : function () {
		this.addTo(app._map);
		this._initContainer();
		this._addHooks();
		this._added = true;
	},	

	_refreshLayer : function (layer) {

		// get layer
		this.layers[layer.getUuid()] = layer;

		this.setHTMLfromStore(layer.getUuid());
		this.updateMultiple(layer.getUuid());
	},

	toggle : function () {
		this.isCollapsed ? this.toggleOpen() : this.toggleClose();
	},

	toggleOpen : function () {

		Wu.DomUtil.removeClass(this._multipleLegendOuter, 'displayNone');
		Wu.DomUtil.removeClass(this._singleLegendViewWrapper, 'displayNone');
		Wu.DomUtil.addClass(this._toggeOpener, 'displayNone');
		Wu.DomUtil.addClass(this._compactLegendViewWrapper, 'displayNone');
		Wu.DomUtil.removeClass(this._inner, 'multiview');
		Wu.DomUtil.addClass(this._compactExpand, 'displayNone');

		this.isCollapsed = false;
		this.miniLegend = false;

		this._calculateHeight();

	},

	toggleClose : function () {


		Wu.DomUtil.addClass(this._multipleLegendOuter, 'displayNone');
		Wu.DomUtil.removeClass(this._toggeOpener, 'displayNone');

		this.isCollapsed = true;
		this.compactLegend();

		this._calculateHeight();

	},

	_addLayer : function (layer) {

		this.layers = this.layers || {};

		var layerUuid = layer.getUuid();
		this.layers[layerUuid] = layer;

		this.setHTMLfromStore(layerUuid);

		// For multiple layers
		this.updateMultiple(layerUuid);
	},

	_removeLayer : function (layer) {

		// console.log('_removeLayer', layer, this);

		// Delete layer from store
		var layerUuid = layer.getUuid();
		delete this.layers[layerUuid];

		// Get first object
		for ( var first in this.layers ) break;

		// If there are other legend, display it...
		if ( first ) this.setHTMLfromStore(first);

		// For multiple layers
		this.updateMultiple(first);

		this.refresh();
	},

	updateMultiple : function (layerUuid) {

		if ( this.miniLegend ) {
			this.compactLegend();			
		}

		if ( app.isMobile ) {
			this.compactLegend();
			return;
		}

		if ( this.isCollapsed ) Wu.DomUtil.addClass(this.satelliteAngle._innerContainer, 'displayNone');

		var wrapper = this._multipleLegendInnerContent;
		wrapper.innerHTML = '';

		var length = 0;
		for (var k in this.layers) {
		       length++;
		}


		for ( var uuid in this.layers ) {

			var layer = this.layers[uuid];

			var title = layer.getTitle();
			var multipleLayer = Wu.DomUtil.create('div', 'each-multiple-description', wrapper, title);
			multipleLayer.id = 'mulitidec_' + uuid;

			if ( uuid == layerUuid ) {
				if ( length > 1 ) {
					// MULTIPLE LAYERS ARE OPEN
					Wu.DomUtil.addClass(multipleLayer, 'active');					

					// Display toggle open button if menu is collapsed
					if ( this.isCollapsed ) {

						Wu.DomUtil.removeClass(this._toggeOpener, 'displayNone');
						
					} else {
						// Show layer list box
						Wu.DomUtil.removeClass(this._multipleLegendOuter, 'displayNone');

						Wu.DomUtil.addClass(this._toggeOpener, 'displayNone');
					}


				} else {
					// ONLY ONE LAYER IS OPEN
					Wu.DomUtil.addClass(multipleLayer, 'one-layer');

					// Hide layer list box
					Wu.DomUtil.addClass(this._multipleLegendOuter, 'displayNone');

					// Remove toggle open button
					Wu.DomUtil.addClass(this._toggeOpener, 'displayNone');
				}
				


			} else {
				Wu.DomUtil.removeClass(multipleLayer, 'active');
				Wu.DomUtil.removeClass(multipleLayer, 'one-layer');
			}

			Wu.DomEvent.on(multipleLayer, 'click', this.toggleLegend, this);
		}

		this._calculateHeight();
	},

	toggleLegend : function (e) {	

		var id = e.target.id;
		var layerUuid = id.slice(10, id.length);

		this.setHTMLfromStore(layerUuid);

		// For multiple layers
		this.updateMultiple(layerUuid);		

	},


	getLegend : function (layer) {
		var legendHTML = layer.isVector() ? this.createLegendHTML() : '';
		// console.log('getLEgend', legendHTML);
		return legendHTML;
	},


	getMetaDescription : function (layer) {

		var meta = layer.getMeta();

		// set geom type
		var geom_type = 'items';
		if (meta.geometry_type == 'ST_Point') geom_type = 'points';
		if (meta.geometry_type == 'ST_MultiPolygon') geom_type = 'polygons';

		// create description meta
		var area = Math.floor(meta.total_area / 1000000 * 100) / 100;
		var num_points = meta.row_count;
		var startend = this._parseStartEndDate(meta);

		description_meta = {};
		description_meta['Number of ' + geom_type] = num_points;
		description_meta['Covered area (km<sup>2</sup>)'] = area;
		
		if (startend.start != startend.end) {
			description_meta['Start date'] = startend.start;
			description_meta['End date'] = startend.end;
		}

		return description_meta;
	},


	setHTMLfromStore : function (uuid) {

		this.legendUuid = uuid;

		// get layer
		var layer = this._project.getLayer(uuid);
		if (!layer) return;

		var legend = layer.getLegends();

		// Create legend if there are none
		if ( !legend ) {
			this.createLegend(layer);
			legend = layer.getLegends();
		}

		if ( legend && !legend.enable ) {
			legend.layerMeta = false;
			legend.opacitySlider = false;
			legend.gradient = false;
			legend.html = '';
		}


		// Todo: write as plugin
		var satellitePos = layer.getSatellitePosition();
		if ( satellitePos ) {
			satellitePos = JSON.parse(satellitePos);
			this.satelliteAngle.update(satellitePos);
		}

		// Title
		var title = layer.getTitle();

		// Set title
		this.setMetaTitle(title);

		// Layer meta
		if ( legend.layerMeta ) {
			// Get description meta
			var descriptionMeta = this.getMetaDescription(layer);
			// Set description meta
			this.setMetaHTML(descriptionMeta);
			Wu.DomUtil.removeClass(this._metaContainer, 'displayNone');
		} else {
			Wu.DomUtil.addClass(this._metaContainer, 'displayNone');
		}

		// Opacity slider
		if ( legend.opacitySlider ) {
			Wu.DomUtil.removeClass(this._opacityWrapper, 'displayNone');
			// Set opacity slider
			this.setOpacity(layer);
		} else {
			Wu.DomUtil.addClass(this._opacityWrapper, 'displayNone');
		}

		// Legend
		if ( legend.html && legend.html.length>10 && !legend.gradient ) {
			this.setLegendHTML(legend.html);
		} else if ( legend.gradient ) {
			var grad = legend.html + legend.gradient;
			this.setLegendHTML(grad);
		} else if ( !legend.gradient ) {
			this.setLegendHTML('');
		}
	},


	createLegend : function (layer) {

		var styleJSON = Wu.parse(layer.store.style);
		if (!styleJSON) return;

		var legendObj = Wu.Tools.Legend.buildLegendObject(styleJSON, layer, false);
		var legendArray = Wu.Tools.Legend.getLegendArray(legendObj.point, legendObj.line, legendObj.polygon);
		var legendHTML = '';
		var gradientHTML = '';

		legendArray.forEach(function (l) {
			
			if ( l.gradient ) {
				gradientHTML += Wu.Tools.Legend.gradientLegendHTML(l, this.satelliteView);
			} else {
				legendHTML += Wu.Tools.Legend.eachLegendHTML(l, this.satelliteView);
			}
			
		}.bind(this));

		legendObj.html = legendHTML;
		legendObj.gradient = gradientHTML;


		legendObj.enable = true;
		legendObj.layerMeta = true;
		legendObj.opacitySlider = true;
		legendObj.layerName = layer.getTitle();

		// Save legend
		layer.setLegends( legendObj );

	},

	setMetaTitle : function (title) {
		this._metaTitle.innerHTML = title;
	},

	setOpacity : function (layer) {		

		// create slider once
		if (!this._slider) {
			this._createOpacitySlider(layer);
		}
		
		// set current layer
		this._slider.layer = layer;

		// set opacity value on slider
		var opacity = layer.getOpacity();
		this._slider.set(parseInt(opacity * 100));	

		// set opacity on layer
		layer.setOpacity(opacity);

	},

	_createOpacitySlider : function (layer) {

	
		// create slider
		this._sliderContainer = Wu.DomUtil.create('div', 'opacity-slider', this._opacityContainer);
		this._slider = noUiSlider.create(this._sliderContainer, {
			start: [100],
			range: {
				'min': [0],
				'max': [100]
			}
		});

		// events
		this._slider.on('update', this._updateOpacity.bind(this));

	},

	_updateOpacity : function (values, handle) {
		var styler = app.Chrome.Top._buttons.settingsSelector.options.context;
		var opacity = parseFloat(values[0]) / 100;
		var layer = this._slider.layer;	

		layer && layer.setOpacity(opacity);

		// only save opacity if styler is open
		if (!styler._isOpen) return;

		// set value on layer
		layer && layer.saveOpacity(opacity);

	},

	setMetaHTML : function (meta) {

		// Clear container
		this._metaContainer.innerHTML = '';

		for (var key in meta) {
			var val = meta[key];

			// Make new content	
			var metaLine = Wu.DomUtil.create('div', 'legends-meta-line', this._metaContainer);
			var metaKey = Wu.DomUtil.create('div', 'legends-meta-key', metaLine, key);
			var metaVal = Wu.DomUtil.create('div', 'legend-meta-valye', metaLine, val)
		}
	},

	setLegendHTML : function (HTML) {
		this._legendContainer.innerHTML = HTML;
	},


	// HELPERS HELPERS HELPERS
	_parseStartEndDate : function (meta) {

		// get all columns with dates
		var columns = meta.columns;
		var times = [];

		for (var c in columns) {
			if (c.length == 8) { // because d12mnd is valid moment.js date (??)
				var m = moment(c, "YYYYMMDD");
				var unix = m.format('x');
				if (m.isValid()) {
					var u = parseInt(unix);
					if (u > 0) { // remove errs
						times.push(u);
					}
				}
			}
		}

		function sortNumber(a,b) {
			return a - b;
		}

		times.sort(sortNumber);

		var first = times[0];
		var last = times[times.length-1];
		var m_first = moment(first).format('MMM Do YYYY');
		var m_last = moment(last).format('MMM Do YYYY');

		var startend = {
			start : m_first,
			end : m_last
		};

		return startend;
	},



	isEmpty : function (obj) {
		for(var prop in obj) {
			if (obj.hasOwnProperty(prop)) return false;
		}

		return true;
	},



	// EXTERNAL EXTERNAL EXTERNAL
	// Toggle scale/measure/mouseposition corner
	toggleScale : function (openDescription) {

		if (!app._map._controlCorners.topright) return;

		if (openDescription) {
			Wu.DomUtil.addClass(app._map._controlCorners.topright, 'toggle-scale');
		} else {
			Wu.DomUtil.removeClass(app._map._controlCorners.topright, 'toggle-scale');
		}
	},

	_on : function () {
		this._show();
	},

	_off : function () {
		this._hide();
	},

	_calculateHeight : function () {


			var windowSize = this._getWindowSize();
			var h = windowSize.height - 55;


			// LEGEND – SELECTOR HEIGHT (when we're showing one and one legend)
			// LEGEND – SELECTOR HEIGHT (when we're showing one and one legend)

			// Outer height
			var legendSelectorOuterHeight = this.miniLegend ? 0 : this._multipleLegendInner.offsetHeight;

			// Inner height
			var legendSelectorInnerHeight = this.miniLegend ? 0 : this._multipleLegendInnerContent.scrollHeight;

			// Visible height
			if ( legendSelectorOuterHeight > legendSelectorInnerHeight ) {
				var legendSelectorVisisbleHeight = legendSelectorOuterHeight;
			} else {
				var legendSelectorVisisbleHeight = legendSelectorInnerHeight;
			}



			// LEGEND HEIGHT
			// LEGEND HEIGHT

			// Outer height
			var legendOuterHeight = this._outer.offsetHeight;

			// Inner height
			var legendInnerHeight = this._inner.scrollHeight;

			// Visible height
			// Problem: This is a little buggy if we're only watching
			// the legend of one layer. Not a biggie, but will fix it.
			if ( legendOuterHeight > legendInnerHeight ) {
				var legendBoxVisisbleHeight = legendOuterHeight;
				// Wu.DomUtil.removeClass(this._inner, 'allow-scrolling');				

			} else {
				var legendBoxVisisbleHeight = legendInnerHeight;
				// Wu.DomUtil.addClass(this._inner, 'allow-scrolling');
			}


			// if ( app.isMobile ) {
			// 	legendSelectorVisisbleHeight = 0;
			// 	legendSelectorInnerHeight = 0;
			// }

	
			// Total height of legend
			var legendTotalHeight = legendSelectorInnerHeight + legendInnerHeight;

			// Visible height of legend
			var legendVisibleHeight = legendBoxVisisbleHeight + legendSelectorVisisbleHeight;




			// LAYER SELECTOR HEIGHTS
			// LAYER SELECTOR HEIGHTS

			// Check if Layer selector exists
			if ( app.MapPane._controls.layermenu && app.MapPane._controls.layermenu._innerScroller ) {

				var layermenu = app.MapPane._controls.layermenu._innerScroller;
				// Height of wrapper
				var layermenuOuterHeight = layermenu.offsetHeight;
				// Inner height of scroller content
				var layermenuInnerHeight = app.MapPane._controls.layermenu._content.scrollHeight;

			// If the layer menu does not exist, set values to zero and declare false
			} else {

				var layermenu = false;
				var layermenuOuterHeight = 0;
				var layermenuInnerHeight = 0;

			}



		
			// The content of the LAYER MENU and the LEGEND exceeds the height of
			// the window. We need to restrict them, by setting max height.
			if ( (layermenuInnerHeight + legendVisibleHeight) > (h-10) ) {

				// .. .. .. .. .. .. .. .. .. .. .. .. .. .. .. .. ..
				// LEGEND LEGEND LEGEND LEGEND LEGEND LEGEND LEGEND 
				// .. .. .. .. .. .. .. .. .. .. .. .. .. .. .. .. ..
				
				// Layer menu height is higher than 50% ->
				// restrict legend total height to be more than 50%.
				if ( layermenuInnerHeight > (h/2) ) {	
					var legendAllowedHeight = (h/2);

				// Layer menu height is less than 50% ->
				// restrict legend to 100% - layermenu height
				} else {
					var legendAllowedHeight = h - layermenuInnerHeight;
				}


				// .. .. .. .. .. .. .. .. .. .. .. .. .. .. .. .. ..
				// LAYER MENU - LAYER MENU - LAYER MENU - LAYER MENU
				// .. .. .. .. .. .. .. .. .. .. .. .. .. .. .. .. ..

				// Legend total height is higher than 50% ->
				// restrict legend total height to be more than 50%.
				if ( legendVisibleHeight > (h/2) ) {	
					var layersAllowedHeight = (h/2);
				
				// Legend total height is less than 50% ->
				// restrict layers to 100% - legend total height
				} else {
					var layersAllowedHeight = h - (legendSelectorOuterHeight + legendOuterHeight + 10);
				}




				// .. .. .. .. .. .. .. .. .. .. .. .. .. .. .. .. ..
				// LAYER MENU - LAYER MENU - LAYER MENU - LAYER MENU
				// .. .. .. .. .. .. .. .. .. .. .. .. .. .. .. .. ..

				
				// Set layer menu total height
				if ( layermenu ) {
					layermenu.style.maxHeight = layersAllowedHeight + 'px';
				}


				// If the legend selector is collapsed, allow full size to legend
				if ( this.isCollapsed ) {
					this._outer.style.maxHeight = legendAllowedHeight + 'px';
					this._inner.style.maxHeight = legendAllowedHeight - 30 + 'px';

				// If top legend selector is open, calculate height.
				} else {

					// Legend selector inner height...
					// These two shall share legendAllowedHeight
					if ( ((legendSelectorVisisbleHeight + legendBoxVisisbleHeight)+2) > legendAllowedHeight) {

						// The boxes are taller than allowed
						var allowedHeightUnit = legendAllowedHeight/4;

						// Legend box is larger than 3/4 of available space
						// Force 3/4 of space to legend and 1/4 to legend selector
						if ( legendBoxVisisbleHeight > (allowedHeightUnit*3) ) {
							this._multipleLegendInner.style.maxHeight = allowedHeightUnit + 'px';
							this._outer.style.maxHeight = (allowedHeightUnit*3) + 'px';
							this._inner.style.maxHeight = (allowedHeightUnit*3) - 30 + 'px';					
						
						// Legend box is NOT larger than 3/4 of available space
						// Remvoe maxHeight from Legend box, 
						// Give legend selector allowedHeight - legend box height
						} else {
							this._multipleLegendInner.style.maxHeight = (legendAllowedHeight - legendBoxVisisbleHeight) + 'px';
							this._outer.style.maxHeight = legendBoxVisisbleHeight + 'px';
							this._inner.style.maxHeight = legendBoxVisisbleHeight - 30 + 'px';
						}

					} else {
						// The boxes are NOT taller than allowed
						this._multipleLegendInner.style.maxHeight = h + 'px';
						this._outer.style.maxHeight = h + 'px';
						this._inner.style.maxHeight = h - 30 + 'px';
					}
				}
				

				
			// It's not a crash 
			// legend and layer selector can be as high as they want
			} else {

				if ( layermenu ) layermenu.style.maxHeight = h + 'px';
				this._multipleLegendInner.style.maxHeight = h + 'px';
				this._outer.style.maxHeight = h + 'px';
				this._inner.style.maxHeight = h - 30 + 'px';

			}

			// At the very end we set scrollers
			// If we do it before, we will not get the real numbers,
			// and it fails every once in a while
			if ( this._outer.offsetHeight > this._inner.scrollHeight ) {
				Wu.DomUtil.removeClass(this._inner, 'allow-scrolling');	
			} else {
				Wu.DomUtil.addClass(this._inner, 'allow-scrolling');
			}




	},

	compactLegend : function () {

		var length = 0;
		for (var k in this.layers) {
		       length++;
		}

		if ( length <= 1 ) {
			Wu.DomUtil.addClass(this._compactExpand, 'displayNone');
		} else {

			if ( !app.isMobile ) Wu.DomUtil.removeClass(this._compactExpand, 'displayNone');
		}
		

		Wu.DomUtil.addClass(this._multipleLegendOuter, 'displayNone');
		Wu.DomUtil.addClass(this._singleLegendViewWrapper, 'displayNone');
		Wu.DomUtil.removeClass(this._compactLegendViewWrapper, 'displayNone');
		Wu.DomUtil.addClass(this._inner, 'multiview');

		var allLegendHTML = '';
		var allGradientHTML = '';

		for ( var f in this.layers ) {
			var layer = this.layers[f]
			var legend = layer.getLegends();

			var title = layer.getTitle();
			var layerTitle = '<div class="description-control-meta-title">' + title + '</div>';
			// var layerTitle = '';

			// if ( legend.html && legend.html.length>10 ) allLegendHTML += layerTitle + legend.html;
			if ( legend.html && legend.html.length>10 ) allLegendHTML += legend.html;
			if ( legend.gradient ) allGradientHTML += layerTitle + legend.gradient;
			
			if ( !legend.html && !legend.gradient ) {
				// allLegendHTML += layerTitle + 'No legend!';
			}
			
		}


		this._compactLegendInnerScroller.innerHTML = '';
		this._comactContent = Wu.DomUtil.create('div', 'compact-legends', this._compactLegendInnerScroller, allLegendHTML + allGradientHTML);
		this.miniLegend = true;

	},

	_getWindowSize : function (argument) {
		var w = window,
		    d = document,
		    e = d.documentElement,
		    g = d.getElementsByTagName('body')[0],
		    x = w.innerWidth || e.clientWidth || g.clientWidth,
		    y = w.innerHeight|| e.clientHeight|| g.clientHeight;
		    return {width : x, height : y};
	}
	
});

L.control.description = function (options) {
	return new L.Control.Description(options);
};