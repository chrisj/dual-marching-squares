// var DIMENSION = 12;

var X_DIM = 45;
var Y_DIM = 5;

var state = new Uint8Array(X_DIM * Y_DIM);

var counts = new Uint8Array(state.length);

var stateSmooth = new Float32Array(state.length);

var edges = [];

var X_OFF = 1;
var Y_OFF = X_DIM;


var stateEdge = new Int8Array(state.length);






// marching squares



var VERT_OFFSET = [
	[0, X_OFF],
	[X_OFF, X_OFF+Y_OFF],
	[Y_OFF, Y_OFF+X_OFF],
	[0, Y_OFF]
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
			var x = i % X_DIM;
			var y = Math.floor(i / X_DIM);

			var edgeOffsets = MC_TABLE[counts[i]];

			for (let edgeOffset of edgeOffsets) {
				let [[first, second], [third, fourth]] = edgeOffset;
				first += i;
				second += i;
				third += i;
				fourth += i;

				let x1 = first % X_DIM;
				let y1 = stateSmooth[first];

				let x2 = second % X_DIM;
				let y2 = stateSmooth[second];

				let x3 = third % X_DIM;
				let y3 = stateSmooth[third];

				let x4 = fourth % X_DIM;
				let y4 = stateSmooth[fourth];

				edges.push([
					[
						(x1+x2) / 2, (y1+y2) / 2
					],
					[
						(x3+x4) / 2, (y3+y4) / 2
					]
				]);
			}
		}
	}
}


var DISABLE_SMOOTH = false;


function zsmooth() {
	if (DISABLE_SMOOTH) {
		for (var i = 0; i < state.length; i++) {
			var y = Math.floor(i / X_DIM);
			stateSmooth[i] = y;
		}

		return;
	}

	stateSmooth.fill(0);

	// stateEdge.fill(0);

	var stateSmoothCount = new Float32Array(state.length);

	// for (var i = 0; i < state.length; i++) {
	// 	if (state[i]) {
	// 		var selfCount = 0;
	// 		var neighbor;

	// 		neighbor = stateEdge[i - X_OFF] <<= 1;
	// 		selfCount += neighbor >>> 31;
	// 		neighbor = stateEdge[i - Y_OFF] <<= 1;
	// 		selfCount += neighbor >>> 31;

	// 		stateEdge[i] = -1 << selfCount;
	// 	}
	// }

	// for (var i = 0; i < state.length; i++) {
	// 	if (stateEdge[i] < 0){//} && stateEdge[i] > -Math.pow(2, 4)) {
	// 		stateEdge[i] = 1;
	// 	} else {
	// 		stateEdge[i] = 0;
	// 	}
	// }

	for (var i = 0; i < state.length; i++) {
		if (state[i]) {
			var x = i % X_DIM;
			var y = Math.floor(i / X_DIM);

			smooth(i, y, 1);
			smooth(i - X_OFF, y, 1);
			smooth(i + X_OFF, y, 1);
			smooth(i - Y_OFF, y, 1);
			smooth(i + Y_OFF, y, 1);

			smooth(i - X_OFF - Y_OFF, y, Math.sqrt(2));
			smooth(i + X_OFF - Y_OFF, y, Math.sqrt(2));
			smooth(i - X_OFF + Y_OFF, y, Math.sqrt(2));
			smooth(i + X_OFF + Y_OFF, y, Math.sqrt(2));

			smooth(i - X_OFF * 2, y, 2);
			smooth(i + X_OFF * 2, y, 2);

			smooth(i - X_OFF * 2 - Y_OFF, y, Math.sqrt(5));
			smooth(i + X_OFF * 2 - Y_OFF, y, Math.sqrt(5));
			smooth(i - X_OFF * 2 + Y_OFF, y, Math.sqrt(5));
			smooth(i + X_OFF * 2 + Y_OFF, y, Math.sqrt(5));
		}
	}


	

	function smooth(i, y, dist) {
		if (state[i]) {
			if (i === 67) {
				console.log('smooth', y);
			}

			stateSmooth[i] += y / dist;
			stateSmoothCount[i] += 1 / dist;
		}
	}

	for (var i = 0; i < state.length; i++) {
		if (stateSmoothCount[i] > 0) {
			var y = Math.floor(i / X_DIM);
			stateSmooth[i] = (y + stateSmooth[i] / stateSmoothCount[i]) / 2;
		
			if (i === 67) {
				console.log(stateSmooth[i]);
			}

		} else {
			var y = Math.floor(i / X_DIM);
			stateSmooth[i] = y;
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
				let x = i % X_DIM;
				let y = Math.floor(i / X_DIM);

				let position2 = neighborVert.pos;
				let neighborX = neighbor % X_DIM;
				let neighborY = Math.floor(neighbor / X_DIM);

				edges.push([
					[position[0] + x, position[1] + y],
					[position2[0] + neighborX, position2[1] + neighborY],
				]);
			}
		}
	}
}
