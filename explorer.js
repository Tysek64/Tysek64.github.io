let nClassesSlider = document.getElementById("nClasses");
let nNeighborsSlider = document.getElementById("nNeighbors");
let pointCanvas = document.getElementById("mainCanvas");
let neighborsCanvas = document.getElementById("subCanvas");

let pointCtx = pointCanvas.getContext("2d");
let neighborsCtx = neighborsCanvas.getContext("2d");

pointCtx.strokeStyle = "black";
pointCtx.lineWidth = 10;
pointCtx.lineCap = "round";

let classes = [];

function buildClasses () {
	classes = Array.from({length: nClassesSlider.value}, () => ({
		x: Math.random(),
		y: Math.random(),
		objects: Array.from({length: 10}, () => ({
			theta: Math.random() * 2 * Math.PI,
			r: Math.random(),
		})),
		color: Array.from({length: 3}, () => Math.floor(Math.random() * 256)),
	}));
}

function drawClasses () {
	pointCtx.clearRect(0, 0, pointCanvas.width, pointCanvas.height);
	for (let clas of classes) {
		pointCtx.strokeStyle = "rgb(" + clas.color.reduce((acc, cur) => acc + ", " + cur) + ")"
		for (let object of clas.objects) {
			pointCtx.beginPath();
			pointCtx.arc(clas.x * pointCanvas.width, clas.y * pointCanvas.height, object.r * pointCanvas.width * 0.1, object.theta, object.theta + 0.0001);
			pointCtx.stroke();
		}
	}
}

function kNeighbors (x, y) {
	neighborsCtx.clearRect(0, 0, neighborsCanvas.width, neighborsCanvas.height);

	let distances = [];

	for (let clas of classes) {
		for (let object of clas.objects) {
			distances.push({
				color: clas.color,
				x: clas.x * pointCanvas.width + (object.r * pointCanvas.width * 0.1 * Math.cos(object.theta)),
				y: clas.y * pointCanvas.height + (object.r * pointCanvas.width * 0.1 * Math.sin(object.theta)),
				distance: Math.sqrt(
					Math.pow(x - (clas.x * pointCanvas.width + (object.r * pointCanvas.width * 0.1 * Math.cos(object.theta))), 2) + 
					Math.pow(y - (clas.y * pointCanvas.height + (object.r * pointCanvas.width * 0.1 * Math.sin(object.theta))), 2)
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
		neighborsCtx.lineTo(x, y);
		neighborsCtx.stroke();
	}

	let mostCommonColor = distances.sort((a,b) =>
		distances.filter(v => v.color===a.color).length - distances.filter(v => v.color===b.color).length
	).pop().color;

	neighborsCtx.fillStyle = "rgb(" + mostCommonColor.reduce((acc, cur) => acc + ", " + cur) + ")"
	neighborsCtx.beginPath();
	neighborsCtx.arc(x, y, 10, 0, 2 * Math.PI);
	neighborsCtx.fill();
}

nClassesSlider.addEventListener("change", () => {buildClasses(); drawClasses();});
neighborsCanvas.addEventListener("mousemove", (e) => kNeighbors(e.clientX, e.clientY));
neighborsCanvas.addEventListener("mouseleave", () => {neighborsCtx.clearRect(0, 0, neighborsCanvas.width, neighborsCanvas.height);});

buildClasses();
drawClasses();
