import * from "marching.js";

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

var SIZE = canvas.width;
var SPACING = Math.floor(SIZE / (DIMENSION - 1));

var hover = null;

var cleanMode = false;

var pixelMode = false;

function render() {
	ctx.clearRect(0, 0, SIZE, SIZE);

	ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";

	ctx.font = `${Math.floor(SPACING / 5)}px monospace`;

	if (!cleanMode) {

		ctx.beginPath();
		for (var x = 1; x < DIMENSION - 1; x++) {
			ctx.moveTo(x * SPACING - 0.5, 0);
			ctx.lineTo(x * SPACING - 0.5, SIZE);
		};
		ctx.stroke();

		ctx.beginPath();
		for (var y = 1; y < DIMENSION - 1; y++) {
			ctx.moveTo(0, y * SPACING - 0.5);
			ctx.lineTo(SIZE, y * SPACING - 0.5);
		};
		ctx.stroke();

		for (var i = 0; i < state.length; i++) {
			if (state[i]) {
				var x = i % DIMENSION;
				var y = Math.floor(i / DIMENSION);

				if (pixelMode) {
					ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
					ctx.fillRect((x - 0.5) * SPACING, (y - 0.5) * SPACING, SPACING, SPACING);
				} else {
					ctx.fillStyle = "black";
					var circle = new Path2D();
					circle.arc(x * SPACING, y * SPACING, SPACING / 15, 0, 2 * Math.PI);

					ctx.fill(circle);
				}
				
			}
		}
	}

	// hover
	if (!cleanMode && hover !== null) {
		var x = hover % DIMENSION;
		var y = Math.floor(hover / DIMENSION);
		var circle = new Path2D();
		circle.arc(x * SPACING, y * SPACING, SPACING / 15, 0, 2 * Math.PI);
		if (state[hover]) {
			ctx.fillStyle = "red";
		} else {
			ctx.fillStyle = "green";
		}
		ctx.fill(circle);
	}

	ctx.fillStyle = "rgba(0, 0, 0, 1.0)";

	for (var i = 0; i < edges.length; i++) {
		var pos1 = edges[i][0];
		var pos2 = edges[i][1];
		var edge = new Path2D();

		var x1 = (pos1[0] * SPACING);
		var y1 = (pos1[1] * SPACING);
		var x2 = (pos2[0] * SPACING);
		var y2 = (pos2[1] * SPACING);


		var midX = Math.floor((x1 + x2) / 2);
		var midY = Math.floor((y1 + y2) / 2);

		var normal = calculateNormal(edges[i]);

		var normX = midX + normal[0] / 2 * SPACING;
		var normY = midY + normal[1] / 2 * SPACING;

		ctx.strokeStyle = "black";

		edge.moveTo(x1, y1);
		edge.lineTo(x2, y2);
		ctx.stroke(edge);

		// draw normal
		if (!cleanMode) {
			ctx.strokeStyle = "blue";
			edge = new Path2D();
			edge.moveTo(midX, midY);
			edge.lineTo(normX, normY);
			ctx.stroke(edge);
		}

		// draw vertex
		if (!cleanMode) {
			var circle = new Path2D();
			circle.arc(x1 * SPACING, y1 * SPACING, SPACING / 20, 0, 2 * Math.PI);
			ctx.fill(circle);
		}
	}

	// draw counts
	if (!cleanMode) {
		for (var i = 0; i < counts.length; i++) {
			if (counts[i]) {
				var x = i % DIMENSION;
				var y = Math.floor(i / DIMENSION);

				x += 0.1;
				y += 0.2;

				ctx.fillText(counts[i], x * SPACING, y * SPACING);
			}
		}
	}
}


// start
render();

function update() {
	var mesher = update.dual ? dual_march : march;

	vertices = [];
	edges = [];
	counts.fill(0);

	mesher();
	render();
}
update.dual = false;

function flipPixel(idx, on) {
	if (on !== undefined && state[idx] == on) {
		return;
	}

	state[idx] = 1 - state[idx];
	update();
}

document.addEventListener('keyup', function (e) {
	if (e.keyCode === 32) {
		update.dual = !update.dual;

		update();
	}

	if (e.keyCode === 67) {
		cleanMode = !cleanMode;
	}

	if (e.keyCode === 80) {
		pixelMode = !pixelMode;
	}

	render();
});

var lastIdx = null;

var deselecting = false;

document.addEventListener('mouseup', function (e) {
	lastIdx = null;
	deselecting = false;
});

function handleMouse(e, click) {
	// var forceOn = click ? undefined : !e.shiftKey;
	var gridX = Math.round(e.offsetX / SPACING);
	var gridY = Math.round(e.offsetY / SPACING);

	if (gridX < 1 || gridX > DIMENSION - 2 || gridY < 1 || gridY > DIMENSION - 2) {
		if (hover !== null) {
			hover = null;
			render();
		}
		return;
	}

	var idx = gridY * DIMENSION + gridX;

	if (e.buttons) {
		hover = null;
		if (idx !== lastIdx) {
			lastIdx = idx;

			if (click && state[idx]) {
				deselecting = true;
			}

			flipPixel(idx, !deselecting);
		}
	} else {
		hover = idx;
		render();
	}
}

canvas.addEventListener('mousemove', handleMouse);
canvas.addEventListener('mousedown', (e) => {
	handleMouse(e, true);
});
