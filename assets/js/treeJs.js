// var treeData = [
//     {
//       "name": "0",
//       "children": [
//         {
//           "name": "1",
//           "children": [
//             {
//               "name": "4",
//               "color": "blue",
//             },
//             {
//               "name": "5",
//               "color": "blue",
//             }
//           ],
//           "color": "yellow",
//         },
//         {
//           "name": "2",
//           "color": "blue",
//         },
//         {
//             "name": "3",
//             "children": [
//                 {
//                   "name": "6",
//                   "color": "blue",
//                 },
//                 {
//                   "name": "7",
//                   "color": "blue",
//                 }
//             ],
//             "color": "blue",
//         }
//       ],
//       "color": "blue",
//     }
//   ];

var contadorNodos=0;

var treeData = [
    {
      "name": contadorNodos,
      "parent": "null",
      "color": "green",
      "data": {"a":"b"}
    }
  ];


  var headTree = treeData[0];
  
  
  // ************** Generate the tree diagram	 *****************
  var margin = {top: 20, right: 120, bottom: 20, left: 120},
      width = 960 - margin.right - margin.left,
      height = 500 - margin.top - margin.bottom;
      
  var i = 0,
      duration = 750,
      root;
  
  var tree = d3.layout.tree()
      .size([height, width]);
  
  var diagonal = d3.svg.diagonal()
      .projection(function(d) { return [d.y, d.x]; });
  
  var svg = d3.select("body").append("svg")
      .attr("width", width + margin.right + margin.left)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    var nodeEnter;
  
  root = treeData[0];
  root.x0 = height / 2;
  root.y0 = 0;
    
  update(root);
  
  d3.select(self.frameElement).style("height", "500px");
  
  function  update(source) {
  
    // Compute the new tree layout.
    var nodes = tree.nodes(root).reverse(),
        links = tree.links(nodes);
  
    // Normalize for fixed-depth.
    nodes.forEach(function(d) { d.y = d.depth * 180; });
  
    // Update the nodes…
    var node = svg.selectAll("g.node")
        .data(nodes, function(d) { return d.id || (d.id = ++i); });
  
    // Enter any new nodes at the parent's previous position.
    nodeEnter = node.enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
        .on("click", click);

    nodeEnter.append("circle")
        .attr("r", 1e-6)
        .style("fill",function(d) { return d.color; });

    var html= '<div class = "card">'+
        '<div class="container">'+
        '<p>'+function(d) { return d.data; }+'</p> '+
        '</div>'+
    '</div>';

    // nodeEnter.append("div")
    //     .attr("x", function(d) { return d.children || d._children ? -20 : 15; })
    //     .attr("y", function(d) { return d.children || d._children ? -30 : 0; })
    //     .html(html);
  
    nodeEnter.append("text")
        .attr("x", function(d) { return d.children || d._children ? -13 : 15; })
        .attr("y", function(d) { return d.children || d._children ? -9 : 0; })
        .attr("dy", ".35em")
        .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
        .text(function(d) { return String(d.name); })
        .style("fill-opacity", 1e-6);
  
    // Transition nodes to their new position.
    var nodeUpdate = node.transition()
        .duration(duration)
        .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });
  
    nodeUpdate.select("circle")
        .attr("r", 10)
        .style("fill", function(d) { return d.color; });
  
    nodeUpdate.select("text")
        .style("fill-opacity", 1);
  
    // Transition exiting nodes to the parent's new position.
    var nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
        .remove();
  
    nodeExit.select("circle")
        .attr("r", 1e-6);
  
    nodeExit.select("text")
        .style("fill-opacity", 1e-6);
  
    // Update the links…
    var link = svg.selectAll("path.link")
        .data(links, function(d) { return d.target.id; });
  
    // Enter any new links at the parent's previous position.
    link.enter().insert("path", "g")
        .attr("class", "link")
        .attr("d", function(d) {
          var o = {x: source.x0, y: source.y0};
          return diagonal({source: o, target: o});
        });
  
    // Transition links to their new position.
    link.transition()
        .duration(duration)
        .attr("d", diagonal);
  
    // Transition exiting nodes to the parent's new position.
    link.exit().transition()
        .duration(duration)
        .attr("d", function(d) {
          var o = {x: source.x, y: source.y};
          return diagonal({source: o, target: o});
        })
        .remove();
  
    // Stash the old positions for transition.
    nodes.forEach(function(d) {
      d.x0 = d.x;
      d.y0 = d.y;
    });
  }
  
  
  function findCircle(name){
    var retorno;
    console.log(nodeEnter[0]);

    // for(var i = 0; i < nodeEnter[0].length ; i++){
    //     console.log(nodeEnter[0][i].children[0].style.fill="red");
    // }

    nodeEnter[0].forEach((node) => {
        if(node.textContent == name){
            retorno = node;
            return;
        }
    });
    return retorno;
  }
  

  function click(d) {

    window.clearTimeout();
    // var test = findCircle(d.name);
    var div = document.getElementById('divCard');   
    div.style.position = "absolute";
    // div.style.transform = 'translate('+d.x0+','+d.y0+')';
    div.style.left = (d.y+100)+'px';
    div.style.top = (d.x-20)+'px';
    div.style.display = "inline-block";
    document.getElementById('textCard').innerHTML=String("asdasdasdadsasdasdasdasdads"); //d.data.a

    // setTimeout(() => {
    //     document.getElementById("divCard").style.display = "none";
    // }, 7000);

    // console.log(d);
    // if (d.children) {
    //   d._children = d.children;
    //   d.children = null;
    // } else {
    //   d.children = d._children;
    //   d._children = null;
    // }
    // update(d);


    // test.children[0].style.fill="red";
  }


  function cambiarJson(){
    //   console.log(treeData[0].children[0].color = "yellow");
      treeData[0].children[0].color = "black";
      update(treeData[0]);
  }


  function addCircle(){
    var newCircle = {
        "name": ++contadorNodos,
        "parent": headTree.name,
        "color": "green",
        "data": {"a":"b"}
    }
    if(typeof headTree.children == "undefined"){
        headTree.children = [newCircle];
    }else{
        headTree.children.push(newCircle);
    }
    headTree.color = "blue";
    headTree = newCircle;
    
    update(treeData[0]);
  }

  function disableCircle(){
    headTree.color="red";
    update(treeData[0]);

    headTree = headTree.parent;

    headTree.color="green";
    update(treeData[0]);
  }