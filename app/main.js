let todos = [];
let draggable = null;

const todoList = document.querySelector('[data-js=show-todo-list]');
const importBtn = document.querySelector('[data-js=import-todo-list]');
const exportBtn = document.querySelector('[data-js=export-todo-list]');
const newTodoBtn = document.querySelector('[data-js=add-new-todo]');

const autoHeight = (element) => {
	element.style.height = `auto`;
	element.style.height = `${element.scrollHeight}px`;
}

const addNewTodo = () => {
	const newTodo = {
		id: new Date().getTime(),
		complete: false,
		text: '',
	}

	todos.unshift(newTodo);

	const {todo, text} = createTodo(newTodo);
	
	todoList.prepend(todo);
	
	text.removeAttribute('disabled');
	text.focus();
	
	saveTodoList();
}

const createTodo = (newTodo) => {
	const todo = document.createElement('li');
	todo.classList.add('row', 'todo');
	todo.setAttribute('data-js', 'drag-and-drop');

	const handler = document.createElement('button');
	handler.type = 'button';
	handler.innerHTML = '&#8661;';
	handler.setAttribute('draggable', 'true');
	handler.setAttribute('data-id', newTodo.id);

	const complete = document.createElement('input');
	complete.type = 'checkbox';
	complete.checked = newTodo.complete;

	newTodo.complete && todo.classList.add('complete');

	const text = document.createElement('textarea');
	text.innerText = newTodo.text;
	text.setAttribute('rows', '1');
	text.setAttribute('disabled', '');

	const actions = document.createElement('div');
	actions.classList.add('actions');

	const edit = document.createElement('button');
	edit.innerHTML = '&#9998; Edit';

	const remove = document.createElement('button');
	remove.innerHTML = '&#10006; Remove';

	actions.append(edit);
	actions.append(remove);

	todo.append(handler);
	todo.append(complete);
	todo.append(text);
	todo.append(actions);

	complete.addEventListener('change', () => {
		newTodo.complete = complete.checked;
		newTodo.complete ? todo.classList.add('complete') : todo.classList.remove('complete');

		saveTodoList();
	});

	text.addEventListener('input', () => {
		newTodo.text = text.value;

		autoHeight(text);
	});

	text.addEventListener('blur', () => {
		text.setAttribute('disabled', '');

		saveTodoList();
	});

	edit.addEventListener('click', () => {
		text.removeAttribute('disabled');
		text.focus();
	});

	remove.addEventListener('click', () => {
		todos = todos.filter(todo => todo.id != newTodo.id);
		todo.remove();

		saveTodoList();
	});

	return {todo, text}
}

const moveTodo = (srcID, destID) => {
	const srcIndex = todos.findIndex((todo) => todo.id == srcID);
	const destIndex = todos.findIndex((todo) => todo.id == destID);

	movedTodo = todos[srcIndex];

	todos[srcIndex] = todos[destIndex];
	todos[destIndex] = movedTodo;

	saveTodoList();
}

const loadTodoList = new Promise(function(resolve, reject) {
	const loadedList = localStorage.getItem('todo-list');

	loadedList
		? resolve(todos = JSON.parse(loadedList))
		: reject('The todo-list in local storage not exists!');
});

const saveTodoList = () => localStorage.setItem('todo-list', JSON.stringify(todos));

const displayTodoList = () => {
	todoList.innerHTML = '';

	todos.forEach(
		listElement => {
			const {todo} = createTodo(listElement);

			todoList.append(todo);
		}
	);
}

const importTodoList = () => {
	const inputFile = document.createElement('input');

	inputFile.type = 'file';
	inputFile.accept = '.json';
	
	if (window.confirm('Are you sure? This will overwrite the current todo list!')) {
		inputFile.click();
	}

	inputFile.addEventListener('change', () => {
		if (inputFile.value.length) {
			const reader = new FileReader();

			reader.readAsText(inputFile.files[0]);

			reader.onload = function () {
				todos = JSON.parse(reader.result);

				displayTodoList();
				saveTodoList();
			}
		}
	});
}

const exportTodoList = () => {
	if (!todos.length) return alert('Todo list is empty! Please add some todos before export.');

	const file = new Blob([JSON.stringify(todos)], {type: 'text/plain'});
	const link = document.createElement('a');

	link.href = URL.createObjectURL(file);
	link.download = `todo-list-${new Date().toJSON().slice(0,10).toString()}.json`;
	link.click();

	URL.revokeObjectURL(link.href);
}

// Drag and drop handlers
function handleDragStart(e) {
	draggable = this;
	draggable.classList.add('draggable');

	e.dataTransfer.effectAllowed = 'move';
	e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragOver(e) {
	if (e.preventDefault) {
		e.preventDefault();
	}

	e.dataTransfer.dropEffect = 'move';
	this.classList.add('over');
	
	return false;
}

function handleDragLeave() {
	this.classList.remove('over');
}

function handleDrop(e) {
	if (e.stopPropagation) {
		e.stopPropagation();
	}

	draggable.classList.remove('draggable');
	this.classList.remove('over');
	
	if (draggable != this) {
		draggable.innerHTML = this.innerHTML;
		this.innerHTML = e.dataTransfer.getData('text/html');

		moveTodo(draggable.querySelector('[draggable=true]').dataset.id, this.querySelector('[draggable=true]').dataset.id);
	}

	return false;
}

// App init
(function() {
	loadTodoList.then(displayTodoList(), error => console.warn(error));

	window.addEventListener('load', () => {
		importBtn.addEventListener('click', importTodoList);
		exportBtn.addEventListener('click', exportTodoList);
		newTodoBtn.addEventListener('click', addNewTodo);

		document.querySelectorAll('textarea').forEach(textarea => {
			autoHeight(textarea);
		});

		document.querySelectorAll('[data-js=drag-and-drop]').forEach(function(dnd) {
		  dnd.addEventListener('dragstart', handleDragStart, false);
		  dnd.addEventListener('dragover', handleDragOver, false);
		  dnd.addEventListener('dragleave', handleDragLeave, false);
		  dnd.addEventListener('drop', handleDrop, false);
		});
	});
})();
