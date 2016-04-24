var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

var SIZE = canvas.width;
var DIMENSION = 10;
var SPACING = Math.floor(SIZE / (DIMENSION - 1));

var state = new Uint8Array(DIMENSION * DIMENSION);
var counts = new Uint8Array(state.length);

var edges = [];

var vertices = [];


var X_OFF = 1;
var Y_OFF = DIMENSION;

function render() {
	ctx.clearRect(0, 0, SIZE, SIZE);

	ctx.strokeStyle = "black";

	ctx.font = "10px monospace";

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
			var circle = new Path2D();
			circle.arc(x * SPACING, y * SPACING, 5, 0, 2 * Math.PI);
			ctx.fill(circle);
		}
	}

	for (var i = 0; i < edges.length; i++) {
		var pos1 = edges[i][0];
		var pos2 = edges[i][1];
		var edge = new Path2D();

		var x1 = Math.floor(pos1[0] * SPACING);
		var y1 = Math.floor(pos1[1] * SPACING);
		var x2 = Math.floor(pos2[0] * SPACING);
		var y2 = Math.floor(pos2[1] * SPACING);


		var midX = Math.floor((x1 + x2) / 2);
		var midY = Math.floor((y1 + y2) / 2);

		var normal = calculateNormal(edges[i]);

		var normX = midX + normal[0] / 2 * SPACING;
		var normY = midY + normal[1] / 2 * SPACING;

		ctx.strokeStyle = "black";

		edge.moveTo(x1, y1);
		edge.lineTo(x2, y2);
		ctx.stroke(edge);

		ctx.strokeStyle = "blue";

		edge = new Path2D();

		edge.moveTo(midX, midY);
		edge.lineTo(normX, normY);
		ctx.stroke(edge);
	}

	for (var i = 0; i < counts.length; i++) {

		if (counts[i]) {
			var x = i % DIMENSION;
			var y = Math.floor(i / DIMENSION);

			x += 0.1;
			y += 0.2;

			ctx.fillText(counts[i], x * SPACING, y * SPACING);
		}
	}


	for (var i = 0; i < vertices.length; i++) {
		var vertex = vertices[i];

		var circle = new Path2D();
		circle.arc(vertex[0] * SPACING, vertex[1] * SPACING, 3, 0, 2 * Math.PI);
		ctx.fill(circle);
	}
}

var V = [
	[0.5, 0.0],
	[1.0, 0.5],
	[0.5, 1.0],
	[0.0, 0.5]
];

var table = [
	[],
	[[0, 3]],
	[[1, 0]],
	[[1, 3]],
	[[3, 2]],
	[[0, 2]],
	[[1, 0], [3, 2]], // 2 and 4
	[[1, 2]],
	[[2, 1]],
	[[0, 3], [2, 1]], // 1 and 8
	[[2, 0]],
	[[2, 3]],
	[[3, 1]],
	[[0, 1]],
	[[3, 0]],
];

table = table.map(edges => edges.map(edge => edge.map(vert => V[vert])));


function deepCopy(array) {
	return JSON.parse(JSON.stringify(array));
}

function calculateNormal(edge) {
	var dx = edge[1][0] - edge[0][0];
	var dy = edge[1][1] - edge[0][1];

	var length = Math.sqrt(dx * dx + dy * dy);

	return [dy / length, -dx / length];
}


function march() {
	for (var i = 0; i < state.length; i++) {
		if (state[i]) {
			var x = i % DIMENSION;
			var y = Math.floor(i / DIMENSION);

			counts[i] |= 1;
			counts[i - X_OFF] |= 2;
			counts[i - Y_OFF] |= 4;
			counts[i - X_OFF - Y_OFF] |= 8;
		}
	}

	for (var i = 0; i < state.length; i++) {
		if (counts[i] > 0 && counts[i] < 15) {
			var x = i % DIMENSION;
			var y = Math.floor(i / DIMENSION);

			if (counts[i] >= table.length || !table[counts[i]]) {
				console.log('not ready', counts[i]);
				continue;
			}

			var edgeOffsets = deepCopy(table[counts[i]]);

			for (let edgeOffset of edgeOffsets) {
				edgeOffset[0][0] += x;
				edgeOffset[1][0] += x;
				edgeOffset[0][1] += y;
				edgeOffset[1][1] += y;

				edges.push(edgeOffset);
			}
		}
	}
}

var DM_VERT_POS = [
	[0.5, 0.5],
	[0.25, 0.25],
	[0.75, 0.25],
	[0.75, 0.75],
	[0.25, 0.75],
];

// var DM_VERTS = [
// 	[0],
// 	[0.25, 0.25],
// 	[0.75, 0.25],
// 	[0.75, 0.75],
// 	[0.25, 0.75],
// ];

// offset to neighor for each each (starting top left CW)
var DM_EDGES = [
	-Y_OFF,
	X_OFF,
	Y_OFF,
	-X_OFF,
];


var table2 = [
	[],
	[{ pos: 1, edge: 3}],
	[{ pos: 2, edge: 0}],
	[{ pos: 0, edge: 3}],
	[{ pos: 4, edge: 2}],
	[{ pos: 0, edge: 2}],
	[{ pos: 2, edge: 0}, { pos: 4, edge: 2}], // 2 and 4
	[{ pos: 3, edge: 2}],
	[{ pos: 3, edge: 1}],
	[{ pos: 3, edge: 1}, { pos: 1, edge: 3}], // 1 and 8
	[{ pos: 0, edge: 0}],
	[{ pos: 4, edge: 3}],
	[{ pos: 0, edge: 1}],
	[{ pos: 2, edge: 1}],
	[{ pos: 1, edge: 0}],
];
table2 = table2.map(vs => vs.map(v => {
	v.pos = DM_VERT_POS[v.pos]
	v.edge = DM_EDGES[v.edge];
	return v;
}));

function dual_march() {
	for (var i = 0; i < state.length; i++) {
		if (state[i]) {
			var x = i % DIMENSION;
			var y = Math.floor(i / DIMENSION);

			counts[i] |= 1;
			counts[i - X_OFF] |= 2;
			counts[i - Y_OFF] |= 4;
			counts[i - X_OFF - Y_OFF] |= 8;
		}
	}

	for (var i = 0; i < state.length; i++) {
		if (counts[i] > 0 && counts[i] < 15) {
			var x = i % DIMENSION;
			var y = Math.floor(i / DIMENSION);

			if (counts[i] >= table2.length || !table2[counts[i]]) {
				console.log('not ready', counts[i]);
				continue;
			}

			var verts = table2[counts[i]];

			for (let vert of verts) {
				let position = vert.pos;
				vertices.push([position[0] + x, position[1] + y]);

				let neighbor = i + vert.edge;

				let neighborVerts = table2[counts[neighbor]];

				if (!neighborVerts) {
					console.log(x, y, counts[i]);
				}

				var nx = neighbor % DIMENSION;
				var ny = Math.floor(neighbor / DIMENSION);

				let first = neighborVerts[vert.edge < 0 ? 0 : neighborVerts.length - 1];

				if (!first) {
					console.log(x, y, nx, ny);
				}

				let position2 = first.pos;

				edges.push([
					[position[0] + x, position[1] + y],
					[position2[0] + nx, position2[1] + ny],
				]);
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

canvas.addEventListener('click', function (e) {
	// console.log(e);

	var gridX = Math.round(e.clientX / SPACING);
	var gridY = Math.round(e.clientY / SPACING);

	var idx = gridY * DIMENSION + gridX;

	state[idx] = 1 - state[idx];

	update();
});

document.addEventListener('keyup', function (e) {
	update.dual = !update.dual;
	update();
});

