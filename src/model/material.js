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