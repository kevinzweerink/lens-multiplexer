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