// postgis raster layer
Wu.RasterLayer = Wu.Model.Layer.extend({

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

        this._fileUuid = this.store.file;
        this._defaultCartoid = 'raster';

        // prepare raster
        this._prepareRaster();

    },

    _prepareRaster : function () {

        // set ids
        var fileUuid    = this._fileUuid;   // file id of geojson
        var cartoid     = this.store.data.cartoid || this._defaultCartoid;
        var tileServer  = app.options.servers.tiles.uri;
        var subdomains  = app.options.servers.tiles.subdomains;
        var access_token = '?access_token=' + app.tokens.access_token;
        var layerUuid = this._getLayerUuid();
        var url = app.options.servers.tiles.uri + '{layerUuid}/{z}/{x}/{y}.png' + access_token;

        // add vector tile raster layer
        this.layer = L.tileLayer(url, {
            fileUuid: fileUuid,
            layerUuid : layerUuid,
            subdomains : subdomains,
            maxRequests : 0
        });
    },

    _getLayerUuid : function () {
        return this.store.data.postgis.layer_id;
    },

    getMeta : function () {
        var metajson = this.store.metadata;
        var meta = Wu.parse(metajson);
        return meta;
    },

    getData : function () {
        return this.store.data.postgis;
    },

    getFileMeta : function () {
        var file = app.Account.getFile(this.store.file);
        var metajson = file.store.data.raster.metadata;
        var meta = Wu.parse(metajson);
        return meta;
    },

    getExtent : function () {
        var meta = this.getMeta();
        var extent_geojson = meta.extent_geojson;
        if (!extent_geojson) return false;
        var coordinates = extent_geojson.coordinates;
        if (!coordinates) return false;
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
        console.log('raster downloadLayer');
    },

    isRaster : function () {
        return true;
    },

    setData : function (data) {
        if (!data) return console.error('no styloe to set!');
        this.store.data.postgis = data;
        this.save('data');
    },
    setStyle : function (data) {
        console.error('deprecated??');
        return this.setData(data);
    },

    // on change in style editor, etc.
    updateStyle : function (style) {

        var layerUuid = style.layerUuid;
        var postgisOptions = style.options;

        // save 
        this.setData(postgisOptions);

        // update layer option
        this._refreshLayer(layerUuid);
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

        // add gridLayer if available
        if (this.gridLayer) {
            map.addLayer(this.gridLayer);
        }

        // add to active layers
        app.MapPane.addActiveLayer(this);   // includes baselayers

        // update zindex
        // this._addToZIndex(type);
        
        this._added = true;

        // fire event
        Wu.Mixin.Events.fire('layerEnabled', { detail : {
            layer : this
        }}); 

    },

});




