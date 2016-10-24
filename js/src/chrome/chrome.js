Wu.Chrome = Wu.Class.extend({

    initialize : function (options) {

        // set options
        Wu.setOptions(this, options);

        // listen up
        this._listen();

        // local initialize
        this._initialize();
    },      

    _listen : function () {
        Wu.Mixin.Events.on('projectSelected',      this._projectSelected, this);
        Wu.Mixin.Events.on('projectDeleted',       this._onProjectDeleted, this);
        Wu.Mixin.Events.on('editEnabled',          this._editEnabled, this);
        Wu.Mixin.Events.on('editDisabled',         this._editDisabled, this);
        Wu.Mixin.Events.on('layerEnabled',         this._layerEnabled, this);
        Wu.Mixin.Events.on('layerDisabled',        this._layerDisabled, this);
        Wu.Mixin.Events.on('fileImported',         this._onFileImported, this);
        Wu.Mixin.Events.on('fileDeleted',          this._onFileDeleted, this);
        Wu.Mixin.Events.on('layerAdded',           this._onLayerAdded, this);
        Wu.Mixin.Events.on('layerEdited',          this._onLayerEdited, this);
        Wu.Mixin.Events.on('layerDeleted',         this._onLayerDeleted, this);
        Wu.Mixin.Events.on('closeMenuTabs',        this._onCloseMenuTabs, this);
        Wu.Mixin.Events.on('fileProcessing',       this._onFileProcessing, this);
        Wu.Mixin.Events.on('processingProgress',   this._onProcessingProgress, this);
        Wu.Mixin.Events.on('processingError',      this._onProcessingError, this);
        Wu.Mixin.Events.on('tileCount',            this._onTileCount, this);
        Wu.Mixin.Events.on('tileset_meta',         this._onTilesetMeta, this);
        Wu.Mixin.Events.on('generatedTiles',       this._onGeneratedTiles, this);
        Wu.Mixin.Events.on('closeFullscreen',      this._onCloseFullscreen, this);
        Wu.Mixin.Events.on('updatedProjectAccess', this._onUpdatedProjectAccess, this);
        Wu.Mixin.Events.on('maskUploaded',         this._onMaskUploaded, this);

        Wu.DomEvent.on(window, 'resize', _.throttle(this._onWindowResize, 1000), this);
    },

    _projectSelected : function (e) {
        if (!e.detail.projectUuid) return;

        // set project
        this._project = app.activeProject = app.Projects[e.detail.projectUuid];

        // refresh pane
        this._refresh({event : 'projectSelected'});
    },

    updateMapSize : function () {

        return;
        
        var rightChrome = app.Chrome.Right;
        var leftChrome = app.Chrome.Left;
        var left = 0;
        var width = app._appPane.offsetWidth;

        if (!rightChrome || !leftChrome) return;

        // only left open
        if (leftChrome._isOpen && !rightChrome._isOpen) {
            left = left + leftChrome.options.defaultWidth;
            width = width - leftChrome.options.defaultWidth;
        }

        // only right open
        if (!leftChrome._isOpen && rightChrome._isOpen) {
            width = width - rightChrome.options.defaultWidth;

            // css exp
            left = left + rightChrome.options.defaultWidth;
        }

        // none open
        if (!leftChrome._isOpen && !rightChrome._isOpen) {
            width = app._appPane.offsetWidth;
            left = 0;
        }

        // set size
        var map = app._map.getContainer();
        app._map._controlCorners.topleft.style.left = left + 'px';
        app._map._controlCorners.bottomleft.style.left = left + 'px';

    },

    
    // dummies
    // _projectSelected : function () {},
    _initialize             : function () {},
    _initContainer          : function () {},
    _editEnabled            : function () {},
    _editDisabled           : function () {},
    _layerEnabled           : function () {},
    _layerDisabled          : function () {},
    _updateView             : function () {},
    _refresh                : function () {},
    _onFileImported         : function () {},
    _onFileDeleted          : function () {},
    _onLayerAdded           : function () {},
    _onLayerEdited          : function () {},
    _onLayerDeleted         : function () {},
    _onProjectDeleted       : function () {},
    _onCloseMenuTabs        : function () {},
    _onFileProcessing       : function () {},
    _onProcessingProgress   : function () {},
    _onProcessingError      : function () {},
    _onTileCount            : function () {},
    _onGeneratedTiles       : function () {},
    _onTilesetMeta          : function () {},
    _onCloseFullscreen      : function () {},
    _onUpdatedProjectAccess : function () {},
    _onWindowResize         : function () {},
    _onMaskUploaded         : function () {}

});