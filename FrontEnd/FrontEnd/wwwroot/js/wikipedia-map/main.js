// This script contains the code that creates the central network, as well as
// a function for resetting it to a brand new page.


var nodes, edges, network; //Global variables
var startpages = [];
// Tracks whether the network needs to be reset. Used to prevent deleting nodes
// when multiple nodes need to be created, because AJAX requests are async.
var needsreset = true;

var container = document.getElementById('container');
//Global options
var options = {
  nodes: {
    shape: 'dot',
    scaling: { min: 20,max: 30,
      label: { min: 14, max: 30, drawThreshold: 9, maxVisible: 20 }
    },
    font: {size: 14, face: 'Helvetica Neue, Helvetica, Arial'}
  },
  interaction: {
    hover: true,
    hoverConnectedEdges: false,
    selectConnectedEdges: true,
  },
};

var nodes = new vis.DataSet();
var edges = new vis.DataSet();
var data = {nodes:nodes,edges:edges};
var initialized = false;


//Make the network
function makeNetwork() {
  network = new vis.Network(container,data,options);
  bindNetwork();
  initialized=true;
}


// Reset the network to be new each time.
function resetNetwork(start, name) {
    if (!initialized) makeNetwork();
    document.getElementById("submit").innerHTML = '<i class="icon ion-refresh"> </i>';
    var startID = getNeutralId(start);
    var paths = apiproxy.getPaths(startID);
    
    startpages = []; // Register the page as an origin node
    tracenodes = [];
    traceedges = [];
    nodes = new vis.DataSet();
    edges = new vis.DataSet();

    for (var i = 0; i < paths.length;i++) {
        var lastNode = "";
        for (var j = 0; j < paths[i].length; j++) {
            var ndId = paths[i][j];
            var ndName = apiproxy.getEntity(ndId)['name'];
            console.log(ndId);
            if (lastNode == "") {
                if (nodes.getIds().indexOf(ndId) == -1) {
                    startpages.push(ndId)
                    nodes.add([
                        {
                            id: ndId, label: wordwrap(decodeURIComponent(ndName), 20), value: 2, level: 0,
                            color: getColor(0), x: 0, y: 0, parent: ndId, isMethod: false, isExpand: false
                        } // Parent is self
                    ]);
                }
               lastNode = ndId;
            } else {
                startpages.push(ndId)
                if (nodes.getIds().indexOf(ndId) == -1) {
                    startpages.push(ndId)
                    nodes.add([
                        {
                            id: ndId, label: wordwrap(decodeURIComponent(ndName), 20), value: 2, level: 4,
                            color: getColor(0), x: 0, y: 0, parent: lastNode, isMethod: false, isExpand: false
                        } // Parent is self
                    ]);
                }
                if (!getEdgeConnecting(lastNode, ndId)) { //Don't create duplicate edges in same direction
                    edges.add([{
                        from: lastNode, to: ndId, color: getEdgeColor(1),
                        level: 1, selectionWidth: 2, hoverWidth: 0
                    }]);
                }
                lastNode = ndId;

            }
        }
    }
    data = { nodes: nodes, edges: edges };
    network.setData(data);
}
 

  // Change "go" button to a refresh icon
 

  // -- CREATE NETWORK -- //
  //Make a container
  
  //Put the data in the container
  


// Add a new start node to the map.
function addStart(start, url) {
  var name = apiproxy.getEntity(start)['name'];
  
  if (needsreset) {
    // Delete everything only for the first call to addStart by tracking needsreset
      resetNetwork(start, name);
    needsreset = false;
    return;

  } else {
      var startID = getNeutralId(start);
      //console.log(startID);
    startpages.push(startID);
    nodes.add([
      {id:startID, label:wordwrap(decodeURIComponent(name),20), value:2, level:0,
            color: getColor(0), x: 0, y: 0, parent: startID, isMethod:false, isExpand: false} // Parent is self
    ]);
  }
}


// Reset the network with the content from the input box.
function resetNetworkFromInput() {
  // Network should be reset
  needsreset = true;
  var cf = document.getElementsByClassName("commafield")[0];
  // Items entered.
    var inputs = getItems(cf);
    inputs = ['drive'];
  // If no input is given, prompt user to enter articles
  if (!inputs[0]) {
    noInputDetected();
    return;
  }


  for (var i=0; i<inputs.length; i++) {
    getPageName(encodeURI(inputs[i]), addStart);
  }
}

// Reset the network with the content from the input box.
function resetNetworkFromInputDefault() {
    // Network should be reset
    //console.log(apiproxy.getDefaultEntity());
    needsreset = true;
    getPageName(apiproxy.getDefaultEntity()['id'], addStart);
}


// Reset the network with one or more random pages.
function randomReset() {
  needsreset = true;
  clearItems(cf);
  // Function to add a single random page to the network as a start.
  var addRandomStart = function() {
    getRandomName(function(data){
      addStart(data);
      addItem(cf, decodeURIComponent(data));
    });
  };

  if (Math.random() < 0.3) { // 3 in 10 chance of creating multiple nodes
    // Add multiple nodes (2 or 3)
    for (var i=0; i<=Math.ceil(Math.random() * 2); i++) {
      // Unfortunately, random calls need to be at least 1 second apart due to
      // what looks like crappy random algorithms on Wikimedia's end. Even with
      // 1 second, duplicates still occasionally happen, hence the try / catch.
      // I may eventually be able to fix it by implementing my own page
      // randomizer.
      try {
        setTimeout(addRandomStart, 1000*i);
      } catch (e) {}
    }
  } else {
    // Add a single random node (most likely)
    addRandomStart();
  }
}

// Reset the network with content from a JSON string
function resetNetworkFromJson(data) {
  if (!initialized) makeNetwork();
  var obj = networkFromJson(data);
  nodes = obj.nodes;
  edges = obj.edges;
  startpages = obj.startpages;
  // Fill the network
  network.setData({nodes:nodes, edges:edges});
  // Populate the top bar
  for (var i=0; i<startpages.length; i++) {
    addItem(document.getElementById("input"), nodes.get(startpages[i]).label);
  }
  // Transform the "go" button to a "refresh" button
  document.getElementById("submit").innerHTML = '<i class="icon ion-refresh"> </i>';
}
