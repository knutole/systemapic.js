Wu.satelliteAngle = Wu.Class.extend({

	initialize : function (options) {

		this.options = options;
		this.container = this.options.appendTo;

		this.initContent();

	},


	initContent : function () {

		this.color = '#019688';
		this._innerContainer = Wu.DomUtil.create('div', 'd3-satellite-wrapper displayNone', this.container);

	},

	update : function (options) {

		var angle = options.angle ? options.angle : false;
		var path  = options.path ? options.path : false;

		if ( !angle && !path ) {
			this.closed = true;
			Wu.DomUtil.addClass(this._innerContainer, 'displayNone');
		} else {
			this.closed = false;
			Wu.DomUtil.removeClass(this._innerContainer, 'displayNone');
		}

		this.initAngle(parseInt(angle));
		this.initCompass(parseInt(path));
	},

	initAngle : function (angle) {		
		
		if ( this.angleContainer ) {
			this.angleContainer.innerHTML = '';			
			this.angleContainer.remove();
		}
		if ( !angle && angle != 0 ) return;

		this.angleContainer = Wu.DomUtil.createId('div', 'd3-satellite-angle-container', this._innerContainer);
		this.angleTitle = Wu.DomUtil.create('div', 'd3-satellite-title', this.angleContainer, 'Measurement angle');

		var size = 0.55,
		    padding = 10,
		    width = 45,
		    height = 75,
		    flip = angle < 0 ? true : false;


		var D3angle = d3.select(this.angleContainer)
				.append("svg")
                              	.attr("width", (width + padding*2) * size)
                              	.attr("height", (height * size) + padding);

                var yLine = D3angle
				.append("line")
				.attr("x1", function () {
					if ( flip ) return (width + padding) * size;
						    return padding * size;
				})
				.attr("y1", padding * size)
				.attr("x2", function () {
					if ( flip ) return (width + padding) * size;
						    return padding * size;
				})
				.attr("y2", (height - padding) * size)
				// Styling
				.attr("stroke-width", 1)
				.attr("stroke", "#999");

                var xLine = D3angle
				.append("line")
				.attr("x1", padding * size)
				.attr("y1", (height - padding - 1) * size)
				.attr("x2", (width + padding) * size)
				.attr("y2", (height - padding - 1) * size)
				// Styling
				.attr("stroke-width", 1)
				.attr("stroke", "#999");				



		// Line container
		var lineContainer = D3angle
				.append('g')
				.attr('transform', function() {
					var r = -angle;
					var x = flip ? width * size : width/2 * size;
					var y = padding * size;
					return 'rotate(' + r + ', ' + x + ',' + y + ')';
				});

		var angleLine = lineContainer
				.append("line")
				.classed('angle-line', true)

				.attr('y1', padding * size)
				.attr("y2", (height - padding) * size)

				.attr("x1", function () {
					if ( flip ) return (width + padding) * size;
						    return padding * size;
				})

				.attr("x2", function () {
					if ( flip ) return (width + padding) * size;
						    return padding * size;
				})
				
				// styling
				.attr('stroke-width', 2)
				.attr('stroke', this.color);


		// Arrow head
		var triangle = lineContainer
				.append("path")
				.attr("d", function() {

					var arrowWidth = 5;
					var arrowHeight = 3;

					var _startX = flip ? ((width + padding) * size) : (padding * size);
					var _startY = (height - padding) * size + arrowHeight;

					var M = "M" + _startX + ',' + _startY;
					var L1 = "L" + (_startX + arrowHeight) + ',' + (_startY - arrowWidth);
					var L2 = "L" + (_startX - arrowHeight) + ',' + (_startY - arrowWidth);
					return M + L1 + L2 + 'Z';
				})
				// style
				.attr('stroke-width', 0)
				.attr('stroke', 'none')
				.attr('fill', this.color);

		var startCircle = D3angle
				.append("circle")
				.attr('cx', function () {
					if ( flip ) return (width + padding) * size;
						    return padding * size;					
				})
				.attr('cy', padding * size)
				.attr('r', 3)
				// styling
				.attr('fill', '#FFF')
				.attr('stroke-width', 2)
				.attr('stroke', this.color);


		// Angle
		var text = D3angle
			.append('text')
			.attr('x', ((width/2)+padding) * size)
			.attr('y', (height+15) * size)
			.attr('font-family', 'sans-serif')
			.attr('font-size', '10px')
			.attr('font-weight', 900)
			.attr('fill', '#999')
			.attr("text-anchor", "middle")
			.text(function() {
				if ( flip ) return  (-angle) + '°';
						return  angle + '°'
			});


	},


	initCompass : function (path) {		

		if ( this.compassContainer ) {
			this.compassContainer.innerHTML = '';
			this.compassContainer.remove();
		}

		if ( !path && path != 0 ) return;

		this.compassContainer = Wu.DomUtil.createId('div', 'd3-satellite-compass-container', this._innerContainer);		
		this.compassTitle = Wu.DomUtil.create('div', 'd3-satellite-title', this.compassContainer, 'Line of sight');


		var size = 0.75,
		    padding = 10,
		    width = 65,
		    height = 65;		

		var D3container = d3.select(this.compassContainer)
				.append("svg")
                              	.attr("width", width * size)
                              	.attr("height", (height * size) + padding);


                // North
		var N = D3container
				.append('text')
				.attr('x', width/2 * size)
				.attr('y', (padding + 2 ) * size)
				.attr('font-family', 'sans-serif')
				.attr('font-size', (10 * size) + 'px')
				.attr('fill', '#999')
				.attr("text-anchor", "middle")
				.text('N');

		// South
		var S = D3container
				.append('text')
				.attr('x', width/2 * size)
				.attr('y', (height - 5) * size) 
				.attr('font-family', 'sans-serif')
				.attr('font-size', (10 * size) + 'px')
				.attr('fill', '#999')
				.attr("text-anchor", "middle")
				.text('S');

		// West
		var W = D3container
				.append('text')
				.attr('x', (padding - 2) * size)
				.attr('y', (height/2 + 3) * size) 
				.attr('font-family', 'sans-serif')
				.attr('font-size', (10 * size) + 'px')
				.attr('fill', '#999')
				.attr("text-anchor", "middle")
				.text('W');

		// East
		var E = D3container
				.append('text')
				.attr('x', (width - 9) * size)
				.attr('y', (height/2 + 3) * size) 
				.attr('font-family', 'sans-serif')
				.attr('font-size', (10 * size) + 'px')
				.attr('fill', '#999')
				.attr("text-anchor", "middle")
				.text('E');


                // East-West line
		var ewLine = D3container
				.append('line')
				.attr("x1", (padding + 5) * size)
				.attr("y1", (height/2 * size))
				.attr("x2", ((width-15) * size))
				.attr("y2", (height/2 * size))
				// style
				.attr('stroke-width', 1)
				.attr('stroke', '#ccc');


		// North-South line
		var nsLine = D3container
				.append('line')
				.attr("x1", (width/2 * size))
				.attr("y1", (padding + 5) * size)
				.attr("x2", (width/2 * size))
				.attr("y2", ((height-15) * size))
				// style
				.attr('stroke-width', 1)
				.attr('stroke', '#ccc');

		// Compass circle frame
                var circle = D3container
				.append("circle")
				.attr('cx', (width/2 * size))
				.attr('cy', (height/2 * size))
				.attr('r', (width/2 - 15) * size)
				// style
				.attr('fill', 'transparent')
				.attr('stroke-width', 1)
				.attr('stroke', '#999');


		// Line container
		var lineContainer = D3container
				.append('g')
				.attr('transform', function() {
					return 'rotate(' + path + ', ' + (width/2 * size) + ',' + (height/2 * size) + ')';
				})


		// Path line
                var line = lineContainer
				.append("line")
				.classed('angle-line', true)
				.attr('fill', 'white')
				.attr("x1", (width/2 * size))
				.attr("y1", padding * size)
				.attr("x2", (width/2 * size))
				.attr("y2", ((height-10) * size))
				// style
				.attr('stroke-width', 2)
				.attr('stroke', this.color);


		// Arrow head
		var triangle = lineContainer
				.append("path")
				.attr("d", function() {
					var _startX = width/2;
					var _startY = padding - 5;
					var M = "M" + (_startX*size) + ',' + (_startY*size);
					var L1 = "L" + ((_startX + 4)*size) + ',' + ((_startY + 6)*size);
					var L2 = "L" + ((_startX - 4)*size) + ',' + ((_startY + 6)*size);
					return M + L1 + L2 + 'Z';
				})
				// style
				.attr('stroke-width', 0)
				.attr('stroke', 'none')
				.attr('fill', this.color);


                var innerCircle = D3container
				.append("circle")
				.classed('inner-circle', true)
				.attr('cx', (width/2 * size))
				.attr('cy', (height/2 * size))
				.attr('r', 3)
				// style
				.attr('fill', '#FFF')
				.attr('stroke-width', 2)
				.attr('stroke', this.color);



		// Degree
		var degreePath = D3container
				.append('text')
				.attr('x', width/2 * size)
				.attr('y', (height+10) * size)
				// style
				.attr('font-family', 'sans-serif')
				.attr('font-size', '10px')
				.attr('font-weight', 900)
				.attr('fill', '#999')
				.attr("text-anchor", "middle")
				.text(path + '°');

	}
});