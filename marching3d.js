var DIMENSION = 4;

var state = new Uint8Array(DIMENSION * DIMENSION * DIMENSION);

var vertices = [];

var triangles = [];

var vertIdx = new Uint8Array(DIMENSION * DIMENSION * DIMENSION);
// for each cell that has vertices, set somearray to the current index of the vertex list
// then add the vertices, that way, we can look up vertices for each cell, it is a lot of memory though




state[1 + 1 * DIMENSION + 1 * DIMENSION * DIMENSION] = 1;
state[2 + 1 * DIMENSION + 1 * DIMENSION * DIMENSION] = 1;


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

var EDGE_SOMETHING = [
	[-Y_OFF,-Z_OFF-Y_OFF,-Z_OFF],
	null,
	null,
	[-X_OFF, -Y_OFF-X_OFF,-Y_OFF],
	null,
	null,
	null,
	null,
	[-Z_OFF, -X_OFF-Z_OFF,-X_OFF],
]


// negative means reverse it
var EDGE_TABLE = [
	null,
		[0, 3, 8],
	[-0],
	[0, 3, 8],
	[],
	[],
	[],
	[],
	[-3], //8
	[],
	[],
	[],
	[-3],
	[],
	[],
	[],
	[-8],
	[],
	[],
	[],
	[],
	[],
	[],
	[],
	[],
	[],
	[],
	[],
	[],
	[],
	[],
	[],
	[],
	[],
	[],
	[],
	[],
	[],
	[],
	[],
	[],
	[],
	[],
	[],
	[],
	[],
	[],
	[],
	[-8],
	[],
	[],
	[],
];

var MIDDLE = [0.5, 0.5, 0.5];


var C_0 = [EPS, EPS, EPS];
var C_1 = [1-EPS, EPS, EPS];
var C_2 = [1-EPS, EPS, 1-EPS];
var C_3 = [EPS, EPS, 1-EPS];
var C_4 = [EPS, 1-EPS, EPS];
var C_5 = [1-EPS, 1-EPS, EPS];
var C_6 = [1-EPS, 1-EPS, 1-EPS];
var C_7 = [EPS, 1-EPS, 1-EPS]


var VERT_TABLE = [
	null,
	C_0,
	C_1,
	MIDDLE,
	C_2,
	null,
	null,
	null,
	C_3,
	null,
	null,
	null,
	MIDDLE,
	null,
	null,
	null,
	C_4,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	C_5,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	MIDDLE,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	C_6, // 64
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	C_7, // 128
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	MIDDLE,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
	null,
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

			vertIdx[i] = vertices.length;

			if (counts[i] < VERT_TABLE.length && VERT_TABLE[counts[i]]) {
				var [x, y, z] = idxToXYZ(i);


				var [ox, oy, oz] = VERT_TABLE[counts[i]];

				vertices.push([
					x + ox,
					y + oy,
					z + oz
				]);
			}

			if (counts[i] < EDGE_TABLE.length) {
				var edges = EDGE_TABLE[counts[i]];

				if (counts[i] === 48) {
					console.log('here');
				}

				for (let edge of edges) {
					var offs = EDGE_SOMETHING[Math.abs(edge)];

					if (!(edge > 0 || Object.is(Math.sign(edge), 0))) {
						offs.reverse();
					}

					triangles.push([
						vertIdx[i + 0],
						vertIdx[i + offs[0]],
						vertIdx[i + offs[1]]
					]);

					triangles.push([
						vertIdx[i + 0],
						vertIdx[i + offs[1]],
						vertIdx[i + offs[2]]
					]);

					if (!(edge > 0 || Object.is(Math.sign(edge), 0))) {
						offs.reverse();
					}
				}
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