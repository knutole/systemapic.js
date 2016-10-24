Wu.MapPane = Wu.Pane.extend({

    _ : 'mappane',

    options : {
        controls : [
            'description',
            // 'inspect',
            'layermenu',
            'zoom',
            // 'legends',
            'measure',
            'geolocation',
            'mouseposition',
            'baselayertoggle',
            // 'cartocss',
            'draw',
            'wms'
        ]
    },
    
    _initialize : function () {

        // create zindex controls
        this._baselayerZIndex = new Wu.ZIndexControl.Baselayers();
        this._layermenuZIndex = new Wu.ZIndexControl.Layermenu();

        // active layers
        this._activeLayers = [];
    },

    _initContainer : function () {
        
        // init container
        this._container = app._mapPane = Wu.DomUtil.createId('div', 'map', app._mapContainer);
    
        // add help pseudo
        Wu.DomUtil.addClass(this._container, 'click-to-start');

        // init map
        this._initLeaflet();

        // init controls
        this._initControls();

        // events
        this._registerEvents();

        // adjust padding, etc.
        this._adjustLayout();

        // experimental: hover popup
        if (app.options.custom && app.options.custom.hoverPopup) {
            this.hoverPopup = Wu.hoverPopup();
        }
    },

    _projectSelected : function (e) {

        var projectUuid = e.detail.projectUuid;

        if (!projectUuid) return;

        // set project
        this._project = app.activeProject = app.Projects[projectUuid];

        // refresh pane
        this._refresh();

        // fire project selected on map load
        app._map.fire('projectSelected')
    },

    // refresh view
    _refresh : function () {

        // remove old
        this._flush();

        // set base layers
        this.setBaseLayers();

        // set bounds
        this.setMaxBounds();

        // set position
        this.setPosition();

        // set background color :: NEW
        this.setBackgroundColor();

    },

    _flush : function () {

        // remove layers
        this._flushLayers();

        this._activeLayers = null;
        this._activeLayers = [];
    },

    _flushLayers : function () {
        var map = app._map;
        
        var activeLayers = _.clone(this._activeLayers);
        activeLayers.forEach(function (layer) {
            if (layer.layer) map.removeLayer(layer.layer);
            layer._flush();
        }, this);
    },

    _initLeaflet : function () {

        // create new map
        var map = this._map = app._map = L.map('map', {
            worldCopyJump : true,
            attributionControl : false,
            maxZoom : 19,
            minZoom : 0,
            zoomControl : false,
            inertia : false,

            // js optimizing attempt
            fadeAnimation : false,
            // zoomAnimation : false,

            

            // exp
            // zoomSnap : 0,
            // zoomDelta : 2,
            // wheelPxPerZoomLevel : 100,
            // wheelDebounceTime : 80,
            // loadingControl : true,
            // zoomAnimationThreshold : 2,

        });

        // add map click (bug: layer won't listen to click)
        map.on('click', function (e) {
            Wu.Mixin.Events.fire('mapClick', {details : {e : e}});
        }, this);

        // add attribution
        this._addAttribution(map);


        // todo: remove this?
        // global map events
        map.on('zoomstart', function (e) {

            map.eachLayer(function (layer) {
                if (!layer.options) return;

                var layerUuid = layer.options.layerUuid;

                if (!layerUuid) return;

                // get wu layer
                var l = app.activeProject.getPostGISLayer(layerUuid);
        
                if (!l) return ;
                
                l._invalidateTiles();
            });

            // send invalidate to pile
            this._invalidateTiles();

        }, this);

        // on projectSelected
        map.on('projectSelected', function (e) {
            // todo: remove, refactor this? 

            // hack due to race conditions
            setTimeout(function () { 
    
                // get layermenu control            
                var lm = app.MapPane.getControls().layermenu;

                // enable layers that are marked as on by default
                lm && lm._enableDefaultLayers();
            
            }, 10);
        });

    },

    _addAttribution : function (map) {

        // create attribution control
        this._attributionControl = L.control.attribution({position : 'bottomleft', prefix : false});

        // add to map
        map.addControl(this._attributionControl);

        // set content
        this._attributionControl.addAttribution('<a href="http://mapic.io">Powered by Mapic</a>');
        
        // remove content
        this._attributionControl.removeAttribution('Leaflet');

    },

    // todo: remove??
    _invalidateTiles : function () {
        var options = {
            access_token : app.tokens.access_token, // unique identifier
        }
    },

    _initControls : function () {
        var controls = this.options.controls;
        this._controls = {};
        _.each(controls, function (control) {

            // create controls
            this._controls[control] = new L.Control[control.camelize()];

        }.bind(this));
    },

    getControls : function () {
        return this._controls;
    },

    _adjustLayout : function () {
        // this.setHeaderPadding();
    },

    _registerEvents : function () {
        app._map.on('moveend', this._onMove, this);
        app._map.on('zoomend', this._onZoom, this);
    },

    _onMove : function () {
        var project = this._project || app.activeProject;
        Wu.Mixin.Events.fire('projectChanged', {detail : {
            projectUuid : project.getUuid()
        }});
    },

    _onZoom : function () {

        var project = this._project || app.activeProject;
        Wu.Mixin.Events.fire('projectChanged', {detail : {
            projectUuid : project.getUuid()
        }});
    },

    // // fired on window resize
    // // THIS FUNCTION IS NEVER FIRED, IS IT???
    // resizeEvent : function (d) {
    //     console.error('deprecated??');
    //     this._updateWidth(d);
    // },
    
    // // THIS FUNCTION IS NEVER FIRED, IS IT???
    // _updateWidth : function (d) {
    //     console.error('deprecated??');
    //     var map = this._map;
    //     if (!map || !d) return;
        
    //     // set width
    //     var w = d.width - parseInt(map._container.offsetLeft) + 'px';
    //     map._container.style.width = w;
        
    //     // refresh map size
    //     setTimeout(function() {
    //         if (map) map.reframe();
    //     }, 300); // time with css
    // },
    
    getZIndexControls : function () {
        var z = {
            b : this._baselayerZIndex, // base
            l : this._layermenuZIndex  // layermenu
        };
        return z;
    },

    clearBaseLayers : function () {
        if (!this.baseLayers) return;
        
        this.baseLayers.forEach(function (base) {
            app._map.removeLayer(base.layer);
        });

        this.baseLayers = {};
    },

    setBaseLayers : function () { 

        // get baseLayers stored in project
        var baseLayers = this._project.getBaselayers();

        // return if empty
        if (!baseLayers) return;

        // add
        baseLayers.forEach(function (layer) {
            this.addBaseLayer(layer);
        }, this);
    },

    setBackgroundColor : function () {
        var bgc = this._project.getBackgroundColor() ? this._project.getBackgroundColor() : '#3C4759 url(../images/canvas.png)';
        app.MapPane._container.style.background = bgc;
    },

    addBaseLayer : function (baseLayer) {
        // Wu.Layer
        var layer = this._project.layers[baseLayer.uuid];
        if (layer) layer.add('baselayer');
    },

    removeBaseLayer : function (layer) {
        map.removeLayer(base.layer);
    },

    _setLeft : function (width) {  
        this._container.style.left = width + 'px';
        this._container.style.width = parseInt(window.innerWidth) - width + 'px';
    },

    setHeaderPadding : function () {
        // set padding
        var map = this._map;
        var control = map._controlContainer;
        control.style.paddingTop = this._project.getHeaderHeight() + 'px';
    },

    setPosition : function (position) {
        var map = this._map;
        
        // get position
        var pos = position || this._project.getLatLngZoom();
        var lat = pos.lat;
        var lng = pos.lng;
        var zoom = pos.zoom;

        // set map options
        if (lat != undefined && lng != undefined && zoom != undefined) {
            map.setView([lat, lng], zoom);
        }
    },

    getPosition : function () {
        // get current lat/lng/zoom
        var center = this._map.getCenter();
        var position = {
            lat : center.lat,
            lng : center.lng,
            zoom : this._map.getZoom()
        };
        return position;
    },

    getActiveLayermenuLayers : function () {
        if (!this.layerMenu) return;

        var zIndexControl = app.zIndex;

        var layers = this.layerMenu.getLayers();
        var active = _.filter(layers, function (l) {
            return l.on;
        });

        var sorted = _.sortBy(active, function (l) {
            return zIndexControl.get(l.layer);
        });

        return sorted;
    },

    getActiveLayers : function () {
        return this._activeLayers;
    },

    addActiveLayer : function (layer) {
        this._activeLayers.push(layer);
    },

    clearActiveLayers : function () {
        this._activeLayers = [];
    },

    removeActiveLayer : function (layer) {
        _.remove(this._activeLayers, function (l) {
            return l.getUuid() == layer.getUuid();
        }, this);
    },

    setMaxBounds : function () {
        var map = app._map;
        var bounds = this._project.getBounds();

        if (!bounds) {
            this.clearBounds();
            return;
        }
        var southWest = L.latLng(bounds.southWest.lat, bounds.southWest.lng);
        var northEast = L.latLng(bounds.northEast.lat, bounds.northEast.lng);
            var maxBounds = L.latLngBounds(southWest, northEast);

            // set maxBoudns
        map.setMaxBounds(maxBounds);
        map.options.minZoom = bounds.minZoom;
        map.options.maxZoom = bounds.maxZoom > 19 ? 19 : bounds.maxZoom;
    },

    _clearBounds : function () {
        // clear current bounds
        var noBounds = {
            northEast : {
                lat : '90',
                lng : '180'
            },

            southWest : {
                lat : '-90',
                lng : '-180'
            },
            minZoom : '1',
            maxZoom : '20'
        };
        var southWest = L.latLng(noBounds.southWest.lat, noBounds.southWest.lng);
        var northEast = L.latLng(noBounds.northEast.lat, noBounds.northEast.lng);
        var nullBounds = L.latLngBounds(southWest, northEast);

        // set bounds to project
        app.activeProject.setBounds(noBounds);
        app._map.setMaxBounds(nullBounds);
    },

    clearBounds : function () {
        
        // get actual Project object
        var project = Wu.app.activeProject;
        var map = Wu.app._map;
        var nullBounds = {
            northEast : {
                lat : '90',
                lng : '180'
            },

            southWest : {
                lat : '-90',
                lng : '-180'
            },
            minZoom : '1',
            maxZoom : '20'
        };

        // set bounds to project
        project.setBounds(nullBounds);

        // enforce
        this.enforceBounds();

        // no bounds
        map.setMaxBounds(false);
    },      

    enforceBounds : function () {
        var project = app.activeProject;
        var map     = app._map;

        // get values
        var bounds = project.getBounds();

        if (bounds) {
            var southWest   = L.latLng(bounds.southWest.lat, bounds.southWest.lng);
            var northEast   = L.latLng(bounds.northEast.lat, bounds.northEast.lng);
                var maxBounds   = L.latLngBounds(southWest, northEast);
            var minZoom     = bounds.minZoom;
            var maxZoom     = bounds.maxZoom;

                if (bounds == this._nullBounds) {
                    map.setMaxBounds(false);
                } else {
                    map.setMaxBounds(maxBounds);
                }
            
            // set zoom
            map.options.minZoom = minZoom;
            map.options.maxZoom = maxZoom;  
        }
        
        map.invalidateSize();
    },
    
    addEditableLayer : function (map) {
        // create layer
        this.editableLayers = new L.FeatureGroup();
        map.addLayer(this.editableLayers);
    },

    updateControlCss : function () {

        // get controls
        var controls = this._project.getControls(),
            legendsControl = controls.legends,
            corners = app._map._controlCorners,
            topleft = corners.topleft,
            bottomright = corners.bottomright,
            topright = corners.topright;


        // layermenu control
        if (controls.layermenu) {
            
            // Check for Layer Inspector
            if (controls.inspect) {
                Wu.DomUtil.removeClass(bottomright, 'no-inspector');
            } else {
                Wu.DomUtil.addClass(bottomright, 'no-inspector');
            }
        }

        // legend control
        if (controls.legends) {
            
            // get container
            var legendsContainer = controls.legends._legendsContainer;

            // Check for Layer Menu Control
            if (controls.layermenu) {
                if (legendsContainer) Wu.DomUtil.removeClass(legendsContainer, 'legends-padding-right');
            } else {
                if (legendsContainer) Wu.DomUtil.addClass(legendsContainer, 'legends-padding-right');
            }

            // Check for Description Control
            if (controls.description) {} 

        }

        // // scale control
        // if (controls.measure) {
        //  if (controls.layermenu) {
        //      topright.style.right = '295px';
        //  } else {
        //      topright.style.right = '6px';
        //  }
        // }


        // todo?
        if (controls.mouseposition) {}
        if (controls.vectorstyle) {}
        if (controls.zoom) {}
        if (controls.baselayertoggle) {}
        if (controls.description) {} 
        if (controls.draw) {}
        if (controls.geolocation) {}
        if (controls.inspect) {}
    },

    resetControls : function () {

        // remove carto
        if (this.cartoCss) this.cartoCss.destroy();

        this.cartoCss               = null;
        this._drawControl           = null;
        this._drawControlLayer      = null;
        this._scale                 = null;
        this.vectorStyle            = null;
        this.layerMenu              = null;
        this.legendsControl         = null;
        this.descriptionControl     = null;
        this.inspectControl         = null;
        this.mousepositionControl   = null;
        this.baselayerToggle        = null;
        this.geolocationControl     = null;

        // remove old controls
        delete this._drawControl;
        delete this._drawControlLayer;
        delete this._scale;
        delete this.vectorStyle;                // TODO, refactor
        delete this.layerMenu;
        delete this.legendsControl;
        delete this.descriptionControl;
        delete this.inspectControl;
        delete this.mousepositionControl;
        delete this.baselayerToggle;
        delete this.geolocationControl;
        delete this.cartoCss;
    },

    refreshControls : function () {
    },

    hideControls : function () {

        Wu.DomUtil.addClass(app._map._controlContainer, 'displayNone');
    },

    showControls : function () {

        Wu.DomUtil.removeClass(app._map._controlContainer, 'displayNone');
    },

    addLayer : function (layerID) {
        var layer = L.mapbox.tileLayer(layerID);
        layer.addTo(this._map);
    },

    _addLayer : function (layer) {
        layer.addto(this._map);
    },

    disableInteraction : function (noDrag) {
        var map = this._map || app._map;
        if (noDrag) map.dragging.disable();
        map.touchZoom.disable();
        map.doubleClickZoom.disable();
        map.scrollWheelZoom.disable();
        map.boxZoom.disable();
        map.keyboard.disable();
    },

    enableInteraction : function (noDrag) {
        var map = this._map || app._map;
        if (noDrag) map.dragging.enable();
        map.touchZoom.enable();
        map.doubleClickZoom.enable();
        map.scrollWheelZoom.enable();
        map.boxZoom.enable();
        map.keyboard.enable();
    },


    getEditableLayerParent : function (id) {
        // return id from _leaflet_id
        var layers = this.editableLayers._layers;
        for (l in layers) {
            for (m in layers[l]._layers) {
                if (m == id) return layers[l];
                var deep = layers[l]._layers[m];
                for (n in deep) {
                    var shit = deep[n];
                    if (n == id) return deep;
                    for (o in shit) {
                        if (o == id) return shit;
                    }
                }
            }
        }
        return false;
    },


    // Create pop-up from draw
    _addPopupContentDraw : function (data) {
        this._addPopupContent(false, data)      
    },

    // Create pop-up
    _addPopupContent : function (e, multiPopUp) {

        if ( this._chart && this._chart._popup ) {          
            this.updatePopup(e, multiPopUp);
        } else {            
            this.newPopup(e, multiPopUp);           
        }

    },

    // Creates a new pop-up
    newPopup : function (e, multiPopUp) {
        
        var options = {
                e : e,
                multiPopUp : multiPopUp
            };
        
        this._chart = new Wu.Control.Chart(options);
    },

    // Adds data to existing pop-up
    updatePopup : function (e, multiPopUp) {
        
        var options = {
                e : e,
                multiPopUp  : multiPopUp,
                context     : this
            };
    
        this._chart.updateExistingPopup(options);
    },


    _clearPopup : function () {
        if (this._chart) {
            this._chart._refresh();
        }
    }

    
});










// experimental: hover popup with config switch


Wu.HoverPopup = L.Evented.extend({

    options : {
        // contentType : 'table',
    },

    _cache : {},

    initialize : function (options) {
        L.setOptions(this, options);

        // create frame
        this._initContainer();
    },

    _initContainer : function () {

        // container to append popup to
        var appendTo = app._appPane;

        // create container, append
        this._container = Wu.DomUtil.create('div', 'hover-popup-container displayNone', appendTo);

    },

    addContent : function (options) {

        // show container
        Wu.DomUtil.removeClass(this._container, 'displayNone');

        // check if already added
        if (this._cache[options.id]) return;

        // create content
        this._createContent(options);
        
    },

    _removing : {},

    removeContent : function (options) {

        // find container in cache
        var container = this._cache[options.id];

        // remove from DOM
        Wu.DomUtil.remove(this._cache[options.id]);

        // remove from cache
        delete this._cache[options.id];

        // hide popup if no content in cache
        if (!_.size(this._cache)) {
            Wu.DomUtil.addClass(this._container, 'displayNone');
        }

    },


    _createContent : function (options) {

        // create wrapper
        var container = Wu.DomUtil.create('div', 'hover-popup-content', this._container);
       
        // save in cache
        this._cache[options.id] = container;
        
        // create title
        var title = Wu.DomUtil.create('div', 'hover-popup-title', container, options.data.title);

        var sorted_rows = _.sortBy(options.data.rows, 't').reverse();

        // create inner content
        if (this.options.contentType == 'table') {
            
            // as table
            this._fillTableContent(sorted_rows, container);
        
        } else {
        
            // as divs
            this._fillContent(sorted_rows, container);
        
        }

       

        
    },

    _fillContent : function (sorted_rows, container) {

        // create each row
        _.forEach(sorted_rows, function (r) {
            var row = Wu.DomUtil.create('div', 'hover-popup-line', container);
            var t = Wu.DomUtil.create('div', 'hover-popup-t', row); // todo: tilstandsklasse farge
            var key = Wu.DomUtil.create('div', 'hover-popup-key', row, r.key);
            var value = Wu.DomUtil.create('div', 'hover-popup-value', row, r.value.toString());
            var legend = Wu.DomUtil.create('div', 'hover-popup-legend', row, r.legend);

            value.setAttribute('key', r.k); // debugging

            // set color for tilstandsklasse
            Wu.DomUtil.addClass(t, 't-color-' + r.t);
        });
    },

    _fillTableContent : function (sorted_rows, container) {

        // <table>
        var table = Wu.DomUtil.create('table', 'hover-popup-table', container);

        // <thead>
        var thead = Wu.DomUtil.create('thead', 'hover-popup-thead', table);
        
        // <tr>
        var theadtr = Wu.DomUtil.create('tr', 'hover-popup-tr', thead);

        // <th>
        var th1 = Wu.DomUtil.create('th', 'hover-popup-th', theadtr, ''); // color
        var th2 = Wu.DomUtil.create('th', 'hover-popup-th', theadtr, 'Compound'); // color
        var th3 = Wu.DomUtil.create('th', 'hover-popup-th', theadtr, 'Value'); // color
        var th4 = Wu.DomUtil.create('th', 'hover-popup-th', theadtr, 'Legend'); // color

        // <tbody>
        var tbody = Wu.DomUtil.create('tbody', 'hover-popup-tr', table);


        // create each row
        _.forEach(sorted_rows, function (r) {

            var row = Wu.DomUtil.create('tr', 'hover-popup-tr', tbody);
            var t = Wu.DomUtil.create('td', 'hover-popup-t', row); // todo: tilstandsklasse farge
            var key = Wu.DomUtil.create('td', 'hover-popup-key', row, r.key);
            var value = Wu.DomUtil.create('td', 'hover-popup-value', row, r.value.toString());
            var legend = Wu.DomUtil.create('td', 'hover-popup-legend', row, r.legend);

            // value.setAttribute('key', r.k); // debugging

            // set color for tilstandsklasse
            Wu.DomUtil.addClass(t, 't-color-' + r.t);
        });
    },

});

Wu.hoverPopup = function (options) {
    return new Wu.HoverPopup(options);
}
