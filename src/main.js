window.onload = function () {
	window.model = window.model || new Model();
	window.editor = window.editor || new Editor(model);

	window.model.import(window.data);
	window.editor.render();

	window.vis.init();

	window.model.addToUpdateQueue(window.vis.update.bind(window.vis));
}