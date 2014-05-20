;(function($$) { 
    'use strict';

    // Additional graph analysis algorithms
    $$.fn.eles({
	
	// implemented from pseudocode from wikipedia
	aStar: function(root, goal, directed, heuristic, weightFn) {
	    
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
		var tempScore = fScore[openSet[0].id()];
		for (var i = 1; i < openSet.length; i++) {
		    var s = fScore[openSet[i].id()];
		    if (s < tempScore) {
			tempScore = s;
			minPos = i;
		    }
		}
		return minPos;
	    };

	    var cy = this._private.cy;
	    // If not specified, assume zero constant heuristic
	    // It will be exactly as running Dijkstra
	    heuristic = $$.is.fn(heuristic) ? heuristic : function(a,b) {return 0;};
	    // If not specified, assume each edge has equal weight (1)
	    weightFn = $$.is.fn(weightFn) ? weightFn : function(a) {return 1;};

	    var source = $$.is.string(root) ? this.filter("#" + root)[0] : root[0];
	    var target = $$.is.string(goal) ? this.filter("#" + goal)[0] : goal[0];

	    var closedSet = [];
	    var openSet = [source];
	    var cameFrom = {};
	    var gScore = {};
	    var fScore = {};

	    gScore[source.id()] = 0;
	    fScore[source.id()] = heuristic(source, target);
	    
	    var edges = this.edges().not(':loop');
	    var nodes = this.nodes();

	    // Counter
	    var steps = 0;

	    // Main loop 
	    while (openSet.length > 0) {
		var minPos = findMin(openSet, fScore);
		var cMin = openSet[minPos];
		steps++;
		
		// If we've found our goal, then we are done
		if (cMin.id() == target.id()) {
		    var rPath = reconstructPath(source.id(), target.id(), cameFrom, []);
		    return {
			found : true
			, cost : gScore[cMin.id()]
			, path : rPath.reverse()
			, steps : steps
		    };		    
		}
		
		// Add cMin to processed nodes
		closedSet.push(cMin.id());
		// Remove cMin from boundary nodes
		openSet.splice(minPos, 1);

		// Update scores for neighbors of cMin
		// Take into account if graph is directed or not
		var vwEdges = cMin.connectedEdges(directed ? '[source = "' + cMin.id() + '"]' 
					       : undefined).intersect(edges); 		
		for (var i = 0; i < vwEdges.length; i++) {
		    var e = vwEdges[i];
		    var w = e.connectedNodes('[id != "' + cMin.id() + '"]').intersect(nodes);

		    // if node is in closedSet, ignore it
		    if (closedSet.indexOf(w.id()) != -1) {
			continue;
		    }
		    
		    // New tentative score for node w
		    var tempScore = gScore[cMin.id()] + weightFn(e);

		    // Update gScore for node w if:
		    //   w not present in openSet
		    // OR
		    //   tentative gScore is less than previous value
		    if (openSet.indexOf(w) == -1) {
			gScore[w.id()] = tempScore;
			fScore[w.id()] = tempScore + heuristic(w, target);
			openSet.push(w); // Add node to openSet
			cameFrom[w.id()] = cMin.id();
			continue;
		    }
		    // w already in openSet
		    if (tempScore < gScore[w.id()]) {
			gScore[w.id()] = tempScore;
			fScore[w.id()] = tempScore + heuristic(w, target);
			cameFrom[w.id()] = cMin.id();
		    }

		} // End of neighbors update


	    } // End of main loop

	    // If we've reached here, then we've not reached our goal
	    return {
		found : false
		, cost : Infinity
		, path : [] 
		, steps : steps
	    };
	}

    });
    
}) (cytoscape);