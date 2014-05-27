;(function($$) { 
    'use strict';

    // Additional graph analysis algorithms
    $$.fn.eles({

	// Implemented from pseudocode from wikipedia

	// options => options object
	//    root // starting node (either element or selector string)
	//    weight: function( edge ){} // specifies weight to use for `edge`/`this`
	//    heuristic: function( node ){} // specifies heuristic value for `node`/`this`
	//    directed // default false
	//    goal // target node (either element or selector string). Optional. If present, computation will end if path to goal is found

	// retObj => returned object by function
	// distanceTo: function( node ){} // returns numeric total to specified destination node, may be undefined if no path or exited early so no path found
	// pathTo: function( node ){} // returns path collection in node-edge-node order, may be empty collection if no path
	aStar: function(options) {

	    var logDebug = function() {
		if (debug) {
		    //console.log(text);
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
	    
	    logDebug("Starting aStar."); 
	    var cy = this._private.cy;

	    // root - mandatory!
	    if (typeof options.root !== undefined) {		
		var source = $$.is.string(options.root) ? 
		    this.filter("#" + options.root)[0] : 
		    options.root[0];
		logDebug("Source node: %s", source.id()); 
	    } else {
		return undefined;
	    }
	    
	    // goal - mandatory!
	    if (typeof options.goal !== undefined) {		
		var target = $$.is.string(options.goal) ? 
		    this.filter("#" + options.goal)[0] : 
		    options.goal[0];
		logDebug("Target node: %s", target.id()); 
	    } else {
		return undefined;
	    }

	    // Heuristic function - optional
	    if (typeof options.heuristic !== undefined && $$.is.fn(options.heuristic)) {		
		var heuristic = options.heuristic;
	    } else {
		// If not specified, assume zero constant heuristic
		// It will be exactly as running Dijkstra
		var heuristic = function(a) {return 0;};
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
			, distanceTo : undefined
			, pathTo : undefined
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
		, path : [] 
		, steps : steps
		, distanceTo : undefined
		, pathTo : undefined
	    };
	}

    });
    
}) (cytoscape);