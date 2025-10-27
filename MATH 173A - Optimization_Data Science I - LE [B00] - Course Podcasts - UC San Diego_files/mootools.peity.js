// Peity jQuery plugin version 2.0.1
// (c) 2014 Ben Pickles
//
// http://benpickles.github.io/peity
//
// Released under MIT license.
// Modified for Mootools by Matthew Fedder <matthewf@ucsd.edu>, March 18th 2014

// Variables to export
var Peity;
var PiePeity; 

(function($, document, Math) {

var svgElement = function(tag, attrs) {
	var elem = document.createElementNS("http://www.w3.org/2000/svg", tag); 

	Object.each(attrs, function(value, name) 
		{
		elem.set(name, value); 
		});

	return elem;
	}

var Peity = new Class({
	Implements: [Options],

	options: {
		target: null,
		},
	prepare: function(width, height) 
		{
		if (this.svg)
			{
			this.svg.empty();
			} 
		else 
			{
			this.svg = svgElement("svg", 
				{
				"class": "peity"
				});

			this.svg.inject(this.$el, "after");
			this.$el.hide();

			this.$el.store("peity", this.svg);
			}

		this.svg.set("height", height);
		this.svg.set("width", width);

		return this.svg;
		},
	draw: function() 
		{
		peity.graphers[this.type].call(this, this.options);
		},
	fill: function() 
		{
		var fill = this.options.fill;
		var func = fill;

		if (typeOf(func) != 'function') 
			{
			func = function(_, i) 
				{
				return fill[i % fill.length];
				}
			}
		return func;
		},
	values: function() 
		{
		var values = this.$el.get('text').split(this.options.delimiter); 

		var parsedValues = Array.map(values, function(value) 
			{
			return parseFloat(value)
			});

		return parsedValues;
		}
	});
	

PiePeity = new Class({
	Extends: Peity,
	options: 	
		{
		delimiter: null,
		diameter: 100,
		fill: ["#ff9900", "#fff4dd", "#ffc66e"]
		},

	initialize: function(target, opts)
		{
		opts.target = this.$el = target; 

		Object.append(this.options, opts);
		opts = this.options;

		if (!opts.delimiter) 
			{
			var delimiter = this.$el.get('text').match(/[^0-9\.]/);
			opts.delimiter = delimiter ? delimiter[0] : ",";
			}

		var values = this.values();

		if (opts.delimiter == "/") 
			{
			var v1 = values[0];
			var v2 = values[1];
			values = [v1, Math.max(0, v2 - v1)];
			}

		var i = 0;
		var length = values.length;
		var sum = 0;

		for (; i < length; i++) 
			{
			sum += values[i];
			}

		var width = opts.width || opts.diameter; 
		var height = opts.height || opts.diameter; 

		var $svg = this.prepare(width, height);

		var cx = width / 2, 
			cy = height / 2;

		var radius = Math.min(cx, cy);
		var pi = Math.PI;
		var fill = this.fill();
		var start = -pi / 2;

		for (i = 0; i < length; i++) 
			{
			var value = values[i];
			var portion = value / sum;
			var node; 

			if (portion == 0) continue;

			if (portion == 1) 
				{
				node = svgElement("circle", 
					{
					cx: cx,
					cy: cy,
					r: radius
					});
				} 
			else 
				{
				var slice = portion * pi * 2;
				var end = start + slice;

				var x1 = radius * Math.cos(start) + cx;
				var y1 = radius * Math.sin(start) + cy;
				var x2 = radius * Math.cos(end) + cx;
				var y2 = radius * Math.sin(end) + cy;

				var d = [
					"M", cx, cy,
					"L", x1, y1,
					"A", radius, radius, 0, slice > pi ? 1 : 0, 1, x2, y2,
					"Z"];

				node = svgElement("path", 
					{
					d: d.join(" ")
					});

				start = end;
				}

			node.set("fill", fill.call(this, value, i, values));

			node.inject(this.svg); 
			}
		}
	});

})(document.id, document, Math);
