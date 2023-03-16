let todos = [];

const todoList = document.querySelector('[data-js=show-todo-list]');
const newTodoBtn = document.querySelector('[data-js=add-new-todo]');

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

	const complete = document.createElement('input');
	complete.type = 'checkbox';
	complete.checked = newTodo.complete;

	newTodo.complete && todo.classList.add('complete');

	const text = document.createElement('input');
	text.type = 'text';
	text.value = newTodo.text;
	text.setAttribute('disabled', '');

	const actions = document.createElement('div');
	actions.classList.add('actions');

	const edit = document.createElement('button');
	edit.innerHTML = '&#9998; Edit';

	const remove = document.createElement('button');
	remove.innerHTML = '&#10006; Remove';

	actions.append(edit);
	actions.append(remove);

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

	return {todo, text, edit, remove}
}

const loadTodoList = new Promise(function(resolve, reject) {
	const loadedList = localStorage.getItem('todo-list');

	loadedList
		? resolve(todos = JSON.parse(loadedList))
		: reject('The todo-list in local storage not exists!');
});

const saveTodoList = () => localStorage.setItem('todo-list', JSON.stringify(todos));

const displayTodoList = (loadedList) => loadedList.forEach(
	listElement => {
		const {todo} = createTodo(listElement);

		todoList.append(todo);
	}
);

(function() {
	newTodoBtn.addEventListener('click', addNewTodo);

	loadTodoList.then(
		result => displayTodoList(result),
		error => console.warn(error)
	  );
})();
