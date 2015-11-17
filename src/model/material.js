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