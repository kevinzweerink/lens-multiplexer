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