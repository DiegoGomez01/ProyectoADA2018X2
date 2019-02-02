
var matriz = [[1,2,3],[4,5,6],[4,5,6],[4,5,6],[4,5,6],[4,5,6],[4,5,6],[4,5,6]];
var idMatriz="testMatriz";

function drawMatriz(){
    
    var htmlMatriz='<div id="'+idMatriz+'" class="divMatrix">'+
                        '<table class="table table-bordered table-sm">'

    for(var i=0;i<matriz.length;i++){
        htmlMatriz += '<tr>'
        for(var j=0;j<matriz[0].length;j++){
            htmlMatriz += '<td id="'+idMatriz+'-'+i+'-'+j+'">'
            htmlMatriz += '<span id="animationVariableMatirz'+'-'+i+'-'+j+'" style="display: block;">'+matriz[i][j]+'</span>';
            // htmlMatriz += matriz[i][j];
            htmlMatriz += '</td>'
        }
        htmlMatriz += '</tr>'
    }

    htmlMatriz += '</table>'+
    '</div> &emsp;';

    addMatrizView(htmlMatriz);
    
}

function drawCell(i,j){
    document.getElementById(idMatriz+'-'+i+'-'+j).setAttribute("style", "background:red");
    setTimeout(() => {
        unsealCell(i,j);
    }, 2000);
    setTimeout(() => {
        animationChangeVariable(i,j);
    }, 3000);
    setTimeout(() => {
        changeValueCell(i,j,999);
    }, 4000);
}

function animationChangeVariable(i,j){
	$('#animationVariableMatirz'+'-'+i+'-'+j).removeClass().addClass('shake animated').one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){
		$(this).removeClass();
	});
}

function unsealCell(i,j){
    document.getElementById(idMatriz+'-'+i+'-'+j).removeAttribute("style");
}

function changeValueCell(i,j,value){
    matriz[i][j]=value;
    document.getElementById(idMatriz+'-'+i+'-'+j).innerHTML = value;
}

function addMatrizView(htmlMatriz){
    $('#wrapMatriz').append(htmlMatriz);
}

function removeMatrizView(idMatriz){
    $('#wrapMatriz').remove(idMatriz);
}