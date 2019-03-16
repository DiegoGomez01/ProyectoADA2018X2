
var matriz = [[23,22,3],[4,5,3336],[24,5,6],[34,5,6],[44,55,6],[4,5555,6],[4,5,36],[4,5,6]];
var idMatriz="testMatriz";

function drawMatriz(){
    
    var htmlMatriz='<div id="'+idMatriz+'" class="divMatrix">'+
                    '<table class="table table-bordered table-sm" style="table-layout: fixed">';

    htmlMatriz += '<thead><tr><th scope="col">#</th>'
    for(var i =0; i<matriz[0].length;i++){
        htmlMatriz += '<th scope="col">'+i+'</th>';
    }
    htmlMatriz += ' </tr></thead><tbody>'

    for(var i=0;i<matriz.length;i++){
        htmlMatriz += '<tr><th scope="row">'+i+'</th>'
        for(var j=0;j<matriz[0].length;j++){
            htmlMatriz += '<td id="'+idMatriz+'-'+i+'-'+j+'">'
            htmlMatriz += '<span id="animationVariableMatirz'+'-'+i+'-'+j+'" style="display: block;">'+matriz[i][j]+'</span>';
            htmlMatriz += '</td>'
        }
        htmlMatriz += '</tr>'
    }

    htmlMatriz += '</tbody></table>'+
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
    $('#wrapContent').append(htmlMatriz);
}

function removeViewContent(idMatriz){
    $('#'+idMatriz).remove();
}