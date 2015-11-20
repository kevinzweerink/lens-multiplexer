window.onload = function () {
	window.model = window.model || new Model();
	window.editor = window.editor || new Editor(model);

	window.model.import(window.data);
	window.editor.render();

	window.vis.init();

	window.model.addToUpdateQueue(window.vis.update.bind(window.vis));
}
function Editor(model) {
	this.editor = d3.select('.editor');
	this.model = model;
	this.listen();	
	this.selectTab('lenses');
	this.render();
}

Editor.prototype.gatherTemplates = function () {
	var tmp = {};
	var templates = d3.selectAll('.template')
		.each(function (d) {
			tmp[this.dataset.templateName] = this.cloneNode(true);
			tmp[this.dataset.templateName].classList.remove('template');
		})
		.remove();

	this.templates = tmp;
}

Editor.prototype.selectTab = function (tab) {
	d3.selectAll('.editor .toggle').classed('selected', false);
	d3.select('.editor .toggle.' + tab).classed('selected', true);

	d3.selectAll('.editor .view').classed('hidden', function () { return !this.classList.contains(tab); });
}

Editor.prototype.renderMaterialTab = function () {

	var view = this.editor.select('.material.view');
	var _this = this;

	view.selectAll('.material-node').remove();

	var material = view.selectAll('.material-node')
		.data(this.model.material)
		.enter().append('li')
			.classed('material-node', true);

	material.append('h1')
		.text(function (d) { return d.name })
		.on('click', function () {
			this.parentNode.classList.toggle('expanded');
		});

	material.append('button')
		.classed('delete', true)
		.html('&times;')
		.on('click', function (d) {
			_this.model.removeMaterial(d.name);
			_this.render();
		});

	var lenses = material.append('ul')
		.classed('lenses', true)

	var lens = lenses.selectAll('.lens')
		.data(function (d) { return d.lenses })
		.enter().append('li')
			.classed('lens', true)
			.text(function (d) { return d.name });

	var poles = lens.append('ul')
		.classed('poles', true);

	var pole = poles.selectAll('.pole')
		.data(function (d) { return d.poles })
		.enter().append('li')
			.classed('pole', true)
			.text(function (d) { return d.name });

	pole.append('input')
		.attr('type', 'range')
		.attr('min', 0)
		.attr('max', 10)
		.attr('value', function (d) { return d.value })
		.on('change', function (d) {
			var materialName = d3.select(this.parentNode.parentNode.parentNode.parentNode).datum().name;
			_this.model.setPoleValue(d.value, d.name, d.lens, materialName);
		});


}

Editor.prototype.renderSchemaTab = function () {
	var view = this.editor.select('.lenses.view');
	var _this = this;

	// Do this for now, but at some point figure out how to do the actual update pattern
	view.selectAll('.lens').remove();

	var lens = view.selectAll('.lens')
		.data(this.model.lenses)
		.enter().append('li')
			.classed('lens', true)

	lens.append('h1')
		.text(function (d) { return d.name })
	
	lens.append('button')
		.classed('delete', true)
		.html('&times;')
		.on('click', function (d) {
			_this.model.removeLens(d.name);
			_this.render();
		});

	var poles = lens.append('ul')
		.classed('poles', true);

	var pole = poles.selectAll('.pole')
		.data(function (d) { return d.poles })
		.enter().append('li')
			.classed('pole', true)
			.text(function (d) { return d })
			.append('button')
				.classed('delete', true)
				.html('&times;')
				.on('click', function (d) {
					var lens = d3.select(this.parentNode.parentNode).datum().name;
					_this.model.removePoleFromLens(lens, d);
					_this.render();
				})

	poles.append('input')
		.attr('class', 'create-pole')
		.attr('placeholder', 'Add pole')
		.attr('type', 'text')
		.on('keyup', function (d) {
			if (d3.event.keyCode === 13) {
				_this.model.addPoleToLens(d.name, this.value);
				_this.render();
			}
		});
}

Editor.prototype.render = function () {
	this.renderSchemaTab();
	this.renderMaterialTab();
}

Editor.prototype.createLens = function (name) {
	this.model.addLens(name);
	this.render();
}

Editor.prototype.createMaterial = function (name) {
	this.model.addMaterial(name);
	this.render();
}

Editor.prototype.listen = function () {
	var _this = this;

	this.editor.selectAll('.toggle')
		.on('click', function () {
			_this.selectTab(this.dataset.tab);
		});

	this.editor.select('.create-lens')
		.on('keyup', function () {
			if (d3.event.keyCode === 13) {
				_this.createLens(this.value);
				this.value = '';
			}
		});

	this.editor.select('.create-material')
		.on('keyup', function () {
			if (d3.event.keyCode === 13) {
				_this.createMaterial(this.value);
				this.value = '';
			}
		})

}
function Lens(name, poles) {
	this.poles = [];
	this.name = name;

	if (poles && poles.length > 0) {
		this.poles = poles.map(function (p) { return p; })
	}
}

Lens.prototype.addPole = function (pole) {
	this.poles.push(pole);
}

Lens.prototype.removePole = function (pole) {
	var index = this.poles.indexOf(pole);
	this.poles.splice(index, 1);
}
function Material(name, lenses) {
	this.name = name;
	this.lenses = lenses;
}

Material.prototype.getLens = function (lens) {
	return this.lenses.reduce(function (p, l) {
		if (l.name === lens) {
			return l;
		}

		return p;
	}, undefined);
}

Material.prototype.addLens = function (lens) {
	this.lenses.push(lens);
}

Material.prototype.getPole = function (lens, poleName) {
	if (typeof lens === 'string') {
		lens = this.getLens(lens);
	}

	return lens.poles.reduce(function(prev, pole) {
		if (pole.name === poleName) {
			return pole;
		}

		return prev;
	}, undefined);
}

Material.prototype.setValueForPole = function (value, lens, pole) {
	var l = this.getLens(lens);
	var p = this.getPole(l, pole);

	if (p) {
		p.value = value;
	}
}


Material.prototype.extendWithSchema = function (schema) {
	var _this = this;
	for (var i = 0; i < schema.length; ++i) {
		var lensCandidate = schema[i];
		var lens = this.getLens(lensCandidate.name);

		if (lens) {
			lensCandidate.poles = lensCandidate.poles.map(function (pole) {
				var oldPole = _this.getPole(lens, pole.name);

				if (oldPole) {
					pole.value = oldPole.value;
				}

				return pole;
			});
		}
	}

	this.lenses = schema;
}
function Model() {
	this.lenses = [];
	this.material = [];
}

Model.prototype.import = function (data) {
	_this = this;

	this.lenses = data.lenses.map(function (l) {
		return new Lens(l.name, l.poles);
	});

	this.material = data.material.map(function (m) {
		var schema = _this.generateEmptyLensSchema();
		var material = new Material(m.name, schema);

		for (var i = 0; i < m.lenses.length; ++i) {
			var lens = m.lenses[i];
			for (var pole in lens.poles) {
				var poleValue = lens.poles[pole];
				material.setValueForPole(poleValue, lens.name, pole);
			}
		}

		return material;
	});
}

Model.prototype.addToUpdateQueue = function (fn) {
	if (!this.updateQueue) {
		this.updateQueue = [];
	}

	this.updateQueue.push(fn);
}

Model.prototype.updated = function () {
	this.updateQueue.forEach(function (fn) {
		fn();
	});
}

Model.prototype.getLens = function (lens) {
	return this.lenses.reduce(function (p, c, i) {
		if (c.name === lens) {
			return c;
		}

		return p;
	}, undefined);
}

Model.prototype.getLensPosition = function (lens) {
	return this.lenses.reduce(function (p, c, i) {
		if (c.name === lens) {
			return i;
		}

		return p;
	}, undefined);
}

Model.prototype.getMaterial = function (materialName) {
	return this.material.reduce(function (p, m) {
		if (m.name = materialName) {
			return m;
		}

		return p;
	}, undefined);
}

Model.prototype.getMaterialPosition = function (material) {
	return this.material.reduce(function (p, c, i) {
		if (c.name === material) {
			return i;
		}

		return p;
	}, undefined);
}

Model.prototype.addLens = function (name, poles) {
	var lens = new Lens(name, poles, this);
	this.lenses.push(lens);
	this.propagateSchema();
	this.updated();
}

Model.prototype.addPoleToLens = function (lens, pole) {
	if (typeof lens === 'string') {
		var l = this.getLens(lens);
		if (l) {
			l.addPole(pole);
			this.propagateSchema();
			this.updated();
		}
	} else {
		console.log('Could not add pole, please provide pole as string');
	}
}

Model.prototype.removeLens = function (lens) {
	var i = this.getLensPosition(lens);
	this.lenses.splice(i, 1);
	this.propagateSchema();
	this.updated();
}

Model.prototype.removePoleFromLens = function (lens, pole) {
	var lens = this.getLens(lens);
	lens.removePole(pole);
	this.propagateSchema();
	this.updated();
}

Model.prototype.addMaterial = function (nodeName) {
	var m = new Material(nodeName, this.generateEmptyLensSchema());
	this.material.push(m);
	this.updated();
}

Model.prototype.removeMaterial = function (nodeName) {
	var index = this.getMaterialPosition(nodeName);
	if (index !== undefined) {
		this.material.splice(index, 1);
		this.updated();
	}
}

Model.prototype.setPoleValue = function (value, pole, lens, material) {
	var m = this.getMaterial(material);

	if (!m) return false;

	var p = m.getPole(lens, pole);

	if (!p) return false;

	p.value = value;
	this.updated();

}

Model.prototype.generateEmptyLensSchema = function () {
	var schema = this.lenses.map(function (lens) {
		return {
			name : lens.name,
			poles : lens.poles.map(function (pole, index) {
				return {
					name : pole,
					index : index,
					value : 0,
					lens : lens.name
				}
			})
		}
	});

	return schema;
}

Model.prototype.propagateSchema = function () {
	for (var i = 0; i < this.material.length; ++i) {
		var m = this.material[i];
		var schema = this.generateEmptyLensSchema();
		m.extendWithSchema(schema);
	}
}
window.data = {
	material : [
		{
			name : 'Top News',
			lenses : [
				{
					name : 'Active/Passive Usage',
					poles : {
						active : 0,
						passive : 10
					}
				},
				{
					name : 'Me/NYT',
					poles : {
						me : 0,
						nyt : 10
					}
				},
				{
					name : 'Reader/User/Customer',
					poles : {
						reader : 10,
						user : 0,
						customer : 0
					}
				},
				{
					name : 'Moments',
					poles : {
						prepare_me : 10,
						update_me : 7,
						entertain_me : 4,
						connect_me : 6,
						follow_developing : 7,
						follow_planned : 3,
						improve_me : 2
					}
				}
			]
		},
		{
			name : 'Collections',
			lenses : [
				{
					name : 'Active/Passive Usage',
					poles : {
						active : 2,
						passive : 8
					}
				},
				{
					name : 'Me/NYT',
					poles : {
						me : 1,
						nyt : 9
					}
				},
				{
					name : 'Reader/User/Customer',
					poles : {
						reader : 10,
						user : 0,
						customer : 0
					}
				},
				{
					name : 'Moments',
					poles : {
						prepare_me : 3,
						update_me : 3,
						entertain_me : 8,
						connect_me : 5,
						follow_developing : 5,
						follow_planned : 5,
						improve_me : 3
					}
				}
			]
		},
		{
			name : 'Article',
			lenses : [
				{
					name : 'Active/Passive Usage',
					poles : {
						active : 4,
						passive : 6
					}
				},
				{
					name : 'Me/NYT',
					poles : {
						me : 0,
						nyt : 10
					}
				},
				{
					name : 'Reader/User/Customer',
					poles : {
						reader : 10,
						user : 0,
						customer : 0
					}
				},
				{
					name : 'Moments',
					poles : {
						prepare_me : 6,
						update_me : 8,
						entertain_me : 8,
						connect_me : 3,
						follow_developing : 5,
						follow_planned : 5,
						improve_me : 7
					}
				}
			]
		},
		{
			name : 'Recommended',
			lenses : [
				{
					name : 'Active/Passive Usage',
					poles : {
						active : 3,
						passive : 7
					}
				},
				{
					name : 'Me/NYT',
					poles : {
						me : 6,
						nyt : 4
					}
				},
				{
					name : 'Reader/User/Customer',
					poles : {
						reader : 8,
						user : 2,
						customer : 0
					}
				},
				{
					name : 'Moments',
					poles : {
						prepare_me : 0,
						update_me : 0,
						entertain_me : 10,
						connect_me : 6,
						follow_developing : 0,
						follow_planned : 0,
						improve_me : 0
					}
				}
			]
		},
		{
			name : 'Trending',
			lenses : [
				{
					name : 'Active/Passive Usage',
					poles : {
						active : 0,
						passive : 10
					}
				},
				{
					name : 'Me/NYT',
					poles : {
						me : 0,
						nyt : 4
					}
				},
				{
					name : 'Reader/User/Customer',
					poles : {
						reader : 10,
						user : 2,
						customer : 0
					}
				},
				{
					name : 'Moments',
					poles : {
						prepare_me : 0,
						update_me : 0,
						entertain_me : 10,
						connect_me : 10,
						follow_developing : 6,
						follow_planned : 6,
						improve_me : 0
					}
				}
			]
		},
		{
			name : 'Saved',
			lenses : [
				{
					name : 'Active/Passive Usage',
					poles : {
						active : 8,
						passive : 2
					}
				},
				{
					name : 'Me/NYT',
					poles : {
						me : 8,
						nyt : 2
					}
				},
				{
					name : 'Reader/User/Customer',
					poles : {
						reader : 7,
						user : 3,
						customer : 0
					}
				},
				{
					name : 'Moments',
					poles : {
						prepare_me : 0,
						update_me : 0,
						entertain_me : 10,
						connect_me : 10,
						follow_developing : 0,
						follow_planned : 0,
						improve_me : 6
					}
				}
			]
		},
		{
			name : 'Following',
			lenses : [
				{
					name : 'Active/Passive Usage',
					poles : {
						active : 6,
						passive : 4
					}
				},
				{
					name : 'Me/NYT',
					poles : {
						me : 5,
						nyt : 5
					}
				},
				{
					name : 'Reader/User/Customer',
					poles : {
						reader : 6,
						user : 4,
						customer : 0
					}
				},
				{
					name : 'Moments',
					poles : {
						prepare_me : 8,
						update_me : 8,
						entertain_me : 10,
						connect_me : 6,
						follow_developing : 8,
						follow_planned : 8,
						improve_me : 4
					}
				}
			]
		},
		{
			name : 'Notifications',
			lenses : [
				{
					name : 'Active/Passive Usage',
					poles : {
						active : 3,
						passive : 7
					}
				},
				{
					name : 'Me/NYT',
					poles : {
						me : 0,
						nyt : 10
					}
				},
				{
					name : 'Reader/User/Customer',
					poles : {
						reader : 5,
						user : 5,
						customer : 0
					}
				},
				{
					name : 'Moments',
					poles : {
						prepare_me : 8,
						update_me : 8,
						entertain_me : 2,
						connect_me : 5,
						follow_developing : 5,
						follow_planned : 5,
						improve_me : 0
					}
				}
			]
		},
		{
			name : 'Search',
			lenses : [
				{
					name : 'Active/Passive Usage',
					poles : {
						active : 10,
						passive : 0
					}
				},
				{
					name : 'Me/NYT',
					poles : {
						me : 5,
						nyt : 5
					}
				},
				{
					name : 'Reader/User/Customer',
					poles : {
						reader : 5,
						user : 5,
						customer : 0
					}
				},
				{
					name : 'Moments',
					poles : {
						prepare_me : 8,
						update_me : 8,
						entertain_me : 0,
						connect_me : 0,
						follow_developing : 8,
						follow_planned : 8,
						improve_me : 6
					}
				}
			]
		},
		{
			name : 'Profile',
			lenses : [
				{
					name : 'Active/Passive Usage',
					poles : {
						active : 10,
						passive : 0
					}
				},
				{
					name : 'Me/NYT',
					poles : {
						me : 8,
						nyt : 2
					}
				},
				{
					name : 'Reader/User/Customer',
					poles : {
						reader : 0,
						user : 10,
						customer : 5
					}
				},
				{
					name : 'Moments',
					poles : {
						prepare_me : 0,
						update_me : 0,
						entertain_me : 0,
						connect_me : 0,
						follow_developing : 0,
						follow_planned : 0,
						improve_me : 0
					}
				}
			]
		},
		{
			name : 'Subscriptions',
			lenses : [
				{
					name : 'Active/Passive Usage',
					poles : {
						active : 10,
						passive : 0
					}
				},
				{
					name : 'Me/NYT',
					poles : {
						me : 7,
						nyt : 3
					}
				},
				{
					name : 'Reader/User/Customer',
					poles : {
						reader : 2,
						user : 5,
						customer : 10
					}
				},
				{
					name : 'Moments',
					poles : {
						prepare_me : 0,
						update_me : 0,
						entertain_me : 0,
						connect_me : 0,
						follow_developing : 0,
						follow_planned : 0,
						improve_me : 0
					}
				}
			]
		},
		{
			name : 'Billing Information',
			lenses : [
				{
					name : 'Active/Passive Usage',
					poles : {
						active : 10,
						passive : 0
					}
				},
				{
					name : 'Me/NYT',
					poles : {
						me : 10,
						nyt : 0
					}
				},
				{
					name : 'Reader/User/Customer',
					poles : {
						reader : 0,
						user : 0,
						customer : 10
					}
				},
				{
					name : 'Moments',
					poles : {
						prepare_me : 0,
						update_me : 0,
						entertain_me : 0,
						connect_me : 0,
						follow_developing : 0,
						follow_planned : 0,
						improve_me : 0
					}
				}
			]
		}

	],
	lenses : [
		{
			name : 'Active/Passive Usage',
			poles : ['active', 'passive']
		},
		{
			name : 'Me/NYT',
			poles : ['me', 'nyt']
		},
		{
			name : 'Reader/User/Customer',
			poles : ['reader', 'user', 'customer']
		},
		{
			name : 'Moments',
			poles : ['prepare_me', 'update_me', 'entertain_me', 'connect_me', 'follow_developing', 'follow_planned', 'improve_me']
		}
	]
}
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