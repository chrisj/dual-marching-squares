var DIMENSION = 12;

var state = new Uint8Array(DIMENSION * DIMENSION);
var counts = new Uint8Array(state.length);

var edges = [];

var X_OFF = 1;
var Y_OFF = DIMENSION;






// marching squares



var VERT_OFFSET = [
	[0.5, 0.0],
	[1.0, 0.5],
	[0.5, 1.0],
	[0.0, 0.5]
];

var MC_TABLE = [
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
	[]
];

MC_TABLE = MC_TABLE.map(edges => edges.map(edge => edge.map(vert => VERT_OFFSET[vert])));


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

			var edgeOffsets = deepCopy(MC_TABLE[counts[i]]);

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









// dual marching squares


// dual marching squares table
//
// for each case, pos is the location of the vertex (0 center, 1 to 4 are corners CW)
// edge is the cell edge that the surface edge should cross.
var DM_TABLE = (() => {

	let EPS = 0.25;

	// vertex positions
	let DM_VERT_POS = [
		[0.5, 0.5],
		[EPS, EPS],
		[1 - EPS, EPS],
		[1 - EPS, 1 - EPS],
		[EPS, 1 - EPS],
	];

	// offset to neighor for each each (starting top left CW)
	let DM_EDGES = [
		-Y_OFF,
		X_OFF,
		Y_OFF,
		-X_OFF,
	];

	let temp = [
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
		[]
	];
	temp = temp.map(vs => vs.map(v => {
		v.pos = DM_VERT_POS[v.pos]
		v.edge = DM_EDGES[v.edge];
		return v;
	}));

	return temp;
})();

function dual_march() {
	for (var i = 0; i < state.length; i++) {
		if (state[i]) {
			counts[i] |= 1;
			counts[i - X_OFF] |= 2;
			counts[i - Y_OFF] |= 4;
			counts[i - X_OFF - Y_OFF] |= 8;
		}
	}

	for (var i = 0; i < state.length; i++) {
		if (counts[i] !== 0 && counts[i] !== 15) {
			var verts = DM_TABLE[counts[i]];

			for (let vert of verts) {
				let neighbor = i + vert.edge;
				let neighborVerts = DM_TABLE[counts[neighbor]];

				// need to choose the right vert for the 2 vert cases
				// needs improvement, especially for 3d
				let neighborVert = neighborVerts[vert.edge < 0 ? 0 : neighborVerts.length - 1];
				
				let position = vert.pos;
				let x = i % DIMENSION;
				let y = Math.floor(i / DIMENSION);

				let position2 = neighborVert.pos;
				let neighborX = neighbor % DIMENSION;
				let neighborY = Math.floor(neighbor / DIMENSION);

				edges.push([
					[position[0] + x, position[1] + y],
					[position2[0] + neighborX, position2[1] + neighborY],
				]);
			}
		}
	}
}
