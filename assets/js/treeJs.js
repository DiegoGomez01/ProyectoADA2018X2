var contadorNodos = 0;

const COLOR_CURRENT_NODE = "green";
const COLOR_DISABLED_NODE = "gray";
const COLOR_OPEN_NODE = "blue";

var treeData = [{
    "name": contadorNodos,
    "parent": "null",
    "color": COLOR_CURRENT_NODE,
    "data": {
        "a": "b"
    }
}];


var headTree = treeData[0];


// ************** Generate the tree diagram	 *****************
var margin = {
        top: 20,
        right: 120,
        bottom: 20,
        left: 120
    },
    width = 1960 - margin.right - margin.left,
    height = 750 - margin.top - margin.bottom;
var i = 0,
    duration = 750,
    root;

var tree = d3.layout.tree()
    .size([height, width]);

var diagonal = d3.svg.diagonal()
    .projection(function (d) {
        return [d.y, d.x];
    });

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

function update(source) {

    // Compute the new tree layout.
    var nodes = tree.nodes(root).reverse(),
        links = tree.links(nodes);

    // Normalize for fixed-depth.
    nodes.forEach(function (d) {
        d.y = d.depth * 180;
    });

    // Update the nodes…
    var node = svg.selectAll("g.node")
        .data(nodes, function (d) {
            return d.id || (d.id = ++i);
        });

    // Enter any new nodes at the parent's previous position.

    var newNodePositionY;
    var newNodePositionX;
    var newNodeData;
    nodeEnter = node.enter().append("g")
        .attr("class", "node")
        .attr("transform", function (d) {
            newNodePositionY = d.y;
            newNodePositionX = d.x;
            newNodeData = d.data;
            return "translate(" + source.y0 + "," + source.x0 + ")";
        });

    // showInfo(newNodePositionX,newNodePositionY,newNodeData);

    nodeEnter.append("circle")
        .attr("r", 1e-6)
        .style("fill", function (d) {
            return d.color;
        });

    nodeEnter.append("text")
        .attr("x", function (d) {
            return d.children || d._children ? -13 : 15;
        })
        .attr("y", function (d) {
            return d.children || d._children ? -9 : 0;
        })
        .attr("dy", ".35em")
        .attr("text-anchor", function (d) {
            return d.children || d._children ? "end" : "start";
        })
        .text(function (d) {
            return String(d.name);
        })
        .style("fill-opacity", 1e-6);

    // Transition nodes to their new position.
    var nodeUpdate = node.transition()
        .duration(duration)
        .attr("transform", function (d) {
            return "translate(" + d.y + "," + d.x + ")";
        });

    nodeUpdate.select("circle")
        .attr("r", 10)
        .style("fill", function (d) {
            return d.color;
        });

    nodeUpdate.select("text")
        .style("fill-opacity", 1);

    // Transition exiting nodes to the parent's new position.
    var nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function (d) {
            return "translate(" + source.y + "," + source.x + ")";
        })
        .remove();

    nodeExit.select("newCirclecircle")
        .attr("r", 1e-6);

    nodeExit.select("text")
        .style("fill-opacity", 1e-6);

    // Update the links…
    var link = svg.selectAll("path.link")
        .data(links, function (d) {
            return d.target.id;
        });

    // Enter any new links at the parent's previous position.
    link.enter().insert("path", "g")
        .attr("class", "link")
        .attr("d", function (d) {
            var o = {
                x: source.x0,
                y: source.y0
            };
            return diagonal({
                source: o,
                target: o
            });
        });

    // Transition links to their new position.
    link.transition()
        .duration(duration)
        .attr("d", diagonal);

    // Transition exiting nodes to the parent's new position.
    link.exit().transition()
        .duration(duration)
        .attr("d", function (d) {
            var o = {
                x: source.x,
                y: source.y
            };
            return diagonal({
                source: o,
                target: o
            });
        })
        .remove();

    // Stash the old positions for transition.
    nodes.forEach(function (d) {
        d.x0 = d.x;
        d.y0 = d.y;
    });
}


function findCircle(name) {
    var retorno;
    console.log(nodeEnter[0]);

    // for(var i = 0; i < nodeEnter[0].length ; i++){
    //     console.log(nodeEnter[0][i].children[0].style.fill=COLOR_DISABLED_NODE);
    // }

    nodeEnter[0].forEach((node) => {
        if (node.textContent == name) {
            retorno = node;
            return;
        }
    });
    return retorno;
}


function showInfo(positionX, postitionY, data) {
    console.log(positionX, postitionY, data);
    window.clearTimeout();
    var div = document.createElement('div');
    div.className = 'card';
    div.style.position = "absolute";
    div.style.left = (postitionY + 60) + 'px';
    div.style.top = (positionX - 20) + 'px';
    div.style.display = "inline-block";
    var divContainer = document.createElement('div');
    divContainer.className = 'container';
    div.appendChild(divContainer);
    var textCard = document.createElement('p');
    textCard.innerHTML = String("asdasdasdads");
    divContainer.appendChild(textCard);

    document.getElementsByTagName('body')[0].appendChild(div);
}


function cambiarJson() {
    treeData[0].children[0].color = "black";
    update(treeData[0]);
}


function addCircle() {
    var newCircle = {
        "name": ++contadorNodos,
        "parent": headTree.name,
        "color": COLOR_CURRENT_NODE,
        "data": {
            "a": "b"
        }
    }
    if (typeof headTree.children == "undefined") {
        headTree.children = [newCircle];
    } else {
        headTree.children.push(newCircle);
    }
    headTree.color = COLOR_OPEN_NODE;
    headTree = newCircle;
    update(treeData[0]);
}

function disableCircle() {
    headTree.color = COLOR_DISABLED_NODE;
    update(treeData[0]);
    headTree = headTree.parent;
    headTree.color = COLOR_CURRENT_NODE;
    update(treeData[0]);
}

function resetTree() {
    if (treeData[0].children) {
        delete treeData[0].children;
        treeData[0].color = COLOR_CURRENT_NODE;
        headTree = treeData[0];
        contadorNodos = 0;
        update(treeData[0]);
    }
}