document.addEventListener("DOMContentLoaded", function () {
	const todoForm = document.getElementById("todo-form");
	const newItemInput = document.getElementById("new-item-input");
	const itemsContainer = document.getElementById("items-container");

	todoForm.addEventListener("submit", function (event) {
		event.preventDefault();

		const newItemText = newItemInput.value.trim();

		if (newItemText !== "") {
			addTodoItem(newItemText, null, true);
			newItemInput.value = "";
		}
	});

	loadSavedItems();

	function calculateDueDateText(dateString) {
		if (!dateString) return "";

		const dueDate = new Date(dateString);
		const today = new Date();

		today.setHours(0, 0, 0, 0);
		dueDate.setHours(0, 0, 0, 0);

		const timeDiff = dueDate - today;
		const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

		if (daysDiff < 0) {
			return `Overdue by ${Math.abs(daysDiff)} day${
				Math.abs(daysDiff) === 1 ? "" : "s"
			}`;
		} else if (daysDiff === 0) {
			return "Due today";
		} else if (daysDiff === 1) {
			return "Due tomorrow";
		} else {
			return `Due in ${daysDiff} days`;
		}
	}

	function loadSavedItems() {
		itemsContainer.innerHTML = "";

		Object.keys(localStorage).forEach(function (key) {
			if (key.startsWith("slider-")) {
				const item = JSON.parse(localStorage.getItem(key));
				if (item && item.id && item.text) {
					const dueDateText = calculateDueDateText(item.dueDate);
					addTodoItem(item.text, item.percentage || 0, false, item.id, item.dueDate);
				}
			}
		});
	}

	function addTodoItem(
		text,
		savedPercentage = 0,
		saveToStorage = true,
		existingId = null,
		storedDueDate = null
	) {
		let actualDueDate = storedDueDate;
		if (!actualDueDate && saveToStorage) {
			const dueDateElement = document.getElementById("new-item-date");
			actualDueDate = dueDateElement ? dueDateElement.value : null;
		}

		const dueDateText = calculateDueDateText(actualDueDate);

		const todoItem = document.createElement("div");
		todoItem.className = "card mb-2";

		const uniqueId = existingId || `slider-${Date.now()}`;
		todoItem.innerHTML = `
			<div class="card-body">
				<div class="row align-items-center">
					<div class="col-12 col-md-4 mb-2 mb-md-0">
						<span class="todo-text fw-bold">${text}</span>
					</div>
					<div class="col-12 col-md-8">
						<div class="row align-items-center g-2">
							<div class="col-6 col-sm-4">
								<input type="range" class="form-range" min="0" max="100" value="${
									savedPercentage || 0
								}" step="1" />
							</div>
							<div class="col-3 col-sm-2 text-center">
								<span class="completion-percentage fw-bold">${savedPercentage || 0}%</span>
							</div>
							<div class="col-12 col-sm-4 col-md-3">
								<small class="due-date-label text-muted d-block">${dueDateText || ""}</small>
							</div>
							<div class="col-3 col-sm-2 col-md-3">
								<button class="btn btn-sm btn-outline-danger delete-btn w-100" id="${uniqueId}">Delete</button>
								<button class="btn btn-sm btn-outline-primary edit-btn w-100">Edit</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		`;

		const rangeInput = todoItem.querySelector(".form-range");
		const percentageDisplay = todoItem.querySelector(".completion-percentage");

		rangeInput.addEventListener("input", function () {
			percentageDisplay.textContent = `${rangeInput.value}%`;
		});

		if (saveToStorage) {
			const itemIdentifier = {
				id: uniqueId,
				text: text,
				percentage: rangeInput.value,
				dueDate: actualDueDate,
			};
			localStorage.setItem(uniqueId, JSON.stringify(itemIdentifier));
		}

		const deleteBtn = todoItem.querySelector(".delete-btn");
		deleteBtn.addEventListener("click", function () {
			localStorage.removeItem(uniqueId);
			todoItem.remove();
		});

		const editBtn = todoItem.querySelector(".edit-btn");
		editBtn.addEventListener("click", function () {
			const todoTextElement = todoItem.querySelector(".todo-text");
			const dueDateLabel = todoItem.querySelector(".due-date-label");

			const newTitle = prompt("Edit the title:", text);
			if (newTitle !== null && newTitle.trim() !== "") {
				todoTextElement.textContent = newTitle.trim();
				text = newTitle.trim();
			}
			const newDueDate = prompt(
				"Edit the due date (YYYY-MM-DD):",
				actualDueDate || ""
			);
			if (newDueDate) {
				const dueDateObj = new Date(newDueDate);
				if (!isNaN(dueDateObj)) {
					actualDueDate = newDueDate;
					const newDueDateText = calculateDueDateText(actualDueDate);
					dueDateLabel.textContent = newDueDateText;
				}
			}

			const updatedItem = {
				id: uniqueId,
				text: text,
				percentage: rangeInput.value,
				dueDate: actualDueDate,
			};
			localStorage.setItem(uniqueId, JSON.stringify(updatedItem));
		});

		itemsContainer.appendChild(todoItem);

		rangeInput.addEventListener("change", function () {
			const updatedItem = {
				id: uniqueId,
				text: text,
				percentage: rangeInput.value,
				dueDate: actualDueDate,
			};
			localStorage.setItem(uniqueId, JSON.stringify(updatedItem));
		});
	}
});

const itemsContainerElement = document.getElementById("items-container");
