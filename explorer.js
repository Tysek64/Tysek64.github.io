// HTML elements
let nClassesSlider = document.getElementById("nClasses");
let cSizeSlider = document.getElementById("cSize");
let nNeighborsSlider = document.getElementById("nNeighbors");
let xRangeMinInput = document.getElementById("xRangeMin");
let xRangeMaxInput = document.getElementById("xRangeMax");
let yRangeMinInput = document.getElementById("yRangeMin");
let yRangeMaxInput = document.getElementById("yRangeMax");
let pointCanvas = document.getElementById("mainCanvas");
let neighborsCanvas = document.getElementById("subCanvas");

// contexts
let pointCtx = pointCanvas.getContext("2d");
let neighborsCtx = neighborsCanvas.getContext("2d");

// important globals
let classes = [];

// view parameters
let pan = false;
let transformX = 600;
let transformY = 400;
let scale = 100;
let mouseX = 0;
let mouseY = 0;

function buildClusters () {
	classes = Array.from({length: nClassesSlider.value}, () => ({
		x: Math.random() * (Number(xRangeMaxInput.value) - Number(xRangeMinInput.value)) + Number(xRangeMinInput.value),
		y: Math.random() * (Number(yRangeMaxInput.value) - Number(yRangeMinInput.value)) - yRangeMaxInput.value,
		color: Array.from({length: 3}, () => Math.floor(Math.random() * 256)),
		objects: buildObjects(),
	}));
}

function buildObjects () {
	let retVal = Array.from({length: 10}, () => ({
		theta: Math.random() * 2 * Math.PI,
		r: Math.random() * 0.1 * cSizeSlider.value,
	}));

	for (let object of retVal) {
		object.x = object.r * Math.cos(object.theta);
		object.y = object.r * Math.sin(object.theta);
	}

	return retVal;
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
		pointCtx.strokeStyle = "rgb(" + clas.color.reduce((acc, cur) => acc + ", " + cur) + ")"
		for (let object of clas.objects) {
			pointCtx.beginPath();
			pointCtx.arc(clas.x * scale + transformX, clas.y * scale + transformY, object.r * scale, object.theta, object.theta + 0.0001);
			pointCtx.stroke();
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
				x: clas.x * scale + transformX + (object.x * scale),
				y: clas.y * scale + transformY + (object.y * scale),
				distance: Math.sqrt(
					Math.pow(clas.x * scale + transformX + (object.x * scale) - mouseX, 2) + 
					Math.pow(clas.y * scale + transformY + (object.y * scale) - mouseY, 2)
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
xRangeMinInput.addEventListener("change", () => {buildClusters(); drawClusters();});
xRangeMaxInput.addEventListener("change", () => {buildClusters(); drawClusters();});
yRangeMinInput.addEventListener("change", () => {buildClusters(); drawClusters();});
yRangeMaxInput.addEventListener("change", () => {buildClusters(); drawClusters();});

xRangeMinInput.addEventListener("input", () => {
	if (Number(xRangeMinInput.value) >= Number(xRangeMaxInput.value)) {
		xRangeMinInput.value = xRangeMaxInput.value - 1;
	}
});

xRangeMaxInput.addEventListener("input", () => {
	if (Number(xRangeMaxInput.value) <= Number(xRangeMinInput.value)) {
		xRangeMaxInput.value = Number(xRangeMinInput.value) + 1;
	}
});

yRangeMinInput.addEventListener("input", () => {
	if (Number(yRangeMinInput.value) >= Number(yRangeMaxInput.value)) {
		yRangeMinInput.value = yRangeMaxInput.value - 1;
	}
});

yRangeMaxInput.addEventListener("input", () => {
	if (Number(yRangeMaxInput.value) <= Number(yRangeMinInput.value)) {
		yRangeMaxInput.value = Number(yRangeMinInput.value) + 1;
	}
});

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
