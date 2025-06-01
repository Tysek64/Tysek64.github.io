document.addEventListener("keyup", function(event) {
	if (event.keyCode === 13) {
		event.preventDefault();
		calculateSolution();
	}
})

function addRow () {
	let table = document.getElementById("items").children[0];
	let newRow = document.createElement("tr");
	let massInput = document.createElement("td");
	massInput.appendChild(document.createElement("input"));

	let valueInput = document.createElement("td");
	valueInput.appendChild(document.createElement("input"));

	let numberOutput = document.createElement("td");
	numberOutput.innerHTML = 0;

	let removeContainer = document.createElement("td");
	let removeButton = document.createElement("button");
	removeButton.innerHTML = "-";
	removeButton.setAttribute("onclick", "deleteRow(this)");
	removeContainer.appendChild(removeButton);

	newRow.appendChild(massInput);
	newRow.appendChild(valueInput);
	newRow.appendChild(numberOutput);
	newRow.appendChild(removeContainer);

	table.children[table.children.length - 1].before(newRow);
}

function deleteRow (rowToDelete) {
	rowToDelete.parentElement.parentElement.remove();
}

function clearSolution () {
	let table = document.getElementById("items").children[0].children;

	for (let i = 1;i < table.length - 1;i++) {
		let row = table[i].children;
		row[2].innerHTML = 0;
	}

	document.getElementById("result").innerHTML = "Wynik: 0";
}

function calculateSolution () {
	let numberRegex = /^[1-9]\d*$/;

	let table = document.getElementById("items").children[0].children;
	let items = [];

	if (!numberRegex.test(document.getElementById("maxMass").value)) {
		alert("Wpisano niepoprawną masę maksymalną! Powinna to być liczba całkowita dodatnia!");
		return;
	}

	let maxMass = Number.parseInt(document.getElementById("maxMass").value);

	for (let i = 1;i < table.length - 1;i++) {
		let row = table[i].children;

		if (!(numberRegex.test(row[0].children[0].value) && numberRegex.test(row[1].children[0].value))) {
			alert("Wpisano niepoprawne dane! Powinny to być liczby całkowite dodatnie!");
			return;
		}

		items.push({
			"row": i,
			"mass": Number.parseInt(row[0].children[0].value),
			"value": Number.parseInt(row[1].children[0].value),
			"number": 0
		});
	}

	let result = knapSackRecur(0, maxMass, items, Array.from({length: items.length}, () => 0));

	for (let i = 0;i < items.length;i++) {
		let row = table[items[i].row].children;
		row[2].innerHTML = result[1][i];
	}

	document.getElementById("result").innerHTML = "Wynik: " + result[0];
}

function knapSackRecur(i, capacity, items, taken, memo) {
	if (i === items.length) {
		return [0, taken];
	}

	let take = 0;
	if (items[i].mass <= capacity) {
		take = knapSackRecur(i, capacity - items[i].mass, items, structuredClone(taken), memo);
		take[0] += items[i].value;
	}

	let noTake = knapSackRecur(i + 1, capacity, items, structuredClone(taken), memo);

	if (take[0] > noTake[0]) {
		taken[i]++;
		for (let i = 0;i < taken.length;i++) {
			taken[i] += take[1][i];
		}
		return [take[0], taken];
	} else {
		for (let i = 0;i < taken.length;i++) {
			taken[i] += noTake[1][i];
		}
		return [noTake[0], taken];
	}
}
