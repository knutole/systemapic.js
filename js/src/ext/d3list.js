Wu.List = Wu.Class.extend({
	
	canEdit : false,
	folder  : 'Folder',

	initialize : function (options) {


		// searchField has not been implemented yet
		this.searchField = options.searchfield;
	
		// Define the D3 container
		this.D3container = d3.select(options.container);

		// Get list options
		this.listOptions = this.getListOptions();

		if (this.listOptions.button) {
			
			// Select all button
			this.selectAllButton = Wu.DomUtil.create('div', 'item-select-button select-all-button', this.D3container[0][0]);
		}

		// set hooks
		this.setHooks('on');
	},

	setHooks : function (on) {
		
		Wu.DomEvent[on](this.searchField, 'keyup', this.searchList, this);
		
		if (this.listOptions.button)  {
			Wu.DomEvent[on](this.selectAllButton, 'mousedown', this.selectAllClick, this);
		}

	},

	createFolder : function() {

		// console.log('this.listData', this.listData);

		// var newFolder = {

		// 	'fileUuid' : {

		// 		store : {

		// 			access : {
		// 				clients : [],
		// 				projects : [],
		// 				users : []
		// 			},
		// 			category : '',
		// 			created : '',
		// 			createdBy : '',
		// 			createdByName : '',
		// 			data : {
		// 				geojson : '',
		// 				image : {
		// 					crunched : []
		// 				},
		// 				other : [],
		// 				shapefile : [],						
		// 			},
		// 			description : '',
		// 			files : [],
		// 			format : [],
		// 			keywords : [],
		// 			lastUpdated : '',
		// 			name : '',
		// 			type : '',
		// 			uuid : ''

		// 		}

		// 	}

		// }

	},

	openItemInfo : function (DATA) {

	},

	// These are run on the children below
	refresh : function (DATA) {},

	// These are run on the children below
	save : function (saveJSON) {},

	stop : function (e) {
		Wu.DomEvent.stopPropagation(e);
	},	



	// ██╗   ██╗████████╗██╗██╗     ███████╗
	// ██║   ██║╚══██╔══╝██║██║     ██╔════╝
	// ██║   ██║   ██║   ██║██║     ███████╗
	// ██║   ██║   ██║   ██║██║     ╚════██║
	// ╚██████╔╝   ██║   ██║███████╗███████║
	//  ╚═════╝    ╚═╝   ╚═╝╚══════╝╚══════╝



	// ┌─┐┌─┐┬─┐┌┬┐┬┌┐┌┌─┐
	// └─┐│ │├┬┘ │ │││││ ┬
	// └─┘└─┘┴└─ ┴ ┴┘└┘└─┘	

	// TRIGGERS ON CLICK:
	// SORTS LIST ON FIELDS
	// RUNS ASC IF DESC

	sortBy : function (e, that) {

		var sortThis = e.name;

		if ( !this.sortDirection ) this.sortDirection = {};

		if ( this.sortDirection[sortThis] == false ) {
			var direction = 'desc';
			this.sortDirection[sortThis] = true;
		} else {
			var direction = 'asc';
			this.sortDirection[sortThis] = false;
		}


		var objDATA     = this.listData;
		var DATA        = this.sortedData ? this.sortedData : that.data2array(objDATA);

		this.sortedData = that.sortData(DATA, { field : sortThis, direction : direction });

		this.refreshTable();

	},


	updateTable : function (options) {  



		var that = options.context;

		// RESET TABLE!
		if ( options.reset ) {

			// List data
			that.listData = options.listData;

			// Clear sorted data
			that.sortedData = null;

			// Clear selected list items
			if ( that.listOptions.button.arr ) that.listOptions.button.arr = [];

			// Set edit mode
			if ( options.canEdit ) {
				that.canEdit = options.canEdit; 
				that.D3container.classed('canEdit', true) 
			} else {
				that.D3container.classed('canEdit', false) 
			}

			that.refreshTable(that);

		}		


		// DELETING FILES
		if ( options.remove ) that.removeItems(options.remove);

		// UPLOADED FILES
		if ( options.add ) that.addItems(options.add);

		// IF WE'RE CHANGING TABLE SIZE
		if ( options.tableSize ) {
			that.tableSize = options.tableSize;
			that.refreshTable(that);
		}


	},



	// REFRESH LIST WITH DATA FILE LIST FROM DOM		

	refreshTable : function (context) {



		var that = context ? context : this;

		if ( that.sortedData ) {

			var DATA = that.sortedData;

		} else {

			// Put data into an array that D3 likes
			var objDATA = that.listData;
			var DATA    = that.data2array(objDATA);

		}

		that.refresh(DATA);
	
	},	


	// RETURNS ARRAY OF DATA SORTED IN ASC OR DESC BY FIELD 

	sortData : function (data, options) {


		var field 	= options.field;
		var direction   = options.direction;

		// Alphabetical
		if ( direction == 'asc' ) {

			data.sort(function(a, b) {

				// Sorting DATE
				if ( field == 'createdDate' ) {
					return new Date(a.file.store.created).getTime() - new Date(b.file.store.created).getTime();
				}
				
				// Put empty fields on the bottom
				if ( !a.file.store[field] || a.file.store[field] == '' || a.file.store[field] == ' ' ) return 1;
				if ( !b.file.store[field] || b.file.store[field] == '' || b.file.store[field] == ' ' ) return -1;

				// Sorting LETTERS
				if ( a.file.store[field] < b.file.store[field] ) return -1;
				if ( a.file.store[field] > b.file.store[field] ) return 1;
				
				return 0;

			})

		}

		if ( direction == 'desc' ) {

			data.sort(function(a, b) {

				// Sorting DATE
				if ( field == 'createdDate' ) {
					return new Date(b.file.store.created).getTime() - new Date(a.file.store.created).getTime();
				}		

				// Put empty fields on the bottom
				if ( !a.file.store[field] || a.file.store[field] == '' || a.file.store[field] == ' ' ) return 1;
				if ( !b.file.store[field] || b.file.store[field] == '' || b.file.store[field] == ' ' ) return -1;				

				// Sorting LETTERS
				if ( a.file.store[field] > b.file.store[field] ) return -1;
				if ( a.file.store[field] < b.file.store[field] ) return 1;

				return 0;

			})
			
		}		


		return data;

	},



	// ┌─┐┌─┐┌─┐┬─┐┌─┐┬ ┬┬┌┐┌┌─┐
	// └─┐├┤ ├─┤├┬┘│  ├─┤│││││ ┬
	// └─┘└─┘┴ ┴┴└─└─┘┴ ┴┴┘└┘└─┘


	searchList : function (e) {

		if (e.keyCode == 27) { // esc
			// reset search
			return this.resetSearch();
		}

		// get value and search
		var value = this.searchField.value;
		this.listSearch(value);

	},


	resetSearch : function () {

		this.searchField.value = '';

	},


	// SEARCH THROGH FIELDS IN FILE LIST

	listSearch : function (searchword) {

		var that = this;
		var searchResults = [];

		// Get list of all entries
		var objDATA = this.listData;

		// Go through all data
		for (f in objDATA) {

			// Gets all the fields with data to match
			var searchHere = this.getSearchObj(f, objDATA);

			// Search word to lower case
			var sw = searchword.toLowerCase();

			searchHere.forEach(function (sf) {

				// Field value to lower case
				var s = sf.value.toLowerCase();

				// Match search word to field value
				var res = s.match(sw);

				// If we've got a hit
				if ( res ) that.buildSearchString(searchResults, sf.location);
			
			});

		}

		var resultData  = this.buildResultData(searchResults);
		this.sortedData = this.data2array(resultData);

		this.unselectItems();
		this.refreshTable();

	},


	// If a selected item disappears when you're searching, also un-select list
	// item (so you don't end up deleting files that's not in your visual field)

	unselectItems : function () {

		if ( !this.listOptions.button ) return;

		var _listData   = this.data2array(this.listData);
		var _sortedData = this.sortedData;
		var _selected   = this.listOptions.button.arr;

		var that = this;

		_listData.forEach(function (allItem) {

			var match = false;
			
			// Find list items that's NOT been filtered OUT (they are on the screen)
			_sortedData.forEach(function (filteredItem) {

				if ( filteredItem.fileUuid == allItem.fileUuid ) match = true;				
			});

			// If file has been filtered OUT (not on the screen)
			if ( !match ) {

				var isSelected = false;

				// We must find out of it's selected...
				_selected.forEach(function (sel) {
					if ( sel == allItem.fileUuid ) isSelected = true;
				});

				if ( isSelected ) {
					that.unSelectListItem(allItem.fileUuid, that)
				}
				
			}
		})

	},


	// Gets all the fields with data to match
	
	getSearchObj : function (f, objDATA) {

		// Store hits here
		var DATA = [];

		var searchFields = this.listOptions.searchFields;

		// Put all datafields in array for easier searching
		var searchHere = [];
		var dataStore = objDATA[f].store;

		// Get all the data fields
		
		searchFields.forEach(function (sf) {

			if ( dataStore[sf] ) {

				// Check if field is array
				if ( typeof dataStore[sf] == 'object' ) {
					if ( dataStore[sf].length > 0 ) {

						// ARRAY
						var _array = dataStore[sf];

						_array.forEach(function (val) {
							if (val) {
								var type = {
									value    : val,
									location : f
								};
								searchHere.push(type);
							}
						})
					}
				} else {

					var val = dataStore[sf];

					var type = {

						value    : val,
						location : f
					};

					searchHere.push(type);

				}
			}
		});


		return searchHere;

	},	


	// CREATES AN ARRAY WITH FILES UUIDS THAT MATCHES OUR SEARCH CRITERIA

	buildSearchString : function (searchResults, thisResult) {

		var pushing = true;

		searchResults.forEach(function (res) {
			if ( res == thisResult ) pushing = false
		});

		if ( pushing ) searchResults.push(thisResult);

	},


	// MATCHES FILE LIST WITH WITH OUR SEARCH RESULTS, AND CREATES A NEW
	// OBJECT CONTAINING FILES THAT MATCHES OUR SEARCH RESULTS

	buildResultData : function (searchResults) {

		var _DATA = {};

		var objDATA = this.listData;

		for (f in objDATA) {

			searchResults.forEach(function (res) {

				// If there is a match, copy object
				if ( f == res ) _DATA[f] = objDATA[f];
			})
		}

		return _DATA;

	},	



	// ┬┌┐┌┌─┐┬ ┬┌┬┐  ┌─┐┬┌─┐┬  ┌┬┐┌─┐
	// ││││├─┘│ │ │   ├┤ │├┤ │   ││└─┐
	// ┴┘└┘┴  └─┘ ┴   └  ┴└─┘┴─┘─┴┘└─┘	

	// EDIT INPUT FIELDS
	// Currently only used for File Title
	editField : function (options) {

		var outerContext     	= options.outerContext;
		var input       	= outerContext._D3input(options, outerContext.updateAndRefresh);

	},


	// CREATE INPUT FIELD
	_D3input : function (options, blurFunction) {

		// Create input box
		var input 	    = Wu.DomUtil.create('input');

		input.type 	    = 'text';
		input.className = 'autocarto-input';
		input.value     = options.value ? options.value : '';

		options.context.innerHTML = '';		

		options.context.appendChild(input);

		// Set input box to focus
		input.focus();

		// Set cursor in the beginning
		input.setSelectionRange(0,0);

		// Blur on enter
		document.addEventListener("keydown", function(e) {
			if ( e.keyCode == 13 ) input.blur();
		});

		// Fire this when bluring
		input.onblur = function () {
			blurFunction(input, options);
		};
		
		return input;

	},	


	// INPUT FIELD ON BLUR
	updateAndRefresh : function (input, options) {


		// New Name
		var newName  = input.value;

		// Remove input field
		input.remove();

		// Update data object in DOM
		options.where[options.what] = newName;

		var DATA = options.allDATA;
		var that = options.outerContext;

		// Refresh list
		that._D3list(DATA);

		// create update object
		var saveJSON = {};
		var namespace = options.what;

		saveJSON[namespace] = newName;
		saveJSON.uuid 	    = options.uuid;

		// popopopopopopo
		saveJSON.key   	    = namespace;
		saveJSON.value 	    = newName;
		saveJSON.id    	    = options.uuid;


		// Save changes
		that.save(saveJSON);

		// Set app save status
		app.setSaveStatus();
			
	},




	// ┌─┐┌┬┐┬ ┬┌─┐┬─┐  ┌─┐┬ ┬┌┐┌┌─┐┌┬┐┬┌─┐┌┐┌┌─┐
	// │ │ │ ├─┤├┤ ├┬┘  ├┤ │ │││││   │ ││ ││││└─┐
	// └─┘ ┴ ┴ ┴└─┘┴└─  └  └─┘┘└┘└─┘ ┴ ┴└─┘┘└┘└─┘	


	// Select/un select list item

	selectListItem : function (select, context) {

		if ( !context.listOptions.button ) return;

		var removeFile 	  = false;
		var selectedListItems = context.listOptions.button.arr;

		selectedListItems.forEach(function(selectedFile, i) {
			if ( selectedFile == select ) removeFile = i+1; // Add 1 to i in order to avoid 0 (which is same as false)
		});

		if ( removeFile ) {
			selectedListItems.splice(removeFile-1, 1);
		} else {
			selectedListItems.push(select);
		}

		context.refreshTable();

	},

	// Unselect list item

	unSelectListItem : function (select, context) {

		if ( !context.listOptions.button ) return;

		var selectedListItems = context.listOptions.button.arr;

		selectedListItems.forEach(function(selectedFile, i) {
			if ( selectedFile == select ) selectedListItems.splice(i, 1);
		});

	},

	// Converts data format

	dateHTML : function (DATA) {

		var DATE = new Date(DATA.file.store.created);
		var dd = DATE.getDate(); 
		var mm = DATE.getMonth()+1;//January is 0! 
		var yyyy = DATE.getFullYear(); 

		var month;
		if ( mm == 1 )  month = 'Jan';
		if ( mm == 2 )  month = 'Feb';
		if ( mm == 3 )  month = 'Mar';
		if ( mm == 4 )  month = 'Apr';
		if ( mm == 5 )  month = 'May';
		if ( mm == 6 )  month = 'Jun';
		if ( mm == 7 )  month = 'Jul';
		if ( mm == 8 )  month = 'Aug';
		if ( mm == 9 )  month = 'Sep';
		if ( mm == 10 ) month = 'Oct';
		if ( mm == 11 ) month = 'Nov';
		if ( mm == 12 ) month = 'Dec';

		var isDate = month + ' ' + dd + ' ' + yyyy;
		return isDate;

	},

	// CONVERTS LIST OF DATA (FILE LIST) INTO AN ARRAY THAT D3 LIKES

	data2array : function (data) {

		var DATA = [];

		for (f in data) {
			var file = {
				fileUuid : f,
				file     : data[f]
			};
			DATA.push(file);
		}

		return DATA;
	
	},



	// ████████╗██╗  ██╗███████╗    ██╗     ██╗███████╗████████╗
	// ╚══██╔══╝██║  ██║██╔════╝    ██║     ██║██╔════╝╚══██╔══╝
	//    ██║   ███████║█████╗      ██║     ██║███████╗   ██║   
	//    ██║   ██╔══██║██╔══╝      ██║     ██║╚════██║   ██║   
	//    ██║   ██║  ██║███████╗    ███████╗██║███████║   ██║   
	//    ╚═╝   ╚═╝  ╚═╝╚══════╝    ╚══════╝╚═╝╚══════╝   ╚═╝   



	// INIT

	_D3list : function (DATA) {

		// Create header
		this._D3header();

		// Create wrapper
		this.listOptions.wrapper = this.listItemWrapper(DATA);

		// Create select button
		this.selectButton();
		
		// Folder
		this.listFolder(DATA);

		// Title and description
		this.listTitle(DATA);		

		// Attributes
		this.initAttributes(DATA);

		// Open info items
		this.openItemInfo(DATA);
		
	},


	// HEADER

	_D3header : function () {

		var listOptions = this.listOptions;
		var field = this.listOptions.titleSpace.name.field;

		var that = this;
		var DATA = listOptions.attributes;


		// CLEAN UP – ONLY SHOW FIELDS THAT WE WANT!!!
		var _DATA = [];
		DATA.forEach(function (D) {
			var proceed = true;

			listOptions.attributes.forEach(function (lo) {
				if ( D.name == lo.name ) {
					if ( lo.killOnSmall && that.tableSize == 'small' ) {
						proceed = false;
					}
				}
			});
			if ( proceed ) _DATA.push(D);
		});


		var headerWrapper = 
			this.D3container
			.selectAll('.d3-list-header')
			.data([DATA]);
			// .data([_DATA]);

		headerWrapper
			.enter()
			.append('div')
			.classed('d3-list-header', true);

		headerWrapper
			.exit()
			.remove();



		// EACH LINE
		// EACH LINE
		// EACH LINE				

		// bind
		var eachField = 
			headerWrapper
			.selectAll('.d3-list-header-item')
			.data(function(d) {
				return d;
			});

		// enter 
		eachField
			.enter()
			.append('div')
			.attr('class', function(d) {
				return 'd3-list-header-item-' + d.niceName;
			})
			.classed('d3-list-header-item', true);

		// update
		eachField
			.html(function(d) {				
				return d.niceName
			})
			.attr('style', function(d, i) {


				if ( d.killOnSmall && that.tableSize == 'small' ) {
					return 'display: none';
				}

				if ( d.niceName == 'Name' ) {
					
					var width = 100;

					listOptions.attributes.forEach(function(att) {
				
						var exclude = true;

						if ( att.restrict ) {
							if ( that.canEdit ) exclude = false;
						} else {
							exclude = false;
						}

						if ( att.killOnSmall && that.tableSize == 'small' ) {
							exclude = true;
						}

						if ( att.width && !exclude ) {
						
							var _width;
							// Enable different width in collapsed mode
							if ( att.smallWidth && !att.killOnSmall && that.tableSize == 'small' ) {
								_width = att.smallWidth;
							} else {
								_width = att.width;
							}


							width -= _width;
						
						}
				
					});
				

					var style = 'width: ' + width + '%; left: 0%; ';
				
					if ( !that.listOptions.button ) {
						style += 'padding-left: 10px;';
					}

				} else {
			
					var style = that.getAttributeStyle(i);
				}

				return style;
			})
			.on('mousedown', function(e) {
				
				that.sortBy(e, that)

				});

		// exit
		eachField
			.exit()
			.remove();

	},


	// Wrapper for each line

	listItemWrapper : function (DATA) {

		var that = this;
		var isFolder = false;
	
		// BIND DATA TO WRAPPER
		// BIND DATA TO WRAPPER
		// BIND DATA TO WRAPPER

		var wrapper = 
			this.D3container
			.selectAll('.list-line')
			.data(DATA);




		// EACH FILE WRAPPER
		// EACH FILE WRAPPER
		// EACH FILE WRAPPER		


		// ENTER
		wrapper
			.enter()
			.append('div');
		

		// UPDATE
		wrapper
			.attr('class', function(d) {				
				var cName = 'list-line';
				var isSelected = that.checkSelected(d.fileUuid);
				if ( isSelected ) cName += ' selected';

				if ( d.file.isProcessing ) {
					cName += ' processing';
				}

				return cName;
			})
			.attr('style', function(d) {
				var isOpen = that.checkOpenFileInfo(d.fileUuid, that);
				if ( isOpen ) {
					return 'height: 240px; overflow: hidden;';
				}
			});
					
			

		// EXIT
		wrapper
			.exit()
			.remove();	


		return wrapper;

	},



	listFolder : function (DATA) {

		var wrapper = this.listOptions.wrapper;
		var field   = this.listOptions.titleSpace.name.field;

		var that    = this;

		// FILE TITLE & DESCRIPTION WRAPPER
		// FILE TITLE & DESCRIPTION WRAPPER
		// FILE TITLE & DESCRIPTION WRAPPER	

		// BIND
		var folderWrapper = 
			wrapper
			.selectAll('.list-folder-wrapper')
			.data(function(d) { 

				if ( d.file.store.type == that.folder ) {
					return [d];
				} else {
					return [];
				}
			});

		// ENTER
		folderWrapper
			.enter()
			.append('div')
			.classed('list-folder-wrapper', true);

		// UPDATE
		folderWrapper
			.on('click', function(d) {
				that.listfolderToggle(d, that);
			});

		// UPDATE
		folderWrapper
			.attr('class', function(d) {
				var isOpen = that.checkFolderOpenState(d.fileUuid, that);

				if ( isOpen ) {
					return 'list-folder-wrapper open-folder';
				} else {
					return 'list-folder-wrapper';
				}
			});




		// EXIT
		folderWrapper
			.exit()
			.remove();


	},


	// Select button

	selectButton : function () {

		var listOptions = this.listOptions;

		if ( !listOptions.button ) return;

		// Wrapper
		var wrapper = listOptions.wrapper;
		
		// Function to store selected items
		var fn = listOptions.button.fn;
		
		// Array with selected items
		var slArr = listOptions.button.arr;

		// Context
		var that = this;


		// SELECT BUTTON
		// SELECT BUTTON
		// SELECT BUTTON			

		// BIND
		var selectButton = 
			wrapper
			.selectAll('.item-select-button')
			.data(function(d) { return [d] });

		// ENTER
		selectButton
			.enter()
			.append('div')
			.classed('item-select-button', true);

		// UPDATE
		selectButton
			.on('mousedown', function(d) {
			
				// Set active state of button
				if ( this.className == 'item-select-button active' ) {
					Wu.DomUtil.removeClass(this, 'active');
					d.checked = true;
				} else {
					Wu.DomUtil.addClass(this, 'active');
					d.checked = false;
				}			

				var selectedFile = d.fileUuid;

				// Store selected files 
				fn(selectedFile, that);
							
			});

		// UPDATE
		selectButton
			.attr('class', function(d) {

				// MAKE SURE THAT THE SELECTED STATE ON FILES FOLLOWS ON UPDATE
				var selected = false;
				slArr.forEach(function (sel) {
					if ( d.fileUuid == sel ) selected = true;
				});

				if ( selected ) return 'item-select-button active';
				else 		return 'item-select-button';
			});


		// EXIT
		selectButton
			.exit()
			.remove();

	},


	// List title

	listTitle : function (DATA) {

		var wrapper = this.listOptions.wrapper;
		var field   = this.listOptions.titleSpace.name.field;
		var that    = this;

		// FILE TITLE & DESCRIPTION WRAPPER
		// FILE TITLE & DESCRIPTION WRAPPER
		// FILE TITLE & DESCRIPTION WRAPPER	

		// BIND
		var titleWrapper = 
			wrapper
			.selectAll('.list-title-wrapper')
			.data(function(d) { return [d] });

		// ENTER
		titleWrapper
			.enter()
			.append('div')
			.classed('list-title-wrapper', true);

		// UPDATE
		titleWrapper
			.attr('style', function(d) {		
				var style = '';
				var _width = that.getNameWidth(that);
				if ( _width ) style += 'width:' + _width + '%;';
				if ( d.file.store.type == that.folder ) style += 'padding-left: 115px;';
				return style;

			});


		// EXIT
		titleWrapper
			.exit()
			.remove();




		// FILE TITLE
		// FILE TITLE
		// FILE TITLE				

		// BIND
		var title = 
			titleWrapper
			.selectAll('.list-title')
			.data(function(d) { return [d] });

		// ENTER
		title
			.enter()
			.append('div')
			.classed('list-title', true);

		// UPDATE
		title
			.html(function (d) { return d.file.store[field] });


		// If there is a function on this field
		if ( this.listOptions.titleSpace.name.fn && this.listOptions.titleSpace.name.ev ) {
			
			title.on(this.listOptions.titleSpace.name.ev, function(d) {
				that.listOptions.titleSpace.name.fn(DATA, d, this, that);
			});

		}


		// EXIT
		title
			.exit()
			.remove();



		// FILE DESCRIPTION
		// FILE DESCRIPTION
		// FILE DESCRIPTION

		// BIND
		var fileDescription = 
			titleWrapper
			.selectAll('.list-description')
			.data(function(d) {
				return [d];
			});

		// ENTER
		fileDescription
			.enter()
			.append('div')
			.classed('list-description', true);		


		// UPDATE
		// If there is a function on this field
		if ( this.listOptions.titleSpace.description.fn && this.listOptions.titleSpace.description.ev ) {
				
			fileDescription
				.on(this.listOptions.titleSpace.description.ev, function(d) {
					that.listOptions.titleSpace.description.fn(DATA, d, this, that);
				});
		}


		// UPDATE
		// If there is a function on this field

		if ( this.listOptions.titleSpace.description.killOnSmall && this.tableSize == 'small' ) {
				
			fileDescription
				.classed('displayNone', true);
		}


		if ( this.listOptions.titleSpace.description.killOnSmall && this.tableSize != 'small' ) {
				
			fileDescription
				.classed('displayNone', false);
		}



		// UPDATE		
		fileDescription
			.html(function (d) { 
				var _html = that.listOptions.titleSpace.description.html(d);
				return _html;
			});

		// EXIT
		fileDescription
			.exit()
			.remove();			





		// FILE INFO
		// FILE INFO
		// FILE INFO


		if ( this.listOptions.fileInfo ) {

			// BIND
			var info = 
				titleWrapper
				.selectAll('.list-item-info')
				.data(function(d) { return [d] });

			// ENTER
			info
				.enter()
				.append('div')
				.classed('list-item-info', true);

			info
				.on('click', function(d) {
					that.toggleFileInfo(d, that, info);
				});


			// EXIT
			title
				.exit()
				.remove();

		}





	},


	// Init attributes

	initAttributes : function (DATA) {

		var listOptions = this.listOptions;
		var that = this;

		// Init processing, if there is such a thing...
		that.listProcessing(DATA);

		// Init attributes (gets stropped if there is processing happening...)
		listOptions.attributes.forEach(function (att, i) {

			if ( att.niceName != 'Name' ) {
				// Filter out fields that should only appear for editors
				var proceed = true;
				if ( att.restrict    && !that.canEdit ) proceed = false;
				if ( proceed ) that.listAttribute(i, DATA);
					// that.listProcessing(i, DATA);
				

			}

		})
	
	},

	listProcessing : function (i, DATA) {

		var listOptions = this.listOptions;
		var that        = this;
		

		// WRAPPER
		// WRAPPER
		// WRAPPER

		// BIND
		var process = 
			listOptions.wrapper
			.selectAll('.list-process-grind')
			.data(function(d) { 

				if ( d.file.isProcessing ) {
					return [d];
				} else {
					return [];
				}
			});

		// ENTER
		process
			.enter()
			.append('div')
			.classed('list-process-grind', true);


		// EXIT
		process
			.exit()
			.remove();


		// // Process bar

		// // BIND
		// var processBar = 
		// 	process
		// 	.selectAll('.list-process-bar')
		// 	.data(function(d) { return [d] });

		// // ENTER
		// processBar
		// 	.enter()
		// 	.append('div')
		// 	.classed('list-process-bar', true);

		// // EXIT
		// processBar
		// 	.exit()
		// 	.remove();



		// // Process bar inner

		// // BIND
		// var processBarInner = 
		// 	processBar
		// 	.selectAll('.list-process-bar-inner')
		// 	.data(function(d) { return [d] });

		// // ENTER
		// processBarInner
		// 	.enter()
		// 	.append('div')
		// 	.classed('list-process-bar-inner', true);

		// // UPDATE
		// processBarInner
		// 	.attr('style', function(d) {

		// 		var percent = d.file.isProcessing.percent;
		// 		if ( d.file.isProcessing.percent > 100 ) {
		// 			percent = 100;
		// 		}
		// 		return 'width:' + percent + '%'; 
		// 	})

		// // EXIT
		// processBarInner
		// 	.exit()
		// 	.remove();





		// // Process NO

		// // BIND
		// var processNO = 
		// 	process
		// 	.selectAll('.list-process-no')
		// 	.data(function(d) { return [d] });

		// // ENTER
		// processNO
		// 	.enter()
		// 	.append('div')
		// 	.classed('list-process-no', true);

		// // UPDATE
		// processNO
		// 	.html(function(d) {
		// 		return d.file.isProcessing.tiles;
		// 	})

		// // EXIT
		// processNO
		// 	.exit()
		// 	.remove();			


	},


	// listProcessing : function (i, DATA) {

	// 	var listOptions = this.listOptions;
	// 	var that        = this;
		

	// 	// WRAPPER
	// 	// WRAPPER
	// 	// WRAPPER

	// 	// BIND
	// 	var process = 
	// 		listOptions.wrapper
	// 		.selectAll('.list-process')
	// 		.data(function(d) { 

	// 			if ( d.file.isProcessing ) {
	// 				return [d];
	// 			} else {
	// 				return [];
	// 			}
	// 		});

	// 	// ENTER
	// 	process
	// 		.enter()
	// 		.append('div')
	// 		.classed('list-process', true);


	// 	// EXIT
	// 	process
	// 		.exit()
	// 		.remove();


	// 	// Process bar

	// 	// BIND
	// 	var processBar = 
	// 		process
	// 		.selectAll('.list-process-bar')
	// 		.data(function(d) { return [d] });

	// 	// ENTER
	// 	processBar
	// 		.enter()
	// 		.append('div')
	// 		.classed('list-process-bar', true);

	// 	// EXIT
	// 	processBar
	// 		.exit()
	// 		.remove();



	// 	// Process bar inner

	// 	// BIND
	// 	var processBarInner = 
	// 		processBar
	// 		.selectAll('.list-process-bar-inner')
	// 		.data(function(d) { return [d] });

	// 	// ENTER
	// 	processBarInner
	// 		.enter()
	// 		.append('div')
	// 		.classed('list-process-bar-inner', true);

	// 	// UPDATE
	// 	processBarInner
	// 		.attr('style', function(d) {

	// 			var percent = d.file.isProcessing.percent;
	// 			if ( d.file.isProcessing.percent > 100 ) {
	// 				percent = 100;
	// 			}
	// 			return 'width:' + percent + '%'; 
	// 		})

	// 	// EXIT
	// 	processBarInner
	// 		.exit()
	// 		.remove();





	// 	// Process NO

	// 	// BIND
	// 	var processNO = 
	// 		process
	// 		.selectAll('.list-process-no')
	// 		.data(function(d) { return [d] });

	// 	// ENTER
	// 	processNO
	// 		.enter()
	// 		.append('div')
	// 		.classed('list-process-no', true);

	// 	// UPDATE
	// 	processNO
	// 		.html(function(d) {
	// 			return d.file.isProcessing.tiles;
	// 		})

	// 	// EXIT
	// 	processNO
	// 		.exit()
	// 		.remove();			


	// },

	// Each attribute
	listAttribute : function (i, DATA) {

		var listOptions = this.listOptions;
		var that        = this;
		var attribute   = listOptions.attributes[i].name;
		var fn 	        = listOptions.attributes[i].fn;
		var ev 	        = listOptions.attributes[i].ev;
		var style       = this.getAttributeStyle(i);
		var kill 	= listOptions.attributes[i].killOnSmall;


		// WRAPPER
		// WRAPPER
		// WRAPPER

		// BIND
		var listAttributeWrapper = 
			listOptions.wrapper
			.selectAll('.list-attribute-wrapper-' + attribute)
			.data(function(d) { 

				if ( d.file.isProcessing ) {
					return [];

				} else if ( kill && that.tableSize == 'small' ) {
					return [];
				} else {
					return [d];
				}
			});

		// ENTER
		listAttributeWrapper
			.enter()
			.append('div')
			.classed('list-attribute-wrapper-' + attribute, true)
			.classed('list-attribute-wrapper', true);


		// update
		listAttributeWrapper
			.attr('style', style);


		// if ( fn && event ) {
		if (fn) {
			// UPDATE
			listAttributeWrapper 
				.on(ev, function (d) {
					fn(DATA, d, this, that);
				});
		}



		// EXIT
		listAttributeWrapper
			.exit()
			.remove();


		// INNER
		// INNER
		// INNER

		// BIND
		var listAttribute = 
			listAttributeWrapper
			.selectAll('.list-attribute-' + attribute)
			.data(function(d) { return [d] });

		// ENTER
		listAttribute
			.enter()
			.append('div')
			.classed('list-attribute-' + attribute, true)
			.classed('list-attribute', true);



		// UPDATE
		listAttribute
			.html(function (d) { 




				// If we have special rules for HTML ...
				if ( listOptions.attributes[i].html ) {
					var returnData = listOptions.attributes[i].html(d, that);
					
					if ( returnData ) {
						return [returnData.camelize()]
					} else {
						return [];
					}

				// if not, return attribute field.
				} else {
					if ( d.file.store[attribute] ) {
						return d.file.store[attribute].camelize();
					} else {
						return []; 
					}				
				}

			});

		// EXIT
		listAttribute
			.exit()
			.remove();

	},


	updateProcessig : function (context, data) {


		// BIND
		var process = 
			context
			.selectAll('.list-process')
			.data(function(d) { 
				return [d] 
			});

		// ENTER
		process
			.enter()
			.append('div')
			.classed('list-process', true);


		// EXIT
		process
			.exit()
			.remove();



		// Process bar

		// BIND
		var processBar = 
			process
			.selectAll('.list-process-bar')
			.data(function(d) { return [d] });

		// ENTER
		processBar
			.enter()
			.append('div')
			.classed('list-process-bar', true);

		// EXIT
		processBar
			.exit()
			.remove();



		// Process bar inner

		// BIND
		var processBarInner = 
			processBar
			.selectAll('.list-process-bar-inner')
			.data(function(d) { return [d] });

		// ENTER
		processBarInner
			.enter()
			.append('div')
			.classed('list-process-bar-inner', true);

		// UPDATE
		processBarInner
			.attr('style', function(d) {
				return 'width:' + d.file.isProcessing.percent + '%'; 
			});

		// EXIT
		processBarInner
			.exit()
			.remove();



		// Process NO

		// BIND
		var processNO = 
			process
			.selectAll('.list-process-no')
			.data(function(d) { return [d] });

		// ENTER
		processNO
			.enter()
			.append('div')
			.classed('list-process-no', true);

		// UPDATE
		processNO
			.html(function(d) {
				return d.file.isProcessing.tiles;
			});

		// EXIT
		processNO
			.exit()
			.remove();		

	},




	// ┬  ┬┌─┐┌┬┐  ┌─┐┬ ┬┌┐┌┌─┐┌┬┐┬┌─┐┌┐┌┌─┐
	// │  │└─┐ │   ├┤ │ │││││   │ ││ ││││└─┐
	// ┴─┘┴└─┘ ┴   └  └─┘┘└┘└─┘ ┴ ┴└─┘┘└┘└─┘	

	// Get style string for width and right position of attribute fields

	getNameWidth : function (that) {

		var attribs = that.listOptions.attributes;
		var _width = 100;
		that = this;

		attribs.forEach(function (att) {

			var exclude = true;
			if ( att.restrict ) { if ( that.canEdit ) exclude = false;
			} else { exclude = false; }

			if ( att.killOnSmall && that.tableSize == 'small' ) {
				exclude = true;
			}

			if ( !exclude && att.width ) {

				var width;
				// Enable different width in collapsed mode
				if ( att.smallWidth && !att.killOnSmall && that.tableSize == 'small' ) {
					width = att.smallWidth;
				} else {
					width = att.width;
				}

				_width -= width;
			}
		});

		return _width;

	},



	getAttributeStyle : function (i) {

		var that 	= this;
		var listOptions = this.listOptions;
		var _attrib 	= listOptions.attributes[i];
		var width       = _attrib.width;
		var restrict    = _attrib.restrict;
		var no 		= i;
		var a_allWidth 	= 0;
		var b_allWidth 	= 0;
		var displayNone	= false;

		// Enable different width in collapsed mode
		if ( _attrib.smallWidth && !_attrib.killOnSmall && that.tableSize == 'small' ) {
			width = _attrib.smallWidth;
		}


		listOptions.attributes.forEach(function (attrib, i) {

			var exclude = true;

			if ( attrib.restrict ) {
				if ( this.canEdit ) exclude = false;
			} else {
				exclude = false;
			}

			if ( attrib.killOnSmall && that.tableSize == 'small' ) {
				exclude = true;
			}			

			if ( !exclude ) {

				var _width;

				// Compensate for width in collapsed mode
				if ( attrib.smallWidth && !attrib.killOnSmall && that.tableSize == 'small' ) {
					_width = attrib.smallWidth;

				// if not in collapsed mode
				} else {
					_width = attrib.width;
				}

				if ( _width && i >= no ) a_allWidth += _width;
				if ( _width ) 	         b_allWidth += _width;
			}
			
		}, this);


		var right = (b_allWidth - 10) - (a_allWidth - 10);
		
		var style = 'width: ' + width + '%; right: ' + right + '%;';

		if ( restrict && !this.canEdit ) style += ' display: none;';

		return style;

	},


	// SELECT ALL BUTTON

	selectAllClick : function () {

		if ( !this.listOptions.button ) return;

		var DATA    = this.data2array(this.listData);
		if ( this.sortedData ) DATA = this.sortedData;

		var selected = this.listOptions.button.arr;

		if ( selected.length == DATA.length ) {
			this.listOptions.button.arr = [];
			this.refreshTable();
		} else {

			this.listOptions.button.arr = [];
			DATA.forEach(function (d) {
				this.listOptions.button.arr.push(d.fileUuid);
			}, this);
			this.refreshTable();
		}


	},	

	checkSelected : function (uuid) {

		if ( !this.listOptions.button ) return;

		var slArr = this.listOptions.button.arr;

		var isSelected = false;

		slArr.forEach(function (selected) {
			if ( selected == uuid ) isSelected = true;
		});

		return isSelected;
	
	},


	// FOLDER

	checkFolderOpenState : function(fileUuid, that) {

		if ( !that.openFolders ) return false;

		var isOpen = false;
		that.openFolders.forEach(function(openFolder) {
			if ( openFolder == fileUuid ) isOpen = true;
		});

		return isOpen;

	},

	listfolderToggle : function (d, that) {

		if ( !that.openFolders ) that.openFolders = [];

		var thisFolderIsOpen = false;

		that.openFolders.forEach(function(openFolder, i) {
			if ( openFolder == d.fileUuid ) thisFolderIsOpen = i+1;
		});

		if ( thisFolderIsOpen ) {
			that.openFolders.splice(thisFolderIsOpen-1, 1);			
		} else {
			that.openFolders.push(d.fileUuid);
			
		}

		that.refreshTable();

	},	


	// TOGGLE FILE INFO

	checkOpenFileInfo : function(fileUuid, that) {

		if ( !that.showFileInfo ) return false;

		var isOpen = false;
		that.showFileInfo.forEach(function(openInfo) {
			if ( openInfo == fileUuid ) isOpen = true;
		});

		return isOpen;		

	},


	toggleFileInfo : function (d, that, info) {

		if ( !that.showFileInfo ) that.showFileInfo = [];

		var thisOpen = false;
		that.showFileInfo.forEach(function (fi, i) {
			if (fi == d.fileUuid) thisOpen = i+1;
		});

		if ( thisOpen ) {
			that.showFileInfo.splice(thisOpen-1, 1);
		} else {
			that.showFileInfo.push(d.fileUuid);
		}

		that.refreshTable();

	}

});




// ██╗   ██╗███████╗███████╗██████╗ ███████╗
// ██║   ██║██╔════╝██╔════╝██╔══██╗██╔════╝
// ██║   ██║███████╗█████╗  ██████╔╝███████╗
// ██║   ██║╚════██║██╔══╝  ██╔══██╗╚════██║
// ╚██████╔╝███████║███████╗██║  ██║███████║
//  ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝╚══════╝
                                         


Wu.UserList = Wu.List.extend({



	// ┌─┐┌─┐┌┐┌┌─┐┬─┐┌─┐┬  
	// │ ┬├┤ │││├┤ ├┬┘├─┤│  
	// └─┘└─┘┘└┘└─┘┴└─┴ ┴┴─┘


	// Refresh table
	refresh : function (DATA) {

		// turn off dropzone dragging
		if (app.Dropzone) app.Dropzone.disable();


		if ( this.canEdit ) 	{ this.D3container.classed('canEdit', true) }
		else 			{ this.D3container.classed('canEdit', false) }		
		
		this.listData = app.Users;

		if ( DATA ) this._D3list(DATA);

	},


	addItems : function (items) {

		if ( this.sortedData ) this.sortedData = null;
		this.refreshTable();

	},

	removeItems : function (items) {

		if ( this.sortedData ) this.sortedData = null;
		this.refreshTable();

	},

	// Save
	save : function (saveJSON) {
		var key   = saveJSON.key;
		var value = saveJSON.value ? saveJSON.value : ' ';
		var id    = saveJSON.id;
		var user = app.Users[id];
		user.setKey(key, value);
	},

	// OPTIONS FOR THE LIST
	getListOptions : function () {


		var listOptions = {

			fileInfo   : false,

			button     : {

					// when selecting item
					fn  : this.selectListItem,

					// array with stored selections
					arr : []

			},
			
			titleSpace : {

				name : {

					fn    : this.lastNameFunction,
					ev    : 'dblclick',
					field : 'lastName'
				},

				description : {
					fn    : this.firstNameFunction,
					html  : this.firstNameHtml,					
					ev    : 'dblclick',
					field : 'firstName'
				}

			},

			attributes : [

					// This one is only used for the header

					{ 	
						name 	 : 'lastName',	
						niceName : 'Name',
						fn       : null,
						ev       : null
					},					

					
					// These ones are used for attributes

					{ 	
						name 	    : 'access',
						niceName    : 'Access',
						fn          : this.accessFunction,
						ev          : 'click',
						html        : this.accessHtml,
						killOnSmall : false,
						width       : 15,
						smallWidth  : 20
					},


					{ 	
						name 	    : 'email',
						niceName    : 'Email',
						fn          : null,
						ev          : null,
						html        : this.emailHtml,
						killOnSmall : true,
						width       : 20
					},


					{ 	
						name 	    : 'phone',
						niceName    : 'Phone',
						fn          : this.phoneFunction,
						ev          : 'dblclick',
						html        : this.phoneHtml,
						killOnSmall : true,
						width       : 15
					},


					{ 	
						name 	    : 'position',
						niceName    : 'Position',
						html        : null,
						fn          : this.positionFunction,
						ev          : 'dblclick',
						html        : this.positionHtml,
						killOnSmall : false,
						width       : 12,
						smallWidth  : 20

					},	

					{ 	
						name 	    : 'company',
						niceName    : 'Company',
						fn          : this.companyFunction,
						ev          : 'dblclick',
						html        : this.companyHtml,
						killOnSmall : false,
						width       : 12,
						smallWidth  : 20
					}

			],

			// Fields we incorporate in searching
			searchFields : [

				'lastName',
				'firstName',
				'company',
				'position',
				'phone',
				'email',
				'access'

				]			

		};

		return listOptions;
	
	},


	// ┌─┐┌─┐┌┬┐┬┌─┐┌┐┌  ┌─┐┬ ┬┌┐┌┌─┐┌┬┐┬┌─┐┌┐┌┌─┐
	// ├─┤│   │ ││ ││││  ├┤ │ │││││   │ ││ ││││└─┐
	// ┴ ┴└─┘ ┴ ┴└─┘┘└┘  └  └─┘┘└┘└─┘ ┴ ┴└─┘┘└┘└─┘	

	// Functions that gets triggered on events in table cells

	lastNameFunction : function (DATA, d, context, outerContext) {

		if ( !outerContext.canEdit ) return;

		var options = {

			outerContext : outerContext,
			context      : context,
			what         : 'lastName',
			allDATA      : DATA,
			data 	     : d,
			where        : d.file.store,
			value        : d.file.store.lastName,
			uuid         : d.fileUuid

		};

		if ( this.sortedData ) options.allDATA = this.sortedData;

		outerContext.editField(options);

	},


	firstNameFunction : function (DATA, d, context, outerContext) {

		if ( !outerContext.canEdit ) return;

		var options = {

			outerContext : outerContext,
			context      : context,
			what         : 'firstName',
			allDATA      : DATA,
			data 	     : d,
			where        : d.file.store,
			value        : d.file.store.firstName,
			uuid         : d.fileUuid

		};

		if ( this.sortedData ) options.allDATA = this.sortedData;

		outerContext.editField(options);

	},



	companyFunction : function (DATA, d, context, outerContext) {

		if ( !outerContext.canEdit ) return;

		var options = {

			outerContext : outerContext,
			context      : context,
			what         : 'company',
			allDATA      : DATA,
			data 	     : d,
			where        : d.file.store,
			value        : d.file.store.company,
			uuid         : d.fileUuid

		};

		if ( this.sortedData ) options.allDATA = this.sortedData;

		outerContext.editField(options);

	},


	positionFunction : function (DATA, d, context, outerContext) {

		if ( !outerContext.canEdit ) return;

		var options = {

			outerContext : outerContext,
			context      : context,
			what         : 'position',
			allDATA      : DATA,
			data 	     : d,
			where        : d.file.store,
			value        : d.file.store.position,
			uuid         : d.fileUuid

		};

		if ( this.sortedData ) options.allDATA = this.sortedData;

		outerContext.editField(options);

	},

	phoneFunction : function (DATA, d, context, outerContext) {

		if ( !outerContext.canEdit ) return;

		var options = {

			outerContext : outerContext,
			context      : context,
			what         : 'phone',
			allDATA      : DATA,
			data 	     : d,
			where        : d.file.store,
			value        : d.file.store.phone,
			uuid         : d.fileUuid

		};

		if ( this.sortedData ) options.allDATA = this.sortedData;

		outerContext.editField(options);

	},

	accessFunction : function (DATA, d, context, outerContext) {

		if ( !outerContext.canEdit ) return;

		var userId = d.fileUuid;

		app.SidePane.Users.editAccess(userId);

	},	



	// ┬ ┬┌┬┐┌┬┐┬    ┌─┐┬ ┬┌┐┌┌─┐┌┬┐┬┌─┐┌┐┌┌─┐
	// ├─┤ │ ││││    ├┤ │ │││││   │ ││ ││││└─┐
	// ┴ ┴ ┴ ┴ ┴┴─┘  └  └─┘┘└┘└─┘ ┴ ┴└─┘┘└┘└─┘

	firstNameHtml : function (DATA) {

		return DATA.file.store.firstName;

	},

	companyHtml : function (DATA) {

		var company = DATA.file.store.company;

		if ( !company || company == '' || company == ' ' )  {
			return '<span class="grayed">Add company</span>';
		} else {
			return company;
		}

	},

	positionHtml : function (DATA) {

		var position = DATA.file.store.position;

		if ( !position || position == '' || position == ' ' )  {
			return '<span class="grayed">Add position</span>';
		} else {
			return position;
		}

	},

	phoneHtml : function (DATA) {

		var phone = DATA.file.store.phone;

		if ( !phone || phone == '' || phone == ' ' )  {
			return '<span class="grayed">Add phone number</span>';
		} else {
			return phone;
		}

	},	

	emailHtml : function (DATA) {

		return DATA.file.store.local.email;

	},

	accessHtml : function (DATA, context) {

		var allUsers = context.listData;

		for (f in allUsers) {
			if ( DATA.fileUuid == f ) {
				var user = allUsers[f];
			}
		}

		if ( !user ) return;

		var divProjectsOpen = '<div class="user-projects-button">';
		var divProjectsClose = '</div>';

		// get no of projets etc for user
		var projects = user.getProjects();
		var n = projects ? projects.length : 0;
		var projectsText = n == 1 ? n + ' project' : n + ' projects';
		if (n == 0) projectsText = 'Click to give access!';

		// set html
		var html = divProjectsOpen + projectsText + divProjectsClose;

		return html;


	},

	getUser : function (uuid) {

		var allUsers = this.listData;

		for (f in allUsers) {
			if ( uuid == f ) return allUsers[f];
		}

	},


	// ┌─┐─┐ ┬┌┬┐┌─┐┬─┐┌┐┌┌─┐┬  
	// ├┤ ┌┴┬┘ │ ├┤ ├┬┘│││├─┤│  
	// └─┘┴ └─ ┴ └─┘┴└─┘└┘┴ ┴┴─┘	

	// These functions gets called from sidepane.users.js

	// Returns selected list items

	getSelected : function () {

		// get selected files
		var checks = [];

		var selectedListItems = this.listOptions.button.arr;

		var allUsers = this.listData;

		for (f in allUsers) {

			selectedListItems.forEach(function (selectedUser) {

				// Save if we have a match
				if ( selectedUser == f ) checks.push(allUsers[f]);

			});

		}

		// Return files
		return checks;

	}


});