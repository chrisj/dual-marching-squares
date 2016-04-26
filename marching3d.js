var DIMENSION = 4;

var state = new Uint8Array(DIMENSION * DIMENSION * DIMENSION);

var vertices = [];

state[1 + 1 * DIMENSION + 1 * DIMENSION * DIMENSION] = 1;


var counts = new Uint8Array(state.length);

var edges = [];

var X_OFF = 1;
var Y_OFF = DIMENSION;
var Z_OFF = DIMENSION * DIMENSION;


function idxToXYZ(i) {
  var z = Math.floor(i / Z_OFF);
  var y = Math.floor((i - z * Z_OFF) / Y_OFF);
  var x = i % Y_OFF;

  return [x, y, z];
}


var EPS = 0.25;


var VERT_TABLE = [
	null,
	[EPS, EPS, EPS],
	[1-EPS, EPS, EPS]
];


// var DM_TABLE = [
// 	[],

// ];


function dual_march() {
	vertices = [];
	counts.fill(0);

	for (var i = 0; i < state.length; i++) {
		if (state[i]) {
			counts[i                        ] |= 1;
			counts[i - X_OFF                ] |= 2;
			counts[i         - Y_OFF        ] |= 16;
			counts[i - X_OFF - Y_OFF        ] |= 32;
			counts[i                 - Z_OFF] |= 8;
			counts[i - X_OFF         - Z_OFF] |= 4;
			counts[i         - Y_OFF - Z_OFF] |= 128;
			counts[i - X_OFF - Y_OFF - Z_OFF] |= 64;
		}
	}

	for (var i = 0; i < state.length; i++) {
		if (counts[i] !== 0 && counts[i] !== 255) {

			if (counts[i] < VERT_TABLE.length) {
				var [x, y, z] = idxToXYZ(i);


				var [ox, oy, oz] = VERT_TABLE[counts[i]];

				vertices.push([
					x + ox,
					y + oy,
					z + oz
				]);
			}
			

			var verts = [];//DM_TABLE[counts[i]];

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