var TAU = Math.PI * 2;

window.vis = {

	init : function () {

		this.width = window.innerWidth - document.querySelector('.editor').offsetWidth;
		this.height = window.innerHeight;
		this.smallestDimension = this.height < this.width ? this.height : this.width;
		this.cx = this.width / 2;
		this.cy = this.height / 2;
		this.data = window.model;

		// Initialize properties that require function calls
		this.svg = d3.select('body').append('svg')
			.attr('width', this.width)
			.attr('height', this.height);

		this.force = d3.layout.force()
			.charge(-500)
			.size([this.width, this.height])
			.nodes(this.data.material)
			.gravity(0.01)
			.start();

		this.drag = d3.behavior.drag()

		// Create the visualization
		this.drawConnectors();
		this.drawSchemas();
		this.drawNodes();

		// Start it uup
		this.listen();
	},

	//
	// UTILS
	//

	pointForAngleAndRadius : function (theta, r) {
		return {
			x : Math.cos(theta) * r + this.cx,
			y : Math.sin(theta) * r + this.cy
		}
	},
	processConnectionData : function (views) {
		var connections = [];
		for (var i = 0; i < views.length; ++i) {
			var view = views[i];
			for (var j = 0; j < view.lenses.length; ++j) {
				var lens = view.lenses[j];
				for (var k = 0; k < lens.poles.length; ++k) {
					var pole = lens.poles[k];
					connections.push({
						node : i,
						mass : '#schema-' + pole.name,
						value : pole.value
					});
				}
			}
		}

		return connections;
	},

	//
	// DRAWLING
	//

	drawConnectors : function () {
		this.connector = this.svg.selectAll('.connector')
			.data(this.processConnectionData(this.data.material))
		this.connector.enter().append('line')
				.classed('connector', true)
				.style('stroke-width', .5)
				.style('stroke', '#FFF')
				.style('opacity', 0)

		this.connector.exit().remove();
	},

	drawSchemas : function () {
		var _this = this;

		this.schema = this.svg.selectAll('.schema')
			.data(this.data.lenses);

		this.schema.enter().append('g')
				.classed('schema', true);

		this.schema.exit().remove();

		this.schemaGuide = this.schema.selectAll('.radius')
			.data(function (d) { return d; })

		this.schemaGuide.enter().append('circle')
			.classed('radius', true)
			.attr('r', function (d, i) { return _this.smallestDimension/3 + (20 * i) })
			.attr('cx', this.cx)
			.attr('cy', this.cy)
			.style('stroke', '#FFF')
			.style('fill', 'rgba(0,0,0,0)')
			.style('pointer-events', 'none');

		this.schemaGuide.exit().remove()

		this.mass = this.schema.selectAll('.mass')
			.data(function (d, i) { 
				return d.poles.map(function(pole, j) {
					var angle = (TAU * j) / d.poles.length;
					var radius = _this.smallestDimension/3 + (20 * i);
					var position = _this.pointForAngleAndRadius(angle, radius)

					return { pole : pole, r : radius, position : position, index : j, total : d.poles.length, angle : angle }; 
				}); 
			});

		this.mass.enter().append('circle')
				.classed('mass', true)
				.attr('id', function(d) { return 'schema-' + d.pole })
				.attr('r', 4)
				.style('stroke', '#666')
				.style('fill', '#000')
				.attr('cx', function (d) { return d.position.x })
				.attr('cy', function(d) { return d.position.y });

		this.mass.exit().remove();

		this.massLabel = this.schema.selectAll('.mass-label')
			.data(function (d, i) {
				return d.poles.map(function(pole, j) {
					var angle = (TAU * j) / d.poles.length;
					var radius = _this.smallestDimension/3 + (20 * i);
					var position = _this.pointForAngleAndRadius(angle, radius)

					return { pole : pole, r : radius, position : position, index : j, total : d.poles.length, angle : angle }; 
				}); 
			});

		this.massLabel.enter().append('text')
				.classed('mass-label', true)
				.attr('x', function(d) { return d.position.x + 5 })
				.attr('y', function(d) { return d.position.y - 5 })
				.attr('fill', '#FFF')
				.text(function(d) { return d.pole.split('_').join(' ') });

		this.massLabel.exit().remove();
	},

	drawNodes : function () {
		this.node = this.svg.selectAll('.node')
			.data(this.data.material);

		this.node.enter().append('circle')
				.attr('class', 'node')
				.attr('r', 3)
				.style('fill', '#FFF');

		this.node.exit().remove();

		this.nodeLabel = this.svg.selectAll('.node-label')
			.data(this.data.material);

		this.nodeLabel.enter().append('text')
				.attr('class', 'node-label')
				.attr('fill', '#FFF')
				.text(function (d) { return d.name });

		this.nodeLabel.exit().remove();
	},

	//
	// POSITIONING
	//

	// Given a dragged node in a schema ring,
	// Positions all other nodes equidistant around the ring
	resolvePosition : function (draggedNode) {
		var x = draggedNode.attr('cx') - this.cx,
				y = draggedNode.attr('cy') - this.cy,
				r = Math.sqrt((x*x) + (y*y)),
				datum = draggedNode.datum(),
				theta = Math.atan2(y, x),
				alpha = (TAU * datum.index) / datum.total,
				offset = theta - alpha,
				_this = this;

		var parentNode = d3.select(draggedNode.node().parentNode);
		parentNode.select('.radius')
			.attr('r', r);

		parentNode.selectAll('.mass').filter(function (d) { return this === draggedNode.node() ? null : this })
			.attr('cx', function (d) {
				return _this.pointForAngleAndRadius(d.angle + offset, r).x
			})
			.attr('cy', function (d) {
				return _this.pointForAngleAndRadius(d.angle + offset, r).y
			});

		parentNode.selectAll('.mass-label')
			.attr('x', function(d) { 
					return _this.pointForAngleAndRadius(d.angle + offset, r).x + 5;
			})
			.attr('y', function(d) {
					return _this.pointForAngleAndRadius(d.angle + offset, r).y - 5;
			});
	},

	resolveGravity : function (d, i) {
		for (var i = 0; i < d.lenses.length; ++i) {
			var lens = d.lenses[i];
			
			if (lens.poles.length === 0) {
				continue;
			}

			var totalValue = lens.poles.reduce(function (p, c) {
				return p + c.value;
			}, 0);

			if (totalValue === 0) {
				continue;
			}

			for (var j = 0; j < lens.poles.length; ++j) {
				var pole = lens.poles[j];

				if (!d3.select('#schema-' + pole.name).node().parentNode.classList.contains('focused')) {
					continue;
				}

				var k = pole.value;
				k = (k/totalValue) * 10;
				k = k === 10 ? .1 : .1/(10 - k);

				var focus = this.svg.select('#schema-' + pole.name);

				var offsetX = parseInt(focus.attr('cx')) - d.x;
				var offsetY = parseInt(focus.attr('cy')) - d.y;

				d.x += offsetX * k;
				d.y += offsetY * k;
			}
		}
	},

	//
	// INTERACTIVITY
	//

	revealConnectorsForNode : function (node) {
		var _this = this;
		var index = (function() {
			var position = 0;
			_this.node.filter(function (d, i) {
				if (this === node.node()) {
					position = i;
				}
			});

			return position;
		})();

		this.connector.filter(function (d) { 
			return d.node === index 
		})
			.style('opacity', function(d) { return d.value/10 });
	},

	hideAllConnectors : function () {
		this.connector
			.style('opacity', 0);
	},

	selectRing : function (index) {
		this.schema
			.classed('focused', false);

		this.schema
			.filter(function(d, i) { return i === index })
			.classed('focused', true);

		if (d3.selectAll('.focused').size() === 0) {
			this.schema
				.classed('focused', true);
		}

		this.selectedRing = index;
	},

	//
	// LISTEN
	//

	listenForDragBehaviors : function () {
		var _this = this,
				dragTarget;

		this.drag.on('dragstart', function () {
			dragTarget = d3.select(d3.event.sourceEvent.target);
			dragTarget.node().parentNode.classList.add('dragging');
		})

		this.drag.on('drag', function () {
			dragTarget
				.attr('cx', d3.event.x)
				.attr('cy', d3.event.y)
			
			_this.resolvePosition(dragTarget);
			_this.force.resume();
		});

		this.drag.on('dragend', function () {
			dragTarget.node().parentNode.classList.remove('dragging');
		})
	},

	frame : function () {
		var _this = this;

		this.node
			.each(this.resolveGravity.bind(this))
			.attr('cx', function (d) { return d.x })
			.attr('cy', function (d) { return d.y });

		this.nodeLabel
			.attr('x', function (d) { return d.x + 5 })
			.attr('y', function (d) { return d.y - 5 });

		this.connector
			.attr('x1', function(d) {
				return _this.node.filter(function(e, i) { return i === d.node }).attr('cx')
			})
			.attr('y1', function (d) {
				return _this.node.filter(function(e, i) { return i === d.node }).attr('cy')
			})
			.attr('x2', function (d) {
				return d3.select(d.mass).attr('cx')
			})
			.attr('y2', function (d) {
				return d3.select(d.mass).attr('cy')
			})
	},

	listenForNodeActions : function () {
		var _this = this;

		this.node.on('mouseenter', function () {
			_this.revealConnectorsForNode(d3.select(this))
			_this.force.resume();
		});

		this.node.on('mouseleave', function () {
			_this.hideAllConnectors();
			_this.force.resume();
		})
	},

	listenForRingSelection : function () {
		var _this = this;

		this.selectedRing = this.schema.size();

		window.addEventListener('keyup', function (e) {
			if (e.keyCode === 32) {
				e.preventDefault();
				_this.selectedRing ++;

				if (_this.selectedRing > _this.schema.size()) {
					_this.selectedRing = 0;
				}

				_this.selectRing(_this.selectedRing);
			}

			_this.force.resume();
		});

		this.selectRing(this.selectedRing);
	},

	update : function () {
		this.force.start();
		this.drawConnectors();
		this.drawSchemas();
		this.drawNodes();
	},

	listen : function () {
		this.mass.call(this.drag);
		this.listenForDragBehaviors();
		this.listenForNodeActions();
		this.listenForRingSelection();
		this.force.on('tick', this.frame.bind(this));
	}

}