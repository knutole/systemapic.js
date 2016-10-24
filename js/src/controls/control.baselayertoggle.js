// app.MapPane.baselayerToggle
L.Control.Baselayertoggle = Wu.Control.extend({

	type : 'baselayertoggle',

	options: {
		collapsed: true,
		position: 'topleft',
		autoZIndex: true
	},

	onAdd: function () {
		// create div
		var className = 'leaflet-control-baselayertoggle';
		var container = this._container = L.DomUtil.create('div', className);
		return container;
	},

	_addHooks : function () {
		// add events
		Wu.DomEvent.on(this._container, 'mousedown', this.toggle, this);
		Wu.DomEvent.on(this._container, 'dblclick', Wu.DomEvent.stop, this);
		Wu.DomEvent.on(this._container, 'mouseleave', this.mouseOut, this);

		// add stops
		Wu.DomEvent.on(this._container, 'mousedown dblclick mouseup click', Wu.DomEvent.stopPropagation, this);
	},

	addTo: function (map) {

		this._map = map;

		var container = this._container = this.onAdd(map),
		    pos = this.getPosition(),
		    corner = map._controlCorners[pos];

		L.DomUtil.addClass(container, 'leaflet-control');

		// add to dom
		corner.appendChild(container);

		return this;
	},

	_on : function () {
		this._show();
	},
	_off : function () {
		this._hide();
	},
	_show : function () {
		this._container.style.display = 'block';
		this._refresh();
	},
	_hide : function () {
		this._container.style.display = 'none';
	},

	_addTo : function () {
		this.addTo(app._map);
		this._addHooks();
		this._added = true;
	},

	_refresh : function () {
		if (!this._added) this._addTo();

		// get control active setting from project
		var active = this._project.getControls()[this.type];
		
		// if not active in project, hide
		if (!active) return this._hide();

		// remove old content
		this._flush();

		// init content
		this._initContent();

	},

	_flush : function () {
		// empty old
		if (this._list) {
			Wu.DomUtil.remove(this._list);
			this._list = null;
		}

		this._layers = null;
		this._layers = {};

	},

	_initContent : function () {
		
		// create wrapper
		this._list = L.DomUtil.create('div', 'baselayertoggle-list', this._container);
		Wu.DomEvent.on(this._list, 'dblclick', Wu.DomEvent.stop, this);

		// build menu
		var baseLayers = this._getBaselayers();

		baseLayers.forEach(function (b) {
			var baseLayer = {
				layer : this._project.getLayer(b.uuid),
				baseLayer : b
			};
			this.addLayer(baseLayer);
		}, this);

		// Add blank baselayer (NONE)
		this.addBlankLayer();

	},

	_getBaselayers : function () {
		var layers = this._project.getLayers();
		var filtered = this._filterBackgroundLayersByProvider(layers);
		var formatted = this._formatBackgroundLayersObject(filtered);
		return formatted;
	},

	_formatBackgroundLayersObject : function (layers) {
		var result = [];
		layers.forEach(function (l, n) {
			result.push({
				uuid : l.getUuid(),
				zIndex : n+1,
				opacity : 1
			});
		}, this);
		return result;
	},

	_filterBackgroundLayersByProvider : function (layers) {
		var keys = ['google', 'norkart', 'mapbox'];
		var results = [];
		keys.forEach(function (key) {
			for (var l in layers) {
				var layer = layers[l];
				if (layer && layer.store && layer.store.data.hasOwnProperty(key)) {
					results.push(layer)
				}
			}
		}, this);

		results
		return results;
	},	
	
	mouseOut : function () {
		return;
		if ( this._isOpen ) { this.collapse() }
		else { return }

	},

	addLayer : function (baseLayer) {


		if (!baseLayer.layer) return console.error('BUG: fixme!');
		
		// create div
		var layerName = baseLayer.layer.getTitle();
		var item = Wu.DomUtil.create('div', 'baselayertoggle-item', this._list, layerName);
		
		// set active by default
		baseLayer.active = false;

		// add to local store
		var id = L.stamp(baseLayer);
		this._layers[id] = baseLayer;

		// add click event
		Wu.DomEvent.on(item, 'mousedown', function (e) {
			Wu.DomEvent.stop(e);
			this.toggleLayer(baseLayer, item);
		}, this);
	},

	addBlankLayer : function () {		
		
		var item = Wu.DomUtil.create('div', 'baselayertoggle-item', this._list, 'NONE');
		
		// add click event
		Wu.DomEvent.on(item, 'mousedown', function (e) {

			Wu.DomEvent.stop(e);			

			var bgLayers = this._getBaselayers();

			// turn all baselayers off
			for (var l in bgLayers) {
				if (bgLayers.hasOwnProperty(l)) {
					var b = bgLayers[l];
					var layer2 = this._project.getLayer(b.uuid);

					// disable
					layer2.disable();
					Wu.DomUtil.removeClass(item, 'active');

					// mark not active
					var bl = _.find(this._layers, function (bl2) {
						return bl2.layer.store.uuid == b.uuid;
					});
					var bl3 = this._layers[L.stamp(bl)];
					bl3.active = false;
				}
			}

			var children = this._list.childNodes;

			for (var i=0; i < children.length; i++) {
				var div = children[i];
				Wu.DomUtil.removeClass(div, 'active');
			}

			Wu.DomUtil.addClass(item, 'active');

		}, this);

		
	},

	toggleLayer : function (baseLayer, item) {

		// get layer from local store
		var layer = this._layers[L.stamp(baseLayer)].layer;

		var bgLayers = this._getBaselayers();

		// turn on
		if (!baseLayer.active) {

			// turn all baselayers off
			for (var l in bgLayers) {
				if (bgLayers.hasOwnProperty(l)) {
					var b = bgLayers[l];
					var layer2 = this._project.getLayer(b.uuid);

					// disable
					layer2.disable();
					Wu.DomUtil.removeClass(item, 'active');

					// mark not active
					var bl = _.find(this._layers, function (bl2) {
						return bl2.layer.store.uuid == b.uuid;
					});
					var bl3 = this._layers[L.stamp(bl)];
					bl3.active = false;
				}
			}

			var children = this._list.childNodes;

			for (var i=0; i < children.length; i++) {
				var div = children[i];
				Wu.DomUtil.removeClass(div, 'active');
			}

			// turn on this baselayer
			layer.add('baselayer');
			baseLayer.active = true;
			Wu.DomUtil.addClass(item, 'active');
		}

		
	},

	toggle : function () {
		this._isOpen ? this.collapse() : this.expand();

	},

	collapse : function () {
		this._isOpen = false;
		Wu.DomUtil.removeClass(this._container, 'open');
	},

	expand : function () {
		this._isOpen = true;
		Wu.DomUtil.addClass(this._container, 'open');
	}

});

L.control.baselayerToggle = function (options) {
	return new L.Control.Baselayertoggle(options);
};