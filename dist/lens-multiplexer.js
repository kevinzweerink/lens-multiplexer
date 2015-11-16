var Lens = function (name, poles, controller) {
	this.poles = [];
	this.name = name;
	this.controller = controller;

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
var Material = function (name, controller) {
	this.name = name;
	this.controller = controller;
	this.lenses = this.controller.generateEmptyLensSchema();
}

Material.prototype.setValueForPole = function (value, lens, pole) {
	var lensIndex = this.lenses.reduce(function (p, c, i) {
		if (c.name === lens) {
			return i;
		}
	}, -1);

	if (lensIndex === -1) {
		console.log('Could not set value, lens ' + lens + ' not identified in schema');
		return false;
	}

	var poleIndex = this.lenses[lensIndex].poles.reduce(function (p, c, i) {
		if (c.name === pole) {
			return i;
		}
	}, -1);

	if (poleIndex === -1) {
		console.log('Could not set value, pole ' + pole + ' not identified in lens ' + lens);
	}

	this.lenses[lens].poles[pole].value = value;
}
var Model = function () {
	this.lenses = [];
	this.material = [];
}

Model.prototype.addLens = function (name, poles) {
	var lens = new Lens(name, poles, this);
	this.lenses.push(lens);
}

Model.prototype.addPoleToLens = function (lens, pole) {
	if (typeof lens === 'string') {
		var index = this.lenses.reduce(function (p, c, i) {
			if (c.name === lens) {
				return i;
			}
		}, -1);

		if (index > -1) {
			this.lenses[index].poles.push(pole);
		}
	}
}

var m = new Model();

m.addLens('me/nyt', ['me', 'nyt']);
m.addPoleToLens('me/nyt', 'cool');

console.log(m);