;(function($$) { 
    'use strict';

    // Additional graph analysis algorithms
    $$.fn.eles({
	
	// implemented from pseudocode from wikipedia
	aStar: function(root, goal, heuristic, weightFn, directed) {
	    
	    // Reconstructs the path from Start to End, acumulating the result in pathAcum
	    var reconstructPath = function(start, end, cameFromMap, pathAcum) {
		// Base case
		if (start == end) {
		    return pathAcum;
		}
		
		if (end in cameFromMap) {
		    // We know which node is before the last one
		    var previous = cameFromMap[end];
		    return reconstructPath = function(start, 
						      previous, 
						      cameFromMap, 
						      pathAcum.push(end));
		}

		// We should not reach here!
		return undefined;		
	    };


	    // TODO
	    var findMin = function(openSet, fScore) {


	    };

	    var cy = this._private.cy;
	    directed = !$$.is.fn(weightFn) ? weightFn : directed;
	    weightFn = $$.is.fn(weightFn) ? weightFn : function() {return 1;}; // if not specified, assume each edge has equal weight (1)
	    heuristic = $$.is.fn(heuristic) ? heuristic : function() {return 0;}; // if not specified, assume zero constant heuristic - Will be exactly as running Dijkstra

	    var source = $$.is.string(root) ? this.filter(root)[0] : root[0];
	    var target = $$.is.string(goal) ? this.filter(goal)[0] : goal[0];

	    var closedSet = [];
	    var openSet = [source];
	    var cameFrom = {};
	    var gScore = {};
	    var fScore = {};

	    gScore[source] = 0;
	    fScore[source] = heuristic(source);
	    
	    var edges = this.edges().not(':loop');
	    var nodes = this.nodes();
	    
	    // Main loop 
	    while (openSet.length > 0) {
		var minPos = findMin(openSet, fScore);
		var cMin = openSet[minPos];
		
		// If we've found our goal, then we are done
		if (cMin.id() == target.id()) {

		    var rPath = reconstructPath(source, target, cameFrom, []);
		    return {
			found : true
			, cost : gScore[cMin]
			, path : rPath
		    };
		    
		}
		
		// Add cMin to processed nodes
		closedSet.push(cMin);
		// Remove cMin from boundary nodes
		openSet.splice(minPos, 1);

		// Update scores for neighbors of cMin
		// Take into account if graph is directed or not
		var vwEdges = v.connectedEdges(directed ? '[source = "' + v.id() + '"]' : undefined).intersect(edges); 		
		for (var i = 0; i < vwEdges.length; i++) {
		    var e = vwEdges[i];
		    var w = e.connectedNodes('[id != "' + v.id() + '"]').intersect(nodes);

		    // if node is in closedSet, ignore it
		    if (closedSet.indexOf(w) == -1) {
			continue;
		    }
		    
		    // New tentative score for node w
		    var tempScore = gScore[cMin] + weight(e);

		    // Update gScore for node w if:
		    //   w not present in openSet
		    // OR
		    //   tentative gScore is less than previous value
		    if (openSet.indexOf(w) == -1) {
			gScore[w] = tempScore;
			fScore[w] = tempScore + heuristic(w);
			openSet.push(w); // Add node to openSet
			continue;
		    }
		    // No need to add it to openSet
		    if (tempScore < gScore[w]) {
			gScore[w] = tempScore;
			fScore[w] = tempScore + heuristic(w);
		    }

		} // End of neighbors update


	    } // End of main loop

	    // If we've reached here, then we've not reached our goal
	    return {
		found : false
		, cost : Infinity
		, path : [] 
	    };
	}

    });
    
}) (cytoscape);