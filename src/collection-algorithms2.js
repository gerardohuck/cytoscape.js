;(function($$) { 
    'use strict';

    // Additional graph analysis algorithms
    $$.fn.eles({

	// Implemented from pseudocode from wikipedia

	// options => options object
	//    root // starting node (either element or selector string)
	//    weight: function( edge ){} // specifies weight to use for `edge`/`this`. If not present, it will be asumed a weight of 1 for all edges
	//    heuristic: function( node ){} // specifies heuristic value for `node`/`this`
	//    directed // default false
	//    goal // target node (either element or selector string). Optional. If present, computation will end if path to goal is found

	// retObj => returned object by function
	// found : true/false // whether a path from root to goal has been found
	// distance // Distance for the shortest path from root to goal
	// path // Array of ids of nodes in shortest path
	aStar: function(options) {

	    var logDebug = function() {
		if (debug) {
		    console.log.apply(console, arguments);
		}
	    };

	    // Reconstructs the path from Start to End, acumulating the result in pathAcum
	    var reconstructPath = function(start, end, cameFromMap, pathAcum) {
		// Base case
		if (start == end) {
		    pathAcum.push(end);
		    return pathAcum;
		}
		
		if (end in cameFromMap) {
		    // We know which node is before the last one
		    var previous = cameFromMap[end];
		    pathAcum.push(end)
		    return reconstructPath(start, 
					   previous, 
					   cameFromMap, 
					   pathAcum);
		}

		// We should not reach here!
		return undefined;		
	    };

	    // Returns the index of the element in openSet which has minimum fScore
	    var findMin = function(openSet, fScore) {
		if (openSet.length == 0) {
		    // Should never be the case
		    return undefined;
		}
		var minPos = 0;
		var tempScore = fScore[openSet[0]];
		for (var i = 1; i < openSet.length; i++) {
		    var s = fScore[openSet[i]];
		    if (s < tempScore) {
			tempScore = s;
			minPos = i;
		    }
		}
		return minPos;
	    };

	    // Parse options
	    // debug - optional
	    if (typeof options.debug !== undefined) {
		var debug = options.debug;
	    } else {
		var debug = false;
	    }
	    
	    logDebug("Starting aStar..."); 
	    var cy = this._private.cy;

	    // root - mandatory!
	    if (typeof options.root !== undefined) {		
		var source = $$.is.string(options.root) ? 
		    // use it as a selector, e.g. "#rootID
		    this.filter(options.root)[0] : 
		    options.root[0];
		logDebug("Source node: %s", source.id()); 
	    } else {
		return undefined;
	    }
	    
	    // goal - mandatory!
	    if (typeof options.goal !== undefined) {		
		var target = $$.is.string(options.goal) ? 
		    // use it as a selector, e.g. "#goalID
		    this.filter(options.goal)[0] : 
		    options.goal[0];
		logDebug("Target node: %s", target.id()); 
	    } else {
		return undefined;
	    }

	    // Heuristic function - optional
	    if (typeof options.heuristic !== undefined && $$.is.fn(options.heuristic)) {		
		var heuristic = options.heuristic;
	    } else {
		console.error("Missing required parameter (heuristic)! Aborting.");
		return;
	    }

	    // Weight function - optional
	    if (typeof options.weight !== undefined && $$.is.fn(options.weight)) {		
		var weightFn = options.weight;
	    } else {
		// If not specified, assume each edge has equal weight (1)
		var weightFn = function(e) {return 1;};
	    }

	    // directed - optional
	    if (typeof options.directed !== undefined) {		
		var directed = options.directed;
	    } else {
		var directed = false;
	    }

	    var closedSet = [];
	    var openSet = [source.id()];
	    var cameFrom = {};
	    var gScore = {};
	    var fScore = {};

	    gScore[source.id()] = 0;
	    fScore[source.id()] = heuristic(source);
	    
	    var edges = this.edges().not(':loop');
	    var nodes = this.nodes();

	    // Counter
	    var steps = 0;

	    // Main loop 
	    while (openSet.length > 0) {
		var minPos = findMin(openSet, fScore);
		var cMin = this.filter("#" + openSet[minPos])[0];
		steps++;

		logDebug("\nStep: %s", steps);
		logDebug("Processing node: %s, fScore = %s", cMin.id(), fScore[cMin.id()]);
		
		// If we've found our goal, then we are done
		if (cMin.id() == target.id()) {
		    logDebug("Found goal node!");
		    var rPath = reconstructPath(source.id(), target.id(), cameFrom, []);
		    rPath.reverse();
		    logDebug("Path: %s", rPath);
		    return {
			found : true
			, distance : gScore[cMin.id()]
			, path : rPath
			, steps : steps
		    };		    
		}
		
		// Add cMin to processed nodes
		closedSet.push(cMin.id());
		// Remove cMin from boundary nodes
		openSet.splice(minPos, 1);
		logDebug("Added node to closedSet, removed from openSet.");
		logDebug("Processing neighbors...");

		// Update scores for neighbors of cMin
		// Take into account if graph is directed or not
		var vwEdges = cMin.connectedEdges(directed ? '[source = "' + cMin.id() + '"]' 
					       : undefined).intersect(edges); 		
		for (var i = 0; i < vwEdges.length; i++) {
		    var e = vwEdges[i];
		    var w = e.connectedNodes('[id != "' + cMin.id() + '"]').intersect(nodes);

		    logDebug("   processing neighbor: %s", w.id());
		    // if node is in closedSet, ignore it
		    if (closedSet.indexOf(w.id()) != -1) {
			logDebug("   already in closedSet, ignoring it.");
			continue;
		    }
		    
		    // New tentative score for node w
		    var tempScore = gScore[cMin.id()] + weightFn.apply(e, [e]);
		    logDebug("   tentative gScore: %d", tempScore);

		    // Update gScore for node w if:
		    //   w not present in openSet
		    // OR
		    //   tentative gScore is less than previous value

		    // w not in openSet
		    if (openSet.indexOf(w.id()) == -1) {
			gScore[w.id()] = tempScore;
			fScore[w.id()] = tempScore + heuristic(w);
			openSet.push(w.id()); // Add node to openSet
			cameFrom[w.id()] = cMin.id();
			logDebug("   not in openSet, adding it. ");
			logDebug("   fScore(%s) = %s", w.id(), tempScore);
			continue;
		    }
		    // w already in openSet, but with greater gScore
		    if (tempScore < gScore[w.id()]) {
			gScore[w.id()] = tempScore;
			fScore[w.id()] = tempScore + heuristic(w);
			cameFrom[w.id()] = cMin.id();
			logDebug("   better score, replacing gScore. ");
			logDebug("   fScore(%s) = %s", w.id(), tempScore);
		    }

		} // End of neighbors update

	    } // End of main loop

	    // If we've reached here, then we've not reached our goal
	    logDebug("Reached end of computation without finding our goal");
	    return {
		found : false
		, cost : undefined
		, path : undefined 
		, steps : steps
	    };
	}, // aStar()


	// Implemented from pseudocode from wikipedia

	// options => options object
	//    weight: function( edge ){} // specifies weight to use for `edge`/`this`. If not present, it will be asumed a weight of 1 for all edges
	//    directed // default false
	
	// retObj => returned object by function
	// ??
	floydWarshall: function(options) {

	    var logDebug = function() {
		if (debug) {
		    console.log.apply(console, arguments);
		}
	    };

	    // Parse options
	    // debug - optional
	    if (typeof options.debug !== undefined) {
		var debug = options.debug;
	    } else {
		var debug = false;
	    }

	    logDebug("Starting floydWarshall..."); 
	    var cy = this._private.cy;

	    // Weight function - optional
	    if (typeof options.weight !== undefined && $$.is.fn(options.weight)) {		
		var weightFn = options.weight;
	    } else {
		// If not specified, assume each edge has equal weight (1)
		var weightFn = function(e) {return 1;};
	    }

	    // directed - optional
	    if (typeof options.directed !== undefined) {		
		var directed = options.directed;
	    } else {
		var directed = false;
	    }

	    var edges = this.edges().not(':loop');
	    var nodes = this.nodes();


	}, // floydWarshall
    }); // $$.fn.eles({

    
}) (cytoscape);