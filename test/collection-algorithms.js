var expect = require('chai').expect;
var cytoscape = require('../build/cytoscape.js', cytoscape);

describe('Graph theory algorithms (traversing, search, etc)', function(){

  var cy;
  var a, b, c, d, e;
  var ae, ab, be, bc, ce, cd, de;

  beforeEach(function(done){
    cytoscape({
      elements: {
        nodes: [
          { data: { id: 'a' } },
          { data: { id: 'b' } },
          { data: { id: 'c' } },
          { data: { id: 'd' } },
          { data: { id: 'e' } }
        ], 
        
        edges: [
          { data: { id: 'ae', weight: 1, source: 'a', target: 'e' } },
          { data: { id: 'ab', weight: 3, source: 'a', target: 'b' } },
          { data: { id: 'be', weight: 4, source: 'b', target: 'e' } },
          { data: { id: 'bc', weight: 5, source: 'b', target: 'c' } },
          { data: { id: 'ce', weight: 6, source: 'c', target: 'e' } },
          { data: { id: 'cd', weight: 2, source: 'c', target: 'd' } },
          { data: { id: 'de', weight: 7, source: 'd', target: 'e' } }
        ]
      },
      ready: function(){
        cy = this;

        a = cy.$('#a');
        b = cy.$('#b');
        c = cy.$('#c');
        d = cy.$('#d');
        e = cy.$('#e');
        
        ae = cy.$('#ae');
        ab = cy.$('#ab');
        be = cy.$('#be');
        bc = cy.$('#bc');
        ce = cy.$('#ce');
        cd = cy.$('#cd');
        de = cy.$('#de');

        done();
      }
    });
  });

  function eles(){
    var col = cy.collection();

    for( var i = 0; i < arguments.length; i++ ){
      var ele = arguments[i];

      col = col.add(ele);
    }

    return col;
  }

  it('eles.bfs() undirected from `a`', function(){
    var expectedDepths = {
      a: 0,
      b: 1,
      e: 1,
      c: 2,
      d: 2
    };

    var depths = {};

    var bfs = cy.elements().bfs(a, function(i, depth){
      depths[ this.id() ] = depth;
    });

    expect( depths ).to.deep.equal( expectedDepths );
    expect( bfs.path.nodes().same( cy.nodes() ) ).to.be.true;
    expect( bfs.path.edges().length ).to.equal( 4 );

    for( var i = 0; i < bfs.path.length; i++ ){
      if( i % 2 === 0 ){
        expect( bfs.path[i].isNode() ).to.be.true;
      } else {
        expect( bfs.path[i].isEdge() ).to.be.true;
      }
    }
  });

  it('eles.bfs() directed from `a`', function(){
    var expectedDepths = {
      a: 0,
      b: 1,
      e: 1,
      c: 2,
      d: 3
    };

    var depths = {};

    var bfs = cy.elements().bfs(a, function(i, depth){
      depths[ this.id() ] = depth;
    }, true);

    expect( depths ).to.deep.equal( expectedDepths );
    expect( bfs.path.nodes().same( cy.nodes() ) ).to.be.true;
    expect( bfs.path.edges().length ).to.equal( 4 );

    for( var i = 0; i < bfs.path.length; i++ ){
      if( i % 2 === 0 ){
        expect( bfs.path[i].isNode() ).to.be.true;
      } else {
        expect( bfs.path[i].isEdge() ).to.be.true;
      }
    }
  });

  it('eles.dfs() undirected from `a`', function(){
    var dfs = cy.elements().dfs(a);

    expect( dfs.path.nodes().same( cy.nodes() ) ).to.be.true;
    expect( dfs.path.edges().length ).to.equal( 4 );

    for( var i = 0; i < dfs.path.length; i++ ){
      if( i % 2 === 0 ){
        expect( dfs.path[i].isNode() ).to.be.true;
      } else {
        expect( dfs.path[i].isEdge() ).to.be.true;
      }
    }
  });

  it('eles.dfs() directed from `a`', function(){
    var dfs = cy.elements().dfs(a, true);

    expect( dfs.path.nodes().same( cy.nodes() ) ).to.be.true;
    expect( dfs.path.edges().length ).to.equal( 4 );

    for( var i = 0; i < dfs.path.length; i++ ){
      if( i % 2 === 0 ){
        expect( dfs.path[i].isNode() ).to.be.true;
      } else {
        expect( dfs.path[i].isEdge() ).to.be.true;
      }
    }
  });

  it('eles.dijkstra() undirected', function(){
    var di = cy.elements().dijkstra(a, function(){
      return this.data('weight');
    });

    expect( di.distanceTo(b) ).to.equal(3);
    expect( di.pathTo(b).same( eles(a, ab, b) ) ).to.be.true;

    expect( di.distanceTo(e) ).to.equal(1);
    expect( di.pathTo(e).same( eles(a, ae, e) ) ).to.be.true;

    expect( di.distanceTo(c) ).to.equal(7);
    expect( di.pathTo(c).same( eles(a, ae, e, ce, c) ) ).to.be.true;

    expect( di.distanceTo(d) ).to.equal(8);
    expect( di.pathTo(d).same( eles(a, ae, e, de, d) ) ).to.be.true;

    var adPath = di.pathTo(d);
    for( var i = 0; i < adPath.length; i++ ){
      if( i % 2 === 0 ){
        expect( adPath[i].isNode() ).to.be.true;
      } else {
        expect( adPath[i].isEdge() ).to.be.true;
      }
    }
  });

  it('eles.dijkstra() directed', function(){
    var di = cy.elements().dijkstra(a, function(){
      return this.data('weight');
    }, true);

    expect( di.distanceTo(b) ).to.equal(3);
    expect( di.pathTo(b).same( eles(a, ab, b) ) ).to.be.true;

    expect( di.distanceTo(e) ).to.equal(1);
    expect( di.pathTo(e).same( eles(a, ae, e) ) ).to.be.true;

    expect( di.distanceTo(c) ).to.equal(8);
    expect( di.pathTo(c).same( eles(a, ab, b, bc, c) ) ).to.be.true;

    expect( di.distanceTo(d) ).to.equal(10);
    expect( di.pathTo(d).same( eles(a, ab, b, bc, c, cd, d) ) ).to.be.true;

    var adPath = di.pathTo(d);
    for( var i = 0; i < adPath.length; i++ ){
      if( i % 2 === 0 ){
        expect( adPath[i].isNode() ).to.be.true;
      } else {
        expect( adPath[i].isEdge() ).to.be.true;
      }
    }
  });

  it('eles.kruskal()', function(){
    var kruskal = cy.elements().kruskal( function(){
      return this.data('weight');
    } );

    expect( kruskal.same( eles(a, b, c, d, e, ae, cd, ab, bc) ) );
  });


  it('eles.kruskal()', function(){
    var kruskal = cy.elements().kruskal( function(){
      return this.data('weight');
    } );

    expect( kruskal.same( eles(a, b, c, d, e, ae, cd, ab, bc) ) );
  });


  it('eles.aStar(): undirected, null heuristic, unweighted', function(){
      var options = {root: a, 
		     goal: b,
		     heuristic: function(a){return 0;}
		    };
      var res = cy.elements().aStar(options);
      expect(res.found).to.equal(true);
      expect(res.distance).to.equal(1);
      expect(res.path).to.deep.equal(["a", "b"]);
  });

  it('eles.aStar(): undirected, null heuristic, unweighted (2)', function(){
      var options = {root: a, 
		     goal: d, 
		     heuristic: function(a){return 0;}
		    };
      var res = cy.elements().aStar(options);
      expect(res.found).to.equal(true);
      expect(res.distance).to.equal(2);
      expect(res.path).to.deep.equal(["a", "e", "d"]);
  });

  it('eles.aStar(): directed, null heuristic, unweighted', function(){
      var options = {root: c, 
		     goal: a, 
		     directed: true,
		     heuristic: function(a){return 0;}
		    };
      var res = cy.elements().aStar(options);
      expect(res.found).to.equal(false);
  });

  it('eles.aStar(): directed, null heuristic, unweighted (2)', function(){
      var options = {root: a, 
		     goal: d, 
		     directed: true,
		     heuristic: function(a){return 0;}
		    };
      var res = cy.elements().aStar(options);
      expect(res.found).to.equal(true);
      expect(res.distance).to.equal(3);
      expect(res.path).to.deep.equal(["a", "b", "c", "d"]);
  });

  it('eles.aStar(): undirected, null heuristic, weighted', function(){
      var options = {root: a, 
		     goal: d, 
		     directed: false, 
		     weight: function() {return this.data('weight');},
		     heuristic: function(a){return 0;}
		    };
      var res = cy.elements().aStar(options);
      expect( res.found ).to.equal(true);
      expect( res.distance ).to.equal(8);
      expect( res.path ).to.deep.equal(["a", "e", "d"]);
  });

  it('eles.aStar(): directed, null heuristic, weighted', function(){
      var options = {root: a, 
		     goal: d, 
		     directed: true, 
		     weight: function() {return this.data('weight');},
		     heuristic: function(a){return 0;}
		    };
      var res = cy.elements().aStar(options);
      expect(res.found).to.equal(true);
      expect(res.distance).to.equal(10);
      expect(res.path).to.deep.equal(["a", "b", "c", "d"]);
  });

  it('eles.aStar(): directed, null heuristic, weighted, not found', function(){
      var options = {root: d, 
		     goal: a, 
		     directed: true, 
		     weight: function() {return this.data('weight');},
		     heuristic: function(a){return 0;}
		    };
      var res = cy.elements().aStar(options);
      expect(res.found).to.equal(false);
      expect(res.distance).to.equal(undefined);
      expect(res.path).to.deep.equal(undefined);
  });

});