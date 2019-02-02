var editor;
var actLineSelected;
var actErrorMarker;
var Range = ace.require('ace/range').Range;
var lineBreackpoints=[];
var markerBreakpoints=[];

$(document).ready(function () {

    //---------------------------------PRUEBAS-----------------------------------------------------------
    $("#headerBar").on("click", function () {
        $("#viewerCointainer").toggleClass("col-sm-7 d-none");
        $("#editor").toggleClass("col-sm-5 col");
        var arr=[50,38,20,18,70,45,56,100];
        var test2 = document.getElementById("iframeVisualizer").contentWindow;
        test2.init(arr);

        /*******Agregar, quitar y animar una variable visible*******/
        // test2.addVisibleVariable('V',50);
        // test2.addVisibleVariable('F',30);
        // test2.addVisibleVariable('G',560);
        // test2.addVisibleVariable('M',80);

        // setTimeout(() => {
        //     test2.animationChangeVariable('G');
        // }, 2000);

        // setTimeout(() => {
        //     test2.removeVisibleVariable('F');
        // }, 4000);

        /*******Cambiar la barra numero 2 de tamaño*******/
        // setTimeout(() => {
        //     test2.changeSizeBar(2,80);
        // }, 2000);

        /*******Cambiar el color de la barra 1, después de 1 segundo restablece al color normal*******/
        // setTimeout(() => {
        //     test2.barColorChange(1);
        // }, 1000);
        
        // setTimeout(() => {
        //     test2.resetbarColorChange(1);
        // }, 2000);
        
        // setTimeout(() => {
        //     test2.swap(2,3);
        // }, 1000);

        setTimeout(() => {
            test2.bubbleSortCallback();
        }, 1000);
    });
    //---------------------------------------------------------------------------------------------------

    //Creación del editor de código
    editor = ace.edit($("#editor")[0], {
        theme: "ace/theme/chrome",
        mode: "ace/mode/pseudo",
        autoScrollEditorIntoView: true,
        maxLines: 25,
        minLines: 25
    });

    editor.on("gutterclick", function(e) { 
        var region = e.editor.renderer.$gutterLayer.getRegion(e) 
        if (region == "markers")  { 
            e.stop() 
            var line = e.getDocumentPosition().row;
            var index = lineBreackpoints.indexOf(line);
            if(index==-1){
                selectLineBreackpoint(line);
                lineBreackpoints.push(line);
            }else{
                deleteMarker(markerBreakpoints[index]);
                markerBreakpoints.splice(index, 1);
                lineBreackpoints.splice(index, 1);
            }
        } 
    }, true);

    editor.on("change", function () {
        analyzeProgram();
    });

    //Cambio de tema del editor
    $('#estiloEditor a').on('click', function (evt) {
        evt.preventDefault();
        if (!$(this).hasClass("active")) {
            $('#estiloEditor a.active').removeClass("active");
            $(this).addClass("active");
            editor.setTheme("ace/theme/" + $(this).attr("data-tema"));
        }
    });

    //escoger un algoritmo para cargarlo
    $('#examplesChooser a').on('click', function (evt) {
        evt.preventDefault();
        $.get('http://localhost/ProyectoADA2018X2/assets/algorithms/' + $(this).attr("data-fname"), (pseudo) => {
            editor.setValue(pseudo, 1);
        }, 'text');
    });

    $("#btnRun").on("click", function () {
        if ($(this).data("run") == "stop") {
            hideRunningUI();
        } else if (program !== undefined) {
            if (program.SUBPROGRAMS.main === undefined) {
                alertify.alert(
                    '<h4 class="text-center">¡Seleccione la subrutina inicial (main)!</h4>' +
                    '<div class="btn-group-vertical w-100">' +
                    Object.keys(program.SUBPROGRAMS).reduce(function (buttons, nameAct) {
                        return buttons + '<button type="button" class="btn btn-secondary  w-100 mb-1" onclick="startProgram(' + "'" + nameAct + "'" + ')">' + nameAct + '</button>';
                    }, "") +
                    '</div>'
                ).set({'basic':true, 'closable':true});
            } else {
                startProgram("main");
            }
        } else {
            alertify.error('El programa no se puede ejecutar.');
        }
    });

    $('#spdSelector a').on('click', function (evt) {
        evt.preventDefault();
        if (!$(this).hasClass("active")) {
            $('#spdSelector a.active').removeClass("active");
            $(this).addClass("active");
            var spd = parseFloat($(this).attr("data-vel"));
            if (spd == 1) {
                $('#spdSelector button').text("normal");
            } else {
                $('#spdSelector button').text("x" + spd);
            }
        }
    });

    $("#btnPlay").on("click", function () {
        $("i", this).toggleClass("fa-play fa-pause");
        $("#btnBackStep, #btnNextStep, #spdSelector button").toggleClass("disabled");
    });

    $("#btnBackStep").on("click", function () {
        if (!$(this).hasClass('disabled')) {
            editor.getSession().removeMarker(actLineSelected);
        }
    });

    $("#btnNextStep").on("click", function () {
        if (!$(this).hasClass('disabled')) {
            executeStatement();
        }
    });
});

function showRunningUI() {
    $("#btnRun").text("Detener").data("run","stop");
    $("#configBar").slideUp(1000, undefined);
    $("#hubExecutionControllerContainer").fadeIn(1000, undefined);
    editor.setReadOnly(true);
}

function hideRunningUI() {
    $("#btnRun").text("Ejecutar").data("run","");
    $("#configBar").slideDown(1000, undefined);
    $("#hubExecutionControllerContainer").fadeOut(1000, function () {
        if ($("#btnPlay i").hasClass("fa-pause")) {
            $("#btnPlay i").toggleClass("fa-play fa-pause");
        }
    });
    deleteMarker(actLineSelected);
    editor.setReadOnly(false);
}

function selectLine(line) {
    deleteMarker(actLineSelected);
    actLineSelected = editor.getSession().addMarker(
        new Range(line, 0, line, 1), "ace_selected_line", "fullLine"
    );
    editor.scrollToLine(line, true, true, undefined);
}

function selectLineBreackpoint(line) {
    var marker = editor.getSession().addMarker(
        new Range(line, 0, line, 1), "ace_selected_line", "fullLine"
    );
    editor.scrollToLine(line, true, true, undefined);
    markerBreakpoints.push(marker);
}

function deleteMarker(id) {
    editor.getSession().removeMarker(id);
}

//Código para mostrar una anotación en el editor
/*  
editor.session.clearAnnotations(); // Limpiar anotaciones
editor.getSession().setAnnotations([{
    row: 0,
    column: 0,
    text: "se ejecuto n",
    type: "info" // (warning, info, error)
}]);
    //Propiedades del error
    console.log(err.location); // Ubicación del error: {start:{offset:X,line:Y,column:Z},end:{offset:X,line:Y,column:Z}}
    console.log(err.found); // Valor encontrado
    console.log(err.message); // Mensaje de error
*/

alertify.defaults = {
    autoReset: true,
    basic: false,
    closable: false,
    closableByDimmer: false,
    frameless: false,
    maintainFocus: true,
    maximizable: false,
    modal: true,
    movable: false,
    moveBounded: false,
    overflow: true,
    padding: false,
    pinnable: true,
    pinned: true,
    preventBodyShift: false,
    resizable: false,
    startMaximized: false,
    transition: 'pulse',
    notifier: {
        delay: 5,
        position: 'bottom-right',
        closeButton: false
    },
    glossary: {
        title: 'AlertifyJS',
        ok: 'OK',
        cancel: 'Cancelar'
    },
    theme: {
        input: 'ajs-input',
        ok: 'ajs-ok', //btn btn-primario
        cancel: 'ajs-cancel' //btn btn-secundario
    }
};