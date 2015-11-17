var Lens = function (name, poles) {
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
var Material = function (name, lenses) {
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
		
		if (!lens) {
			// First, if we don't have this lens already
			// add it for sure
			this.addLens(lensCandidate);
		} else {
			// Make sure our pole list matches the list from the schema
			lens.poles = lensCandidate.poles.map(function (pole) {
				var oldPole = _this.getPole(lens, pole.name);

				if (oldPole) {
					pole.value = oldPole.value;
				}

				return pole;
			});
		}
	}
}
var Model = function () {
	this.lenses = [];
	this.material = [];
}

Model.prototype.getLens = function (lens) {
	return this.lenses.reduce(function (p, c, i) {
		if (c.name === lens) {
			return c;
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

Model.prototype.addLens = function (name, poles) {
	var lens = new Lens(name, poles, this);
	this.lenses.push(lens);
	this.propagateSchema();
}

Model.prototype.addPoleToLens = function (lens, pole) {
	if (typeof lens === 'string') {
		var l = this.getLens(lens);
		if (l) {
			l.addPole(pole);
			this.propagateSchema();
		}
	} else {
		console.log('Could not add pole, please provide pole as string');
	}
}

Model.prototype.addMaterial = function (nodeName) {
	var m = new Material(nodeName, this.generateEmptyLensSchema());
	this.material.push(m);
}

Model.prototype.setPoleValue = function (value, pole, lens, material) {
	var m = this.getMaterial(material);

	if (!m) return false;

	var p = m.getPole(lens, pole);

	if (!p) return false;

	p.value = value;

}

Model.prototype.generateEmptyLensSchema = function () {
	var schema = this.lenses.map(function (lens) {
		return {
			name : lens.name,
			poles : lens.poles.map(function (pole, index) {
				return {
					name : pole,
					index : index,
					value : 0
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

var m = new Model();

m.addLens('me/nyt', ['me', 'nyt']);

m.addMaterial('Top News');

m.addPoleToLens('me/nyt', 'cool');
m.setPoleValue(1, 'cool', 'me/nyt', 'Top News');

m.addMaterial('Recommended');

m.addLens('user/customer/reader', ['user', 'customer', 'reader']);

console.log(m);