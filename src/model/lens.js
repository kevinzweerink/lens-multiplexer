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