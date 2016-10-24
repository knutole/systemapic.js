// wms layer
Wu.WMSLayer = Wu.Model.Layer.extend({

    initialize : function (layer) {

        // set source
        this.store = layer; // db object
        
        // data not loaded
        this.loaded = false;

       
    },

    initLayer : function () {
        this.update();
    },

    update : function () {
        var map = app._map;

        // prepare raster
        this._prepareLayer();
    },

    _prepareLayer : function () {

        // set ids
        // var fileUuid    = this._fileUuid;   // file id of geojson
        // var cartoid     = this.store.data.cartoid || this._defaultCartoid;
        // var tileServer  = app.options.servers.tiles.uri;
        // var subdomains  = app.options.servers.tiles.subdomains;
        // var access_token = '?access_token=' + app.tokens.access_token;
        // var layerUuid = this._getLayerUuid();
        // var url = app.options.servers.tiles.uri + '{layerUuid}/{z}/{x}/{y}.png' + access_token;

        // // add vector tile raster layer
        // this.layer = L.tileLayer(url, {
        //     fileUuid: fileUuid,
        //     layerUuid : layerUuid,
        //     subdomains : subdomains,
        //     maxRequests : 0
        // });

        var wms_source = 'http://195.1.20.83/wms-follo/';
        // var layer_name = 'EIENDOMSKART';

        // console.log('_prepareLayer', this);

        var layer_name = this._getFirstWMSLayer();

        // create layer
        this.layer = L.tileLayer.betterWms(wms_source, {
            layers: layer_name,
            transparent: true,
            format: 'image/png',
            openContent : this.openContent.bind(this),
            parentLayer : this
        });

    },

    _getFirstWMSLayer : function () {
        var wms = this.store.data.wms;
        var layer = wms.layers[0];
        return layer;
    },

    project : function () {
        return app.activeProject;
    },

    openContent : function (options) {

        // clear old
        this.clearSelection();

        // parse content
        var parsed_content = this._prepareContent(options.content);

        // get info box
        var info_box = this.getInfoBox();

        // clear
        info_box.innerHTML = '';

        // append
        info_box.appendChild(parsed_content);
    },

    getInfoBox : function () {
        if (!this.project()._infobox) this._createInfoBox();
        return this.project()._infobox;
    },

    _createInfoBox : function () {
        var container = Wu.DomUtil.create('div', 'wms-info-box', app._appPane);
        var content = Wu.DomUtil.create('div', 'wms-info-box-content', container);
        var closeBtn = Wu.DomUtil.create('div', 'wms-info-box-close-btn', container, 'x');

        // set infobox
        // this._infobox = content;
        this.project()._infobox = content;

        // set close event
        Wu.DomEvent.on(closeBtn, 'click', this.clearSelection.bind(this));
    },

    clearSelection : function () {
    
        // remove polygons
        _.forEach(this._overlays, function (o) {
            o.remove();
            delete this._overlays[o];
        }.bind(this));

        // remove description box
        var infobox = this.getInfoBox();

        // clear
        if (infobox) infobox.innerHTML = '';
    },

    _getGeocodingAddress : function (content) {
        var f = '';
        if (!content) return f;
        if (!content.results) return f;
        if (!_.size(content.results)) return f;
        return content.results[0].formatted_address;
    },

    _prepareContent : function (results) {
        if (!this._added) return;

        // parse content
        var content = Wu.parse(results.feature);

        // create containers
        var html = Wu.DomUtil.create('div', 'wms-content');
        var main_header = Wu.DomUtil.create('div', 'wms-header', html);
        var main_content = Wu.DomUtil.create('div', 'wms-content', html);

        // set header
        main_header.innerHTML = 'Plananalyse';

        // address bar
        var address_text = this._getGeocodingAddress(results.geocoding);
        var address_header = Wu.DomUtil.create('div', 'wms-address', main_content, address_text);

        var content = _.sortBy(content, function (cont) {
            return cont.FeatureType;
        });

        // get "eiendom" index
        // add eiendom to front
        var ie = _.findIndex(content, function (con) {
            return con.FeatureType == 'Eiendom';
        });
        var eiendom = _.find(content, function (c) {
            return c.FeatureType == 'Eiendom';
        });
        content.splice(ie, 1);
        content.unshift(eiendom);

        _.forEach(content, function (c) {

            // skip teiggrenser
            if (c.FeatureType == 'Teiggrense') return;

            // container
            var container = Wu.DomUtil.create('div', 'wms-content-container', main_content);
            var header = Wu.DomUtil.create('div', 'wms-content-header', container);
            var attributes = Wu.DomUtil.create('div', 'wms-content-attributes-container', container);

            // set header
            header.innerHTML = _.capitalize(c.FeatureType);

            // attributes
            _.forEach(c.AttributesList, function (a) {

                var wrap = Wu.DomUtil.create('div', 'wms-content-attributes-wrapper', attributes)
                var namediv = Wu.DomUtil.create('div', 'wms-content-attributes-name', wrap);
                var valuediv = Wu.DomUtil.create('div', 'wms-content-attributes-value', wrap);

                // set values
                var name = a.Name + ':';
                var value = a.Value;

                // create link
                if (a.Name == 'Link') {
                    value = '<a href="' + value + '" target="_blank">Se mer informasjon</a>';
                    name = 'Info:';
                } 
                
                // add values
                namediv.innerHTML = name;
                valuediv.innerHTML = value;

            });

            // create polygon from geometry
            var geometry = [];
            _.forEach(c.Geometry.Positions, function (g) {
                geometry.push([g.X, g.Y]);
            });

            if (c.FeatureType == 'Eiendom') {

                // // create polygon from geometry
                // var geometry = [];
                // _.forEach(c.Geometry.Positions, function (g) {
                //     geometry.push([g.X, g.Y]);
                // });

                // create polygon
                var polygon = turf.polygon([geometry]);

                // add geojson
                var overlay = this._overlays[c.FeatureType] = L.geoJSON(polygon, {
                    style : {
                        "color": "red",
                        "weight": 5,
                        "opacity": 0.65,
                        "fillOpacity" : 0.1
                    }
                });

                // add permanently
                overlay.addTo(app._map);

                // highlight polygon on hover
                Wu.DomEvent.on(container, 'mouseenter', function (e) {
                    container.style.background = 'rgb(99, 109, 125)';
                    overlay.setStyle({
                        "color": "red",
                        "weight": 5,
                        "opacity": 0.65,
                        "fillOpacity" : 0.2
                    });
                });
                // highlight polygon on hover
                Wu.DomEvent.on(container, 'mouseleave', function (e) {
                    container.style.background = '';
                    overlay.setStyle({
                        "color": "red",
                        "weight": 5,
                        "opacity": 0.65,
                        "fillOpacity" : 0.1
                    });
                });


            } else {

                // var exempt = ['Kommune', 'Vei', 'Kommuneplan'];
                
                var exempt = [];

                if (!_.includes(exempt, c.FeatureType)) {

                    // // create polygon from geometry
                    // var geometry = [];
                    // _.forEach(c.Geometry.Positions, function (g) {
                    //     geometry.push([g.X, g.Y]);
                    // });

                    // first/last
                    var first = _.first(c.Geometry.Positions);
                    var last = _.last(c.Geometry.Positions);

                    var isPolygon = (first.X == last.X && first.Y == last.Y);

                     try {
                        
                        // if (isPolygon) {

                        //     // create polygon
                        //     var geojson = turf.polygon([geometry]);
                            
                        // } else {
                           
                        //     // is polyline
                        //     var geojson = turf.linestring(geometry);
                        // }

                        var geojson = isPolygon ? turf.polygon([geometry]) : turf.linestring(geometry);

                    } catch (e) {
                        console.log('turf err', e, c);
                        return;
                    }

                    // add geojson
                    var overlay = this._overlays[c.FeatureType] = L.geoJSON(geojson, {
                        style : {
                            "color": "#ff7800",
                            "weight": 5,
                            "opacity": 0.65,
                            "fillOpacity" : 0.2
                        }
                    });

                    // highlight polygon on hover
                    Wu.DomEvent.on(container, 'mouseenter', function (e) {
                        container.style.background = 'rgb(99, 109, 125)';
                        overlay.addTo(app._map);
                    });
                    // highlight polygon on hover
                    Wu.DomEvent.on(container, 'mouseleave', function (e) {
                        container.style.background = '';
                        overlay.remove();
                    });

                } 
            }

        }.bind(this));

        return html;
    },

    _overlays : {},

    // _getLayerUuid : function () {
    //     return this.store.data.postgis.layer_id;
    // },

    // getMeta : function () {
    //     var metajson = this.store.metadata;
    //     var meta = Wu.parse(metajson);
    //     return meta;
    // },

    // getData : function () {
    //     return this.store.data.postgis;
    // },

    // getFileMeta : function () {
    //     var file = app.Account.getFile(this.store.file);
    //     var metajson = file.store.data.raster.metadata;
    //     var meta = Wu.parse(metajson);
    //     return meta;
    // },

    getExtent : function () {
        var meta = this.getMeta();
        if (!meta) return;
        var extent_geojson = meta.extent_geojson;
        if (!extent_geojson) return;
        var coordinates = extent_geojson.coordinates;
        if (!coordinates) return;
        var coords = coordinates[0];

        var extent = [
            coords[0][0],
            coords[0][1],
            coords[2][0],
            coords[2][1]
        ];
        return extent;
    },

    flyTo : function () {

        var extent = this.getExtent();

        if (!extent) return;

        var southWest = L.latLng(extent[1], extent[0]);
        var northEast = L.latLng(extent[3], extent[2]);
        var bounds = L.latLngBounds(southWest, northEast);
        var map = app._map;
        var row_count = parseInt(this.getMeta().row_count);
        var flyOptions = {};

        // if large file, don't zoom out
        if (row_count > 500000) { 
            var zoom = map.getZoom();
            flyOptions.minZoom = zoom;
        }

        // fly
        map.fitBounds(bounds, flyOptions);
    },

    deleteLayer : function () {

        // confirm
        var message = 'Are you sure you want to delete this layer? \n - ' + this.getTitle();
        if (!confirm(message)) return console.log('No layer deleted.');

        // get project
        var layerUuid = this.getUuid();
        var project = _.find(app.Projects, function (p) {
            return p.layers[layerUuid];
        });

        // delete layer
        project.deleteLayer(this);
    },

    downloadLayer : function () {
        console.log('wms downloadLayer');
    },

    isRaster : function () {
        return true;
    },

    setData : function (data) {
        if (!data) return console.error('no style to set!');
        this.store.data.postgis = data;
        this.save('data');
    },
   
    _refreshLayer : function (layerUuid) {

        this.layer.setOptions({
            layerUuid : layerUuid
        });

        this.layer.redraw();
    },

    add : function (type) {

        // mark as base or layermenu layer
        this._isBase = (type == 'baselayer');
        
        // add
        this.addTo();
    },

    addTo : function () {
        if (!this._inited) this.initLayer();

        // add to map
        this._addTo();
        
        // add to controls
        this.addToControls();
    },

    _addTo : function (type) {
        if (!this._inited) this.initLayer();

        var map = app._map;

        // leaflet fn
        map.addLayer(this.layer);

        // add to active layers
        app.MapPane.addActiveLayer(this);   // includes baselayers

        // mark
        this._added = true;

        // fire event
        Wu.Mixin.Events.fire('layerEnabled', { detail : {
            layer : this
        }}); 

    },


    remove : function (map) {
        var map = map || app._map;

        // leaflet fn
        if (map.hasLayer(this.layer)) map.removeLayer(this.layer);

        // remove from active layers
        app.MapPane.removeActiveLayer(this);    

        // remove gridLayer if available
        if (this.gridLayer) {
            this.gridLayer._flush();
            if (map.hasLayer(this.gridLayer)) map.removeLayer(this.gridLayer); 
        }

        // remove from zIndex
        this._removeFromZIndex();

        // remove from descriptionControl if avaialbe
        // var descriptionControl = app.MapPane.getControls().description;
        // if ( descriptionControl ) descriptionControl._removeLayer(this);

        // remove overlays
        _.forEach(this._overlays, function (o) {
            o.remove();
            delete this._overlays[o];
        }.bind(this))

        this._added = false;

        // fire layer enabled
        this.fire('disabled', {
            layer : this
        });
    },

    isAdded : function () {
        return this._added;
    },


});



L.TileLayer.BetterWMS = L.TileLayer.WMS.extend({

    options : {
        // prepareContent : function () {},
        parentLayer : null,
        openContent : function () {}
    },
  
    onAdd: function (map) {
        // Triggered when the layer is added to a map.
        //   Register a click listener, then do all the upstream WMS things
        L.TileLayer.WMS.prototype.onAdd.call(this, map);
        map.on('click', this.getFeatureInfo, this);
    },

    onRemove: function (map) {
        // Triggered when the layer is removed from a map.
        //   Unregister a click listener, then do all the upstream WMS things
        L.TileLayer.WMS.prototype.onRemove.call(this, map);
        map.off('click', this.getFeatureInfo, this);

        if (this._popup) {
            this._popup.remove();
        }
    },

    getFeatureInfo: function (evt) {
        // Make an AJAX request to the server and hope for the best
        var url = this.getFeatureInfoUrl(evt.latlng);
        var showResults = L.Util.bind(this.showGetFeatureInfo, this);

        var ops = {};


        // set progress bar
        app.ProgressBar.timedProgress(1500)

        ops.feature = function (callback) {
            $.ajax({
                url: url,
                success: function (data, status, xhr) {
                    var err = typeof data === 'string' ? null : data;
                    callback(err, data);
                },
                error: function (xhr, status, error) {
                    callback(error);  
                }
            });
        };

        ops.geocoding = function (callback) {

            var url = [
                'https://maps.googleapis.com/maps/api/geocode/json?',
                'latlng=',
                evt.latlng.lat + ',' + evt.latlng.lng,
                '&key=AIzaSyCavrqiBU2rP7UljU4y3-UQP4h8gjB1IEw'
            ];
            
            $.ajax({
                url: url.join(''),
                success: function (data, status, xhr) {
                    var err = typeof data === 'string' ? null : data;
                    callback(null, data);
                },
                error: function (xhr, status, error) {
                    callback(null);  
                }
            });
        };

        async.parallel(ops, function (err, results) {
            showResults(err, evt.latlng, results);
        }); 

       

       

        // https://maps.googleapis.com/maps/api/geocode/json?latlng=40.714224,-73.961452&key=AIzaSyBVrB_4RHkrlLHIpK15VHs1LrwFszWvfPI

    },

    getFeatureInfoUrl: function (latlng) {
        
        // Construct a GetFeatureInfo request URL given a point
        var point = this._map.latLngToContainerPoint(latlng, this._map.getZoom());
        var size = this._map.getSize();

        // console.log('poinint:', point, latlng);
        // var params = {
        //     request: 'GetFeatureInfo',
        //     service: 'WMS',
        //     srs: 'EPSG:4326',
        //     styles: this.wmsParams.styles,
        //     transparent: this.wmsParams.transparent,
        //     version: this.wmsParams.version,      
        //     format: this.wmsParams.format,
        //     bbox: this._map.getBounds().toBBoxString(),
        //     height: size.y,
        //     width: size.x,
        //     layers: this.wmsParams.layers,
        //     query_layers: this.wmsParams.layers,
        //     info_format: 'text/html'
        // };

        // var params = {
        //     request: 'GetFeatureInfo',
        //     service: 'WMS',
        //     srs: 'EPSG:4326',
        //     // styles: this.wmsParams.styles,
        //     // transparent: this.wmsParams.transparent,
        //     version: '1.1.0',
        //     tolerance : 25,  
        //     styles : '',    
        //     // format: this.wmsParams.format,
        //     // bbox: this._map.getBounds().toBBoxString(),
        //     height: size.y,
        //     width: size.x,
        //     layers: this.wmsParams.layers,
        //     query_layers: 'SKI_WMS-FOLLO:EIENDOMSKART,KULTURMINNER',
        //     layers: 'SKI_WMS-FOLLO:EIENDOMSKART,KULTURMINNER',
        //     format : 'image/png',

        //     info_format: 'text/html',
        //     x : point.x,
        //     y : point.y,
        //     bbox : app._map.getBounds().toBBoxString(),
        // };


        // norkart proxy query
        var params = {
            service: 'WMS',
            srs: 'EPSG:4326',
            tolerance : 25,  
            y : latlng.lat,
            x : latlng.lng,
            appId : 'CPC-Kommunekart',
            // querylayers : 'SKI_WMS-FOLLO:EIENDOMSKART'
        };

        var querylayers = 'SKI_WMS-FOLLO:EIENDOMSKART,KULTURMINNER,PBLTILTAK,BYGGESAKER_UNDER_ARBEID,KP2,RP2,BP3VN2,RP3VN2,KP3,AR5,VEIKATEGORI,RODER;GeoServer_WMS_DOK:layergroup_63;Follo-WMS-TURKART-SOMMER:SYKKELRUTE,SYKKELRUTEFORSLAG,FOTRUTE,FOTRUTEFORSLAG;AreaWMS:0213;';
        params.querylayers = querylayers;

        // debug url, norkart proxy
        var url = 'https://kommunekart.com/api/WebPublisher/GfiProxy?';
        var done_url = url + L.Util.getParamString(params, url, true);
        return done_url;
    },

    getPopup : function () {
        return this._popup;
    },

    showGetFeatureInfo: function (err, latlng, content) {
        if (err) { console.log(err); return; } // do nothing if there's an error

        // don't add if layer was removed from map while querying
        if (!this.options.parentLayer.isAdded()) return;

        // open content in description box
        this.options.openContent({
            latlng : latlng,
            content : content
        });

    },

});

L.tileLayer.betterWms = function (url, options) {
  return new L.TileLayer.BetterWMS(url, options);  
};
