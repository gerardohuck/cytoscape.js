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
  });

  it('eles.dfs() undirected from `a`', function(){
    var dfs = cy.elements().dfs(a);

    expect( dfs.path.nodes().same( cy.nodes() ) ).to.be.true;
    expect( dfs.path.edges().length ).to.equal( 4 );
  });

  it('eles.dfs() directed from `a`', function(){
    var dfs = cy.elements().dfs(a, true);

    expect( dfs.path.nodes().same( cy.nodes() ) ).to.be.true;
    expect( dfs.path.edges().length ).to.equal( 4 );
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


  it('eles.aStar(): undirected, no heuristic, unweighted', function(){
      var options = {root: a, 
		     goal: b};
      var res = cy.elements().aStar(options);
      expect( res.found ).to.equal(true);
      expect( res.cost ).to.equal(1);
      expect( res.path ).to.deep.equal(["a", "b"]);
  });

  it('eles.aStar(): undirected, no heuristic, unweighted (2)', function(){
      var options = {root: a, 
		     goal: d};
      var res = cy.elements().aStar(options);
      expect( res.found ).to.equal(true);
      expect( res.cost ).to.equal(2);
      expect( res.path ).to.deep.equal(["a", "e", "d"]);
  });

  it('eles.aStar(): directed, no heuristic, unweighted', function(){
      var options = {root: c, 
		     goal: a, 
		     directed: true};
      var res = cy.elements().aStar(options);
      expect( res.found ).to.equal(false);
  });

  it('eles.aStar(): directed, no heuristic, unweighted (2)', function(){
      var options = {root: a, 
		     goal: d, 
		     directed: true};
      var res = cy.elements().aStar(options);
      expect( res.found ).to.equal(true);
      expect( res.cost ).to.equal(3);
      expect( res.path ).to.deep.equal(["a", "b", "c", "d"]);
  });

});