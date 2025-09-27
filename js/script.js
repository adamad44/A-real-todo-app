document.addEventListener("DOMContentLoaded", function () {
	const todoForm = document.getElementById("todo-form");
	const newItemInput = document.getElementById("new-item-input");
	const itemsContainer = document.getElementById("items-container");

	const darkModeToggle = document.getElementById("darkModeToggle");
	const darkModeIcon = document.querySelector(".dark-mode-icon");

	const savedDarkMode = localStorage.getItem("darkMode");
	if (savedDarkMode === "enabled") {
		document.body.classList.add("dark-mode");
		darkModeIcon.textContent = "☀️";
	}

	darkModeToggle.addEventListener("click", function () {
		document.body.classList.toggle("dark-mode");

		if (document.body.classList.contains("dark-mode")) {
			localStorage.setItem("darkMode", "enabled");
			darkModeIcon.textContent = "☀️";
		} else {
			localStorage.setItem("darkMode", "disabled");
			darkModeIcon.textContent = "🌙";
		}
	});

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
		const items = [];
		Object.keys(localStorage).forEach(function (key) {
			if (key.startsWith("slider-")) {
				const item = JSON.parse(localStorage.getItem(key));
				items.push(item);
			}
		});

		items.sort((a, b) => {
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			const aDueDate = a.dueDate ? new Date(a.dueDate + "T00:00:00") : null;
			const aDaysUntilDue = aDueDate
				? Math.ceil((aDueDate - today) / (1000 * 60 * 60 * 24))
				: 999;

			const aDaysPressureFactor = Math.max(1, 5 - aDaysUntilDue) / 5;
			const aEffortFactor = (a.effort || 1) / 10;
			const aRemainingWorkFactor = (100 - (a.percentage || 0)) / 100;
			const aPriorityScore =
				aDaysPressureFactor * aEffortFactor * aRemainingWorkFactor;

			const bDueDate = b.dueDate ? new Date(b.dueDate + "T00:00:00") : null;
			const bDaysUntilDue = bDueDate
				? Math.ceil((bDueDate - today) / (1000 * 60 * 60 * 24))
				: 999;

			const bDaysPressureFactor = Math.max(1, 5 - bDaysUntilDue) / 5;
			const bEffortFactor = (b.effort || 1) / 10;
			const bRemainingWorkFactor = (100 - (b.percentage || 0)) / 100;
			const bPriorityScore =
				bDaysPressureFactor * bEffortFactor * bRemainingWorkFactor;

			return bPriorityScore - aPriorityScore;
		});

		items.forEach(function (item) {
			if (item && item.id && item.text) {
				console.log(item.effort);

				addTodoItem(item.text, item.percentage || 0, false, item.id, item.dueDate);
			}
		});
	}

	function addTodoItem(
		text,
		savedPercentage = 0,
		saveToStorage = true,
		existingId = null,
		storedDueDate = null,
		effortValue = null
	) {
		let actualDueDate = storedDueDate;
		if (!actualDueDate && saveToStorage) {
			const dueDateElement = document.getElementById("new-item-date");
			actualDueDate = dueDateElement ? dueDateElement.value : null;
		}

		const dueDateText = calculateDueDateText(actualDueDate);

		const todoItem = document.createElement("div");
		todoItem.className = "card mb-2";

		let daysUntilDue = null;
		if (actualDueDate) {
			const dueDate = new Date(actualDueDate + "T00:00:00");
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			const timeDiff = dueDate - today;
			daysUntilDue = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
		}

		let recommendedCompletion = 0;
		if (daysUntilDue !== null && daysUntilDue > 0 && savedPercentage < 100) {
			const remainingWork = 100 - savedPercentage;

			if (daysUntilDue === 1) {
				recommendedCompletion = remainingWork;
			} else if (daysUntilDue > 1) {
				const availableDays = daysUntilDue;
				recommendedCompletion = Math.ceil(remainingWork / availableDays);
			}
			recommendedCompletion = Math.min(recommendedCompletion, 100);
		}

		const uniqueId = existingId || `slider-${Date.now()}`;
		todoItem.innerHTML = `
			<div class="card-body text-center text-md-start">
				<div class="row align-items-center justify-content-center justify-content-md-start">
					<div class="col-12 col-md-4 mb-2 mb-md-0">
						<span class="todo-text fw-bold">${text}</span>
					</div>
					<div class="col-12 col-md-8">
						<div class="row align-items-center g-2 justify-content-center justify-content-md-start">
							<div class="col-12 col-sm-4 progress-container">
								<input type="range" class="form-range" min="0" max="100" value="${
									savedPercentage || 0
								}" step="1" />
								${
									recommendedCompletion > 0
										? `<label class="form-label" style="font-size: 0.7rem; color: #6c757d;">reach ${
												Number(recommendedCompletion) + Number(savedPercentage)
										  }% today (+${recommendedCompletion}%)</label>`
										: ""
								}
							</div>
							<div class="col-12 col-sm-2 text-center">
								<span class="completion-percentage fw-bold percentage-display">${
									savedPercentage || 0
								}%</span>
							</div>
							<div class="col-12 col-sm-4 col-md-3">
								<small class="due-date-label text-muted d-block">${dueDateText || ""}</small>
								<small class="actual-due-date text-muted d-block">${
									actualDueDate || "N/A"
								}</small>
							</div>
							<div class="col-12 col-sm-2 col-md-3">
								<button class="btn btn-sm delete-btn w-100" id="${uniqueId}">Delete</button>
								<button class="btn btn-sm edit-btn w-100 mt-2 mt-sm-0">Edit</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		`;

		const rangeInput = todoItem.querySelector(".form-range");
		const percentageDisplay = todoItem.querySelector(".completion-percentage");
		const progressContainer = todoItem.querySelector(".progress-container");

		if (saveToStorage) {
			const effortValueInput = document.getElementById("difficulty-slider");
			effortValue = effortValueInput ? effortValueInput.value : 1;
		}

		function updateProgressGlow(percentage) {
			const intensity = percentage / 100;
			const glowOpacity = Math.max(0.1, intensity * 0.8);
			const shadowIntensity = intensity * 20;
			const greenTint = Math.floor(intensity * 70);

			progressContainer.style.boxShadow = `0 0 ${shadowIntensity}px rgba(40, 167, 69, ${glowOpacity})`;
			progressContainer.style.backgroundColor = `rgba(40, 167, 69, ${
				intensity * 0.05
			})`;
		}

		updateProgressGlow(parseInt(rangeInput.value));

		rangeInput.addEventListener("input", function () {
			const currentValue = parseInt(rangeInput.value);
			percentageDisplay.textContent = `${currentValue}%`;

			updateProgressGlow(currentValue);
		});

		if (saveToStorage) {
			const itemIdentifier = {
				id: uniqueId,
				text: text,
				percentage: rangeInput.value,
				dueDate: actualDueDate,
				effort: effortValue,
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
			const newEffortValue = prompt(
				"Edit the effort value (1-10):",
				effortValue || 1
			);

			if (newEffortValue !== null && !isNaN(newEffortValue)) {
				effortValue = Math.max(1, Math.min(10, parseInt(newEffortValue, 10)));
			}

			const updatedItem = {
				id: uniqueId,
				text: text,
				percentage: rangeInput.value,
				dueDate: actualDueDate,
				effort: effortValue,
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
				effort: effortValue,
			};
			localStorage.setItem(uniqueId, JSON.stringify(updatedItem));
		});
	}
});

const itemsContainerElement = document.getElementById("items-container");
