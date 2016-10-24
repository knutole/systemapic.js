// slider events
// 
// - `set` event is fired AFTER slide is done, 
// - `update` event is fired for any change/action
// - `slide` is fired while sliding
//
// - currently, CUBE layer is updated on `set`
//   and GRAPH is updated on `update` 

Wu.Graph.Animator = Wu.Evented.extend({

    options : {

        // Animation frames per second
        fps : 2,

        // Max value for steps on slider
        maxLength : 365,

        // Defines what kind of graph we want
        graphType : 'annualCycles',

        // how often to register updates when sliding
        sliderThrottle : 500,

        // active buttons
        buttons : {
            play : false,
            yearly : false,
            daily : true
        }
    },

    _initialize : function (options) {

        // set layer
        this._layer = this.options.layer;

        // create slider
        this._createSlider();

        // add hooks
        this.listen();       

        // mark inited
        this._inited = true;

    },


    listen : function (onoff) {
        var onoff = onoff || 'on';

        // dom events
        Wu.DomEvent[onoff](this._fastBackBtn,       'click', this._moveFastBack, this);
        Wu.DomEvent[onoff](this._backBtn,           'click', this._moveBack, this);
        Wu.DomEvent[onoff](this._fastForwardBtn,    'click', this._moveFastForward, this);
        Wu.DomEvent[onoff](this._forwardBtn,        'click', this._moveForward, this);
        Wu.DomEvent[onoff](this._playBtn,           'click', this.play, this);

        // slider events
        this.slider[onoff]('update', this._sliderUpdateEvent.bind(this));
        this.slider[onoff]('set', this._sliderSetEvent.bind(this));
        this.slider[onoff]('slide', this._onSlide.bind(this));

        // listen for events
        Wu.Mixin.Events[onoff]('setSlider', this.setSlider, this);
        Wu.Mixin.Events[onoff]('updateSliderButtons', this.updateButtons, this);
        Wu.Mixin.Events[onoff]('setSliderRange', this._onSetSliderRange, this);
        Wu.Mixin.Events[onoff]('unsetSliderRange', this._onUnsetSliderRange, this);
        Wu.Mixin.Events[onoff]('shadeButtons', this._onShadeButtons, this);
        Wu.Mixin.Events[onoff]('unshadeButtons', this._onUnshadeButtons, this);
        Wu.Mixin.Events[onoff]('cubeCacheNoLayer', this._onCubeCacheNoLayer, this);
        
        // Wu.Mixin.Events[onoff]('hideAnimator', this._onHideAnimator, this);
        // Wu.Mixin.Events[onoff]('showAnimator', this._onShowAnimator, this);

        this._layer.on('enabled', this._layerEnabled.bind(this));
        this._layer.on('disabled', this._layerDisabled.bind(this));
    },


    getContainer : function () {
        return this.sliderOuterContainer;
    },

    // set fps
    setFPS : function (fps) {

        // set locally
        this.options.fps = fps;

        // propagate
        Wu.Mixin.Events.fire('setFPS', {detail : {
            fps : fps
        }});
    },  

    _createSlider : function () {

        // create divs
        this.sliderOuterContainer       = Wu.DomUtil.create('div', 'big-slider-outer-container', app._appPane);
        this.sliderInnerContainer        = Wu.DomUtil.create('div', 'big-slider-inner-container', this.sliderOuterContainer);
        var slider                      = Wu.DomUtil.create('div', 'big-slider', this.sliderInnerContainer);
        this.sliderButtonsContainer     = Wu.DomUtil.create('div', 'big-slider-button-container', this.sliderInnerContainer);
        this.tickContainer              = Wu.DomUtil.create('div', 'big-slider-tick-container', this.sliderInnerContainer);

        // animator buttons
        this._fastBackBtn               = Wu.DomUtil.create('div', 'big-slider-step-backward', this.sliderButtonsContainer, '<i class="fa fa-fast-backward"></i>');
        this._backBtn                   = Wu.DomUtil.create('div', 'big-slider-tap-backward', this.sliderButtonsContainer, '<i class="fa fa-step-backward"></i>');
        this._forwardBtn                = Wu.DomUtil.create('div', 'big-slider-tap-forward', this.sliderButtonsContainer, '<i class="fa fa-step-forward"></i>');
        this._fastForwardBtn            = Wu.DomUtil.create('div', 'big-slider-step-forward', this.sliderButtonsContainer, '<i class="fa fa-fast-forward"></i>');
        this._playBtn                   = Wu.DomUtil.create('div', 'big-slider-play-button', this.sliderButtonsContainer, '<i class="fa fa-play"></i>');        

        // Set number of slider steps
        // var dataLength = (_.size(this._data) > this.options.maxLength) ? this.options.maxLength : _.size(this._data);

        // set slider options
        this._defaultSliderOptions = {
            start: [this._sliderValue],
            range: {
                'min': 1,
                'max': this.options.maxLength
            },
            step : 1,
            connect : 'lower' // different color on left side of slider
        }

        // create slider
        this.slider = noUiSlider.create(slider, this._defaultSliderOptions);

        // hide by default if option set
        if (this.options.hide) this.hide();

        // hide/show buttons according to options
        this._displayButtons();

    },

    addExtraPane : function () {
        Wu.DomUtil.addClass(this.sliderInnerContainer, 'bottom-right-border-radius-only');
    },
    removeExtraPane : function () {
        Wu.DomUtil.removeClass(this.sliderInnerContainer, 'bottom-right-border-radius-only');
    },

    remove : function () {
        // this._addHooks('off');
        // Wu.DomUtil.remove(this.sliderOuterContainer);
    },  

    _onCubeCacheNoLayer : function (e) {
        var cube = e.detail.cube;

        // debug: move one step forward
        this._moveForward();
    },

    _onSlide : function (values) {
        var value = parseInt(values[0]);
        var limit = this.getSliderLimit();

        // force limit
        if (value > limit) {

            // force limit on slider
            this.slider.set(limit);

            // shade buttons
            this._onShadeButtons();
        }
    },

    setSliderLimit : function (limit) {
        this._limit = limit.limit;
    },

    getSliderLimit : function () {
        return this._limit;
    },  

    _displayButtons : function () {
        // display buttons based on options
        this._playBtn.style.display   = this.options.buttons.play   ? 'inline-block' : 'none';
        this._fastBackBtn.style.display = this.options.buttons.yearly ? 'inline-block' : 'none';
        this._fastForwardBtn.style.display  = this.options.buttons.yearly ? 'inline-block' : 'none';
        this._forwardBtn.style.display   = this.options.buttons.daily  ? 'inline-block' : 'none';
        this._backBtn.style.display  = this.options.buttons.daily  ? 'inline-block' : 'none';
    },

    _onShadeButtons : function () {
       
        // shade forward button
        this._forwardBtn.style.color = 'rgb(81, 92, 111)';

        // remove event
        Wu.DomEvent.off(this._forwardBtn,  'click', this._moveForward, this);

        // shade slider handle
        this._getSliderHandle().style.background = 'rgb(82, 93, 111)';
        this._getSliderTail().style.background = 'rgb(82, 93, 111)';
    },

    _onUnshadeButtons : function () {
       
        // shade forward button
        this._forwardBtn.style.color = '#FCFCFC';

        // reactivate event
        Wu.DomEvent.on(this._forwardBtn,  'click', this._moveForward, this);

        // shade slider handle
        this._getSliderHandle().style.background = '#ECEDEF';
        this._getSliderTail().style.background = '#ECEDEF';
    },

    _getSliderHandle : function () {
        var handle = this.slider.target.childNodes[0].childNodes[0].childNodes[0];
        return handle;
    },

    _getSliderTail : function () {
        var handle = this.slider.target.childNodes[0].childNodes[0];
        return handle;
    },

    _onSetSliderRange : function (e) {
        var range = e.detail.range;

        // update range option
        this.setSliderOptions({
            range : range
        }, true);
    },

    _onUnsetSliderRange : function () {
        // set default slider options
        this.setSliderOptions(this._defaultSliderOptions, true);
    },

    setSliderOptions : function (options, dontInvalidate) {
        // set slider options
        this.slider.updateOptions(options, dontInvalidate);
    },

    // @ only update graph
    // event that runs when sliding (ie. a lot!)
    // see http://refreshless.com/nouislider/events-callbacks/
    _sliderUpdateEvent : function (value) {
        if (!this._inited) return;

        // set slider value
        this._sliderValue = value ? Math.round(value) : 0;

        // fire update
        this.fire('update', {
            day : this._sliderValue
        });
    },

    // @ event: update layers
    // event that runs when new value is set (either after slide, or with .set())
    _sliderSetEvent : function (value, handle, unencoded, tap) {
        if (!this._inited) return;

        // set slider value
        this._sliderValue = value ? Math.round(value) : 0;

        // get current date
        var timestamp = this._getCurrentDate();

        // add delay if tap (to )
        setTimeout(function () {

            // fire slider set event
            Wu.Mixin.Events.fire('sliderSet', { detail : {
                value : this._sliderValue,
                timestamp : timestamp
            }});

        }.bind(this), tap ? 300 : 0);
       
    },

    // todo: slider should know which date it is without asking graph
    _getCurrentDate : function () {
        var date = this._graph.getCurrentDate(this._sliderValue);
        return date;
    },

    plugGraph : function (graph) {
        this._graph = graph;
    },

    // Enable layer
    _layerEnabled : function (e) {

        // get layer
        var layer = e.layer || e.detail.layer;

        // only support cube layer. todo: destroy animator (ie. so not listening to events) when not active
        if (!layer.isCube()) return;

        // set current layer
        this._currentLayer = layer;

        // set title 
        this.setTitle(layer.getTitle());

        // show
        this.show();
    },

    // Disable layer
    _layerDisabled : function (e) {
        this.hide();
    },

    // Set slider value
    setSlider : function (e) {

        // get value
        var value = (e && e.detail) ? e.detail.value : e;

        // set value
        this._sliderValue = value;

        // set slider
        this.slider.set(this._sliderValue);
    },

    updateButtons : function (e) {

        var disableForward  = e.detail.diableForward;
        var disableBackward = e.detail.diableBackward

        if (disableForward) { 
            Wu.DomUtil.addClass(this._fastForwardBtn, 'disable-button');
        } else { 
            Wu.DomUtil.removeClass(this._fastForwardBtn, 'disable-button'); 
        }

        if (disableBackward) { 
            Wu.DomUtil.addClass(this._fastBackBtn, 'disable-button');
        } else { 
            Wu.DomUtil.removeClass(this._fastBackBtn, 'disable-button'); 
        }
    },

    // Set title
    setTitle : function (title) {

        // return if no layer
        if (!this._currentLayer) return;

        // fire event
        Wu.Mixin.Events.fire('setSliderTitle', {detail : {
            title : title
        }});
    },

    // These are the actions for the play, pause, step forward and backward buttons
    play : function () {        
        this.playing ? this.stopPlaying() : this.startPlaying();
    },

    startPlaying : function () {

        // set pause icon
        this._playBtn.innerHTML = '<i class="fa fa-pause"></i>';

        // mark as playing
        this.playing = true;

        // move frame @ fps
        this.playInterval = setInterval(function() {

            // check if last day of year
            if (this._sliderValue == 365) {     // todo: move to next year...?

                // stop playing
                return clearInterval(this.playInterval);

            } else {                

                // move cursor forward
                this._moveForward();
            }           

        }.bind(this), (1000/this.options.fps)) 

        // fire animation play
        Wu.Mixin.Events.fire('animationPlay');
    },

    stopPlaying : function () {

        // set play icon
        this._playBtn.innerHTML = '<i class="fa fa-play"></i>';

        // stop playing
        clearInterval(this.playInterval);
        this.playing = false;

        // fire animation stop
        Wu.Mixin.Events.fire('animationStop');
    },

    _moveForward : function () {      
        var value = this._sliderValue + 1;

        if ( value > this.options.maxLength ) {
            // debug: just return
            return;
            
            value = 1;
            this._moveNextYear(value)
        }

        // set slider value
        this.slider.set(value);
    },

    _moveBack : function () {
        var value = this._sliderValue - 1;
        
        if (value <= 0) {

            // debug: just return
            return;

            // set value
            value = this.options.maxLength;
            this._movePreviousYear(value);
        }

        this.slider.set(value);
    },

    _movePreviousYear : function (day) {
        Wu.Mixin.Events.fire('animatorMovePreviousYear', {detail : {
            day : day
        }});
    },

    _moveNextYear : function (day) {
        Wu.Mixin.Events.fire('animatorMoveNextYear', {detail : {
            day : day
        }});
    },    

    _moveFastBack : function () {
        Wu.Mixin.Events.fire('sliderMoveBackward');
    },

    _moveFastForward : function () {
        Wu.Mixin.Events.fire('sliderMoveForward');
    },  

    // Update message box, if it exists before
    update : function (message, severity) {},


    hide : function () {
        this.sliderOuterContainer.style.display = 'none';
    },

    show : function () {
        if (!this._inited) return;
        this.sliderOuterContainer.style.display = 'block';
    },  

    _onHideAnimator : function () {
        this.hide();
    },

    _onShowAnimator : function () {
        this.show();
    },


});

