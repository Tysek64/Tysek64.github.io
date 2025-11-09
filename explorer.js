// HTML elements
let nClassesSlider = document.getElementById("nClasses");
let cSizeSlider = document.getElementById("cSize");
let nNeighborsSlider = document.getElementById("nNeighbors");
let xRangeMaxInput = document.getElementById("xRangeMax");
let yRangeMaxInput = document.getElementById("yRangeMax");
let pointCanvas = document.getElementById("mainCanvas");
let neighborsCanvas = document.getElementById("subCanvas");

let preprocessCheckbox = document.getElementById("preprocessCheckbox");
let stepContainer = document.getElementById("stepContainer");

// contexts
let pointCtx = pointCanvas.getContext("2d");
let neighborsCtx = neighborsCanvas.getContext("2d");

// important globals
let classes = [];
let colors = [];

// view parameters
let pan = false;
let transformX = 600;
let transformY = 400;
let scale = 100;
let mouseX = 0;
let mouseY = 0;

function acceptColor (newColor) {
	let results = [];
	for (let color of colors) {
		results.push(Math.abs(color[0] - newColor[0]) + Math.abs(color[1] - newColor[1]) + Math.abs(color[2] - newColor[2]));
	}
	return Math.min(...results) > 150;
}

function generateColor () {
	let result = [0, 0, 0];

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
	} while (!acceptColor(result));

	colors.push(result);

	return result;
}

function buildClusters () {
	classes = Array.from({length: nClassesSlider.value}, () => ({
		x: Math.random() * (2 * Number(xRangeMaxInput.value)) - xRangeMaxInput.value,
		y: Math.random() * (2 * Number(yRangeMaxInput.value)) - yRangeMaxInput.value,
		color: generateColor(),
		objects: buildObjects(),
	}));

	transformObjects();
}

function buildObjects () {
	let retVal = Array.from({length: 10}, () => ({
		theta: Math.random() * 2 * Math.PI,
		r: (Math.random() < 0.95) ? (Math.random() * 0.1 * cSizeSlider.value) : (Math.random() * 0.5 * cSizeSlider.value + 0.5 * cSizeSlider.value),
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
			object.transformedX = object.x + clas.x;
			object.transformedY = object.y + clas.y;

			xPositions.push(object.transformedX);
			yPositions.push(object.transformedY);
		}
	}

	if (preprocessCheckbox.checked) {
		for (let step of stepContainer.children) {
			let currentMinX = Math.min(...xPositions);
			let currentMaxX = Math.max(...xPositions);

			let currentMinY = Math.min(...yPositions);
			let currentMaxY = Math.max(...yPositions);

			xPositions = [];
			yPositions = [];

			switch (step.children[0].innerHTML) {
				case "X scale: ":
					let targetMinX = Number(step.children[1].value);
					let targetMaxX = Number(step.children[2].value);

					for (let clas of classes) {
						for (let object of clas.objects) {
							object.transformedX *= ((targetMaxX - targetMinX) / (currentMaxX - currentMinX));
							object.transformedX += targetMaxX - currentMaxX * ((targetMaxX - targetMinX) / (currentMaxX - currentMinX));

							xPositions.push(object.transformedX);
							yPositions.push(object.transformedY);
						}
					}
					break;
				case "Y scale: ":
					let targetMinY = -1 * Number(step.children[2].value);
					let targetMaxY = -1 * Number(step.children[1].value);

					for (let clas of classes) {
						for (let object of clas.objects) {
							object.transformedY *= ((targetMaxY - targetMinY) / (currentMaxY - currentMinY));
							object.transformedY += targetMaxY - currentMaxY * ((targetMaxY - targetMinY) / (currentMaxY - currentMinY));

							xPositions.push(object.transformedX);
							yPositions.push(object.transformedY);
						}
					}
					break;
				default:
					break;
			}
		}
	}
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
			pointCtx.arc(object.transformedX * scale + transformX, object.transformedY * scale + transformY, 5, 0, 2 * Math.PI);
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

	let mostCommonColor = distances.sort((a,b) =>
		distances.filter(v => v.color===a.color).length - distances.filter(v => v.color===b.color).length
	).pop().color;

	neighborsCtx.fillStyle = "rgb(" + mostCommonColor.reduce((acc, cur) => acc + ", " + cur) + ")"
	neighborsCtx.beginPath();
	neighborsCtx.arc(mouseX, mouseY, 10, 0, 2 * Math.PI);
	neighborsCtx.fill();
}

cSizeSlider.addEventListener("change", () => {buildClusters(); drawClusters();});
nClassesSlider.addEventListener("change", () => {buildClusters(); drawClusters();});
xRangeMaxInput.addEventListener("change", () => {buildClusters(); drawClusters();});
yRangeMaxInput.addEventListener("change", () => {buildClusters(); drawClusters();});

neighborsCanvas.addEventListener("mousemove", (e) => {
	mouseX = e.clientX;
	mouseY = e.clientY;
	kNeighbors();
	if (pan) {
		transformX += e.movementX;
		transformY += e.movementY;
		drawClusters();
		kNeighbors();
	}
});
neighborsCanvas.addEventListener("mouseleave", () => {neighborsCtx.clearRect(0, 0, neighborsCanvas.width, neighborsCanvas.height);});

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
	nNeighborsSlider.value = (e.key - 10) % 10 + 10;
	if (e.key == " ") {
		preprocessCheckbox.checked = !preprocessCheckbox.checked;
	}
	transformObjects();
	drawClusters();
	kNeighbors();
});

document.addEventListener("mousedown", function(e) {
	if ((e.buttons & 2) != 0) {
		scale = 100;
		transformX = 600;
		transformY = 400;
		drawClusters();
		kNeighbors();
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
	scale = Math.min(1000, scale);

	transformX += (1 - scale / prevZoom) * (e.clientX - transformX);
	transformY += (1 - scale / prevZoom) * (e.clientY - transformY);

	drawClusters();
	kNeighbors();
});

document.addEventListener("contextmenu", e => e.preventDefault());

preprocessCheckbox.addEventListener("input", (e) => {
	transformObjects();
	drawClusters();
	kNeighbors();
});

for (let element of document.getElementsByClassName("stepInput")) {
	element.addEventListener("input", (e) => {
		transformObjects();
		drawClusters();
		kNeighbors();
	});
}
