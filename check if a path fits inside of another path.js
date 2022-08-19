/* 
What you need to do to start working on it is make a document, 
make your containing ellipse and call it "mycir" and test out a path called "mypth".
*/

function test () {
	if (!Array.prototype.indexOf) {
		Array.prototype.indexOf = function(searchElement, fromIndex) {
			var k;
			if (this == null) {
				throw new TypeError('"this" is null or not defined');
			}
			var o = Object(this);
			var len = o.length >>> 0;
			if (len === 0) {
				return -1;
			}
			var n = +fromIndex || 0;
			if (Math.abs(n) === Infinity) {
				n = 0;
			}
			if (n >= len) {
				return -1;
			}
			k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
			while (k < len) {
				if (k in o && o[k] === searchElement) {
					return k;
				}
				k++;
			}
			return -1;
		};
	};

	function foreach (arr, func) {
		for (var i = 0; i < arr.length; i++) {
			func(arr[i]);
		}
	}

	function marker (xy, container) {
		var container = container || doc;
		var z = container.pathItems.ellipse(xy[1] + 2, xy[0] - 2, 4, 4);
		z.stroked = false;
		z.filled = true;
		z.fillColor = cclr;
	}

	function getPathPoints (path) { // collects pathPoints of a path into segment arrays of 2 anchors & 2 controls between them
		var arr = [];
		for (var i = 0, ln = path.pathPoints.length; i < ln; i++) { // designed to work on closed paths!
			if (i < ln - 1) {
				var p = path.pathPoints[i], pnext = path.pathPoints[i + 1];
			} else {
				var p = path.pathPoints[i], pnext = path.pathPoints[0];
			}
			arr.push([p.anchor, p.rightDirection, pnext.leftDirection, pnext.anchor]); 
		}
		return arr;
	}

	function getBezierSegment (segArr) { // turns a pathPoint segment  (gotten with getPathPoints) into bezier interpolated points
		var anch2 = segArr[3], cont2 = segArr[2], cont1 = segArr[1], anch1 = segArr[0];
		var resultPts = [];
		var a = anch2[0] - 3 * (cont2[0]) + 3 * (cont1[0]) - anch1[0];
		var b = 3 * (cont2[0]) - 6 * (cont1[0]) + 3 * anch1[0];
		var c = 3 * (cont1[0]) - 3 * (anch1[0]);
		var d = anch1[0];
		var e = anch2[1] - 3 * (cont2[1]) + 3 * (cont1[1]) - anch1[1];
		var f = 3 * (cont2[1]) - 6 * (cont1[1]) + 3 * anch1[1];
		var g = 3 * (cont1[1]) - 3 * (anch1[1]);
		var h = anch1[1];
		var inc = 0.1;
		for (var t = 0; t < 1; t += inc) {
			resultPts.push([
				a * Math.pow(t, 3) + b * Math.pow(t, 2) + (c * t) + d,
				e * Math.pow(t, 3) + f * Math.pow(t, 2) + (g * t) + h
			]);
		}
		return resultPts;
	}

	function getBezierPath (pathPts) { // turns entire series of segments (gotten with getPathPoints)  into a complete set of interpolated bezier points
		var pathArr = [];
		for (var i = 0; i < pathPts.length; i++) {
			var thisPtSet = pathPts[i];
			var seg = getBezierSegment(thisPtSet);
			if (
				i > 0 && (seg[0][0] == pathArr[pathArr.length - 1][0] &&
				seg[0][1] == pathArr[pathArr.length - 1][1])
			) {
				seg.splice(0, 1);
			}
			pathArr = pathArr.concat(seg);
		}
		return pathArr;
	}

	function markBezierPoints (seg) {
		var grp = doc.groupItems.add();
		grp.name = "MyGroup";
		for (var i = 0; i < seg.length; i++) {
			marker(seg, grp);
		}
	}

	function makePolygon (pts) {
		var pth = doc.pathItems.add();
		pth.setEntirePath(pts);
		pth.filled = false;
		pth.stroked = true;
		pth.strokeColor = cclr;
		pth.strokeWidth = 1;
	}

	var RayCaster = { // the whole raycasting through polygon algorithm from http://rosettacode.org/wiki/Ray-casting_algorithm
		// evaluates a single point to see if it's inside a polygon.
		Point : function (x, y) {
			this.x = x;
			this.y = y;
		},
		pointInPoly : function (point, poly) {
			var index, intersected, pointA, pointB, segment, segments;
			segments = (function () {
				var _i, _len, _results;
				_results = [];
				for (index = 0, _len = poly.length; index < _len; index++) {
					pointA = poly[index];
					pointB = poly[(index + 1) % poly.length];
					_results.push([new RayCaster.Point(pointA[0], pointA[1]), new RayCaster.Point(pointB[0], pointB[1])]);
				}
				return _results;
			})();
			intersected = (function () {
				var _i, _len, _results;
				_results = [];
				for (_i = 0, _len = segments.length; _i < _len; _i++) {
					segment = segments[_i];
					if (
						RayCaster.rayIntersectsSegment(new RayCaster.Point(point[0], point[1]), segment)
					) {
						_results.push(segment);
					}
				}
				return _results;
			})();
			return intersected.length % 2 !== 0;
		},
		rayIntersectsSegment : function (p, segment) {
			var a, b, mAB, mAP, p1, p2, _ref;
			p1 = segment[0], p2 = segment[1];
			_ref = p1.y < p2.y ? [p1, p2] : [p2, p1], a = _ref[0], b = _ref[1];
			if (p.y === b.y || p.y === a.y) {
				p.y += Number.MIN_VALUE;
			}
			if (p.y > b.y || p.y < a.y) {
				return false;
			} else if (p.x > a.x && p.x > b.x) {
				return false;
			} else if (p.x < a.x && p.x < b.x) {
				return true;
			} else {
				mAB = (b.y - a.y) / (b.x - a.x);
				mAP = (p.y - a.y) / (p.x - a.x);
				return mAP > mAB;
			}
		}
	};

	function pathAnchorsInPoly (myPath, polyPts) {
		var flag = false;
		var all = [];
		foreach(myPath.pathPoints, function (arg) {
			if (RayCaster.pointInPoly(arg.anchor, polyPts) === false) {
				all.push(false);
			}
			all.push(true);
		});
		flag = (all.indexOf(false) != -1) ? false : true;
		if (flag === false) {
			alert("NOT All Path Anchors are inside containing ellipse.");
		} else {
			alert("Yay!  All Path Anchors are INSIDE the containing ellipse!");
		}
		return flag; // for use later (?)
	}

	if (app == "[Application Adobe Illustrator]" && app.documents.length > 0) {
		app.coordinateSystem = CoordinateSystem.ARTBOARDCOORDINATESYSTEM;
		var cclr = new CMYKColor();
		cclr.cyan = 0;
		cclr.magenta = 100;
		cclr.yellow = 100;
		cclr.black = 0;
		var doc = app.activeDocument;
		try {
			var m = doc.pathItems.getByName('mycir'); // my circle
			var mp = doc.pathItems.getByName('mypth'); // my test path
		} catch (e) {
			alert("Put 2 paths into a document: a containing ellipse, name it 'mycir', and some random path- name it 'mypth'.  Then run.");
			return;
		}
		var pts = getPathPoints(m);
		var bezPts = getBezierPath(pts);

		// testing functions:
		// markBezierPoints(bezPts);
		// makePolygon(bezPts);
		// foreach(bezPts, function(arg) {$.writeln(arg)});

		pathAnchorsInPoly(mp, bezPts);
	}
}

test();