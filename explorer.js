// HTML elements
let generationTable = document.getElementById("generationOptions");
let preprocessingTable = document.getElementById("preprocessingOptions");
let statsTable = document.getElementById("dataStats");

let nClassesSlider = document.getElementById("nClasses");
let cSizeSlider = document.getElementById("cSize");
let outDistanceSlider = document.getElementById("outDistance");
let generationTransformSelector = document.getElementById("genTransform");
let nNeighborsSlider = document.getElementById("nNeighbors");
let xRangeMaxInput = document.getElementById("xRangeMax");
let yRangeMaxInput = document.getElementById("yRangeMax");
let pointCanvas = document.getElementById("mainCanvas");
let neighborsCanvas = document.getElementById("subCanvas");

let preprocessCheckbox = document.getElementById("preprocessCheckbox");
let stepContainer = document.getElementById("stepContainer");

let baseStep = document.getElementById("baseStepContainer").children[0];

// contexts
let pointCtx = pointCanvas.getContext("2d");
let neighborsCtx = neighborsCanvas.getContext("2d");

// important globals
let classes = [];
let colors = [];

// view parameters
let mouseActive = false;
let pan = false;
let transformX = 600;
let transformY = 400;
let scale = 100;
let mouseX = 0;
let mouseY = 0;

function acceptColor (newColor, strict) {
	let results = [];
	for (let color of colors) {
		results.push(Math.abs(color[0] - newColor[0]) + Math.abs(color[1] - newColor[1]) + Math.abs(color[2] - newColor[2]));
	}
	return Math.min(...results) > (strict ? 150 : 100);
}

function generateColor () {
	let result = [0, 0, 0];
	let counter = 0;

	do {
		let tokens = 500;
		result = [0, 0, 0];

		let transfer = 0;

		while (tokens > 100) {
			for (let i = 0;i < 3;i++) {
				transfer = Math.floor(Math.random() * tokens);
				transfer = Math.min(transfer, 255 - result[i]);

				result[i] += transfer;
				tokens -= transfer;
			}
		}
	} while (!acceptColor(result, ++counter < 50));

	colors.push(result);

	return result;
}

function buildClusters () {
	colors = [];

	classes = Array.from({length: nClassesSlider.value}, () => ({
		x: Math.random() * (2 * Number(xRangeMaxInput.value)) - (generationTransformSelector.value != "none" ? 0 : xRangeMaxInput.value),
		y: Math.random() * (2 * Number(yRangeMaxInput.value)) - yRangeMaxInput.value,
		color: generateColor(),
		objects: buildObjects(),
	}));

	transformObjects();
}

function buildObjects () {
	let retVal = Array.from({length: 10}, () => ({
		theta: Math.random() * 2 * Math.PI,
		r: (Math.random() < 0.95) ? (Math.random() * 0.1 * cSizeSlider.value) : (Math.random() * outDistanceSlider.valueAsNumber * cSizeSlider.value + outDistanceSlider.valueAsNumber * cSizeSlider.value),
	}));

	for (let object of retVal) {
		object.x = object.r * Math.cos(object.theta);
		object.y = object.r * Math.sin(object.theta);
	}

	return retVal;
}

function transformObjects () {
	let xPositions = [];
	let yPositions = [];

	for (let clas of classes) {
		for (let object of clas.objects) {
			object.transformedX = generationTransformSelector.value == "exp" ? Math.exp(object.x + clas.x) : (generationTransformSelector.value == "sqr" ? Math.pow(object.x + clas.x, 2) : object.x + clas.x);
			object.transformedY = object.y + clas.y;

			xPositions.push(object.transformedX);
			yPositions.push(object.transformedY);
		}
	}

	if (preprocessCheckbox.checked) {
		for (let step of stepContainer.children) {
			let active = step.getElementsByClassName("stepActivator")[0].checked;

			if (active) {
				let axis = step.getElementsByClassName("axisSelector")[0].value;
				let operation = step.getElementsByClassName("operationSelector")[0].value;
				let value = step.getElementsByClassName("valueSelector")[0].value;
				let customValue = step.getElementsByClassName("customValueInput")[0].valueAsNumber;

				let currentMinX = Math.min(...xPositions);
				let currentMaxX = Math.max(...xPositions);
				let currentAvgX = xPositions.reduce((acc, cur) => (acc + cur), 0) / xPositions.length;
				let currentDevX = Math.sqrt(xPositions.reduce((acc, cur) => (acc + Math.pow(cur - currentAvgX, 2)), 0) / xPositions.length);

				let currentMinY = Math.max(...yPositions);
				let currentMaxY = Math.min(...yPositions);
				let currentAvgY = yPositions.reduce((acc, cur) => (acc + cur), 0) / yPositions.length;
				let currentDevY = Math.sqrt(yPositions.reduce((acc, cur) => (acc + Math.pow(cur - currentAvgX, 2)), 0) / yPositions.length);

				if (axis == "X") {
					value = value == "min" ? currentMinX : (value == "max" ? currentMaxX : (value == "dif" ? currentMaxX - currentMinX : (value == "avg" ? currentAvgX : (value == "dev" ? currentDevX : customValue))));
				} else {
					value = value == "min" ? currentMinY : (value == "max" ? currentMaxY : (value == "dif" ? currentMinY - currentMaxY : (value == "avg" ? currentAvgY : (value == "dev" ? currentDevY : customValue))));
				}

				xPositions = [];
				yPositions = [];

				switch (operation) {
					case "sub":
						for (let clas of classes) {
							for (let object of clas.objects) {
								if (axis == "X") {
									object.transformedX -= value;
								} else {
									object.transformedY -= value;
								}

								xPositions.push(object.transformedX);
								yPositions.push(object.transformedY);
							}
						}
						break;
					case "div":
						for (let clas of classes) {
							for (let object of clas.objects) {
								if (axis == "X") {
									object.transformedX /= value;
								} else {
									object.transformedY /= value;
								}

								xPositions.push(object.transformedX);
								yPositions.push(object.transformedY);
							}
						}
						break;
					case "log":
						for (let clas of classes) {
							for (let object of clas.objects) {
								if (axis == "X") {
									object.transformedX = Math.log(object.transformedX);
								} else {
									object.transformedY = -Math.log(-object.transformedY);
								}

								xPositions.push(object.transformedX);
								yPositions.push(object.transformedY);
							}
						}
						break;
					case "sqrt":
						for (let clas of classes) {
							for (let object of clas.objects) {
								if (axis == "X") {
									object.transformedX = Math.sqrt(object.transformedX);
								} else {
									object.transformedY = -Math.sqrt(-object.transformedY);
								}

								xPositions.push(object.transformedX);
								yPositions.push(object.transformedY);
							}
						}
						break;
				}
			}
		}
	}

	updateStats();
}

function updateStats () {
	let xPositions = [];
	let yPositions = [];

	for (let clas of classes) {
		for (let object of clas.objects) {
			xPositions.push(object.transformedX);
			yPositions.push(object.transformedY);
		}
	}

	let currentMinX = Math.min(...xPositions);
	let currentMaxX = Math.max(...xPositions);
	let currentAvgX = xPositions.reduce((acc, cur) => (acc + cur), 0) / xPositions.length;
	let currentDevX = Math.sqrt(xPositions.reduce((acc, cur) => (acc + Math.pow(cur - currentAvgX, 2)), 0) / xPositions.length);

	let currentMinY = Math.max(...yPositions);
	let currentMaxY = Math.min(...yPositions);
	let currentAvgY = yPositions.reduce((acc, cur) => (acc + cur), 0) / yPositions.length;
	let currentDevY = Math.sqrt(yPositions.reduce((acc, cur) => (acc + Math.pow(cur - currentAvgX, 2)), 0) / yPositions.length);

	let minRow = document.getElementById("dataStatsMinRow");
	minRow.children[1].innerHTML = currentMinX.toFixed(3);
	minRow.children[2].innerHTML = currentMinY.toFixed(3);

	let maxRow = document.getElementById("dataStatsMaxRow");
	maxRow.children[1].innerHTML = currentMaxX.toFixed(3);
	maxRow.children[2].innerHTML = currentMaxY.toFixed(3);

	let avgRow = document.getElementById("dataStatsAvgRow");
	avgRow.children[1].innerHTML = currentAvgX.toFixed(3);
	avgRow.children[2].innerHTML = currentAvgY.toFixed(3);

	let devRow = document.getElementById("dataStatsDevRow");
	devRow.children[1].innerHTML = currentDevX.toFixed(3);
	devRow.children[2].innerHTML = currentDevY.toFixed(3);
}

function drawGrid () {
	pointCtx.lineWidth = 3;
	pointCtx.strokeStyle = "rgb(128, 128, 128)";

	pointCtx.beginPath();
	pointCtx.moveTo(0, transformY);
	pointCtx.lineTo(pointCanvas.width, transformY);
	pointCtx.moveTo(transformX, 0);
	pointCtx.lineTo(transformX, pointCanvas.height);
	pointCtx.stroke();

	pointCtx.lineWidth = 1;
	pointCtx.strokeStyle = "rgb(100, 100, 100)";

	pointCtx.beginPath();
	for (let i = transformX - scale * Math.floor(transformX / scale);i < pointCanvas.width;i += scale) {
		pointCtx.moveTo(i, 0);
		pointCtx.lineTo(i, pointCanvas.height);
	}
	for (let i = transformY - scale * Math.floor(transformY / scale);i < pointCanvas.height;i += scale) {
		pointCtx.moveTo(0, i);
		pointCtx.lineTo(pointCanvas.width, i);
	}
	pointCtx.stroke();
}

function drawClusters () {
	pointCtx.clearRect(0, 0, pointCanvas.width, pointCanvas.height);

	drawGrid();

	pointCtx.lineWidth = 10;
	pointCtx.lineCap = "round";
	for (let clas of classes) {
		pointCtx.fillStyle = "rgb(" + clas.color.reduce((acc, cur) => acc + ", " + cur) + ")"
		for (let object of clas.objects) {
			pointCtx.beginPath();
			pointCtx.arc(object.transformedX * scale + transformX, object.transformedY * scale + transformY, 3 * Math.log10(scale), 0, 2 * Math.PI);
			pointCtx.fill();
		}
	}
}

function kNeighbors () {
	neighborsCtx.clearRect(0, 0, neighborsCanvas.width, neighborsCanvas.height);

	let distances = [];

	for (let clas of classes) {
		for (let object of clas.objects) {
			distances.push({
				color: clas.color,
				x: object.transformedX * scale + transformX,
				y: object.transformedY * scale + transformY,
				distance: Math.sqrt(
					Math.pow((object.transformedX * scale + transformX) - mouseX, 2) + 
						Math.pow((object.transformedY * scale + transformY) - mouseY, 2)
				),
			});
		}
	}

	distances.sort((a, b) => a.distance - b.distance);
	distances.splice(nNeighborsSlider.value);

	for (object of distances) {
		neighborsCtx.strokeStyle = "rgb(" + object.color.reduce((acc, cur) => acc + ", " + cur) + ")"
		neighborsCtx.beginPath();
		neighborsCtx.moveTo(object.x, object.y);
		neighborsCtx.lineTo(mouseX, mouseY);
		neighborsCtx.stroke();
	}

	let mostCommonColor = Object.fromEntries(
		distances.map(
			obj => [
				obj.color, 
				[distances.filter(v => v.color === obj.color).length, 
					Math.min(...distances.filter(v => v.color === obj.color).map(v => v.distance))]
			]
		)
	);

	mostCommonColor = Object.keys(mostCommonColor).map(v => [v, mostCommonColor[v]]);

	mostCommonColor = mostCommonColor.sort((a, b) => b[1][0] - a[1][0]);

	mostCommonColor = mostCommonColor.shift()[0].split(',');

	neighborsCtx.fillStyle = "rgb(" + mostCommonColor.reduce((acc, cur) => acc + ", " + cur) + ")"
	neighborsCtx.beginPath();
	neighborsCtx.arc(mouseX, mouseY, 14, 0, 2 * Math.PI);
	neighborsCtx.fill();
}

function addStep () {
	stepContainer.appendChild(baseStep.cloneNode(true));
	transformObjects();
	drawClusters();
	if (mouseActive) {
		kNeighbors();
	}
}

function removeStep (a) {
	stepContainer.removeChild(a.parentElement);
	transformObjects();
	drawClusters();
	if (mouseActive) {
		kNeighbors();
	}
}

function unlockValue (a) {
	let valueInput = a.parentElement.getElementsByClassName("valueSelector")[0];
	let customInput = a.parentElement.getElementsByClassName("customValueInput")[0];
	if (a.value == "sub" || a.value == "div") {
		valueInput.disabled = false;
		unlockCustom(valueInput);
	} else {
		valueInput.disabled = true;
		customInput.disabled = true;
	}
}

function unlockCustom (a) {
	let customInput = a.parentElement.getElementsByClassName("customValueInput")[0];
	if (a.value == "cus") {
		customInput.disabled = false;
	} else {
		customInput.disabled = true;
	}
}

cSizeSlider.addEventListener("change", () => {buildClusters(); drawClusters();});
nClassesSlider.addEventListener("change", () => {buildClusters(); drawClusters();});
outDistanceSlider.addEventListener("change", () => {buildClusters(); drawClusters();});
generationTransformSelector.addEventListener("change", () => {buildClusters(); drawClusters();});
xRangeMaxInput.addEventListener("change", () => {buildClusters(); drawClusters();});
yRangeMaxInput.addEventListener("change", () => {buildClusters(); drawClusters();});

neighborsCanvas.addEventListener("mousemove", (e) => {
	mouseX = e.clientX;
	mouseY = e.clientY;
	mouseActive = true;
	kNeighbors();
	if (pan) {
		transformX += e.movementX;
		transformY += e.movementY;
		drawClusters();
		kNeighbors();
	}
});
neighborsCanvas.addEventListener("mouseleave", () => {neighborsCtx.clearRect(0, 0, neighborsCanvas.width, neighborsCanvas.height); mouseActive = false;});

buildClusters();

window.addEventListener("resize", () => {
	neighborsCanvas.width = neighborsCanvas.scrollWidth;
	neighborsCanvas.height = neighborsCanvas.scrollHeight;
	pointCanvas.width = pointCanvas.scrollWidth;
	pointCanvas.height = pointCanvas.scrollHeight;

	drawClusters();
});
window.addEventListener("load", () => {
	neighborsCanvas.width = neighborsCanvas.scrollWidth;
	neighborsCanvas.height = neighborsCanvas.scrollHeight;
	pointCanvas.width = pointCanvas.scrollWidth;
	pointCanvas.height = pointCanvas.scrollHeight;

	transformX = pointCanvas.width / 2;
	transformY = pointCanvas.height / 2;

	drawClusters();
});

window.addEventListener("keypress", (e) => {
	if (document.activeElement.type != "number") {
		if (e.key == " ") {
			preprocessCheckbox.checked = !preprocessCheckbox.checked;
		} else if (e.key >= "0" && e.key <= "9") {
			nNeighborsSlider.value = (e.key - 10) % 10 + 10;
		} else if (e.key == "r") {
			buildClusters();
			drawClusters();
		}
	}
	transformObjects();
	drawClusters();
	if (mouseActive) {
		kNeighbors();
	}
});

document.addEventListener("mousedown", function(e) {
	if ((e.buttons & 2) != 0) {
		scale = 100;
		transformX = 600;
		transformY = 400;
		drawClusters();
		if (mouseActive) {
			kNeighbors();
		}
	} else if ((e.buttons & 1) != 0) {
		pan = true;
	}
});

document.addEventListener("mouseup", function(e) {
	pan = false;
});

document.addEventListener("wheel", function(e) {
	let prevZoom = scale;
	scale -= (e.deltaY / 500) * scale;
	scale = Math.max(10, scale);
	scale = Math.min(10000, scale);

	transformX += (1 - scale / prevZoom) * (e.clientX - transformX);
	transformY += (1 - scale / prevZoom) * (e.clientY - transformY);

	drawClusters();
	if (mouseActive) {
		kNeighbors();
	}
});

document.addEventListener("contextmenu", e => e.preventDefault());

preprocessCheckbox.addEventListener("input", (e) => {
	transformObjects();
	drawClusters();
	if (mouseActive) {
		kNeighbors();
	}
});

for (let element of document.getElementsByClassName("stepInput")) {
	element.addEventListener("input", (e) => {
		transformObjects();
		drawClusters();
		if (mouseActive) {
			kNeighbors();
		}
	});
}

for (let element of document.getElementsByClassName("stepInput")) {
	element.addEventListener("change", (e) => {
	});
}
