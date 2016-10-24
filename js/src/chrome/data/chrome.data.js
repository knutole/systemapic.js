Wu.Chrome.Data = Wu.Chrome.extend({

    _ : 'data',

    options : {
        defaultWidth : 400
    },

    // When a new layer is created, we make a background fade on it
    newLayer : false,

    _initialize : function () {

        // init container
        this._initContainer();

        // init content
        this._initContent();

        // register buttons
        this._registerButton();

        // hide by default
        this._hide();

        // shortcut
        app.Tools = app.Tools || {};
        app.Tools.DataLibrary = this;

    },

    _onLayerAdded : function (options) {

        console.log('_onLayerAdded', options);

        var uuid = options.detail.layerUuid;

        // remember
        this.newLayer = uuid;

        // Get layer object
        var layer = this._project.getLayer(uuid);

        if (!layer.store.metadata) {
            app.feedback.setError({
                title : 'Missing metadata',
                description : 'layer ' + uuid + ' has no associated metadata'
            });
            layer.store.metadata = '{}';
        }

        // Get layer meta
        var layerMeta = Wu.parse(layer.store.metadata);

        // Build tooltip object
        var tooltipMeta = app.Tools.Tooltip._buildTooltipMeta(layerMeta); // TODO: use event?

        // Create tooltip meta...
        layer.setTooltip(tooltipMeta);

        // refresh
        this._refresh();
    },

    _onFileDeleted : function () {
        this._refresh();
    },

    _onLayerDeleted : function () {
        this._refresh();  // debug: expensive
        this._refreshLayers();
    },

    _onLayerEdited : function () {
        this._refresh();
        this._refreshLayers();
    },

    _initContainer : function () {

        // create the container (just a div to hold errythign)
        this._container = Wu.DomUtil.create('div', 'chrome chrome-content data', this.options.appendTo);

        // Middle container
        this._innerContainer = Wu.DomUtil.create('div', 'chrome-data-inner', this._container);

        // LAYER LIST OUTER SCROLLER
        this._listOuterScroller = Wu.DomUtil.create('div', 'chrome-data-outer-scroller', this._innerContainer);
        this._listOuterScroller.style.height = '100%';

        // List container
        this._listContainer = Wu.DomUtil.create('div', 'chrome-data-scroller', this._listOuterScroller);

        // LAYER LIST
        this._createLayerListContainer();

        // FILE LIST
        this._createFileListContainer();

        // Top container (with upload button)
        this.topContainer = Wu.DomUtil.create('div', 'chrome-data-top', this._container);

        // close event
        Wu.DomEvent.on(this._innerContainer, 'click', this._closeActionPopUps, this);
        Wu.DomEvent.on(document.getElementById("app"), 'click', function () {
            Wu.Mixin.Events.fire('appClick');
        });
    },


    // Layer list container
    _createLayerListContainer : function () {

        // todo: - create preview icons for background layers
        //       - clean up DOM, wrap categories

        // data layers
        this._layerListWrapper = Wu.DomUtil.create('div', 'chrome-layer-list-wrapper', this._listContainer);
        this._layerListTitle = Wu.DomUtil.create('div', 'chrome-content-header layer-list-container-title', this._layerListWrapper, 'Layers');
        this._layersContainer = Wu.DomUtil.create('div', 'layers-container', this._layerListWrapper);

        // base layers
        this._baseLayers = Wu.DomUtil.create('div', 'chrome-content-header layer-list-container-title', this._layerListWrapper, 'Background layer');
        this._baseLayerDropdownContainer = Wu.DomUtil.create('div', 'base-layer-dropdown-container', this._layerListWrapper);
        this._colorSelectorWrapper = Wu.DomUtil.create('div', 'base-layer-color-selector-wrapper displayNone', this._layerListWrapper);


        var wms_debug = false;
        if (wms_debug) {

            // create wms
            this._createWMSLayers();

        }


        // separator line
        this._fileListSeparator = Wu.DomUtil.create('div', 'file-list-separator', this._layerListWrapper);

    },

    _createWMSLayers : function () {
        
        // wms layers
        this._wmsLayers = Wu.DomUtil.create('div', 'chrome-content-header layer-list-container-title', this._layerListWrapper, 'WMS layers');

        // get available wms layers from server
        app.api.getWMSLayers({}, function (err, wms_layers) {
            console.log('getWMSLayers', err, wms_layers);


        });

        // debug btn
        var btn = Wu.DomUtil.create('div', 'wms-button', this._wmsLayers, 'Create layer');
        Wu.DomEvent.on(btn, 'click', function () {

            

            var project = app.activeProject;

             // create Wu.CubeLayer
            var wmsLayer = {
                projectUuid : project.getUuid(), // pass to automatically attach to project
                data : { 
                    wms : {
                        source : 'http://195.1.20.83/wms-follo/',
                        layers : [
                            // 'EIENDOMSKART'
                            // 'RP3VN2'
                            'KP3'
                        ]
                    }
                },
                metadata : null,
                title : 'Kommuneplan',
                description : 'WMS layer description',
                // file : 'file-' + cube.cube_id,
                // style : JSON.stringify(this.get_default_cube_cartocss()) // save default json style
            }

            console.log('creating layer', wmsLayer);

            // create Wu layer
            app.api.createLayer(wmsLayer, function (err, wmsLayerJSON) {

                console.log('createLayer', wmsLayer, wmsLayerJSON);

                var wmsLayer = Wu.parse(wmsLayerJSON);

                var layer = project.addLayer(wmsLayer);

                console.log('added to layer', layer);

                // select project
                Wu.Mixin.Events.fire('layerAdded', { detail : {
                    projectUuid : project.getUuid(),
                    layerUuid : wmsLayer.uuid
                }});

                // open fullscreen for editing
                // this._openCubeLayerEditFullscreen(layer);

            }.bind(this));

        });

    },

  
    // File list container
    _createFileListContainer : function () {

        // HEADER
        this._fileListTitle = Wu.DomUtil.create('div', 'chrome-content-header layer-list-container-title layer-list', this._listContainer, '<i class="fa fa-database"></i> My Datasets');

        // Upload button container
        this._uploadButtonContainer = Wu.DomUtil.create('div', 'upload-button-container', this._listContainer);

        // Containers
        this._filesContainerHeader = Wu.DomUtil.create('div', 'files-container-header', this._listContainer);
        this._filesContainer = Wu.DomUtil.create('div', 'files-container', this._listContainer);
    },

    _initContent : function () {

        // add hooks
        this._addEvents();
    },

    _registerButton : function () {

        // register button in top chrome
        var top = app.Chrome.Top;

        // add a button to top chrome
        this._topButton = top._registerButton({
            name : 'data',
            className : 'chrome-button datalib',
            trigger : this._togglePane,
            context : this,
            project_dependent : true
        });

        // css experiement
        this._topButton.innerHTML = '<i class="top-button fa fa-cloud"></i>Data';

    },

    _togglePane : function () {
        if (!this._inited) this._refresh();

        // right chrome
        var chrome = this.options.chrome;

        // open/close
        this._isOpen ? chrome.close(this) : chrome.open(this); // pass this tab

        if (this._isOpen) {

            // fire event
            // app.Socket.sendUserEvent({
            app.log('opened:datalibrary', {
                category : 'Data Library'
            });
        }
    },

    _show : function () {

        // Open layer menu
        app.MapPane._controls.layermenu.open();

        // mark button active
        Wu.DomUtil.addClass(this._topButton, 'active');
        this._container.style.display = 'block';

        this._isOpen = true;

        // enable edit of layer menu...
        var layerMenu = app.MapPane.getControls().layermenu;
        if (this._project.isEditable()) layerMenu.enableEditSwitch();

        // open if closed
        if (!layerMenu._layerMenuOpen) app.Chrome.Top._openLayerMenu();
    },

    _hide : function () {

        // mark button inactive
        Wu.DomUtil.removeClass(this._topButton, 'active');
        this._container.style.display = 'none';

        if (this._isOpen) {
            var layerMenu = app.MapPane.getControls().layermenu;     // move to settings selector
            if (layerMenu) layerMenu.disableEditSwitch();
        }

        this._isOpen = false;
    },

    onOpened : function () {},
    onClosed : function () {},
    _addEvents : function () {},
    _removeEvents : function () {},
    _onWindowResize : function () {},

    getDimensions : function () {
        var dims = {
            width : this.options.defaultWidth,
            height : this._container.offsetHeight
        };
        return dims;
    },

    _onFileImported : function (e) {

        // refresh DOM
        this._refresh();

        // get file
        var file = e.detail.file;

        // automatically create layer
        file._createLayer(this._project, function (err, layer) {

            // automatically add layer to layermenu
            this._addOnImport(layer);

        }.bind(this));
    },


    _addOnImport : function (layer) {

        // add
        this.addLayer(layer);

        // enable layer
        this.enableLayer(layer);

        // fly to
        layer.flyTo();

        // refresh
        this._refreshLayers();

        // open styler if postgis
        if (layer.isVector()) {
            app.Tools.SettingsSelector.open();
        }

    },


    // need to rewrite this function.
    //
    // it's too expensive to rewrite everything for every _refresh(), and _refresh() is being called a LOT.
    // when changing project, the uploadButton needs to be aware of new project_id, but this can be solved with _onProjectSelected event instead
    // so no need to recreate upload button
    // also, no need to flush all files if only a small layer update (like rename)
    // also, no need to flush all files if only an update on single file
    // 
    // basically, the idea of recreating everythign on every change doesn't work when there's a lot of files, it's just too slow
    // currently every action takes > 2000ms if filelist is >1000 files.
    //
    // perhaps better to remove d3 completely, and just create divs normally, then update store the divs in an object on file_id keys
    _refresh : function (options) {

        console.error('_refresh!');

        // debug: don't refresh from projectSelected event
        // if (options && options.event && options.event == 'projectSelected') return;

        // if no project, return
        if (!this._project) return;

        // remove temp files
        _.each(this._tempFiles, function (tempFile, etc) {
            Wu.DomUtil.remove(tempFile.datawrap);
        });
        this._tempFiles = {};

        // Empty containers
        if ( this._layersContainer ) this._layersContainer.innerHTML = 'Currently no layers. Add data below.';
        if ( this._filesContainer )  this._filesContainer.innerHTML = '';

        // only update list if project is editable
        if (this._project.isEditable()) {

            console.log('isEditable');

            // Layer list
            this._initLayerList();
            this._refreshLayers();
        }

        this._refreshBaseLayerList();

        // File list
        this._initFileLists();
        this._refreshFiles();

        // Upload button
        this._initUploadButton();

        if (_.toArray(this.fileProviders.postgis.getFiles()).length >= 10) {
            this._filesContainerHeader.style.display = 'block';
            this._initSortButtons();
        } else {
            this._filesContainerHeader.style.display = 'none';
            if (this.searchInput) {
                this.searchInput.value = '';
            }
        }

        // layer title
        var projectName = this._project.getTitle();
        this._layerListTitle.innerHTML = 'Layers for ' + projectName;

        // hide layers if not editor
        if (!this._project.isEditable()) {
            // todo: put layers in wrapper and hide
            Wu.DomUtil.addClass(this._layerListWrapper, 'displayNone');
        } else {
            Wu.DomUtil.removeClass(this._layerListWrapper, 'displayNone');
        }

        // mark inited
        this._inited = true;

    },

    _initUploadButton : function () {

        // Return if upload button already exists
        if (this._uploadButton) return;

        // get upload button
        this._uploadButton = app.Data.getUploadButton('chrome-upload-button', this._uploadButtonContainer);

        // set title
        this._uploadButton.uploadDiv.innerHTML = '<i class="fa fa-cloud-upload"></i>Upload data';

        // set event for options button
        Wu.DomEvent.on(this._uploadButton.optionsDiv, 'mousedown', this._optionsBtnClick, this);

        // set event for create-cube item
        Wu.DomEvent.on(this._uploadButton.createCube, 'mousedown', this._createCubeClick, this);

    },

    _createCubeClick : function () {

        var project = app.activeProject;

        // create cube
        app.api.createCube({}, function (err, cubeJSON) {
            if (err) return console.error('createCube err: ', err);

            var cube = Wu.parse(cubeJSON);

            // create Wu.CubeLayer
            var cubeLayer = {
                projectUuid : project.getUuid(), // pass to automatically attach to project
                data : { cube : cube },
                metadata : null,
                title : 'New cube layer',
                description : 'Cube layer description',
                file : 'file-' + cube.cube_id,
                style : JSON.stringify(this.get_default_cube_cartocss()) // save default json style
            }

            // create Wu layer
            app.api.createLayer(cubeLayer, function (err, cubeLayerJSON) {

                var cubeLayer = Wu.parse(cubeLayerJSON);

                var layer = project.addLayer(cubeLayer);

                // select project
                Wu.Mixin.Events.fire('layerAdded', { detail : {
                    projectUuid : project.getUuid(),
                    layerUuid : cubeLayer.uuid
                }});

                // open fullscreen for editing
                this._openCubeLayerEditFullscreen(layer);

            }.bind(this));

        }.bind(this));

        // toggle dropdown
        this._optionsBtnClick();
    },

    // todo: refactor to server side
    get_default_cube_cartocss : function () {
        // raster debug
        var defaultCartocss = '';
        defaultCartocss += '#layer {'
        defaultCartocss += 'raster-opacity: 1; '; 
        // defaultCartocss += 'raster-scaling: gaussian; '; 
        defaultCartocss += 'raster-colorizer-default-mode: linear; '; 
        defaultCartocss += 'raster-colorizer-default-color: transparent; '; 
        defaultCartocss += 'raster-comp-op: color-dodge;';
        defaultCartocss += 'raster-colorizer-stops: '; 
        // white to blue
        defaultCartocss += '  stop(20, rgba(0,0,0,0)) '; 
        defaultCartocss += '  stop(21, #dddddd) '; 
        defaultCartocss += '  stop(100, #0078ff) '; 
        defaultCartocss += '  stop(200, #000E56) '; 
        defaultCartocss += '  stop(255, rgba(0,0,0,0), exact); '; 
        defaultCartocss += ' }';
        return defaultCartocss;
    },

    _optionsBtnClick : function () {

        if (this._optionsDropdownOpen) {

            // remove dropdown
            Wu.DomUtil.addClass(this._uploadButton.dropdown, 'displayNone');

            // mark closed
            this._optionsDropdownOpen = false;

        } else {
            
            // show dropdown
            Wu.DomUtil.removeClass(this._uploadButton.dropdown, 'displayNone');
             
            // mark open
            this._optionsDropdownOpen = true;
        }

    },

    _initSortButtons : function () {
        var sortType = {
            'name': 'name',
            'date': 'lastUpdated',
            'size': 'dataSize'
        };

        this.reverse = false;

        if (this.sortMenu) {
            return;
        }

        this.sortMenu = Wu.DomUtil.create('div', 'files-sort-menu', this._filesContainerHeader);
        this.sortSelect = Wu.DomUtil.create('div', 'files-sort-select', this._filesContainerHeader, 'Sort');
        this.expendedContaner = Wu.DomUtil.create('div', 'expended-container', this._filesContainerHeader);
        this.searchInputWraper = Wu.DomUtil.create('div', 'files-search-input-wraper', this._filesContainerHeader);

        var searchIcon = Wu.DomUtil.create('i', 'fa fa-search search-files', this.searchInputWraper);

        this.searchInput = Wu.DomUtil.create('input', 'files-search-input', this.searchInputWraper);
        this.searchInput.placeholder = 'sort: date';
        this.currentSort = 'lastUpdated';

        Wu.DomEvent.on(this.searchInput, 'keyup', this._onKeyup, this);

        Wu.DomEvent.on(this.sortSelect, 'click', this._onSortSelectClick, this);

        this.sortOptions = Wu.DomUtil.create('div', 'files-sort-options', this.expendedContaner);

        _.forEach(_.keys(sortType), function (type) {
            var option = Wu.DomUtil.create('div', 'sort-option', this.sortOptions);
            option.innerHTML = 'Sort by ' + type;

            Wu.DomEvent.on(option, 'click', function (e) {
                Wu.DomEvent.stop(e);
                this.searchInput.placeholder = 'sort: ' + type;
                this.currentSort = sortType[type];
                this._sortFiles();
            }, this);
        }.bind(this));

        this.sortOrderWraper = Wu.DomUtil.create('div', 'files-sort-order-switch-wraper', this.sortOptions);

        var sort_order_toggle_label = Wu.DomUtil.create('div', 'sort-order-label');

        this.orderSwitch = new Wu.button({
            id: 'order-switch',
            type: 'switch',
            isOn: this.reverse,
            right: false,
            disabled: false,
            appendTo: this.sortOrderWraper,
            fn: this._toggleSortOrder.bind(this),
            className: 'sort-order-switch'
        });

        this.sortOptions.style.display = 'none';

        // close dropdown on any click
        Wu.DomEvent.on(app._appPane, 'click', function (e) {

            // only if target == self
            var relevantTarget = e.target == this.expendedContaner || e.target == this.sortOptions || e.target == this.sortOrderWraper;
            if (!relevantTarget) this._closeSortSelect();

        }, this);

        Wu.DomEvent.on(this._filesContainerHeader, 'click', function (e) {
            this._closeSortSelect();
            Wu.DomEvent.stop(e);
        }, this);
    },

    _toggleSortOrder : function (e, isOn) {
        isOn ? this.reverse = true : this.reverse = false;
        if (e) {
            Wu.DomEvent.stop(e);
        }
        this._refreshFiles();
    },

    _onSortSelectClick : function (e) {
        this.sortOptions.style.display === 'none' ? this.sortOptions.style.display = 'block' : this.sortOptions.style.display = 'none';

        var toggleClass = Wu.DomUtil.hasClass(this.sortSelect, 'expanded') ? Wu.DomUtil.removeClass : Wu.DomUtil.addClass;
        toggleClass(this.sortSelect, 'expanded');
        if (e) {
            Wu.DomEvent.stop(e);
        }
    },

    _closeSortSelect : function () {
        this.sortOptions.style.display = 'none';
        Wu.DomUtil.removeClass(this.sortSelect, 'expanded');
    },

    _onKeyup : function (e) {
        this._refreshFiles({
            sortBy: this.currentSort,
            reverse: this.reverse,
            filter: this.searchInput.value.toLowerCase()
        });
    },

    _sortFiles : function (type) {
        this._refreshFiles({
            sortBy: this.currentSort,
            reverse: this.reverse,
            filter: this.searchInput.value.toLowerCase()
        });

        this._onSortSelectClick();
    },

    // When clicking on container, close popups
    _closeActionPopUps : function (e) {

        var classes = e.target.classList;
        var stop = false;
        var actions = ['file-action', 'file-popup-trigger', 'file-popup', 'toggle-button'];

        // Stop when clicking on these classes
        if (classes.forEach) {
            classes.forEach(function(c) {
                if ( actions.indexOf(c) !== -1) stop = true;
            });
        }

        // Stop if we're editing name
        if (e.target.name == this.editingFileName) stop = true;
        if (e.target.name == this.editingLayerName) stop = true;

        if (stop) return;

        // Reset
        this.showFileActionFor = false;

        this.showLayerActionFor = false;
        this.selectedLayers = [];

        // this._refreshFiles(); // see https://github.com/systemapic/systemapic.js/issues/203
        this._refreshLayers();
    },

    _initFileLists : function () {

        // Holds each section (project files, my files, etc)
        // Currently only "my files"
        this.fileListContainers = {};

        // Show file actions for this specific file (i.e. download, rename, etc)
        this.showFileActionFor = false;

        // Edit file name for this file
        this.editingFileName = false;

        // File list (global)
        this.fileProviders = {};

        this.fileProviders.postgis = {
            name : 'Data Library',
            data : [],
            getFiles : function () {
                return app.Account.getFiles();
            }
        };

        // Create FILE LIST section, with D3 container
        for (var f in this.fileProviders ) {

            this.fileListContainers[f] = {};

            // Create wrapper
            this.fileListContainers[f].wrapper = Wu.DomUtil.create('div', 'file-list-container', this._filesContainer);

            // D3 Container
            this.fileListContainers[f].fileList = Wu.DomUtil.create('div', 'file-list-container-file-list', this.fileListContainers[f].wrapper);
            this.fileListContainers[f].D3container = d3.select(this.fileListContainers[f].fileList);
        }

    },


    _refreshFiles : function (options) {
        options = options || {};

        // FILES
        for (var p in this.fileProviders) {
            var provider = this.fileProviders[p];
            var files = provider.getFiles();
            var sortBy = options.sortBy || this.currentSort || 'lastUpdated'
            var reverse = options.reverse || this.reverse || false;
            var filter = options.filter || this.searchInput && this.searchInput.value && this.searchInput.value.toLowerCase() || '';

            if (filter) {
                provider.data = _.filter(_.toArray(files), function (file) {
                    return file.store.name.toLowerCase().indexOf(filter) !== -1 || app.Users[file.store.createdBy].getFullName().toLowerCase().indexOf(filter) !== -1;
                });
                files = provider.data;
            }


            // get file list, sorted by last updated
            provider.data = _.sortBy(_.toArray(files), function (f) {

                // need to parseInt dataSize
                if (sortBy === 'dataSize') {
                    return parseInt(f.store[sortBy]);
                }

                if (sortBy === 'lastUpdated') {
                    var m = moment(f.store.lastUpdated).valueOf();
                    return m;
                }

                // if (sortBy === 'created') {
                //     // unix timestamp
                //     var m = moment(f.store.created).valueOf();
                // }

                return f.store[sortBy];
            });

            if (reverse !== true) {
                provider.data = provider.data.reverse();
            }

            // containers
            var D3container = this.fileListContainers[p].D3container;
            var data = provider.data;

            // update
            this.initFileList(D3container, data, p);
        }

    },

    // create temp file holder in file list while processing
    _onFileProcessing : function (e) {
        var file = e.detail.file;
        var unique_id = file.uniqueIdentifier;
        var filename = file.fileName;

        // add temp file holder
        var datawrap = Wu.DomUtil.create('div', 'data-list-line processing');
        var title = Wu.DomUtil.create('div', 'file-name-content processing', datawrap, filename);
        var feedback = Wu.DomUtil.create('div', 'file-feedback processing', datawrap);
        var percent = Wu.DomUtil.create('div', 'file-feedback-percent processing', datawrap);

        // remember
        this._tempFiles = this._tempFiles || {};
        this._tempFiles[unique_id] = {
            feedback : feedback,
            percent : percent,
            file : file,
            datawrap : datawrap
        };

        // get file list
        var file_list = this.fileListContainers.postgis.wrapper;

        // prepend
        file_list.insertBefore(datawrap, file_list.firstChild);
    },

    _onProcessingProgress : function (e) {
        if (!this._tempFiles) return;

        var data = e.detail;
        var percent = data.percent;
        var text = data.text;
        var uniqueIdentifier = data.uniqueIdentifier;

        // get temp file divs
        var tempfile = this._tempFiles[uniqueIdentifier];

        if (!tempfile) return;

        // set feedback
        tempfile.feedback.innerHTML = text;
        tempfile.percent.innerHTML = percent + '% done';

    },

    _onProcessingError : function (e) {

        var error = e.detail;
        var uniqueIdentifier = error.uniqueIdentifier;

        // get temp file divs
        var tempfile = this._tempFiles[uniqueIdentifier];

        // set feedback
        var feedbackText = _.isObject(error.description) ? 'Error code: ' + error.description.code : error.description;
        tempfile.feedback.innerHTML = feedbackText;
        tempfile.percent.innerHTML = 'Upload failed';

        // add error class
        Wu.DomUtil.addClass(tempfile.datawrap, 'upload-error');

        // close on click
        Wu.DomEvent.on(tempfile.datawrap, 'click', this._refresh, this);
    },



    // ┌─┐┌─┐┌─┐┬ ┬  ┌─┐┬┬  ┌─┐  ┬ ┬┬─┐┌─┐┌─┐┌─┐┌─┐┬─┐
    // ├┤ ├─┤│  ├─┤  ├┤ ││  ├┤   │││├┬┘├─┤├─┘├─┘├┤ ├┬┘
    // └─┘┴ ┴└─┘┴ ┴  └  ┴┴─┘└─┘  └┴┘┴└─┴ ┴┴  ┴  └─┘┴└─
    initFileList : function (D3container, data, library) {

        // debug: only get a few last datasets
        var data = _.sortBy(data, 'lastUpdated').splice(0, 50);

        // BIND
        var dataListLine = D3container
        .selectAll('.data-list-line')
        .data(data);

        // ENTER
        dataListLine
        .enter()
        .append('div')
        .classed('data-list-line', true);

        // UPDATE
        dataListLine
        .classed('file-selected', function (d) {

            var uuid = d.getUuid();

            // If selected by single click
            if ( uuid == this.showFileActionFor ) return true;

            // Else no selection
            return false;

        }.bind(this));


        dataListLine
        .classed('editingFileName', function (d) {
            var uuid = d.getUuid();
            if ( this.editingFileName == uuid ) {
                return true;
            }

            return false;
        }.bind(this));

        // EXIT
        dataListLine
        .exit()
        .remove();


        // CREATE NAME CONTENT (file name)
        this.createFileNameContent(dataListLine, library);

        // CREATE FILE META (date and size)
        this.createFileMetaContent(dataListLine, library);

        // CREATE POP-UP TRIGGER (the "..." button)
        this.createFilePopUpTrigger(dataListLine, library);

        // CREATE FILE ACTION POP-UP (download, delete, etc)
        this.createFileActionPopUp(dataListLine, library)

    },


    // ┌─┐┬┬  ┌─┐  ┌┬┐┌─┐┌┬┐┌─┐
    // ├┤ ││  ├┤   │││├┤  │ ├─┤
    // └  ┴┴─┘└─┘  ┴ ┴└─┘ ┴ ┴ ┴

    createFileMetaContent : function (parent, library) {

        var that = this;

        // Bind
        var nameContent = parent
        .selectAll('.file-meta-content')
        .data(function(d) { return [d] });

        // Enter
        nameContent
        .enter()
        .append('div')
        .classed('file-meta-content', true);


        // Update
        nameContent
        .html(function (d) {

            var _str = '';

            // User
            var userId = d.getCreatedBy();
            var userName = app.Users[userId].getFullName();

            _str += '<span class="file-meta-author">' + userName + '</span>';

            // Date
            // var date = moment(d.getCreated()).format('DD MMMM YYYY');
            var date = d.getCreatedPretty();
            _str += '- <span class="file-meta-date">' + date + '</span>';

            // Size
            var bytes = d.getStore().dataSize;
            var size = Wu.Util.bytesToSize(bytes);
            _str += ' – <span class="file-meta-size">' + size + '</span>';

            return _str;

        }.bind(this));


        // Exit
        nameContent
        .exit()
        .remove();

    },




    // ┌─┐┬┬  ┌─┐  ┌┐┌┌─┐┌┬┐┌─┐
    // ├┤ ││  ├┤   │││├─┤│││├┤
    // └  ┴┴─┘└─┘  ┘└┘┴ ┴┴ ┴└─┘

    createFileNameContent : function (parent, library) {
        // Bind
        var nameContent = parent
        .selectAll('.file-name-content')
        .data(function(d) { return [d] });

        // Enter
        nameContent
        .enter()
        .append('div')
        .classed('file-name-content', true);


        // Update
        nameContent
        .html(function (d) {
            return d.getTitle();
        }.bind(this))
        .on('dblclick', function (d) {
            this.activateFileInput(d, library);
        }.bind(this));

        // Exit
        nameContent
        .exit()
        .remove();

        // Create input field (for editing file name)
        this.createFileInputField(nameContent, library);

    },


    // ┌─┐┬┬  ┌─┐  ┬┌┐┌┌─┐┬ ┬┌┬┐
    // ├┤ ││  ├┤   ││││├─┘│ │ │
    // └  ┴┴─┘└─┘  ┴┘└┘┴  └─┘ ┴

    // For editing file name

    createFileInputField : function (parent, library) {
        var that = this;
           
        // Bind
        var nameInput = parent
        .selectAll('.file-name-input')
        .data(function (d) {
            var uuid = d.getUuid();
            if ( this.editingFileName == uuid ) return [d];
            return false;
        }.bind(this));

        // Enter
        nameInput
        .enter()
        .append('input')
        .attr('type', 'text')
        .classed('file-name-input', true);


        // Update
        nameInput
        .attr('value', function (d) {
            if ( library == 'layers' ) return d.getTitle();
            return d.getName();
        })
        .attr('placeholder', function (d) {
            if ( library == 'layers' ) return d.getTitle();
            return d.getName();
        })
        .attr('name', function (d) {
            return d.getUuid()
        })
        .html(function (d) {
            if ( library == 'layers' ) return d.getTitle();
            return d.getName();
        })
        .classed('displayNone', function (d) {
            var uuid = d.getUuid();
            if ( that.editingFileName == uuid ) return false;
            return true;
        })
        .on('blur', function (d) {
            var newName = this.value;
            that.saveFileName(newName, d, library);
        })
        .on('keydown', function (d) {
            var keyPressed = window.event.keyCode;
            var newName = this.value;
            if ( keyPressed == 13 ) this.blur(); // Save on enter
        });

        // Exit
        nameInput
        .exit()
        .remove();


        // Hacky, but works...
        // Select text in input field...
        if ( nameInput ) {
            nameInput.forEach(function(ni) {
                if ( ni[0] ) {
                    ni[0].select();
                    return;
                }
            })
        }

    },




    // ┌─┐┌─┐┌─┐┬ ┬┌─┐  ┌┬┐┬─┐┬┌─┐┌─┐┌─┐┬─┐
    // ├─┘│ │├─┘│ │├─┘   │ ├┬┘││ ┬│ ┬├┤ ├┬┘
    // ┴  └─┘┴  └─┘┴     ┴ ┴└─┴└─┘└─┘└─┘┴└─

    // The little "..." next to file name

    createFilePopUpTrigger : function (parent, library) {

        // open file options button

        // Bind
        var popupTrigger = parent
        .selectAll('.file-popup-trigger')
        .data(function(d) { return [d] });

        // Enter
        popupTrigger
        .enter()
        .append('div')
        .classed('file-popup-trigger', true)
        .html('<i class="fa fa-bars file-trigger"></i>Options')


        // Update
        popupTrigger
        .classed('active', function (d) {
            var uuid = d.getUuid();
            if ( uuid == this.showFileActionFor ) return true;
            return false;
        }.bind(this))
        .on('click', function (d) {
            var uuid = d.getUuid();
            this.enableFilePopUp(uuid)
        }.bind(this));


        // Exit
        popupTrigger
        .exit()
        .remove();



        // add layer button

        // Bind
        var addTrigger = parent
        .selectAll('.file-popup-trigger.add-layer')
        .data(function(d) { return [d] });

        // Enter
        addTrigger
        .enter()
        .append('div')
        .classed('file-popup-trigger add-layer', true)
        .html('<i class="fa fa-plus-square add-trigger"></i>Add layer');

        // Update
        addTrigger
        .classed('active', function (d) {
            var uuid = d.getUuid();
            if ( uuid == this.showFileActionFor ) return true;
            return false;
        }.bind(this))
        .on('click', function (file) {
            file._createLayer(app.activeProject);
        }.bind(this));

        // Exit
        addTrigger
        .exit()
        .remove();


    },


    // ┌─┐┬┬  ┌─┐  ┌─┐┌─┐┌┬┐┬┌─┐┌┐┌  ┌─┐┌─┐┌─┐┬ ┬┌─┐
    // ├┤ ││  ├┤   ├─┤│   │ ││ ││││  ├─┘│ │├─┘│ │├─┘
    // └  ┴┴─┘└─┘  ┴ ┴└─┘ ┴ ┴└─┘┘└┘  ┴  └─┘┴  └─┘┴

    // The "download, delete, etc" pop-up

    createFileActionPopUp : function (parent, library) {

        // Bind
        var dataListLineAction = parent
        .selectAll('.file-popup')
        .data(function(d) { return [d] });

        // Enter
        dataListLineAction
        .enter()
        .append('div')
        .classed('file-popup', true);


        // Update
        dataListLineAction
        .classed('displayNone', function (d) {
            var uuid = d.getUuid();
            if ( uuid == this.showFileActionFor ) return false;
            return true;
        }.bind(this));

        // Exit
        dataListLineAction
        .exit()
        .remove();


        this.initFileActions(dataListLineAction, library);

    },


    // ┌─┐┬┬  ┌─┐  ┌─┐┌─┐┌┬┐┬┌─┐┌┐┌┌─┐
    // ├┤ ││  ├┤   ├─┤│   │ ││ ││││└─┐
    // └  ┴┴─┘└─┘  ┴ ┴└─┘ ┴ ┴└─┘┘└┘└─┘

    // AKA pop-up content

    initFileActions : function (parent, library) {

        // Disable actions for Layers
        var canEdit = this._project.isEditor();
        var that = this;

        var action = {
            createLayer : {
                name : 'Add To Project',
                disabled : !canEdit
            },
            share : {
                name : 'Share with...',         // todo: implement sharing of data
                disabled : true
            },
            changeName : {
                name : 'Change Name',
                disabled : true
            },
            download : {
                name : 'Download',
                disabled : false
            },
            delete : {
                name : 'Delete',
                disabled : false
            }
        };

        for (var f in action) {

            var name = action[f].name;
            var className = 'file-action-' + f;

            // Bind
            var fileAction = parent
            .selectAll('.' + className)
            .data(function(d) { return [d] });

            // Enter
            fileAction
            .enter()
            .append('div')
            .classed(className, true)
            .classed('file-action', true)
            .classed('displayNone', action[f].disabled)
            .attr('trigger', f)
            .html(name)
            .on('click', function (d) {
                var trigger = this.getAttribute('trigger');
                that.fileActionTriggered(trigger, d, that, library)
            });

            // Exit
            fileAction
            .exit()
            .remove();
        }
    },



    // ╔═╗╦╦  ╔═╗  ╔═╗╦  ╦╔═╗╦╔═  ╔═╗╦  ╦╔═╗╔╗╔╔╦╗╔═╗
    // ╠╣ ║║  ║╣   ║  ║  ║║  ╠╩╗  ║╣ ╚╗╔╝║╣ ║║║ ║ ╚═╗
    // ╚  ╩╩═╝╚═╝  ╚═╝╩═╝╩╚═╝╩ ╩  ╚═╝ ╚╝ ╚═╝╝╚╝ ╩ ╚═╝

    fileActionTriggered : function (trigger, file, context, library) {

        return this._fileActionTriggered(trigger, file, context, library);
    },

    _fileActionTriggered : function (trigger, file, context, library) {

        var fileUuid = file.getUuid();
        var project = context._project;

        // set name
        if (trigger == 'changeName') context.editingFileName = fileUuid;

        // create layer
        if (trigger == 'createLayer') file._createLayer(project);

        // share
        if (trigger == 'share') file._shareFile();

        // download
        if (trigger == 'download') file._downloadFile();

        // delete
        if (trigger == 'delete') file._deleteFile();

        // Reset
        this.showFileActionFor = false;
        this._refreshFiles();
    },

    // Enable input field for changing file name
    activateFileInput : function (d, library) {
        this.editingFileName = d.getUuid();
        this.showFileActionFor = false;
        this._refreshFiles();
    },

    // Enable popup on file (when clicking on "(...)" button)
    enableFilePopUp : function (uuid) {

        // open fullscreen file options
        this._openFileOptionsFullscreen(uuid);
    },

    _openCubeLayerEditFullscreen : function (layer) {

        // create fullscreen
        var fullscreen = this._fullscreen = new Wu.Fullscreen({
            title : '<i class="fa fa-bars file-option"></i>Timeseries: ' + layer.getTitle(),
            titleClassName : 'slim-font'
        });

        // shortcuts
        this._fullscreen._layer = layer;
        var content = this._fullscreen._content;
        
        // create cubeset list
        this._createCubeNameBox({
            container : content,
            layer : layer
        });

        // create cubeset list
        this._createMaskBox({
            container : content,
            layer : layer
        });

        // create cubeset list
        this._createCubesetBox({
            container : content,
            layer : layer
        });

    },

    _createMaskBox : function (options) {

        var container = options.container;
        var layer = options.layer;

        // create divs
        var toggles_wrapper = Wu.DomUtil.create('div', 'toggles-wrapper file-options', container);
        var name = Wu.DomUtil.create('div', 'smooth-fullscreen-name-label clearboth', toggles_wrapper, 'Add mask');

        // check for html5 file reader compatability
        if (_.isUndefined(window.FileReader)) return console.error('no filereader available');

        // create file upload input
        var wrap_uploader = Wu.DomUtil.create('div', 'upload-mask-wrapper', toggles_wrapper);
        var uploader_title = Wu.DomUtil.create('div', 'dropdown-mask-title', wrap_uploader, 'Upload vector mask');
        var mask_uploader = Wu.DomUtil.create('input', 'mask-upload-input', wrap_uploader);
        mask_uploader.setAttribute('type', 'file');

        // get, sort datasets (rasters only)
        var mask_datasets = this._getRasterDatasets();

        // create dropdown of datasets
        var wrap_dropdown = Wu.DomUtil.create('div', 'dropdown-mask-wrapper', toggles_wrapper);
        var dropdown_title = Wu.DomUtil.create('div', 'dropdown-mask-title', wrap_dropdown, 'Add raster mask from datasets');

        this._cubesetDrowdown = new Wu.Dropdown({
            fn: this._addDatasetAsMask.bind(this, layer),
            appendTo: wrap_dropdown,
            content: mask_datasets,
            className : 'cubeset-dropdown',
        });


        // create feedback box
        this._maskFeedback = Wu.DomUtil.create('div', 'mask-feedback', toggles_wrapper);
        
        // file input event
        mask_uploader.onchange = function (e) {
            e.preventDefault();

            // get file
            var file = mask_uploader.files[0];
            
            // only allow .geojson
            // var valid_formats = ['geojson', 'topojson'];
            if (!_.includes(file.name, '.geojson')) {
                return this._abortMaskUpload({
                    input : mask_uploader,
                    err : 'Only GeoJSON is accepted for uploaded vector mask'
                });
            }

            // only allow < 5MB
            if (file.size > 5000000) {
                return this._abortMaskUpload({
                    input : mask_uploader,
                    err : 'Masks larger than 5MB not allowed'
                });
            }

            // create file reader
            var fr = new FileReader();

            // read file
            fr.readAsText(file);

            // callback for readAsText
            fr.onload = function (a) {

                // get mask
                var geojsonMask = fr.result;
                var cube_id = layer._cube.cube_id;

                // test data
                var data = {
                    cube_id : cube_id,
                    mask : {
                        type : 'geojson',
                        geometry : geojsonMask,
                        title : file.name,
                        // todo: add name of mask
                    }
                }

                // add mask to layer (server request)
                layer.addMask(data);

                // fire layer edited
                Wu.Mixin.Events.fire('maskUploaded', {detail : {
                    name : file.name
                }});

            };

            return false;

        }.bind(this);


    },

    _abortMaskUpload : function (options) {
        var input = options.input;
        var err = options.err;

        // set message (with error flag)
        this.setMaskFeedback(err, true);
    },

    // add dataset as mask on cube layer
    _addDatasetAsMask : function (layer, dataset_id) {

        // get ids
        var dataset_id = dataset_id;
        var cube_id = layer.getCubeId();

        // create tile layer
        var file = app.Account.getFile(dataset_id);

        // create wu layer
        file.createRasterMaskLayer(function (err, mask_layer) {
            if (err) console.error(err);

            // add mask to layer (server request)
            layer.addMask({
                cube_id : cube_id,
                mask : {
                    type : 'postgis-raster',
                    dataset_id : dataset_id,
                    layer_id : mask_layer.getUuid(),
                    title : layer.getTitle()
                }
            }, function (err) {

                // close fullscreen
                this._fullscreen.close();

                // close data pane
                this.options.chrome.close(this);

                // add and show
                layer.add();
                mask_layer.add();
                mask_layer.flyTo();

                // set feedback
                app.feedback.setMessage({
                    title : 'Added mask layer!'
                }); 

            }.bind(this));


        }.bind(this));
       
    },


    _onMaskUploaded : function (e) {

        // get mask filename
        var name = e.detail.name;

        // set feedback
        this.setMaskFeedback('Added ' + name + '!');

    },

    setMaskFeedback : function (message, error) {

        // set message
        this._maskFeedback.innerHTML = message;

        // set color
        this._maskFeedback.style.borderColor = error ? '#ff9d9d' : '#d0d0d0';

    },


    _createCubeNameBox : function (options) {
        var container = options.container;
        var layer = options.layer;

        // create divs
        var toggles_wrapper = Wu.DomUtil.create('div', 'toggles-wrapper file-options', container);
        var name = Wu.DomUtil.create('div', 'smooth-fullscreen-name-label clearboth', toggles_wrapper, 'Cube name');
        var name_input = Wu.DomUtil.create('input', 'smooth-input smaller-input', toggles_wrapper);
        name_input.setAttribute('placeholder', 'Enter name here');
        name_input.value = layer.getName();
        var name_error = Wu.DomUtil.create('div', 'smooth-fullscreen-error-label', toggles_wrapper);

        var cube_id_name = Wu.DomUtil.create('div', 'smooth-fullscreen-name-label clearboth', toggles_wrapper, 'Cube ID');
        var cube_id_title = Wu.DomUtil.create('input', 'smooth-input smaller-input', toggles_wrapper);
        cube_id_title.value = layer.getCubeId();
        cube_id_title.readOnly = true;
        cube_id_title.style.background = '#F7F7F7';

        // event
        Wu.DomEvent.on(name_input, 'keyup', _.throttle(function () {
            var updatedName = name_input.value;

            // set title
            var updatedLayer = layer.setTitle(updatedName);

        }.bind(this), 1000), this);

        // return wrapper
        return toggles_wrapper;
    },

    _createCubesetBox : function (options) {

        var container = options.container;
        var layer = options.layer;

        // create divs
        var toggles_wrapper = this._cubesetBoxWrapper = Wu.DomUtil.create('div', 'toggles-wrapper file-options', container);
        var name = Wu.DomUtil.create('div', 'smooth-fullscreen-name-label clearboth', toggles_wrapper, 'Datasets in timeseries');

        // add-button
        var addBtn = Wu.DomUtil.create('div', 'cubesets-add-btn', toggles_wrapper, '<i class="fa fa-plus"></i>&nbsp;&nbsp;Add dataset ');

        Wu.DomEvent.on(addBtn, 'click', function () {
            this._addCubesetDropdown(layer);
        }, this);

        // create list of datasets
        this._cubesetContainer = Wu.DomUtil.create('div', 'cubesets-list-wrapper', toggles_wrapper);

        // create cubeset list
        this._refreshCubeset(layer);
        
        // bind update event
        this._cubesetSort.bind('sortupdate', function(e, ui) {

            // save new order of dataset array
            this._updateCubesetOrder();

        }.bind(this));

        // return wrapper
        return toggles_wrapper;
    },

    _updateCubesetOrder : function () {

        var list = this._cubesetContainer.children;
        var layer = this._fullscreen._layer;
        var datasets = layer.getDatasets();
        var order = [];

        // iterate and update
        for (var i=0; i < list.length; i++) {
            var id = list[i].getAttribute('dataset-uuid');
            var dataset = _.find(datasets, function (d) {
                return d.id == id;
            });

            order.push(dataset);
        }

        // due to dataset sample debug below
        return console.error('debug, not saved!');

        // save to server
        app.api.updateCube({
            datasets : order,
            cube_id : layer.getCubeId()
        }, function (err, updatedCube) {
            if (err) return console.error(err);
               
            // parse
            var cube = Wu.parse(updatedCube);

            // update Wu.CubeLayer
            var updatedLayer = layer._saveCube(cube);

            // refresh list
            this._refreshCubeset(updatedLayer);

            // refresh cube
            updatedLayer._refreshCube();

        }.bind(this));

    },

    _refreshCubeset : function (layer) {

        // remove old
        this._cubesetContainer.innerHTML = '';

        // get datasets
        var datasets = layer.getDatasets();


        // debug: only show first 100
        var datasets = _.sample(datasets, 100);

        // create list
        datasets.forEach(function (dataset, i) {

            // create list item
            this._createCubesetItem({
                dataset : dataset, 
                appendTo : this._cubesetContainer,
                index : i
            });

        }, this);

        // gc old sortable
        if (this._cubesetSort) {
            delete this._cubesetSort;
        }

        // enable sortable
        this._cubesetSort = $('.cubesets-list-wrapper').sortable({
            placeholderClass : 'cubeset-sortable-placeholder',
            hoverClass : 'cubeset-hover'
        });
    },


    _createCubesetItem : function (options) {

        // get options
        var dataset = options.dataset;
        var appendTo = options.appendTo;
        var index = (options.index + 1).toString();
        var layer = this._fullscreen._layer;

        // get meta
        var name = dataset.description || '';
        var timestamp = moment(dataset.timestamp).format("MMMM Do YYYY") || 'error';
        var uuid = dataset.id;

        // wrapper
        var wrap = Wu.DomUtil.create('div', 'cubeset-wrapper', appendTo);
        wrap.setAttribute('dataset-uuid', uuid);

        // content
        // var count = Wu.DomUtil.create('div', 'cubeset-count', wrap, index);
        var dataset_name = Wu.DomUtil.create('div', 'cubeset-name', wrap, name);
        var dataset_time = Wu.DomUtil.create('div', 'cubeset-time', wrap, timestamp);

        // buttons
        var removeBtn = Wu.DomUtil.create('div', 'cubeset-remove-btn', wrap, '<i class="fa fa-trash-o"></i>');

        // remove click
        Wu.DomEvent.on(removeBtn, 'click', function () {        // todo: mem leaks if not removed
            this._removeCubesetItem(dataset);
        }, this);

        // change date click
        Wu.DomEvent.on(dataset_time, 'dblclick', function () {  // todo: mem leaks if not removed

            this._addDatePicker({
                dataset : dataset,
                div : dataset_time,
                layer : layer,
                container : wrap
            });

        }, this);

    },

    _addDatePicker : function (options) {
        var dataset = options.dataset;
        var currentDate = dataset.meta ? dataset.meta.date : new Date();
        var div = options.div;
        var container = options.container;
        var layer = options.layer;

        // clear old
        if (this._datePicker) {
            this._datePicker.destroy();
            delete this._datePicker;
        }

        // create date picker
        var picker = this._datePicker = new Pikaday({
            firstDay : 1,
            defaultDate : moment(currentDate).toDate(),
            setDefaultDate : true,
            yearRange : 3,
            onSelect: function(date) {

                // set date to dataset in cube
                layer.setDatasetDate({
                    dataset : dataset,
                    date : date
                }, function (err, updatedCube) {
                    if (err) return console.error('Could not set date for dataset!');

                    // update list
                    var timestamp = moment(date).format("MMMM Do YYYY");
                    div.innerHTML = timestamp;
                });

                // destroy
                picker.destroy();

                // remove close event
                Wu.DomEvent.off(container, 'click', picker.destroy, picker);
            }
        });

        // add to DOM
        div.parentNode.insertBefore(this._datePicker.el, div.nextSibling);

        // add close event
        Wu.DomEvent.on(container, 'click', picker.destroy, picker);

    },

    _addCubesetDropdown : function (layer) {

        var container = Wu.DomUtil.create('div', 'cubeset-dropdown-container', this._cubesetBoxWrapper);

        // create dropdown
        this._cubesetDrowdown = new Wu.Dropdown({
            fn: this._addCubesetItemByUuid.bind(this),
            appendTo: container,
            content: this._getDropdownDatasets(),
            className : 'cubeset-dropdown',
        });

        setTimeout(function () {
            this._cubesetDrowdown._toggleListItems();
        }.bind(this), 100);
    },

    parse_date_YYYY_DDD : function (f) {
        // f is eg. "SCF_MOD_2014_002.tif"
        var a = f.split('.');
        var b = a[0].split('_');
        var year = b[2];
        var day = b[3];
        var yd = year + '-' + day;
        var date = moment(yd, "YYYY-DDDD");
        var dateString = date.format();
        if (date.isValid()) return dateString;
        return false;
    },

    _addCubesetItemByUuid : function (fileUuid) {

        var file = app.Account.getFile(fileUuid);

        // get date from filename (todo: make more flexible, with option to choose)
        var date = this.parse_date_YYYY_DDD(file.getTitle());

        var dataset = {
            id : file.getUuid(),
            description : file.getTitle(),
            timestamp : date || file.getCreated()
        }

        // create list item
        this._createCubesetItem({
            dataset : dataset, 
            appendTo : this._cubesetContainer,
            index : this._cubesetContainer.children.length
        });

        // add on server
        this._addCubesetItem(dataset);

        // refresh sortable
        $('.cubesets-list-wrapper').sortable();

        // remove dropdown
        Wu.DomUtil.remove(this._cubesetDrowdown._baseLayerDropdownContainer);
        delete this._cubesetDrowdown;

    },

    _getRasterDatasets : function () {

        // get rasters
        var files = app.Account.getFiles();
        var datasets = _.filter(files, function (f) {
            if (!f) return false;
            if (!f.store) return false;
            if (!f.store.data) return false;
            if (!f.store.data.postgis) return false;
            if (!f.store.data.postgis.data_type) return false;
            return f.store.data.postgis.data_type == 'raster';
        });
       
        var sorted_datasets = _.sortBy(datasets, function (d) {
            return d.store.created;
        }).reverse();

        // create dropdown content
        var content = [];
        sorted_datasets.forEach(function (d) {
            content.push({
                title : d.getTitle(),
                disabled : false,
                value : d.getUuid(),
                isSelected : false
            });
        });

        return content;
    },

    _getDropdownDatasets : function () {

        // get rasters
        var files = app.Account.getFiles();
        var datasets = _.filter(files, function (f) {
            if (!f) return false;
            if (!f.store) return false;
            if (!f.store.data) return false;
            if (!f.store.data.postgis) return false;
            if (!f.store.data.postgis.data_type) return false;
            return f.store.data.postgis.data_type == 'raster';
        });
       
        // create dropdown content
        var content = [];
        datasets.forEach(function (d) {
            content.push({
                title : d.getTitle(),
                disabled : false,
                value : d.getUuid(),
                isSelected : false
            });
        });

        return content;
    },

    _removeCubesetItem : function (dataset) {

        // confirm
        var name = dataset.meta ? dataset.meta.text : 'error';
        if (!confirm("Are you sure you want to remove dataset " + name + " from the timeseries?")) return;
    
        var layer = this._fullscreen._layer;

        var options = {
            cube_id : layer.getCubeId(),
            datasets : [{
            id : dataset.id
            }]
        }

        app.api.removeFromCube(options, function (err, updatedCube) {
            if (err) return console.error(err);

            // parse cube
            var cube = Wu.parse(updatedCube);

            // update Wu.CubeLayer
            var updatedLayer = layer._saveCube(cube);

            // refresh list
            this._refreshCubeset(updatedLayer);

            // refresh cube
            updatedLayer._refreshCube();

        }.bind(this));
    },

    // add on server
    _addCubesetItem : function (dataset) {

        var layer = this._fullscreen._layer;

        var options = {
            cube_id : layer.getCubeId(),
            datasets : [dataset]
        }

        app.api.addToCube(options, function (err, updatedCube) {
            if (err) return console.error(err);

            // parse cube
            var cube = Wu.parse(updatedCube);

            // update Wu.CubeLayer
            var updatedLayer = this._fullscreen._layer = layer._saveCube(cube);

            // refresh list
            this._refreshCubeset(updatedLayer);

            // refresh cube
            updatedLayer._refreshCube();

        }.bind(this));
    },


    _openFileOptionsFullscreen : function (uuid) {

        // get file
        var file = app.Account.getFile(uuid);

        // create fullscreen
        var fullscreen = this._fullscreen = new Wu.Fullscreen({
            title : '<i class="fa fa-bars file-option"></i>Options for ' + file.getName(),
            titleClassName : 'slim-font'
        });

        // shortcuts
        this._fullscreen._file = file;
        this._currentFile = file;
        var content = this._fullscreen._content;

        // name box
        var nameContainer = this._createNameBox({
            container : content,
            file : file
        });

        // if vector
        if (file.isVector()) {

            // vector meta
            this._createVectorMetaBox({
                container : nameContainer,
                file : file
            });
        }

        // if raster
        if (file.isRaster()) {

            // raster meta
            this._createRasterMetaBox({
                container : nameContainer,
                file : file
            });

            // transparency box
            this._createTransparencyBox({
                container : content,
                file : file
            });

            // vectorize box
            this._createVectorizeBox({
                container : content,
                file : file
            });

        }

        // share button
        this._createShareBox({
            container : content,
            file : file,
            fullscreen : fullscreen
        });

        // download button
        this._createDownloadBox({
            container : content,
            file : file,
            fullscreen : fullscreen
        });

        // delete button
        this._createDeleteBox({
            container : content,
            file : file,
            fullscreen : fullscreen
        });
    },

    _createNameBox : function (options) {
        var container = options.container;
        var file = options.file;

        // create divs
        var toggles_wrapper = Wu.DomUtil.create('div', 'toggles-wrapper file-options', container);
        var name = Wu.DomUtil.create('div', 'smooth-fullscreen-name-label clearboth', toggles_wrapper, 'Dataset name');
        var name_input = Wu.DomUtil.create('input', 'smooth-input smaller-input', toggles_wrapper);
        name_input.setAttribute('placeholder', 'Enter name here');
        name_input.value = file.getName();
        var name_error = Wu.DomUtil.create('div', 'smooth-fullscreen-error-label', toggles_wrapper);

        // return wrapper
        return toggles_wrapper;
    },

    _createVectorMetaBox : function (options) {
        var container = options.container;
        var file = options.file;
        var meta = file.getMeta();
        var toggles_wrapper = container;

        // meta info
        var meta_title = Wu.DomUtil.create('div', 'file-option title', toggles_wrapper, 'Dataset meta');
        var type_div = Wu.DomUtil.create('div', 'file-option sub', toggles_wrapper, '<span class="bold-font">Type:</span> Vector');
        var filesize_div = Wu.DomUtil.create('div', 'file-option sub', toggles_wrapper, '<span class="bold-font">Size:</span> ' + file.getDatasizePretty());
        var createdby_div = Wu.DomUtil.create('div', 'file-option sub', toggles_wrapper, '<span class="bold-font">Created by:</span> ' + file.getCreatedByName());
        var createdby_div = Wu.DomUtil.create('div', 'file-option sub', toggles_wrapper, '<span class="bold-font">Created on:</span> ' + moment(file.getCreated()).format('MMMM Do YYYY, h:mm:ss a'));

    },

    _createRasterMetaBox : function (options) {
        var container = options.container;
        var file = options.file;
        var meta = file.getMeta();
        var toggles_wrapper = container;

        // if no meta
        if (!meta) return;

        var sizeX = meta.size ? meta.size.x : 'n/a';
        var sizeY = meta.size ? meta.size.y : 'n/a';

        // meta info
        var meta_title = Wu.DomUtil.create('div', 'file-option title', toggles_wrapper, 'Dataset meta');
        var type_div = Wu.DomUtil.create('div', 'file-option sub', toggles_wrapper, '<span class="bold-font">Type:</span> Raster');
        var filesize_div = Wu.DomUtil.create('div', 'file-option sub', toggles_wrapper, '<span class="bold-font">Size:</span> ' + file.getDatasizePretty());
        var bands_div = Wu.DomUtil.create('div', 'file-option sub', toggles_wrapper, '<span class="bold-font">Bands:</span> ' + meta.bands);
        var size_div = Wu.DomUtil.create('div', 'file-option sub', toggles_wrapper, '<span class="bold-font">Raster size:</span> ' + sizeX + 'x' + sizeY);
        var projection_div = Wu.DomUtil.create('div', 'file-option sub', toggles_wrapper, '<span class="bold-font">Projection:</span> ' + meta.projection);
        var createdby_div = Wu.DomUtil.create('div', 'file-option sub', toggles_wrapper, '<span class="bold-font">Created by:</span> ' + file.getCreatedByName());
        var createdby_div = Wu.DomUtil.create('div', 'file-option sub', toggles_wrapper, '<span class="bold-font">Created on:</span> ' + moment(file.getCreated()).format('MMMM Do YYYY, h:mm:ss a'));
    },

    _createTilesetBox : function (options) {
        var container = options.container;
        var file = options.file;
        var meta = file.getMeta();

        // nice border box
        var toggles_wrapper = Wu.DomUtil.create('div', 'toggles-wrapper file-options', container);
        var tiles_title = Wu.DomUtil.create('div', 'file-option title', toggles_wrapper, 'Tileset');
        var generated_tiles_title = Wu.DomUtil.create('div', 'file-option title generated-tiles', toggles_wrapper, 'Generated tile-range');

        // zoom levels
        var zoomlevels_wrapper = Wu.DomUtil.create('div', 'zoomlevels-wrapper', toggles_wrapper);
        var zoom_levels = _.sortBy(meta.zoom_levels);
        var zoom_min = _.first(zoom_levels);
        var zoom_max = _.last(zoom_levels);
        var zoom_levels_text = zoom_min  + ' to ' + zoom_max;
        var zoomlevels_div = Wu.DomUtil.create('div', 'file-option sub padding-top-10', zoomlevels_wrapper, '<span class="bold-font">Zoom-levels:</span> ' + zoom_levels_text);

        // create slider
        var stepSlider = Wu.DomUtil.create('div', 'tiles-slider', zoomlevels_wrapper);
        noUiSlider.create(stepSlider, {
            start: [zoom_min, zoom_max],
            step: 1,
            range: {
                'min': [2],
                'max': [19]
            },
            pips: {
                mode: 'count',
                values: [18],
                density : 18,
                stepped : true
            }
        });

        // total tiles div
        var totaltiles_div = Wu.DomUtil.create('div', 'file-option sub', toggles_wrapper, '<span class="bold-font">Total tiles:</span> ' + meta.total_tiles);
        var tilesize_div = Wu.DomUtil.create('div', 'file-option sub', toggles_wrapper, '<span class="bold-font">Tileset size:</span> ');

        // error feedback
        var generated_tiles_error = this._generated_tiles_error = Wu.DomUtil.create('div', 'smooth-fullscreen-error-label tiles-error', toggles_wrapper);

        // generate button
        var generateBtnWrap = Wu.DomUtil.create('div', 'pos-rel height-22', toggles_wrapper);
        var generateBtn = Wu.DomUtil.create('div', 'smooth-fullscreen-save generate-tiles', generateBtnWrap, 'Generate tiles');

        // slider events
        stepSlider.noUiSlider.on('update', function (values, handle) {

            // set zoom levels
            var z_min = parseInt(values[0]);
            var z_max = parseInt(values[1]);
            var zoom_levels_text = z_min + ' to ' + z_max;
            zoomlevels_div.innerHTML = '<span class="bold-font">Zoom-levels:</span> ' + zoom_levels_text;

            // check tile count (local)
            this.calculateTileCount({
                zoom_min : z_min,
                zoom_max : z_max,
                file_id : file.getUuid()
            }, function (err, tile_count) {

                // check tiles
                if (tile_count > 11000) { // todo: make account dependent

                    // mark too high tile-count
                    totaltiles_div.innerHTML = '<span class="bold-font red-font">Total tiles: ' + tile_count + '</span>';

                    // set error feedback
                    generated_tiles_error.innerHTML = '<span class="bold-font">The tile count is too high. Please select a lower zoom-level.</span>';

                    // disable button
                    Wu.DomUtil.addClass(generateBtn, 'disabled-btn');

                } else {

                    // set tile count
                    totaltiles_div.innerHTML = '<span class="bold-font">Total tiles:</span> ' + tile_count;

                    // set error feedback
                    generated_tiles_error.innerHTML = '';

                    // enable button
                    Wu.DomUtil.removeClass(generateBtn, 'disabled-btn');
                }
            });

        }.bind(this));

        // generate button event
        Wu.DomEvent.on(generateBtn, 'click', function () {

            // set zoom levels
            var values = stepSlider.noUiSlider.get();
            var z_min = parseInt(values[0]);
            var z_max = parseInt(values[1]);

            // double check tile count (local)
            this.calculateTileCount({
                zoom_min : z_min,
                zoom_max : z_max,
                file_id : file.getUuid()
            }, function (err, tile_count) {

                // check tile count
                if (tile_count > 11000) return; // todo: account dependent

                // generate tiles
                app.Socket.send('generate_tiles', {
                    zoom_min : z_min,
                    zoom_max : z_max,
                    file_id : file.getUuid()
                });

                // set feedback
                generated_tiles_error.innerHTML = '<span class="bold-font dark-font">Generating tiles. This will take a few minutes...</span>';
            });
        }, this);

    },

    _createShareBox : function (options) {
        var container = options.container;

        // wrapper-5: share box
        var toggles_wrapper5 = Wu.DomUtil.create('div', 'toggles-wrapper file-options', container);

        // create user list input
        this._createInviteUsersInput({
            type : 'read',
            label : 'Share Dataset',
            content : toggles_wrapper5,
            container : this._fullscreen._inner,
            sublabel : 'Users get their own copy of your dataset.'
        });

        // share button
        var shareBtnWrap = Wu.DomUtil.create('div', 'pos-rel height-42', toggles_wrapper5);
        var shareBtn = Wu.DomUtil.create('div', 'smooth-fullscreen-save red-btn', shareBtnWrap, 'Share dataset');

        // feedback
        var share_feedback = Wu.DomUtil.create('div', 'smooth-fullscreen-sub-label label-share_feedback', toggles_wrapper5, '');

        // remember
        this._divs.share_feedback = share_feedback;

        // download button
        Wu.DomEvent.on(shareBtn, 'click', this._shareDataset, this);
    },

    _createDownloadBox : function (options) {
        var container = options.container;
        var file = options.file;

        // wrapper-3: download box
        var toggles_wrapper3 = Wu.DomUtil.create('div', 'toggles-wrapper file-options', container);
        var download_title = Wu.DomUtil.create('div', 'file-option title', toggles_wrapper3, 'Download dataset');

        // download button
        var downloadBtnWrap = Wu.DomUtil.create('div', 'pos-rel height-42', toggles_wrapper3);
        var downloadBtn = Wu.DomUtil.create('div', 'smooth-fullscreen-save', downloadBtnWrap, 'Download');

        // download button
        Wu.DomEvent.on(downloadBtn, 'click', file._downloadFile, file);
    },

    _createVectorizeBox : function (options) {
        var container = options.container;
        var file = options.file;

        // wrapper-3: download box
        var toggles_wrapper3 = Wu.DomUtil.create('div', 'toggles-wrapper file-options', container);
        var download_title = Wu.DomUtil.create('div', 'file-option title', toggles_wrapper3, 'Vectorize dataset');

        var feedbackText = 'A new layer will be created with the raster data converted into vector format.';
        var transparency_feedback = Wu.DomUtil.create('div', 'smooth-fullscreen-error-label tiles-transparency', toggles_wrapper3, feedbackText);

        // download button
        var downloadBtnWrap = Wu.DomUtil.create('div', 'pos-rel height-42', toggles_wrapper3);
        var downloadBtn = Wu.DomUtil.create('div', 'smooth-fullscreen-save', downloadBtnWrap, 'Vectorize');

        // download button
        Wu.DomEvent.on(downloadBtn, 'click', file._vectorizeDataset, file);
    },

    _createDeleteBox : function (options) {

        var container = options.container;
        var file = options.file;
        var fullscreen = options.fullscreen;

        // wrapper-4: delete box
        var toggles_wrapper4 = Wu.DomUtil.create('div', 'toggles-wrapper file-options', container);
        var delete_title = Wu.DomUtil.create('div', 'file-option title red-font', toggles_wrapper4, 'Delete');

        // download button
        var deleteBtnWrap = Wu.DomUtil.create('div', 'pos-rel height-42', toggles_wrapper4);
        var deleteBtn = Wu.DomUtil.create('div', 'smooth-fullscreen-save red-btn', deleteBtnWrap, 'Delete');

        // deleete button event
        Wu.DomEvent.on(deleteBtn, 'click', function (e) {

            // confirm dialog
            Wu.confirm('Are you sure you want to delete this dataset? This cannot be undone!', function (confirmed) {
                if (!confirmed) return;

                // delete file
                file._deleteFile(function (err, removedFile) {

                    // close fullscreen
                    fullscreen.close();

                    // delete successful
                    if (!err && removedFile && removedFile.success) {
                        app.feedback.setMessage({
                            title : 'Dataset deleted!',
                            description : file.getName() + ' was deleted.'
                        });
                    } else {
                        app.feedback.setError({
                            title : 'Something went wrong.',
                            description : 'Dataset not deleted.'
                        });
                    }
                });

            }.bind(this))

        }, this);
    },


    _createTransparencyBox : function (options) {
        var container = options.container;
        var file = options.file;

        // create divs
        var toggles_wrapper9 = Wu.DomUtil.create('div', 'toggles-wrapper file-options', container);
        var ralpha_title = Wu.DomUtil.create('div', 'file-option title', toggles_wrapper9, 'Transparency');
        // var alpha_input = Wu.DomUtil.create('input', 'invite-input-form alpha-input', toggles_wrapper9);
        // alpha_input.setAttribute('placeholder', 'Enter color or #hex value');
        var feedbackText = 'A new layer will be created with the cut color.';
        var transparency_feedback = Wu.DomUtil.create('div', 'smooth-fullscreen-error-label tiles-transparency', toggles_wrapper9, feedbackText);
        var alphaBtnWrap = Wu.DomUtil.create('div', 'pos-rel height-42', toggles_wrapper9);
        var whiteBtn = Wu.DomUtil.create('div', 'smooth-fullscreen-save', alphaBtnWrap, 'Cut white');
        // var blackBtn = Wu.DomUtil.create('div', 'smooth-fullscreen-save left140', alphaBtnWrap, 'Cut black');

        // on click
        Wu.DomEvent.on(whiteBtn, 'click', function (e) {
            // var color = alpha_input.value;

            // cut raster
            this._cutRaster({
                file : file,
                color : 'white'
            }, function (err, layer) {

                // set feedback text
                transparency_feedback.innerHTML = 'New layer created and added to project!';
            });

        }, this);

    },

    _cutRaster : function (options, done) {
        var file = options.file;
        var color = options.color;

        // cut raster
        file.cutRasterColor({
            color : color,
            project : this._project
        }, function (err, layer) {
            if (err) return console.error(err);

            // rename layer
            var layerName = layer.getTitle();
            layerName += ' (white areas cut)';
            layer.setTitle(layerName);

            // automatically add layer to layermenu
            this._addOnImport(layer);

            // done
            done && done(err, layer);

        }.bind(this));
    },

    _highlightFullscreenElement : function (elem) {

        // hide fullscreen
        jss.set('.smooth-fullscreen', {
            'visibility' : 'hidden',
            'overflow' : 'hidden'
        });

        // hide chrome
        jss.set('.chrome-right', {
            'visibility' : 'hidden'
        });

        // hide controls
        jss.set('.leaflet-control-container', {
            'visibility' : 'hidden'
        });

        // show only one element
        elem.style.visibility = 'visible';
        elem.style.background = '#FCFCFC';

        // disable map zoom
        app._map.scrollWheelZoom.disable()

    },

    _unhighlightFullscreenElement : function () {
        jss.remove('.smooth-fullscreen');
        jss.remove('.chrome-right');
        jss.remove('.leaflet-control-container');

        // enable map zoom
        app._map.scrollWheelZoom.enable()
    },

    _onCloseFullscreen : function () {
        this._divs = {
            users : []
        };
    },

    _divs : {
        users : []
    },

    _createInviteUsersInput : function (options) {

        // invite users
        var me = this;
        var content = options.content || me._fullscreen._content;
        var container = me._fullscreen._container;
        var project = options.project;

        // label
        var invite_label = options.label;
        var name = Wu.DomUtil.create('div', 'smooth-fullscreen-name-label', content, invite_label);

        // container
        var invite_container = Wu.DomUtil.create('div', 'invite-container', content);

        // sub-label
        var sublabel = Wu.DomUtil.create('div', 'smooth-fullscreen-sub-label', content, options.sublabel);

        var invite_inner = Wu.DomUtil.create('div', 'invite-inner', invite_container);
        var invite_input_container = Wu.DomUtil.create('div', 'invite-input-container', invite_inner);

        // input box
        var invite_input = Wu.DomUtil.create('input', 'invite-input-form', invite_input_container);

        // invite list
        var invite_list_container = Wu.DomUtil.create('div', 'invite-list-container', invite_container);
        var invite_list_inner = Wu.DomUtil.create('div', 'invite-list-inner', invite_list_container);

        // remember div
        me._divs.invite_list_container = invite_list_container;

        // for manual scrollbar (js)
        var monkey_scroll_bar = Wu.DomUtil.create('div', 'monkey-scroll-bar', invite_list_inner);

        // for holding list
        var monkey_scroll_hider = Wu.DomUtil.create('div', 'monkey-scroll-hider', invite_list_inner);
        var monkey_scroll_inner = Wu.DomUtil.create('div', 'monkey-scroll-inner', monkey_scroll_hider);
        var monkey_scroll_list = Wu.DomUtil.create('div', 'monkey-scroll-list', monkey_scroll_inner);

        // list of all users
        var allUsers = _.sortBy(_.toArray(app.Users), function (u) {
            return u.store.firstName;
        });
        var itemsContainers = [];
        var checkedUsers = {};
        me._onKeyUpparameters = {
            itemsContainers: itemsContainers,
            checkedUsers: checkedUsers,
            invite_input: invite_input
        };

        _.each(allUsers, function (user) {

            if (user.getUuid() == app.Account.getUuid()) return;

            // divs
            var list_item_container = Wu.DomUtil.create('div', 'monkey-scroll-list-item-container', monkey_scroll_list);
            var avatar_container = Wu.DomUtil.create('div', 'monkey-scroll-list-item-avatar-container', list_item_container);
            var avatar = Wu.DomUtil.create('div', 'monkey-scroll-list-item-avatar default-avatar', avatar_container);
            var name_container = Wu.DomUtil.create('div', 'monkey-scroll-list-item-name-container', list_item_container);
            var name_bold = Wu.DomUtil.create('div', 'monkey-scroll-list-item-name-bold', name_container);
            var name_subtle = Wu.DomUtil.create('div', 'monkey-scroll-list-item-name-subtle', name_container);

            // set name
            name_bold.innerHTML = user.getFullName();
            name_subtle.innerHTML = user.getEmail();

            // click event
            Wu.DomEvent.on(list_item_container, 'click', function () {
                // dont allow adding self
                if (user.getUuid() == app.Account.getUuid()) return;

                // add selected user item to input box
                checkedUsers[user.getFullName()] = user;
                this._addUserAccessItem({
                    input : invite_input,
                    user : user,
                    type : options.type,
                    itemsContainers: itemsContainers,
                    checkedUsers: checkedUsers,
                    invite_list_container: invite_list_container
                });

                invite_input.value = '';
                me._onKeyUp();

            }, this);

            itemsContainers.push({
                name: user.getFullName(),
                container: list_item_container
            });
        }.bind(this));


        // events

        // input focus, show dropdown
        Wu.DomEvent.on(invite_input, 'focus', function () {
            me._onKeyUp();
        }, this);

        // focus input on any click
        Wu.DomEvent.on(invite_input_container, 'click', function () {
            invite_input.focus();
        }, this);

        // input keyup
        Wu.DomEvent.on(invite_input, 'keydown', function (e) {

            // get which key
            var key = event.which ? event.which : event.keyCode;

            // get string length
            var value = invite_input.value;
            var text_length = value.length;
            if (text_length <= 0) text_length = 1;

            // set width of input dynamically
            invite_input.style.width = 30 + (text_length * 20) + 'px';

            // backspace on empty field: delete added user
            if (key == 8 && value.length == 0 && _.keys(me._onKeyUpparameters.checkedUsers).length) {

                var popped = _.find(me._divs.users, function (user) {
                    return user.user.getFullName() === me._onKeyUpparameters.checkedUsers[_.last(_.keys(me._onKeyUpparameters.checkedUsers))].getFullName();
                });

                delete me._onKeyUpparameters.checkedUsers[_.last(_.keys(me._onKeyUpparameters.checkedUsers))];
                me._divs.users.pop();
                Wu.DomUtil.remove(popped.user_container);
            }

            // enter: blur input
            if (key == 13 || key == 27) {
                invite_input.blur();
                invite_input.value = '';
                this._closeInviteInputs();
            }

        }.bind(this), this);

        Wu.DomEvent.on(invite_input, 'keyup', me._onKeyUp, me);

        // close dropdown on any click
        Wu.DomEvent.on(container, 'click', function (e) {

            // only if target == self
            var relevantTarget =    e.target == container ||
                    e.target == this._fullscreen._inner ||
                    e.target == name ||
                    e.target == this._fullscreen._content;

            if (relevantTarget) this._closeInviteInputs();

        }, this);

    },

    _closeInviteInputs : function () {
    },

    _closeInviteInputs : function () {
        var container = this._divs.invite_list_container;
        if (container) container.style.display = 'none';
    },

    _showInviteInputs : function () {
        var container = this._divs.invite_list_container;
        if (container) container.style.display = 'block';
    },

    _currentFile : {},

    _onKeyUp : function (e) {
        var me = this;
        var filterUsers = [];

        _.each(me._onKeyUpparameters.itemsContainers, function (user) {
            if (user.name.toLowerCase().indexOf(me._onKeyUpparameters.invite_input.value.toLowerCase()) === -1 || _.keys(me._onKeyUpparameters.checkedUsers).indexOf(user.name) !== -1) {
                user.container.style.display = 'none';
            } else {
                user.container.style.display = 'block';
                filterUsers.push(user);
            }
        });

        if (_.isEmpty(filterUsers)) {
            this._closeInviteInputs();
        } else {
            this._showInviteInputs();
        }
    },

    _shareDataset : function () {

        var users = this._divs.users;
        var dataset = this._fullscreen._file;


        if (!users.length) return;

        var userNames = [];
        users.forEach(function (user) {
            userNames.push(user.user.getFullName());
        });

        var names = userNames.join(', ');

        if (Wu.confirm('Are you sure you want to share the dataset with ' + names + '?')) {

            var userUuids = [];
            users.forEach(function (u) {
                userUuids.push(u.user.getUuid());
            });

            app.api.shareDataset({
                dataset : dataset.getUuid(),
                users : userUuids
            }, function (err, result) {
                if (err) console.error('err', err);

                var result = Wu.parse(result);

                if (result.err || !result.success) {
                    console.error('something went worng', result);

                    // set feedback
                    this._divs.share_feedback.innerHTML = 'Something went wrong.';
                } else {

                    // set feedback
                    this._divs.share_feedback.innerHTML = 'Dataset shared with ' + names + '!';
                }


            }.bind(this));
        }

    },
    _addUserAccessItem : function (options) {

        var invite_input = options.input;
        var user = options.user;
        var me = this;

        // if user deleted. todo: clean up deleting
        if (!user) return;

        // focus input
        invite_input.focus();

        // don't add twice
        var existing = _.find(this._divs.users, function (i) {
            return i.user == user;
        });
        if (existing) return;

        // insert user box in input area
        var user_container = Wu.DomUtil.create('div', 'mini-user-container');
        var user_inner = Wu.DomUtil.create('div', 'mini-user-inner', user_container);
        var user_avatar = Wu.DomUtil.create('div', 'mini-user-avatar default-avatar', user_inner);
        var user_name = Wu.DomUtil.create('div', 'mini-user-name', user_inner, user.getFullName());
        var user_kill = Wu.DomUtil.create('div', 'mini-user-kill', user_inner, 'x');

        // insert before input
        var invite_input_container = invite_input.parentNode;
        invite_input_container.insertBefore(user_container, invite_input);


        // click event (kill)
        Wu.DomEvent.on(user_container, 'click', function () {

            // remove div
            Wu.DomUtil.remove(user_container);

            // remove from array
            _.remove(this._divs.users, function (i) {
                return i.user == user;
            });
            delete options.checkedUsers[user.getFullName()];
            me._onKeyUp();
        }, this);

        // add to array
        this._divs.users.push({
            user : user,
            user_container : user_container
        });


    },

    calculateTileCount : function (options, done) {

        var file_id = options.file_id;
        var zoom_min = options.zoom_min;
        var zoom_max = options.zoom_max;
        var all_levels_count = this._calcTileCount(file_id);
        var zoom_range = _.range(zoom_min, zoom_max + 1);

        // add zoom levels
        var tile_count = 0;
        zoom_range.forEach(function (zr) {
            tile_count += all_levels_count[zr];
        });

        // done
        done(null, tile_count);


        app.Socket.send('tileset_meta', {
            file_id : file_id
        });

    },

    _calcTileCount : function (file_id) {

        // set options
        var zoom_max = 20;
        var zoom_levels = _.range(0, zoom_max + 1);
        var total_tiles = [];

        // get file extent
        var file = app.Account.getFile(file_id);
        var meta = file.getMeta();
        var extent = meta.extent;

        // return if no meta
        if (!meta) return;

        // get edges
        var north_edge = extent[3];
        var south_edge = extent[1];
        var west_edge = extent[0];
        var east_edge = extent[2];

        // calculate tiles per zoom-level
        zoom_levels.forEach(function (z) {
            var zoom = z;
            var top_tile = this._lat2tile(north_edge, zoom);
            var left_tile = this._lon2tile(west_edge, zoom);
            var bottom_tile = this._lat2tile(south_edge, zoom);
            var right_tile = this._lon2tile(east_edge, zoom);
            var width = Math.abs(left_tile - right_tile) + 1;
            var height = Math.abs(top_tile - bottom_tile) + 1;
            var total_tiles_at_zoom = width * height;

            total_tiles.push(total_tiles_at_zoom);

        }, this);

        return total_tiles;

    },

    _lon2tile : function (lon,zoom) { return (Math.floor((lon+180)/360*Math.pow(2,zoom))); },
    _lat2tile : function (lat,zoom)  { return (Math.floor((1-Math.log(Math.tan(lat*Math.PI/180) + 1/Math.cos(lat*Math.PI/180))/Math.PI)/2 *Math.pow(2,zoom))); },

    _onGeneratedTiles : function (e) {

        var data = e.detail.data;
        var meta = data.metadata;
        var file_id = data.file_id;
        var file = app.Account.getFile(file_id);

        // set meta
        file.setMetadata(meta);

        // feedback
        this._generated_tiles_error.innerHTML = '<span class="bold-font dark-font">Done!</span>';

    },

    // Save file name
    saveFileName : function (newName, d, library) {

        if ( !newName || newName == '' ) newName = d.getName();
        d.setName(newName);

        this.editingFileName = false;
        this._refreshFiles();
    },

    // ┬┌┐┌┬┌┬┐  ┬  ┌─┐┬ ┬┌─┐┬─┐┌─┐
    // │││││ │   │  ├─┤└┬┘├┤ ├┬┘└─┐
    // ┴┘└┘┴ ┴   ┴─┘┴ ┴ ┴ └─┘┴└─└─┘

    _initLayerList : function () {

        // Holds each section (mapbox, cartoDB, etc);
        this.layerListContainers = {};

        // Holds layers that we've selected
        this.selectedLayers = [];

        // Show layer actions for this specific layer
        this.showLayerActionFor = false;

        // Edit layer name
        this.editingLayerName = false;

        // Layer providers
        this.layerProviders = {};

        // Empty layers container
        this._layersContainer.innerHTML = '';

        // Create PROJECT LAYERS section, with D3 container
        var sortedLayers = this.sortedLayers = this.sortLayers(this._project.layers);

        sortedLayers.forEach(function (layerBundle) {

            var provider = layerBundle.key;

            // only do our layers
            if (provider == 'postgis' || provider == 'cube' || provider == 'wms') {

                var layers = layerBundle.layers;

                if ( layers.length < 1 ) return;

                this.layerProviders[provider] = {
                    name : provider,
                    layers : layers
                };

                this.layerListContainers[provider] = {};

                // Create wrapper
                this.layerListContainers[provider].wrapper = Wu.DomUtil.create('div', 'layer-list-container', this._layersContainer);

                // D3 Container
                this.layerListContainers[provider].layerList = Wu.DomUtil.create('div', 'layer-list-container-layer-list', this.layerListContainers[provider].wrapper);
                this.layerListContainers[provider].D3container = d3.select(this.layerListContainers[provider].layerList);
            }

        }.bind(this));

    },


    // ┬─┐┌─┐┌─┐┬─┐┌─┐┌─┐┬ ┬  ┬  ┌─┐┬ ┬┌─┐┬─┐┌─┐
    // ├┬┘├┤ ├┤ ├┬┘├┤ └─┐├─┤  │  ├─┤└┬┘├┤ ├┬┘└─┐
    // ┴└─└─┘└  ┴└─└─┘└─┘┴ ┴  ┴─┘┴ ┴ ┴ └─┘┴└─└─┘

    _refreshLayers : function () {

        // layers
        for (var p in this.layerProviders) {
            var provider = this.layerProviders[p];
            var layers = provider.layers;
            provider.data = _.toArray(layers);
            var D3container = this.layerListContainers[p].D3container;
            var data = this.layerProviders[p].data;

            // redraw layer list
            this.initLayerList(D3container, data, p);
        }

    },


    // ┌─┐┌─┐┬─┐┌┬┐  ┬  ┌─┐┬ ┬┌─┐┬─┐┌─┐  ┌┐ ┬ ┬  ┌─┐┬─┐┌─┐┬  ┬┬┌┬┐┌─┐┬─┐
    // └─┐│ │├┬┘ │   │  ├─┤└┬┘├┤ ├┬┘└─┐  ├┴┐└┬┘  ├─┘├┬┘│ │└┐┌┘│ ││├┤ ├┬┘
    // └─┘└─┘┴└─ ┴   ┴─┘┴ ┴ ┴ └─┘┴└─└─┘  └─┘ ┴   ┴  ┴└─└─┘ └┘ ┴─┴┘└─┘┴└─

    sortLayers : function (layers) {

        var keys = ['postgis', 'google', 'norkart', 'geojson', 'mapbox', 'cube', 'wms'];
        var results = [];

        keys.forEach(function (key) {
            var sort = {
                key : key,
                layers : []
            };
            for (var l in layers) {
                var layer = layers[l];
                if (layer) {
                    if (layer.store && layer.store.data.hasOwnProperty(key)) {
                        sort.layers.push(layer)
                    }
                }
            }
            results.push(sort);
        }, this);

        this.numberOfProviders = results.length;
        console.log('results:', results);
        return results;
    },


    // ██████╗  █████╗ ███████╗███████╗    ██╗      █████╗ ██╗   ██╗███████╗██████╗ ███████╗
    // ██╔══██╗██╔══██╗██╔════╝██╔════╝    ██║     ██╔══██╗╚██╗ ██╔╝██╔════╝██╔══██╗██╔════╝
    // ██████╔╝███████║███████╗█████╗      ██║     ███████║ ╚████╔╝ █████╗  ██████╔╝███████╗
    // ██╔══██╗██╔══██║╚════██║██╔══╝      ██║     ██╔══██║  ╚██╔╝  ██╔══╝  ██╔══██╗╚════██║
    // ██████╔╝██║  ██║███████║███████╗    ███████╗██║  ██║   ██║   ███████╗██║  ██║███████║
    // ╚═════╝ ╚═╝  ╚═╝╚══════╝╚══════╝    ╚══════╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚══════╝


    _initBaseLayerList : function () {
        this._initLayout_activeLayers(false, false, this._baseLayerDropdownContainer, false);
    },

    _refreshBaseLayerList : function () {

        // clear
        this._baseLayerDropdownContainer.innerHTML = '';

        // only create if editable
        if (this._project.isEditable()) {
            this._initLayout_activeLayers(false, false, this._baseLayerDropdownContainer, false)
        }

        // init color selector
        this._initColorSelector();
    },

    _initLayout_activeLayers : function (title, subtitle, container, layers) {
        var sortedLayers = [];

        // Create select options

        this.sortedLayers.forEach(function(provider) {

            // Do not allow postgis layers to be in the baselayer dropdown
            if ( provider.key == "postgis" ) return;
            if ( provider.key == "cube" ) return;
            if ( provider.key == "wms" ) return;
            if ( provider.key == "raster"  ) return; // temporary disable rasters. todo: create nice dropdown with mulitple choice

            // Get each provider (mapbox, google, etc)
            provider.layers.forEach(function(layer) {
                sortedLayers.push({
                    title: layer.getTitle(),
                    value: layer.getUuid(),
                    isSelected: this.isBaseLayerOn(layer.getUuid())
                });

            }.bind(this))
        }.bind(this));

        sortedLayers.push({
            title: "----------------------------------------------------------------------------",
            disabled: true
        });

        sortedLayers.push({
            title: "Solid background color",
            value: "Solid background color"
        });

        this._backgroundLayerDropdown = new Wu.Dropdown({
            fn: this._selectedActiveLayer.bind(this),
            appendTo: container,
            content: sortedLayers,
            project: this._project
        });

        if ( this._project.store.baseLayers.length == 0 ) {
            this._backgroundLayerDropdown.setValue({
                title: "Solid background color",
                value: "Solid background color"
            });
            this._enableColorSelector();
        } else {
            this._disableColorSelector();
        }

        // select event
        return this._backgroundLayerDropdown;

    },

    _selectedActiveLayer : function (value) {

        // Remove active baselayers
        var baselayers = this._project.getBaselayers();

        // Force array
        var _baselayers = _.isArray(baselayers) ? baselayers : [baselayers];
        _baselayers.forEach(function (baselayer) {
            var uuid = baselayer.uuid;
            var layer = this._project.getLayer(uuid);
            layer && layer.disable();
        }.bind(this));

        // Add to map
        var uuid = value;
        var bgc = this._project.getBackgroundColor() ? this._project.getBackgroundColor() : this.oldSolidBackgroundColor || '#000';

        this.oldSolidBackgroundColor = bgc;

        if ( uuid == 'Solid background color' ) {
            this._project.setBaseLayer([]);
            this._enableColorSelector();
            this._updateColor(bgc);
            return;
        }

        this._setDefaultBackgroundColor();

        this._disableColorSelector();


        var layer = this._project.getLayer(uuid);
        layer._addTo('baselayer');

        // Save to server
        this._project.setBaseLayer([{
            uuid : uuid,
            zIndex : 1,
            opacity : 1
        }]);
    },

    _setDefaultBackgroundColor : function () {
        if (app.MapPane._container.style.removeProperty) {
            app.MapPane._container.style.removeProperty('background');
        } else {
            app.MapPane._container.style.removeAttribute('background');
        }
        this._project.setBackgroundColor('');
    },

    _initColorSelector : function () {


        this._colorSelectorWrapper.innerHTML = '';

        // Get color
        var bgc = this._project.getBackgroundColor() ? this._project.getBackgroundColor() : '#000';

        // Create color selector
        this._colorSelector = new Wu.button({
            id       : 'background-color',
            type     : 'colorball',
            right    : true,
            isOn     : true,
            appendTo : this._colorSelectorWrapper,
            fn       : this._updateColor.bind(this),
            value    : bgc,
            colors   : '',
            className: 'target-color-box'
        });

        // Create color selector title
        this._colorSelectorTitle = Wu.DomUtil.create('div', 'base-layer-color-title', this._colorSelectorWrapper, 'Background color');

    },

    _enableColorSelector : function () {

        // Show wrapper
        Wu.DomUtil.removeClass(this._colorSelectorWrapper, 'displayNone');

    },

    _disableColorSelector : function () {

        // Hide wrapper
        Wu.DomUtil.addClass(this._colorSelectorWrapper, 'displayNone');

    },

    _updateColor : function (hex, key, wrapper) {

        app.MapPane._container.style.background = hex;
        this._project.setBackgroundColor(hex);

    },


    // ┌─┐┌─┐┌─┐┬ ┬  ┬  ┌─┐┬ ┬┌─┐┬─┐  ┬ ┬┬─┐┌─┐┌─┐┌─┐┌─┐┬─┐
    // ├┤ ├─┤│  ├─┤  │  ├─┤└┬┘├┤ ├┬┘  │││├┬┘├─┤├─┘├─┘├┤ ├┬┘
    // └─┘┴ ┴└─┘┴ ┴  ┴─┘┴ ┴ ┴ └─┘┴└─  └┴┘┴└─┴ ┴┴  ┴  └─┘┴└─

    initLayerList : function (D3container, data, library) {

        // BIND
        var dataListLine = D3container
        .selectAll('.data-list-line')
        .data(data);

        // ENTER
        dataListLine
        .enter()
        .append('div')
        .classed('data-list-line', true);

        // UPDATE
        dataListLine
        .classed('file-selected', function(d) {

            var uuid = d.getUuid();

            // If selected with CMD or SHIFT
            var index = this.selectedLayers.indexOf(uuid);
            if (index > -1) return true;

            // If selected by single click
            if ( uuid == this.showLayerActionFor ) return true;

            // Else no selection
            return false;

        }.bind(this))

        // Add flash to new layer
        .classed('new-layer-list-item', function (d) {
            if (this.newLayer ==  d.getUuid()) {
                return true;
                this.newLayer = false;
            }
            return false;
        }.bind(this))

        .classed('editingName', function (d) {
            return this.editingLayerName == d.getUuid();
        }.bind(this));


        // EXIT
        dataListLine
        .exit()
        .remove();

        // create layermenu toggle 
        this.createLayerToggleSwitch(dataListLine, library);

        // Create Radio Button
        this.createRadioButton(dataListLine, library);

        // Create Name content
        this.createLayerNameContent(dataListLine, library);

        // CREATE POP-UP TRIGGER
        this.createLayerPopUpTrigger(dataListLine, library);

        // CREATE FILE ACTION POP-UP
        this.createLayerActionPopUp(dataListLine, library)


    },


    // ┬─┐┌─┐┌┬┐┬┌─┐  ┌┐ ┬ ┬┌┬┐┌┬┐┌─┐┌┐┌
    // ├┬┘├─┤ ││││ │  ├┴┐│ │ │  │ │ ││││
    // ┴└─┴ ┴─┴┘┴└─┘  └─┘└─┘ ┴  ┴ └─┘┘└┘

    // Sets layers to be on by default

    createRadioButton : function(parent, library) {

        // Bind
        var radioButton =
                parent
                        .selectAll('.layer-on-radio-button-container')
                        .data(function(d) { return [d] });

        // Enter
        radioButton
                .enter()
                .append('div')
                .classed('layer-on-radio-button-container layer-radio', true)
                .on('click', function(d) {
                    this._toggleRadio(d);
                }.bind(this));


        // Update
        radioButton
        // Display radio button
                .classed('displayNone', function(d) {
                    var uuid = d.getUuid();
                    var on = this.isLayerOn(uuid);
                    return !on;
                }.bind(this))

                // Enabled by default
                .classed('radio-on', function(d) {
                    var uuid = d.getUuid();
                    // Check if layer is on by default
                    var layermenuItem = _.find(this._project.store.layermenu, function (l) {
                        return l.layer == uuid;
                    });
                    var enabledByDefault = layermenuItem && layermenuItem.enabled;
                    return enabledByDefault;
                }.bind(this));

        // Exit
        radioButton
                .exit()
                .remove();

    },

    // TOGGLE RADIO BUTTON
    _toggleRadio : function (layer) {
        var uuid = layer.getUuid();
        var item = _.find(this._project.store.layermenu, function (l) {
            return l.layer == uuid;
        });
        var on = item && item.enabled;
        on ? this.radioOff(uuid) : this.radioOn(uuid);
    },

    // RADIO ON
    radioOn : function (uuid) {
        var layerMenu = app.MapPane.getControls().layermenu;
        layerMenu._setEnabledOnInit(uuid, true);
    },

    // RADIO OFF
    radioOff : function (uuid) {
        var layerMenu = app.MapPane.getControls().layermenu;
        layerMenu._setEnabledOnInit(uuid, false);
    },



    // ┌┬┐┌─┐┌─┐┌─┐┬  ┌─┐  ┬  ┌─┐┬ ┬┌─┐┬─┐
    //  │ │ ││ ┬│ ┬│  ├┤   │  ├─┤└┬┘├┤ ├┬┘
    //  ┴ └─┘└─┘└─┘┴─┘└─┘  ┴─┘┴ ┴ ┴ └─┘┴└─

    createLayerToggleSwitch : function (parent, library) {

        // Bind container
        var toggleButton =
            parent
            .selectAll('.chrome-switch-container')
            .data(function(d) { return [d] });

        // Enter container
        toggleButton
        .enter()
        .append('div')
        .classed('chrome-switch-container', true);

        toggleButton
        .classed('switch-on', function (d) {
            var uuid = d.getUuid();
            var on = this.isLayerOn(uuid);
            return on;
        }.bind(this));

        toggleButton
        .on('click', function(d) {
            this.toggleLayer(d);
        }.bind(this));

        // Exit
        toggleButton
        .exit()
        .remove();

    },


    // TOGGLE LAYERS
    // TOGGLE LAYERS
    // TOGGLE LAYERS

    toggleLayer : function (layer) {
        var uuid = layer.getUuid();
        var on = this.isLayerOn(uuid);
        on ? this.removeLayer(layer) : this.addLayer(layer);

        this._refreshLayers();
    },

    addAfterImport : function (layer) {

        // in layermenu
        var layerMenu = app.MapPane.getControls().layermenu;
        layerMenu._enableLayerByUuid(layer.getUuid());

        // in data meny


    },

    enableLayer : function (layer) {
        // in layermenu
        var layerMenu = app.MapPane.getControls().layermenu;
        layerMenu._enableLayerByUuid(layer.getUuid());
    },

    // Add layer
    addLayer : function (layer) {
        var layerMenu = app.MapPane.getControls().layermenu;
        return layerMenu.add(layer);
    },

    // Remove layer
    removeLayer : function (layer) {
        var uuid = layer.getUuid();
        var layerMenu = app.MapPane.getControls().layermenu;
        layerMenu._remove(uuid);
    },

    // Check if layer is on
    isLayerOn : function (uuid) {
        var on = false;
        this._project.store.layermenu.forEach(function (b) {
            if ( uuid == b.layer ) { on = true; }
        }, this);
        return on;
    },


    // Check if base layer is on
    isBaseLayerOn : function (uuid) {
        var on = false;
        this._project.store.baseLayers.forEach(function (b) {
            if ( uuid == b.uuid ) { on = true; }
        }.bind(this));
        return on;
    },




    // ┬  ┌─┐┬ ┬┌─┐┬─┐  ┌┐┌┌─┐┌┬┐┌─┐
    // │  ├─┤└┬┘├┤ ├┬┘  │││├─┤│││├┤
    // ┴─┘┴ ┴ ┴ └─┘┴└─  ┘└┘┴ ┴┴ ┴└─┘

    createLayerNameContent : function (parent, library) {

        // Bind
        var nameContent =
                parent
                    .selectAll('.layer-name-content')
                    .data(function(d) { return [d] });

        // Enter
        nameContent
                .enter()
                .append('div')
                .classed('layer-name-content', true);


        // Update
        nameContent
                .html(function (d) {
                    return d.getTitle();
                }.bind(this))
                .on('dblclick', function (d) {
                    var editable = (library == 'postgis' || library == 'raster' || library == 'wms');
                    editable && this.activateLayerInput(d, library);
                }.bind(this));


        // Exit
        nameContent
                .exit()
                .remove();


        // Create input field
        this.createLayerInputField(nameContent, library);
    },


    // ┬  ┌─┐┬ ┬┌─┐┬─┐  ┬┌┐┌┌─┐┬ ┬┌┬┐
    // │  ├─┤└┬┘├┤ ├┬┘  ││││├─┘│ │ │
    // ┴─┘┴ ┴ ┴ └─┘┴└─  ┴┘└┘┴  └─┘ ┴

    createLayerInputField : function (parent, library) {

        var that = this;

        // Bind
        var nameInput = parent
        .selectAll('.layer-name-input')
        .data(function (layer) {
            if (this.editingLayerName == layer.getUuid()) return [layer];
            return false;
        }.bind(this))

        // Enter
        nameInput
        .enter()
        .append('input')
        .attr('type', 'text')
        .classed('layer-name-input', true);


        // Update
        nameInput
        .attr('value', function (layer) {
            return layer.getTitle();
        })
        .attr('placeholder', function (layer) {
            return layer.getTitle();
        })
        .attr('name', function (layer) {
            return layer.getUuid()
        })
        .html(function (layer) {
            return layer.getTitle();
        })
        .classed('displayNone', function (layer) {
            if (that.editingLayerName == layer.getUuid()) return false;
            return true;
        })
        .on('blur', function (layer) {
            that.saveLayerTitle(this.value, layer, library);
        })
        .on('keydown', function (d) {
            var keyPressed = window.event.keyCode;
            if (keyPressed == 13) this.blur(); // blur on enter
        });

        // remove
        nameInput
        .exit()
        .remove();


        // Hacky, but works...
        // Select text in input field...
        if (nameInput) {
            nameInput.forEach(function(ni) {
                if (ni[0]) {
                    ni[0].select();
                    return;
                }
            });
        }

    },


    // ┌─┐┌─┐┌─┐┬ ┬┌─┐  ┌┬┐┬─┐┬┌─┐┌─┐┌─┐┬─┐
    // ├─┘│ │├─┘│ │├─┘   │ ├┬┘││ ┬│ ┬├┤ ├┬┘
    // ┴  └─┘┴  └─┘┴     ┴ ┴└─┴└─┘└─┘└─┘┴└─

    // Little "..." button next to layer name

    createLayerPopUpTrigger : function (parent, type) {

        if ( type != 'postgis' && type != 'cube' && type != 'wms') return;

        // Bind
        var popupTrigger = parent
        .selectAll('.file-popup-trigger')
        .data(function(d) { 
            return [d]; 
        });

        // Enter
        popupTrigger
        .enter()
        .append('div')
        .classed('file-popup-trigger fa fa-cog', true);

        // Update
        popupTrigger
        .classed('active', function (d) {
            var uuid = d.getUuid();
            if ( uuid == this.showLayerActionFor ) return true;
            return false;
        }.bind(this))
        .on('click', function (d) {
            var uuid = d.getUuid();
            this.enableLayerPopup(uuid)
        }.bind(this));


        // Exit
        popupTrigger
        .exit()
        .remove();


    },


    // ┬  ┌─┐┬ ┬┌─┐┬─┐  ┌─┐┌─┐┌┬┐┬┌─┐┌┐┌  ┌─┐┌─┐┌─┐┬ ┬┌─┐
    // │  ├─┤└┬┘├┤ ├┬┘  ├─┤│   │ ││ ││││  ├─┘│ │├─┘│ │├─┘
    // ┴─┘┴ ┴ ┴ └─┘┴└─  ┴ ┴└─┘ ┴ ┴└─┘┘└┘  ┴  └─┘┴  └─┘┴

    // download, delete, etc

    createLayerActionPopUp : function (parent, library) {

        // Bind
        var dataListLineAction = parent
        .selectAll('.file-popup')
        .data(function(d) { return [d] });

        // Enter
        dataListLineAction
        .enter()
        .append('div')
        .classed('file-popup', true);


        // Update
        dataListLineAction
        .classed('displayNone', function (d) {
            var uuid = d.getUuid();
            if ( uuid == this.showLayerActionFor ) return false;
            return true;
        }.bind(this));

        // Exit
        dataListLineAction
        .exit()
        .remove();


        this.initLayerActions(dataListLineAction, library);

    },


    // ┬  ┌─┐┬ ┬┌─┐┬─┐  ┌─┐┌─┐┌┬┐┬┌─┐┌┐┌┌─┐
    // │  ├─┤└┬┘├┤ ├┬┘  ├─┤│   │ ││ ││││└─┐
    // ┴─┘┴ ┴ ┴ └─┘┴└─  ┴ ┴└─┘ ┴ ┴└─┘┘└┘└─┘

    // AKA pop-up content

    initLayerActions : function (parent, library) {

        // Disable actions for Layers
        var canEdit = this._project.isEditable(),
                canDownload = this._project.isDownloadable(),
                that = this;

        var action = {

            share : {
                name : 'Share with...',
                disabled : false
            },
            style : {
                name : 'Style Layer',
                disabled : !canEdit
            },
            changeName : {
                name : 'Rename...',
                disabled : !canEdit
            },
            download : {
                name : 'Download',
                disabled : !canDownload
            },
            delete : {
                name : 'Delete',
                disabled : !canEdit
            }
        };

        if (library == 'cube') {
            action.editCube = {
                name : 'Edit layer',
                disabled : !canEdit
            }
        }


        for (var f in action) {

            var name = action[f].name;
            var className = 'file-action-' + f;

            // Bind
            var fileAction = parent
            .selectAll('.' + className)
            .data(function(d) { return [d] });

            // Enter
            fileAction
            .enter()
            .append('div')
            .classed(className, true)
            .classed('file-action', true)
            .classed('displayNone', action[f].disabled)
            .attr('trigger', f)
            .html(name)
            .on('click', function (d) {
                var trigger = this.getAttribute('trigger');
                that.layerActionTriggered(trigger, d, that, library)
            });

            // Exit
            fileAction
            .exit()
            .remove();
        }
    },



    // ╦  ╔═╗╦ ╦╔═╗╦═╗  ╔═╗╦  ╦╔═╗╦╔═  ╔═╗╦  ╦╔═╗╔╗╔╔╦╗╔═╗
    // ║  ╠═╣╚╦╝║╣ ╠╦╝  ║  ║  ║║  ╠╩╗  ║╣ ╚╗╔╝║╣ ║║║ ║ ╚═╗
    // ╩═╝╩ ╩ ╩ ╚═╝╩╚═  ╚═╝╩═╝╩╚═╝╩ ╩  ╚═╝ ╚╝ ╚═╝╝╚╝ ╩ ╚═╝

    layerActionTriggered : function (trigger, file, context, library) {
        return this._layerActionTriggered(trigger, file, context, library);
    },

    _layerActionTriggered : function (trigger, layer, ctx, library) {

        // rename
        if (trigger == 'changeName') ctx.editingLayerName = layer.getUuid();

        // share
        if (trigger == 'share') layer.shareLayer();

        // download
        if (trigger == 'download') layer.downloadLayer();

        // delete
        if (trigger == 'delete') layer.deleteLayer();

        // delete
        if (trigger == 'style') this.styleLayer(layer);

        // delete
        if (trigger == 'editCube') this._editCube(layer);

        // refresh
        this.showLayerActionFor = false;
        this.selectedLayers = [];
        this._refreshLayers();
    },

    _editCube : function (layer) {

        this._openCubeLayerEditFullscreen(layer);
    },

    styleLayer : function (layer) {

        var uuid = layer.getUuid();

        // Close this pane (data library)
        this._togglePane();

        // Store layer id
        app.Tools.Styler._storeActiveLayerUuid(uuid);

        // Open styler pane
        app.Tools.SettingsSelector._togglePane();

    },

    // Sets which layer we are editing
    activateLayerInput : function (d, library) {
        this.editingLayerName = d.getUuid();
        this.showLayerActionFor = false;
        this.selectedLayers = [];
        this._refreshLayers();
    },

    // Enable layer popup (delete, download, etc) on click
    enableLayerPopup : function (uuid) {

        // Deselect
        if ( this.showLayerActionFor == uuid ) {
            this.showLayerActionFor = false;
            this.selectedLayers = [];
            this._refreshLayers();
            return;
        }

        // Select
        this.showLayerActionFor = uuid;
        this.selectedLayers = uuid;
        this._refreshLayers();
    },

    // save layer title
    saveLayerTitle : function (title, layer, library) {

        // ensure title
        title = title || layer.getTitle();

        // set layer title
        layer.setTitle(title);

        // mark not editing
        this.editingLayerName = false;

        // fire layer edited
        Wu.Mixin.Events.fire('layerEdited', {detail : {
            layer: layer
        }});

    }

});
