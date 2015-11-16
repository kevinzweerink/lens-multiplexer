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