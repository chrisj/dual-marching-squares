function mod(n, m) {
	return ((n % m) + m) % m;
}

function edgesForPoint (i) {
	var lvl = Math.floor(i / 4);
	return [i, -(mod((i - 1), 4) + 4 * lvl), (1 - (2 * lvl)) * (i + 8 - 4 * lvl)];
}

var CENTER_OF_EDGE = [
	[0.5, 0.0, 0.0],
	[1.0, 0.0, 0.5],
	[0.5, 0.0, 1.0],
	[0.0, 0.0, 0.5],
	[0.5, 1.0, 0.0],
	[1.0, 1.0, 0.5],
	[0.5, 1.0, 1.0],
	[0.0, 1.0, 0.5],
	[0.0, 0.5, 0.0],
	[1.0, 0.5, 0.0],
	[1.0, 0.5, 1.0],
	[0.0, 0.5, 1.0],
];

function p (points) {
	let edges = [];

	let absEdges = [];

	for (let point of points) {
		for (let edge of edgesForPoint(point)) {
			var i = absEdges.indexOf(Math.abs(edge));

			if (i === -1) {
				edges.push(edge);
				absEdges.push(Math.abs(edge));
			} else {
				edges.splice(i, 1);
				absEdges.splice(i, 1);
			}
		}
	}

	var centroid = [0.0, 0.0, 0.0];

	for (let edge of edges) {
		var center = CENTER_OF_EDGE[Math.abs(edge)];
		centroid[0] += center[0];
		centroid[1] += center[1];
		centroid[2] += center[2];
	}

	centroid[0] /= edges.length;
	centroid[1] /= edges.length;
	centroid[2] /= edges.length;

	return [centroid, edges];
}


function separateOns(ons) {
	var groups = [];

	for (let i of ons) {
		var lvl = Math.floor(i / 4);
		var n1 = (i + 1) % 4 + 4 * lvl;
		var n2 = (mod((i - 1), 4) + 4 * lvl);
		var n3 = (i + 4) % 8;

		var addCount = 0;

		for (let group of groups) {
			if (group.indexOf(n1) !== -1 || group.indexOf(n2) !== -1 || group.indexOf(n3) !== -1) {
				group.push(i);
				addCount++;
			}
		}

		if (addCount === 0) {
			groups.push([i]);
		}
	}

	return groups;
}


function genTable () {
	var table = [];

	for (let i = 0; i < 256; i++) {
		var ons = [];
		for (let p = 0; p < 8; p++) {
			if (i << (31 - p) >>> 31) {
				ons.push(p);
			}
		}

		var groups = separateOns(ons);

		var entry = {
			vertices: [],
			normals: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			edges: [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
			debug: [],
			ons: ons
		}

		var count = 0;

		for (let j = 0; j < groups.length; j++) {
			let blah = p(groups[j]);

			let centroid = blah[0];
			let edges = blah[1];

			entry.debug.push(edges);

			entry.vertices[count] = centroid;

			for (let edge of edges) {
				entry.edges[Math.abs(edge)] = count;

				if (edge < 0 || Object.is(Math.sign(edge), -0)) {
					entry.normals[Math.abs(edge)] = -1;
				} else {
					entry.normals[edge] = 1;
				}
			}

			count++;
		}

		table.push(entry);
	}

	return table;
}


// let repl = require("repl")
// const cli = repl.start({ replMode: repl.REPL_MODE_STRICT });

// cli.context.p = p;
// cli.context.s = separateOns;
// cli.context.g = genTable;