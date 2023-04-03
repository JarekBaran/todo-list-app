let todos = [];
let draggable = null;

const prefersColorScheme = window.matchMedia(`(prefers-color-scheme: dark)`) ? `dark` : `light`;
let getTheme = localStorage.getItem(`color-theme`) || prefersColorScheme;

const toggleThemeBtn = document.querySelector(`[data-js=toggle-theme]`);
const importListBtn = document.querySelector(`[data-js=import-todo-list]`);
const exportListBtn = document.querySelector(`[data-js=export-todo-list]`);
const newTodoBtn = document.querySelector(`[data-js=add-new-todo]`);
const todoList = document.querySelector(`[data-js=show-todo-list]`);

// Helpers
const autoHeight = (element) => {
	element.style.height = `auto`;
	element.style.height = `${element.scrollHeight}px`;
}

const toggleComplete = (complete, todo) => {
	complete.checked
		? (complete.setAttribute(`checked`, `true`), todo.classList.add(`complete`))
		: (complete.removeAttribute(`checked`), todo.classList.remove(`complete`));
}

const setTheme = (theme = getTheme) => {
	document.body.classList.remove(`${getTheme}-theme`);
	document.body.classList.add(`${theme}-theme`);

	toggleThemeBtn.innerHTML = `${(theme == `light`) ? `&#9789 Dark` : `&#9788 Light`}`;

	localStorage.setItem(`color-theme`, theme);

	getTheme = theme;
}

const toggleTheme = () => setTheme((getTheme == `light`) ? `dark` : `light`);

// Todo
const addNewTodo = () => {
	const newTodo = {
		id: new Date().getTime(),
		complete: false,
		text: ``,
	}

	todos.unshift(newTodo);

	const {todo, text} = createTodo(newTodo);
	
	todoList.prepend(todo);
	
	text.removeAttribute(`disabled`);
	text.focus();
	
	saveTodoList();
}

const replaceTodo = (srcIndex, targetIndex) => {
	todos.splice(targetIndex, 0, todos.splice(srcIndex, 1)[0]);
	saveTodoList();
}

const removeTodo = (removeTodoId, createdTodo) => {
	todos = todos.filter(todo => todo.id != removeTodoId);
	createdTodo.remove();
	saveTodoList();
}

const createTodo = (newTodo) => {
	const todo = document.createElement(`li`);
	todo.classList.add(`row`, `todo`);
	todo.setAttribute(`data-id`, newTodo.id);
	todo.setAttribute(`data-js`, `drag-and-drop`);

	const handler = document.createElement(`button`);
	handler.type = `button`;
	handler.innerHTML = `&#8661;`;
	handler.setAttribute(`draggable`, `true`);

	const complete = document.createElement(`input`);
	complete.type = `checkbox`;
	complete.checked = newTodo.complete;
	toggleComplete(complete, todo);

	const text = document.createElement(`textarea`);
	text.innerText = newTodo.text;
	text.setAttribute(`rows`, `1`);
	text.setAttribute(`disabled`, `true`);

	const actions = document.createElement(`div`);
	actions.classList.add(`actions`);

	const edit = document.createElement(`button`);
	edit.innerHTML = `&#9998; Edit`;

	const remove = document.createElement(`button`);
	remove.innerHTML = `&#10006; Remove`;

	actions.append(edit, remove);
	todo.append(handler, complete, text, actions);

	complete.addEventListener(`change`, () => {
		newTodo.complete = complete.checked;
		toggleComplete(complete, todo);
		saveTodoList();
	});

	text.addEventListener(`input`, () => {
		newTodo.text = text.value;

		autoHeight(text);
	});

	text.addEventListener(`blur`, () => {
		text.setAttribute(`disabled`, `true`);

		!text.value.length && removeTodo(newTodo.id, todo);
	});

	edit.addEventListener(`click`, () => {
		text.removeAttribute(`disabled`);
		text.focus();
	});

	remove.addEventListener(`click`, () => window.confirm(`Remove todo? - "${newTodo.text}"`) && removeTodo(newTodo.id, todo));

	return {todo, text}
}

// Drag and drop handlers
function handleDragStart(e) {
	draggable = this;
	draggable.classList.add(`draggable`);
}

function handleDragOver(e) {
	if (e.preventDefault) {
		e.preventDefault();
	}

	e.dataTransfer.dropEffect = `move`;
	this.classList.add(`over`);
	
	return false;
}

function handleDragLeave() {
	this.classList.remove(`over`);
}

function handleDrop(e) {
	if (e.stopPropagation) {
		e.stopPropagation();
	}

	draggable.classList.remove(`draggable`);
	this.classList.remove(`over`);
	
	if (draggable != this) {
		const srcIndex = todos.findIndex(todo => todo.id == draggable.dataset.id);
		const targetIndex = todos.findIndex(todo => todo.id == this.dataset.id);

		(srcIndex > targetIndex)
			? this.before(draggable)
			: this.after(draggable);

		replaceTodo(srcIndex, targetIndex);
	}

	return false;
}

// List
const displayTodoList = () => {
	todoList.innerHTML = ``;

	todos.forEach(
		listElement => {
			const {todo} = createTodo(listElement);
			todoList.append(todo);
		}
	);

	todoList.querySelectorAll(`textarea`).forEach(textarea => {
		autoHeight(textarea);
	});

	todoList.querySelectorAll(`[data-js=drag-and-drop]`).forEach(dnd => {
		dnd.addEventListener(`dragstart`, handleDragStart, false);
		dnd.addEventListener(`dragover`, handleDragOver, false);
		dnd.addEventListener(`dragleave`, handleDragLeave, false);
		dnd.addEventListener(`drop`, handleDrop, false);
	});

	saveTodoList();
}

const loadTodoList = new Promise((resolve, reject) => {
	const loadedList = localStorage.getItem(`todo-list`);

	loadedList
		? resolve(todos = JSON.parse(loadedList))
		: reject(`The todo-list in local storage not exists!`);
});

const saveTodoList = () => localStorage.setItem(`todo-list`, JSON.stringify(todos));

const importTodoList = () => {
	const inputFile = document.createElement(`input`);

	inputFile.type = `file`;
	inputFile.accept = `.json`;

	inputFile.addEventListener(`change`, () => {

		if (inputFile.value.length) {
			const reader = new FileReader();

			reader.readAsText(inputFile.files[0]);

			reader.onload = function () {
				todos = JSON.parse(reader.result);

				displayTodoList();
			}
		}
	});

	window.confirm(`Are you sure? This will overwrite the current todo list!`) && inputFile.click();
}

const exportTodoList = () => {
	if (!todos.length) return alert(`Todo list is empty! Please add some todos before export.`);

	const file = new Blob([JSON.stringify(todos)], {type: `text/plain`});
	const link = document.createElement(`a`);

	link.href = URL.createObjectURL(file);
	link.download = `todo-list-${new Date().toJSON().slice(0,10).toString()}.json`;
	link.click();

	URL.revokeObjectURL(link.href);
}

// App init
(function() {
	loadTodoList
		.then(
			setTheme(),
			displayTodoList(),
			error => console.warn(error)
		)
		.then(() => {
			window.addEventListener(`load`, () => {
				toggleThemeBtn.addEventListener(`click`, toggleTheme);
				importListBtn.addEventListener(`click`, importTodoList);
				exportListBtn.addEventListener(`click`, exportTodoList);
				newTodoBtn.addEventListener(`click`, addNewTodo);
			});
		});
})();
