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
	    if (typeof options.debug !== "undefined") {
		var debug = options.debug;
	    } else {
		var debug = false;
	    }
	    
	    logDebug("Starting aStar..."); 
	    var cy = this._private.cy;

	    // root - mandatory!
	    if (typeof options.root !== "undefined") {		
		var source = $$.is.string(options.root) ? 
		    // use it as a selector, e.g. "#rootID
		    this.filter(options.root)[0] : 
		    options.root[0];
		logDebug("Source node: %s", source.id()); 
	    } else {
		return undefined;
	    }
	    
	    // goal - mandatory!
	    if (typeof options.goal !== "undefined") {		
		var target = $$.is.string(options.goal) ? 
		    // use it as a selector, e.g. "#goalID
		    this.filter(options.goal)[0] : 
		    options.goal[0];
		logDebug("Target node: %s", target.id()); 
	    } else {
		return undefined;
	    }

	    // Heuristic function - optional
	    if (typeof options.heuristic !== "undefined" && $$.is.fn(options.heuristic)) {		
		var heuristic = options.heuristic;
	    } else {
		console.error("Missing required parameter (heuristic)! Aborting.");
		return;
	    }

	    // Weight function - optional
	    if (typeof options.weight !== "undefined" && $$.is.fn(options.weight)) {		
		var weightFn = options.weight;
	    } else {
		// If not specified, assume each edge has equal weight (1)
		var weightFn = function(e) {return 1;};
	    }

	    // directed - optional
	    if (typeof options.directed !== "undefined") {		
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
	// pathTo : function(fromId, toId) // Returns the shortest path from node with ID "fromID" to node with ID "toId", as an array of node IDs
	// distanceTo: function(fromId, toId) // Returns the distance of the shortest path from node with ID "fromID" to node with ID "toId"
	floydWarshall: function(options) {

	    var logDebug = function() {
		if (debug) {
		    console.log.apply(console, arguments);
		}
	    };

	    // Parse options
	    // debug - optional
	    if (typeof options.debug !== "undefined") {
		var debug = options.debug;
	    } else {
		var debug = false;
	    }

	    logDebug("Starting floydWarshall..."); 

	    var cy = this._private.cy;

	    // Weight function - optional
	    if (typeof options.weight !== "undefined" && $$.is.fn(options.weight)) {		
		var weightFn = options.weight;
	    } else {
		// If not specified, assume each edge has equal weight (1)
		var weightFn = function(e) {return 1;};
	    }

	    // directed - optional
	    if (typeof options.directed !== "undefined") {		
		var directed = options.directed;
	    } else {
		var directed = false;
	    }

	    var edges = this.edges().not(':loop');
	    var nodes = this.nodes();
	    var numNodes = nodes.length;

	    // mapping: node id -> position in nodes array
	    var id2position = {};
	    for (var i = 0; i < numNodes; i++) {
		id2position[nodes[i].id()] = i;
	    }	    

	    // Initialize distance matrix
	    var dist = [];
	    for (var i = 0; i < numNodes; i++) {
		var newRow = new Array(numNodes);
		for (var j = 0; j < numNodes; j++) {
		    if (i == j) {
			newRow[j] = 0;
		    } else {
			newRow[j] = Infinity;
		    }
		}
		dist.push(newRow);
	    }	   	    

	    // Initialize matrix used for path reconstruction
	    // Initialize distance matrix
	    var next = [];
	    for (var i = 0; i < numNodes; i++) {
		var newRow = new Array(numNodes);
		for (var j = 0; j < numNodes; j++) {
		    newRow[j] = undefined;
		}
		next.push(newRow);
	    }
	    
	    // Process edges
	    for (var i = 0; i < edges.length ; i++) {	    
		var sourceIndex = id2position[edges[i].source().id()];
		var targetIndex = id2position[edges[i].target().id()];	
		var weight = weightFn.apply(edges[i], [edges[i]]);
		
		// Check if already process another edge between same 2 nodes
		if (dist[sourceIndex][targetIndex] > weight) {
		    dist[sourceIndex][targetIndex] = weight
		    next[sourceIndex][targetIndex] = targetIndex;
		}
	    }

	    // If undirected graph, process 'reversed' edges
	    if (!directed) {
		for (var i = 0; i < edges.length ; i++) {	    
		    var sourceIndex = id2position[edges[i].target().id()];	
		    var targetIndex = id2position[edges[i].source().id()];
		    var weight = weightFn.apply(edges[i], [edges[i]]);
		    
		    // Check if already process another edge between same 2 nodes
		    if (dist[sourceIndex][targetIndex] > weight) {
			dist[sourceIndex][targetIndex] = weight
			next[sourceIndex][targetIndex] = targetIndex;
		    }
		}
	    }

	    // Main loop
	    for (var k = 0; k < numNodes; k++) {
		for (var i = 0; i < numNodes; i++) {
		    for (var j = 0; j < numNodes; j++) {			
			if (dist[i][k] + dist[k][j] < dist[i][j]) {
			    dist[i][j] = dist[i][k] + dist[k][j];
			    next[i][j] = next[i][k];
			}
		    }
		}
	    }

	    // Build result object	   
	    var position2id = [];
	    for (var i = 0; i < numNodes; i++) {
		position2id.push(nodes[i].id());
	    }

	    var res = {
		distanceTo: function(from, to) {
		    if ($$.is.string(from)) {
			// from is a selector string
			var fromId = (cy.filter(from)[0]).id();
		    } else {
			// from is a node
			var fromId = from.id();
		    }

		    if ($$.is.string(to)) {
			// to is a selector string
			var toId = (cy.filter(to)[0]).id();
		    } else {
			// to is a node
			var toId = to.id();
		    }

		    return dist[id2position[fromId]][id2position[toId]];
		},

		pathTo : function(from, to) {
		    var reconstructPathAux = function(from, to, next, position2id) {
			if (from === to) {
			    return [position2id[from]];
			}
			if (next[from][to] === undefined) {
			    return undefined;
			}
			var path = [position2id[from]];
			while (from !== to) {
			    from = next[from][to];
			    path.push(position2id[from]);
			}
			return path;
		    };

		    if ($$.is.string(from)) {
			// from is a selector string
			var fromId = (cy.filter(from)[0]).id();
		    } else {
			// from is a node
			var fromId = from.id();
		    }

		    if ($$.is.string(to)) {
			// to is a selector string
			var toId = (cy.filter(to)[0]).id();
		    } else {
			// to is a node
			var toId = to.id();
		    }
		    return reconstructPathAux(id2position[fromId], 
					      id2position[toId], 
					      next,
					      position2id);
		},
	    };

	    return res;

	}, // floydWarshall


	// Implemented from pseudocode from wikipedia
	// options => options object
	//    root: starting node (either element or selector string)
	//    weight: function( edge ){} // specifies weight to use for `edge`/`this`. If not present, it will be asumed a weight of 1 for all edges
	//    directed // default false
	// retObj => returned object by function
	// pathTo : function(toId) // Returns the shortest path from root node to node with ID "toId", as an array of node IDs
	// distanceTo: function(toId) // Returns the distance of the shortest path from root node to node with ID "toId"
	bellmanFord: function(options) {

	    var logDebug = function() {
		if (debug) {
		    console.log.apply(console, arguments);
		}
	    };

	    // Parse options
	    // debug - optional
	    if (typeof options.debug !== "undefined") {
		var debug = options.debug;
	    } else {
		var debug = false;
	    }

	    logDebug("Starting bellmanFord..."); 

	    // Weight function - optional
	    if (typeof options.weight !== "undefined" && $$.is.fn(options.weight)) {		
		var weightFn = options.weight;
	    } else {
		// If not specified, assume each edge has equal weight (1)
		var weightFn = function(e) {return 1;};
	    }

	    // directed - optional
	    if (typeof options.directed !== "undefined") {		
		var directed = options.directed;
	    } else {
		var directed = false;
	    }

	    // root - mandatory!
	    if (typeof options.root !== "undefined") {		
		if ($$.is.string(options.root)) {
		    // use it as a selector, e.g. "#rootID
		    var source = this.filter(options.root)[0];
		} else {
		    var source = options.root[0];
		}
		logDebug("Source node: %s", source.id()); 
	    } else {
		console.error("options.root required");
		return undefined;
	    }

	    var cy = this._private.cy;
	    var edges = this.edges().not(':loop');
	    var nodes = this.nodes();
	    var numNodes = nodes.length;

	    // mapping: node id -> position in nodes array
	    var id2position = {};
	    for (var i = 0; i < numNodes; i++) {
		id2position[nodes[i].id()] = i;
	    }	    

	    // Initializations
	    var cost = [];
	    var predecessor = [];
	    
	    for (var i = 0; i < numNodes; i++) {
		if (nodes[i].id() === source.id()) {
		    cost[i] = 0;
		} else {
		    cost[i] = Infinity;
		}    
		predecessor[i] = undefined;
	    }
	    
	    // Edges relaxation	   
	    var flag = false;
	    for (var i = 1; i < numNodes; i++) {
		flag = false;
		for (var e = 0; e < edges.length; e++) {
		    var sourceIndex = id2position[edges[e].source().id()];
		    var targetIndex = id2position[edges[e].target().id()];	
		    var weight = weightFn.apply(edges[e], [edges[e]]);
		    
		    var temp = cost[sourceIndex] + weight;
		    if (temp < cost[targetIndex]) {
			cost[targetIndex] = temp;
			predecessor[targetIndex] = sourceIndex;
			flag = true;
		    }

		    // If undirected graph, we need to take into account the 'reverse' edge
		    if (!directed) {
			var temp = cost[targetIndex] + weight;
			if (temp < cost[sourceIndex]) {
			    cost[sourceIndex] = temp;
			    predecessor[sourceIndex] = targetIndex;
			    flag = true;
			}
		    }
		}

		if (!flag) {
		    break;
		}
	    }	   
	    	    
	    if (flag) {
		// Check for negative weight cycles
		for (var e = 0; e < edges.length; e++) {
		    var sourceIndex = id2position[edges[e].source().id()];
		    var targetIndex = id2position[edges[e].target().id()];	
		    var weight = weightFn.apply(edges[e], [edges[e]]);
		    
		    if (cost[sourceIndex] + weight < cost[targetIndex]) {
			console.error("Error: graph contains a negative weigth cycle!"); 
			return undefinded;
		    }
		}	    
	    }

	    // Build result object	   
	    var position2id = [];
	    for (var i = 0; i < numNodes; i++) {
		position2id.push(nodes[i].id());
	    }
	    

	    var res = {		
		distanceTo : function(to) {
		    if ($$.is.string(to)) {
			// to is a selector string
			var toId = (cy.filter(to)[0]).id();
		    } else {
			// to is a node
			var toId = to.id();
		    }

		    return cost[id2position[toId]];
		}, 

		pathTo : function(to) {

		    var reconstructPathAux = function(predecessor, fromPos, toPos, position2id, acumPath) {
			// Add toId to path
			acumPath.push(position2id[toPos]);		
			if (fromPos === toPos) {
			    // reached starting node
			    return acumPath;
			}
			// If no path exists, discart acumulated path and return undefined
			var predPos = predecessor[toPos];
			if (typeof predPos === "undefined") {
			    return undefined;
			}
			// recursively compute path until predecessor of toId
			return reconstructPathAux(predecessor, 
						  fromPos, 
						  predPos, 
						  position2id, 
						  acumPath);
		    };

		    if ($$.is.string(to)) {
			// to is a selector string
			var toId = (cy.filter(to)[0]).id();
		    } else {
			// to is a node
			var toId = to.id();
		    }
		    var path = [];

		    // This returns a reversed path 
		    var res =  reconstructPathAux(predecessor, 
					      id2position[source.id()],
					      id2position[toId], 
					      position2id, 
					      path);

		    // Get it in the correct order and return it
		    if (typeof res !== "undefined") {
			res.reverse();
		    }
		    return res;					      
		}, 
	    };

	    return res;

	}, // bellmanFord



    }); // $$.fn.eles

}) (cytoscape);