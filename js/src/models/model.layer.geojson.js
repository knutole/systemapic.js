

// todo: move to separate file
Wu.Model.Layer.GeoJSONMaskLayer = Wu.Model.Layer.extend({

    options : {
        style : {
            fillColor : 'blue',
            weight : 0.5,
            fillOpacity : 0.6,

        }
    },

    initialize : function (options) {
        
        // set options
        Wu.setOptions(this, options);

        // set map
        this._map = app._map;

        // init layer
        this._initLayer();

    },

    _initLayer : function () {

        // ensure simple geometry of geojson (as far as possible) // todo: move to import
        var geojson = this.ensureFlat(this.options.geojson);

        // create geojson layer
        this.layer = L.geoJson(geojson);

        // set default style
        this.layer.setStyle(this.options.style);
    },

    ensureFlat : function (geojson) {
        // combine features of feature collection
        // todo: may not work with multipolygons
        if (_.size(geojson.features) > 1 && geojson.type == 'FeatureCollection') {
            geojson = this.mergePolygons(geojson);
        }
        return geojson;
    },

    // merge multifeatured polygon into flat polygon
    // ---------------------------------------------
    // geojson can be uploaded with multiple features, they are merged here...
    // 
    // see https://github.com/Turfjs/turf/blob/393013ff3f24c71fb7dd9dac99435271d94c0e06/CHANGELOG.md#301
    // and http://morganherlocker.com/post/Merge-a-Set-of-Polygons-with-turf/
    mergePolygons : function (polygons) {
        var merged = _.clone(polygons.features[0]);
        var features = polygons.features;
        for (var i = 0, len = features.length; i < len; i++) {
            var poly = features[i];
            if (poly.geometry) merged = turf.union(merged, poly);
        }
        return merged;
    },

    getLayer : function () {
        return this.layer;
    },

    add : function () {
        this._map.addLayer(this.layer);
    },

    remove : function () {
        this._map.removeLayer(this.layer);
    },

});