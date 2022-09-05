// target illustrator


var myDoc,				// actived document
		currArtboard, // current Artboard
		PNLayerName,	// layer name of project numbers
		PhotoLayerName,
		SilhouetteLayerName;

var snNumbers = [];
var sortNum = 0;	// sort number

var artBSGChar = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"];

(function(){
	myDoc = app.activeDocument;

	var askString = "If they want Project Numbers, Input Number 2 \n";
		askString += "If they want Resort Numbers, Input Number 3 \n";
		askString += "If they want Finalized Numbers, Input Number 4 \n";
	var selType = prompt(askString, 1);
	
  PNLayerName = "Project Numbers";
  PhotoLayerName = "Photo Numbers";
  SilhouetteLayerName = "Silhouette Numbers";

  Array.prototype.indexOf = function ( item ) {
	  var index = 0, length = this.length;
    for ( ; index < length; index++ ) {
      if ( this[index] == item ) return index;
    }
    return -1;
  };

  if (selType == 2) 
		projectNumber();
	else if(selType == 3)
		resortNumbers();
	else if(selType == 4)
		finalizedNumber();
	else 
  	alert("Invalid Selection");
})()

// -------------------------------------------------------------
// project numbers start
function projectNumber() {
	var texts = [];
	var pathes = [];
	getTextItemsInSelection(2, texts);
	getPathItemsInSelection(2, pathes);
	
	// check validate of texts
	if(textValidation(texts, 'pn')) return;

	for (var i=0; i<myDoc.artboards.length; i++) {
    myDoc.artboards.setActiveArtboardIndex(i);
    myDoc.selectObjectsOnActiveArtboard();
    var itemsOfArtboard = app.selection;
    var selObjsOfArtBoard = getContainedObj(itemsOfArtboard, texts);
    
    calcProjectNumber(selObjsOfArtBoard, pathes, i);
    app.selection = null;
	}
}

// final project numbers
function calcProjectNumber(texts, pathes, crr){
	// sort by position
	var sortResult = sortItemsByPos(texts);

  // create layer
  if(!doesLayerExist(myDoc.layers, PNLayerName)){
	  var PNLayer = myDoc.layers.add(); 
		PNLayer.name = PNLayerName;
  } else {
  	var PNLayer = myDoc.layers.getByName(PNLayerName); 
  }

	// change name and contents of selected item
  for (var i = 0; i < sortResult.length; i++) {
  	sortNum += 1; 
  	sortResult[i].name = "P" + artBSGChar[crr] + sortNum;
  	sortResult[i].contents = "P" + sortNum;

  	// move the items
  	sortResult[i].move(PNLayer, ElementPlacement.PLACEATEND);

  	// find nearest path and set name
  	var nearPath = nearestPath(sortResult[i], pathes);
  	if(nearPath) {
	  	// nearPath.name = sortResult[i].name;
	  	// nearPath.move(PNLayer, ElementPlacement.PLACEATEND);
  	}
  }
}
// project numbers end
// -------------------------------------------------------------

// -------------------------------------------------------------
// resort numbers start
function resortNumbers() {
	var texts = [];
	var pathes = [];
	getTextItemsInSelection(2, texts);
	getPathItemsInSelection(2, pathes);

	currAB = myDoc.artboards.getActiveArtboardIndex();
	
	// check validate of texts
	// if(textValidation(texts, 'rn')) return;

	// the items of project numbers
	var PNLayer = myDoc.layers.getByName(PNLayerName); 
	var pgItems = PNLayer.pageItems;
	var pnFlag = false;
	for (var i = 0; i < pgItems.length; i++) {
		var patt = new RegExp("P[A-Z](.*)", "g");
		var p_res = patt.exec(pgItems[i].name);
		if(p_res==null || (p_res!=null && p_res[1] % 1 != 0)){
			pnFlag = true;
			alert("Project numbers are not valid");
			break;
		}
		snNumbers.push(p_res[1]);
	}
	if(pnFlag) return;

	snNumbers.sort(function(v1, v2){ return v1-v2; });

	// sort by position
	var sortResult = sortItemsByPos(texts);
	var s = 0;
	for (var i = 0; i < sortResult.length; i++) {
		while(s < 1000) {
			s++;
			if(snNumbers[snNumbers.length-1] < s || snNumbers.indexOf(s) == -1) {
		  	break;
			}
		}
		sortResult[i].name = "P" + artBSGChar[currAB] + s;
		sortResult[i].contents = "P" + s;
		// move the items
		sortResult[i].move(PNLayer, ElementPlacement.PLACEATEND);

		// find nearest path and set name
		var nearPath = nearestPath(sortResult[i], pathes);
		if(nearPath) {
			// nearPath.name = sortResult[i].name;
			// nearPath.move(PNLayer, ElementPlacement.PLACEATEND);
		}
	}

}
// resort numbers end
// -------------------------------------------------------------

// -------------------------------------------------------------
// finalized number start
function finalizedNumber(){
	var aBn = myDoc.artboards.length;
	var checkAb = [];

	if(!doesLayerExist(myDoc.layers, PNLayerName)){
		alert("First create Project Numbers");return;
	} else if(doesLayerExist(myDoc.layers, PhotoLayerName)){
		alert("Delete Photo Numbers layer first to restart");return;
	} else if(doesLayerExist(myDoc.layers, SilhouetteLayerName)){
		alert("Delete Silhouette Numbers layer first to restart");return;
	}
	
	var s = activeDocument.selection;
	if(s.length > 0) {
		alert("No selection needed. Will process Project numbers");
		app.selection = null;
		return;
	}

	var reFlag = false;
	var PNLayer = myDoc.layers.getByName(PNLayerName); 
	var PNtxtFrames = PNLayer.textFrames;
	for (var i = 0; i < PNtxtFrames.length; i++) {
		var txtName = PNtxtFrames[i].name;
		var patt = new RegExp("(P)([A-Z])(.*)", "g");
		var p_res = patt.exec(txtName);
		if(p_res[1] !="P" && artBSGChar.indexOf(p_res[2]) == -1 && p_res[3] % 1 != 0){
			alert("Incorrect object types in Project Numbers. Re-run Project numbers");
			reFlag = true;
			break;
		}
	}
	if(reFlag) return;

	if(!doesLayerExist(myDoc.layers, SilhouetteLayerName)){
		var SilhouetteLayer = myDoc.layers.add(); 
		SilhouetteLayer.name = SilhouetteLayerName;
  } else {
  	var SilhouetteLayer = myDoc.layers.getByName(SilhouetteLayerName); 
  }
	if(!doesLayerExist(myDoc.layers, PhotoLayerName)){
		var PhotoLayer = myDoc.layers.add(); 
		PhotoLayer.name = PhotoLayerName;
  } else {
  	var PhotoLayer = myDoc.layers.getByName(PhotoLayerName); 
  }
	for (var i=0; i<myDoc.artboards.length; i++) {
    myDoc.artboards.setActiveArtboardIndex(i);
    myDoc.selectObjectsOnActiveArtboard();
    var itemsOfArtboard = app.selection;
		
		copyItemsByCons(itemsOfArtboard, i, SilhouetteLayer, PhotoLayer);
    app.selection = null;
	}
}
// finalized number end
// -------------------------------------------------------------

// ------------------------------------------------
// copy and rename items by second charator of object name
function copyItemsByCons(items, currAB, shL, ptL){
	for (var i = 0; i < items.length; i++) {
		var item = items[i];
		if(item.typename == "TextFrame"){
			var txtName = item.name;
			var patt = new RegExp("(P)([A-Z])(.*)", "g");
			var p_res = patt.exec(txtName);
			// alert(currAB + "  " + txtName + "  " + artBSGChar.indexOf(p_res[2]));
			if(currAB == artBSGChar.indexOf(p_res[2])){
				var createdItem = item.duplicate(shL);
			} else {
				var createdItem = item.duplicate(ptL);
			}
			createdItem.name = p_res[1] + p_res[3];
			createdItem.contents = p_res[3];
		}
	}
}

// ------------------------------------------------
// text validation function
function textValidation(texts, vtp){
	var vflag = false;
	var txtLen = texts.length;
	if (vtp!="rn" && txtLen < 1) {
		vflag = true;
		alert("No items selected.");return;
	}
	
	for (var i = 0; i < txtLen; i++) {
		var obj = texts[i];
		if(obj.paragraphs[0].justification != Justification.CENTER){
			vflag = true;
			alert("All numbers must be CENTER justified");
			break;
		}
		if(obj.contents.toUpperCase() != 'XX'){
			vflag = true;
			alert("Make sure all items are XX format");
			break;
		}
	}
	return vflag;
}

// ------------------------------------------------
// get items that is contained in selected artboard
function getContainedObj(itemsOfArtboard, texts){
	var t_ary = [];
	for (var i = 0; i < itemsOfArtboard.length; i++) {
		for (var j = 0; j < texts.length; j++) {
			if(itemsOfArtboard[i] == texts[j]){
				t_ary.push(itemsOfArtboard[i]);
				break;
			}
		}
	}
	return t_ary;
}

// ------------------------------------------------
// distance of two positions 
function dist2(p1, p2) {
  return Math.pow(p1[0] - p2[0], 2)
         + Math.pow(p1[1] - p2[1], 2);
}

// ------------------------------------------------
// find nearest path from selected text
function nearestPath(txt, pathes){
	var txtCenter = [(txt.left+(txt.width/2)), txt.top+txt.height/2];
	var minDis, expectPath;
	for (var i = 0; i < pathes.length; i++) {
		var objCenterPos = getCenterPos(pathes[i]);
		var dis = dist2(txtCenter, objCenterPos);
		if(!minDis || (minDis && minDis > dis)) {
			minDis = dis;
			expectPath = pathes[i];
		}
	}
	return expectPath;
}

// ------------------------------------------------
// get center position of selected item
function getCenterPos(obj){
	var b = obj.geometricBounds;
	var pos = [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2];
	return pos;
}

// ------------------------------------------------
// check exist layer
function doesLayerExist(layers, Lname) {
    for (i=0; i<layers.length; i++) {
        if (layers[i].name == Lname) return true;
    }
    return false;
}

// ------------------------------------------------
// sort items by position
function sortItemsByPos(texts){
  var vSortedRes = texts.sort(function(v1, v2){ return v2.top-v1.top })
  
  // var lSortedRes = vSortedRes.sort(function(v1, v2){ return v1.left-v2.left });

	return vSortedRes;
}

// ------------------------------------------------
// extract TextItems from the selection
function getTextItemsInSelection(n, texts){
	if(documents.length < 1) return;
  
	var s = activeDocument.selection;
	if (!(s instanceof Array) || s.length < 1) return;

	extractTxtFrames(s, n, texts);
}
function extractTxtFrames(s, n, texts){
	for(var i = 0; i < s.length; i++){
    if(s[i].typename == "TextFrame"){
      texts.push(s[i]);
    } else if(s[i].typename == "GroupItem"){
      extractTxtFrames(s[i].pageItems, n, texts);
    }
	}
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
    if(s[i].typename == "PathItem"){
      if(pp_length_limit
         && s[i].pathPoints.length <= pp_length_limit){
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
