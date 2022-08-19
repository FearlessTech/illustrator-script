// Setup:
// Define Constant: SegmentLength=1

// Step 1:
// -Verify that selection contains:
// 	1) Only closed paths
// 	2) All the same color stroke
// 	3) No fill
// 	4) All the same stroke width

// -If not, display error message, make each path red color if error, return

// Step 2:
// -Move selection into new layer called "CLOSED DIE LINES (WORKING FILE)"
// -Copy selection into new layer called “OPEN DIE LINES (FOR PRINT)”
// -Change stroke color of all paths in layer "CLOSED DIE LINES (WORKING FILE)" to ORANGE
// -Lock and make invisible layer "CLOSED DIE LINES (WORKING FILE)"

// Step 3:
// -Work on EACH path in layer “OPEN DIE LINES (FOR PRINT)”:
// -Find CENTER of path (X & Y coord exactly between left side, right side, top and bottom)
// -Find point on path that is FURTHEST POINT away from center.
// -Break (cut path at anchor point) curve at FURTHEST POINT.

// Step 4
// -create new line segment, connected at Path Start, length of SegmentLength in mm, angled directly away from CENTER.
// -create new line segment, connected at Path END, length of SegmentLength in mm, angled directly away from CENTER.

// Step 5
// -Display message: "OPEN Die lines layer created.  Please check it carefully BEFORE saving."



(function(){
	var myDoc = app.activeDocument;
	
	var pathes = [];

	// selected pathes
	getPathItemsInSelection(1, pathes);

	// Step 1:
	if (app.documents.length == 0 || app.selection.length < 1){
    	alert ("Please make sure to have something useful selected"); return;
	}

	if(checkClosedPath(pathes)) return;
	
	if(checkSameStroke(pathes)) return;
	
	if(checkSameColor(pathes)) return;


	// Step 2:
	var CLOSED_layer = "CLOSED DIE LINES";
	var OPEN_layer = "OPEN DIE LINES";
	
	var closedLayer = myDoc.layers.add(); 
	closedLayer.name = CLOSED_layer;
	var openLayer = myDoc.layers.add(); 
	openLayer.name = OPEN_layer;

	for(var i = pathes.length - 1; i >= 0; i--){
		var op = pathes[i];
		op.duplicate(openLayer);
		op.strokeColor = makeColor(255, 165, 0);
		op.move(closedLayer, ElementPlacement.PLACEATEND);
	}

	myDoc.layers.getByName(CLOSED_layer).visible = false;
	myDoc.layers.getByName(CLOSED_layer).locked = true;

	// Step 3:
	myDoc.activeLayer = myDoc.layers.getByName(OPEN_layer);
	var activeLayer = myDoc.activeLayer;
	var s_Paths = activeLayer.pathItems;

	// is it in a shape?
	var cclr = new CMYKColor();
		cclr.cyan = 0;
		cclr.magenta = 100;
		cclr.yellow = 100;
		cclr.black = 0;
	var cc_Ary = calcContainableFuncs(s_Paths);

	// draw the segment SegmentLength = 1 mm
	var tempLayer = myDoc.layers.add(); 
	tempLayer.name = 'sengmemts';
	var segment = tempLayer.pathItems.add();
	var sp1 = segment.pathPoints.add();
	sp1.anchor = sp1.rightDirection = sp1.leftDirection = [0,0];
	var sp2 = segment.pathPoints.add();
	sp2.anchor = sp2.rightDirection = sp2.leftDirection = [10, 0];

	for(var i = s_Paths.length - 1; i >= 0; i--){
		var s_op = s_Paths[i];
		var b = s_op.geometricBounds
		
		var c_xy = [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2];
		
		var result = furthestSet (s_op, c_xy);
		
		if (result.length == 2)
		{
		    var f_pos = result[1];
		    /* result[1] is point #1, result[2] = center position #2 */
		    /* now calculate angle and rotate */

		    var disty = f_pos[0] - c_xy[0];
		    var distx = f_pos[1] - c_xy[1];
		    var angle = -Math.atan2 (disty, distx) - Math.PI/2;
		    angle = angle*180.0/Math.PI;
		    if (angle <= -180) angle += 180;
		    if (angle >=  180) angle -= 180;

		    var s_path = segment.duplicate();
		    s_path.translate(f_pos[0], f_pos[1]);
			s_path.rotate(angle, true, true, true, true, Transformation.LEFT);
		    // alert("width:"+c_xy[0]+" height:"+f_pos[0]);
		    // alert(angle);

		    // is contained?
		    var isContained = cc_Ary["cc_" + i]?true:false;
		    if(isContained){
			    if(c_xy[0] > f_pos[0] && c_xy[1] > f_pos[1])
			    	s_path.translate(s_path.width*-1, s_path.height*-1);
			    if(c_xy[0] > f_pos[0] && c_xy[1] < f_pos[1])
			    	s_path.translate(s_path.width*-1, s_path.height);
			    if(c_xy[0] < f_pos[0] && c_xy[1] < f_pos[1])
			    	s_path.translate(s_path.width, s_path.height);
		    } else {
		    	if(c_xy[0] > f_pos[0] && c_xy[1] > f_pos[1])
		    		s_path.translate(0, s_path.height);
		    	if(c_xy[0] > f_pos[0] && c_xy[1] < f_pos[1])
			    	s_path.translate(0, 0);
			    if(c_xy[0] < f_pos[0] && c_xy[1] < f_pos[1])
			    	s_path.translate(0, 0);
			    if(c_xy[0] < f_pos[0] && c_xy[1] > f_pos[1])
			    	s_path.translate(s_path.width*-1, s_path.height);
		    }
		    
		    s_path.strokeWidth = s_op.strokeWidth;
		    s_path.strokeColor = s_op.strokeColor;

		    // connected at Path Start, angled directly away from CENTER
		    sg_points = s_path.pathPoints;
		    overlayPoints(s_op, sg_points);

			s_path.remove();
			s_op.remove();
		}
	}
	segment.remove();
	tempLayer.remove();

	alert("OPEN Die lines layer created.  Please check it carefully BEFORE saving.");
})()

// calculate the relationships of shapes
function calcContainableFuncs(_pathes){
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
			// alert("NOT All Path Anchors are inside containing ellipse.");
		} else {
			// alert("Yay!  All Path Anchors are INSIDE the containing ellipse!");
		}
		return flag; // for use later (?)
	}

	function testContained(container, checkme){
		// var m = doc.pathItems.getByName('mycir'); // my circle
		// var mp = doc.pathItems.getByName('mypth'); // my test path
		var pts = getPathPoints(container);
		var bezPts = getBezierPath(pts);
		var chkRes = pathAnchorsInPoly(checkme, bezPts);
		return chkRes;
	}

	// relationshipAry
	var relationshipAry = {};
	for (var i = _pathes.length - 1; i >= 0; i--) {
		var container = _pathes[i];
		if(relationshipAry['cc_'+i] > -1) continue;
		relationshipAry['cc_'+i] = 1;

		for (var j = 0; j < _pathes.length; j++) {
			var checkme = _pathes[j];
			// alert(testContained(container, checkme));
			if(testContained(container, checkme)) {
				relationshipAry['cc_'+i] = 1;
				relationshipAry['cc_'+j] = 0;
			}
		}
	}

	return relationshipAry;
}

// distance of two positions 
function dist2(p1, p2) {
  return Math.pow(p1[0] - p2[0], 2)
       + Math.pow(p1[1] - p2[1], 2);
}

// re-arrange the point and redraw from re-points
function overlayPoints(path, sg_points){
    var pts = path.pathPoints,
    	tmpancs = [],
    	tmpancsPp = [],
    	ancs = [],
    	ancsPp = [],
		minDist = 0.15,
		minFlag = true,
		stopFlag = false,
		startPos = sg_points[0].anchor,
		secondPos = 0;

    for(var k=pts.length - 1; k >= 0; k--) {
    	if(dist2(secondPos, pts[k].anchor) < minDist) {
    		stopFlag = true;
    	}
    	if(stopFlag) continue;
    	
    	// alert(dist2(sg_points[0].anchor, pts[k].anchor));
    	if(dist2(sg_points[0].anchor, pts[k].anchor) < minDist && minFlag){
    		minFlag = false;
    		startPos = sg_points[1].anchor;
    		secondPos = pts[k].anchor;
    	} else if(dist2(sg_points[1].anchor, pts[k].anchor) < minDist && minFlag) {
    		minFlag = false;
    		startPos = sg_points[0].anchor;
    		secondPos = pts[k].anchor;
    	}
    	if(secondPos!=0){
    		ancs.push(pts[k].anchor);
    		ancsPp.push(pts[k]);
    	} else {
    		tmpancs.push(pts[k].anchor);
    		tmpancsPp.push(pts[k]);
    	}
    }
    ancs = ancs.concat(tmpancs);
    ancsPp = ancsPp.concat(tmpancsPp);
	ancs.push(ancs[0]);
	ancsPp.push(ancsPp[0]);
    // alert(ancs[0] + "  last:" + ancs[ancs.length-1]);

    ancsPp.unshift(1);
    ancsPp.push(1);
    ancs.unshift(startPos);
    ancs.push(startPos);

    var dppath = path.duplicate();
    dppath.closed = false;
    dppath.setEntirePath(ancs);

    var dpPoint = dppath.pathPoints;
    for (var k = 0; k < dpPoint.length; k++) {
        if(k==dpPoint.length - 1 || k==0) {
	        dpPoint[k].rightDirection = startPos;
	        dpPoint[k].leftDirection  = startPos;
	        dpPoint[k].pointType      = PointType.CORNER;;	
        } else if(k==1){
        	dpPoint[k].rightDirection = ancsPp[k].leftDirection;
	        dpPoint[k].leftDirection  = secondPos;
	        dpPoint[k].pointType      = ancsPp[k].pointType;
        } else if(k==dpPoint.length-2){
	        dpPoint[k].rightDirection = secondPos;
	        dpPoint[k].leftDirection  = ancsPp[k].rightDirection;
	        dpPoint[k].pointType      = ancsPp[k].pointType;
        } else {
	        dpPoint[k].rightDirection = ancsPp[k].leftDirection;
	        dpPoint[k].leftDirection  = ancsPp[k].rightDirection;
	        dpPoint[k].pointType      = ancsPp[k].pointType;
        }
    }
}

// check
// color closed paths 
function checkClosedPath(pathes){
	var errFlag = false;
	for(var i = pathes.length - 1; i >= 0; i--){
	    var op = pathes[i];
				// op.closed = true;
				// op.filled = true;
				// op.stroked = true;
	    if(!op.closed || !op.filled) {
          errFlag = true;
          op.strokeColor = makeColor(255,0,0);
          continue;
      }
	}
 	errFlag && alert("Closed Or No Fill Error!");
	return errFlag;
}

// check same stroke path
function checkSameStroke(pathes){
 	var errFlag = false;
 	var wdAry = [];
 	var wdObj = {};
	for(var i = pathes.length - 1; i >= 0; i--){
	    var op = pathes[i];
	    var wd = (op.strokeWidth).toFixed(3);
	    wdAry[i] = wd;
	    wdObj[wd] = wdObj[wd]?wdObj[wd]+1:1;
	}
	var mw = 0;
	var maxWd = "";
	for(var mk in wdObj){
	  if(wdObj[mk]> mw){
	    mw = wdObj[mk];
	    maxWd= mk
	  }
	}
	for(var i = pathes.length - 1; i >= 0; i--){
		var op = pathes[i];
		var wd = (op.strokeWidth).toFixed(3);
		if(maxWd != wd) {
          	errFlag = true;
			op.strokeColor = makeColor(255,0,0);
		}
	}
 	errFlag && alert("Incorrect Width Of Stroke!");
	return errFlag;
}

function checkSameColor(pathes){
	var errFlag = false;
 	var clrAry = [];
 	var clrObj = {};

	for(var i = pathes.length - 1; i >= 0; i--){
	    var op = pathes[i];
	    var colorSel = getColor(op); 
	    clrAry[i] = colorSel;
	    var clrName = getColorName(colorSel);
	    clrObj[clrName] = clrObj[clrName]?clrObj[clrName]+1:1;
	}
	var mc = 0;
	var maxClr = "";
	for(var mk in clrObj){
	  if(clrObj[mk]> mc){
	    mc = clrObj[mk];
	    maxClr= mk
	  }
	}
	for(var i = pathes.length - 1; i >= 0; i--){
		var op = pathes[i];
	    var colorSel = getColor(op); 
		if(maxClr != getColorName(colorSel)) {
          	errFlag = true;
			op.strokeColor = makeColor(255,0,0);
		}
	}
 	errFlag && alert("Incorrect Color Of Stroke");
	return errFlag;
}

// defined unique color name
function getColorName(clr){
	return "c_"+(clr.cyan).toFixed(2)+"_m_"+(clr.magenta).toFixed(2)+"_y_"+(clr.yellow).toFixed(2)+"_b_"+(clr.black).toFixed(2);
}

// compare color
function compareColor(clr1, clr2){
	if(clr1.cyan==clr2.cyan && clr1.magenta==clr2.magenta && clr1.yellow==clr2.yellow && clr1.black==clr2.black){
		return true;
	} else return false;
}

// get color
function getColor(obj) {
	var colorSel = new CMYKColor; 
	colorSel.cyan = obj.strokeColor.cyan;  
	colorSel.magenta = obj.strokeColor.magenta;  
	colorSel.yellow = obj.strokeColor.yellow; 
	colorSel.black = obj.strokeColor.black;  
	return colorSel; 
}

// make color
function makeColor(r,g,b){
    var testColor = new RGBColor();
    testColor.red = r;
    testColor.green = g;
    testColor.blue = b;
    return testColor;
}

// ------------------------------------------------
// extract PathItems from the selection which length of PathPoints
// is greater than "n"
function getPathItemsInSelection(n, pathes){
  if(documents.length < 1) return;
  
  var s = activeDocument.selection;
  
  if (!(s instanceof Array) || s.length < 1) return;

  extractPathes(s, n, pathes);
}

// --------------------------------------
// extract PathItems from "s" (Array of PageItems -- ex. selection),
// and put them into an Array "pathes".  If "pp_length_limit" is specified,
// this function extracts PathItems which PathPoints length is greater
// than this number.
function extractPathes(s, pp_length_limit, pathes){
  for(var i = 0; i < s.length; i++){
    if(s[i].typename == "PathItem" && !s[i].guides && !s[i].clipping){
		if(pp_length_limit && s[i].pathPoints.length <= pp_length_limit){
			continue;
		}
		pathes.push(s[i]);      
    } else if(s[i].typename == "GroupItem"){
		// search for PathItems in GroupItem, recursively
		extractPathes(s[i].pageItems, pp_length_limit, pathes);
      
    } else if(s[i].typename == "CompoundPathItem"){
		// searches for pathitems in CompoundPathItem, recursively
		// ( ### Grouped PathItems in CompoundPathItem are ignored ### )
		extractPathes(s[i].pathItems, pp_length_limit , pathes);
    }
  }
}

function distanceFromPointToPoint (A, B)
{
/*  since we only need to know what point is furthest, the squared result is okay as well */

/*  return Math.sqrt ( ((A[0]-B[0]) * (A[0]-B[0])) + ((A[1]-B[1]) * (A[1]-B[1])) ); */

    return ((A[0]-B[0]) * (A[0]-B[0])) + ((A[1]-B[1]) * (A[1]-B[1]));
}

function pathToArray (obj)
{
    var pt;
    var flatpath = [];

    if (!obj.hasOwnProperty ("pathPoints"))
        return null;

    for (pt=0; pt<obj.pathPoints.length; pt++)
    {
        flatpath.push (obj.pathPoints[pt].anchor);
    }
    /* once more for good luck */
    flatpath.push (obj.pathPoints[0].anchor);
    return flatpath;
}

function furthestSet (obj, c_xy)
{
    var flatpath = [], i, d, distance = -1, result = [];

    if (obj.constructor.name == "CompoundPathItem")
    {
        for (p=0; p<obj.pathItems.length; p++)
        {
            flatpath = flatpath.concat(pathToArray (obj.pathItems[p]));
        }
    } else
    {
        flatpath = pathToArray (obj);
    }
    if (flatpath == [])
        return [0, [0,0], [0,0]];

    for (i=0; i < flatpath.length-1; i++)
    {
        d = distanceFromPointToPoint (flatpath[i], c_xy);
        if (d > distance)
        {
            distance = d;
            result = [d, flatpath[i]];
        }
    }
    return result;
}
