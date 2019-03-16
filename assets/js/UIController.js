//---------------------------CONSTANTES---------------------------
const VELOCIDADNORMALMS = 1000;
const VELOCIDADUINORMALMS = 500;
const VELOCIDADUICAMBIOSMS = 250;
//----------------------------------------------------------------

var editor;
var actLineSelected;
var actErrorMarker;
var Range = ace.require('ace/range').Range;
var breakPoints = {};
var visualizerIF;
var VarsVisualized = [];

$(document).ready(function () {
    //---------------------------------PRUEBAS-----------------------------------------------------------
    $("#headerBar").on("click", function () {
        /**************Test swap *************+*/
        // var arr = [50, 38, 20, 18, 70, 45, 56, 100];
        // var test2 = document.getElementById("iframeVisualizer").contentWindow;
        // test2.init(arr,'canvas');
        // test2.init(arr,'canvas2');
        // test2.swap(2,3);

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

        // setTimeout(() => {
        //     test2.bubbleSortCallback();
        // }, 1000);
    });
    //---------------------------------------------------------------------------------------------------

    //Creación del editor de código
    ace.require("ace/ext/language_tools");
    editor = ace.edit($("#editor")[0], {
        theme: "ace/theme/chrome",
        mode: "ace/mode/pseudo",
        enableBasicAutocompletion: true,
        autoScrollEditorIntoView: true,
        maxLines: 30,
        minLines: 30
    });

    editor.on("guttermousedown", function (e) {
        e.stop();
    }, true);

    editor.on("gutterdblclick", function (e) {
        e.stop();
        var line = parseInt(e.getDocumentPosition().row);
        if (breakPoints[line] == undefined) {
            createBreakPoint(line);
        } else {
            deleteBreakPoint(line);
        }
    }, true);

    editor.on("change", function () {
        analyzeProgram();
    });

    // editor.getSession().gutterRenderer = {
    //     getWidth: function (session, lastLineNumber, config) {
    //         return lastLineNumber.toString().length * config.characterWidth;
    //     },
    //     getText: function (session, row) {
    //         return String.fromCharCode(row + 65);
    //     }
    // };

    //Cambio de tema del editor
    $('#estiloEditor a').on('click', function (evt) {
        evt.preventDefault();
        if (!$(this).hasClass("active")) {
            $('#estiloEditor a.active').removeClass("active");
            $(this).addClass("active");
            editor.setTheme("ace/theme/" + $(this).attr("data-tema"));
        }
    });

    visualizerIF = document.getElementById("iframeVisualizer").contentWindow;

    //escoger un algoritmo para cargarlo
    $('#examplesChooser a').on('click', function (evt) {
        evt.preventDefault();
        $.get('http://localhost/ProyectoADA2018X2/assets/algorithms/' + $(this).attr("data-fname"), (pseudo) => {
            editor.setValue(pseudo, 1);
        }, 'text');
    });

    $("#btnRun").on("click", function () {
        if (program !== undefined) {
            if (program.SUBPROGRAMS.main === undefined) {
                alertify.alert(
                    '<h4 class="text-center">¡Seleccione la subrutina inicial (main)!</h4>' +
                    '<div class="btn-group-vertical w-100">' +
                    Object.keys(program.SUBPROGRAMS).reduce(function (VarList, nameAct) {
                        return VarList + '<button type="button" class="btn btn-secondary  w-100 mb-1" onclick="startProgram(' + "'" + nameAct + "'" + ')">' + nameAct + '</button>';
                    }, "") +
                    '</div>'
                ).set({
                    'basic': true,
                    'closable': true
                });
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
            changeSpeed(spd);
        }
    });

    $("#btnStop").on("click", function () {
        stopExecution();
    });

    $("#btnPlay").on("click", function () {
        if (autoExecuteID == undefined) {
            $("#spdSelector").fadeIn(VELOCIDADUINORMALMS);
            startAutoExecute();
        } else {
            $("#spdSelector").fadeOut(VELOCIDADUINORMALMS);
            pauseAutoExecute();
        }
        $("#btnBackStep, #btnNextStep").toggleClass("disabled");
        $("i", this).toggleClass("fa-play fa-pause");
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

    $("#containerSideBtns .tab").on('click', function () {
        if (!$(this).hasClass("disabled")) {
            $("#containerSideBtns div.tab.disabled").removeClass("disabled");
            $(this).addClass("disabled");
            switch ($(this).data("tab")) {
                case 1:
                    $("#containerTree").fadeOut(VELOCIDADUICAMBIOSMS, function () {
                        $("#containerVariables").fadeIn(VELOCIDADUICAMBIOSMS);
                    });
                    break;
                case 2:
                    $("#containerVariables").fadeOut(VELOCIDADUICAMBIOSMS, function () {
                        $("#containerTree").fadeIn(VELOCIDADUICAMBIOSMS);
                    });
                    break;
                default:
                    alert("error");
                    break;
            }
        }
    });

    $('#btnShowTree').on('click', function (evt) {
        evt.preventDefault();
        $('#sideBarTree').addClass('active');
        $('#overlay').fadeIn(VELOCIDADUINORMALMS);
    });

    $('#btnCloseTree').on('click', function (evt) {
        evt.preventDefault();
        $('#sideBarTree, #btnShowTree').removeClass('active');
        $('#overlay').fadeOut(VELOCIDADUINORMALMS);
    });
});

function showRunningUI() {
    $("#hubExecutionControllerContainer button").prop('disabled', false);
    $("#containerSideBtns").fadeIn(VELOCIDADUINORMALMS);
    $("#viewerCointainer").fadeIn(VELOCIDADUINORMALMS);
    $("#configBar").slideUp(VELOCIDADUINORMALMS);
    $("#hubExecutionControllerContainer").fadeIn(VELOCIDADUINORMALMS);
    editor.setReadOnly(true);
    editor.setOption("maxLines", 33);
    editor.resize();
}

function hideRunningUI() {
    $("#hubExecutionControllerContainer button").prop('disabled', true);
    $("#hubExecutionControllerContainer").fadeOut(VELOCIDADUINORMALMS);
    $("#containerSideBtns").fadeOut(VELOCIDADUINORMALMS);
    $("#viewerCointainer").fadeOut(VELOCIDADUINORMALMS);
    $("#configBar").slideDown(VELOCIDADUINORMALMS);
    deleteMarker(actLineSelected);
    editor.setReadOnly(false);
    editor.setOption("maxLines", 30);
    editor.resize();
}

function disableExecutionUI() {
    tryPauseAutoExecute();
    $("#executionBtns button").prop('disabled', true);
}

function pauseUI() {
    $("#spdSelector").fadeOut(VELOCIDADUINORMALMS);
    $("#btnBackStep, #btnNextStep").toggleClass("disabled");
    $("#btnPlay i").toggleClass("fa-play fa-pause");
}

function selectLine(line) {
    deleteMarker(actLineSelected);
    actLineSelected = editor.getSession().addMarker(
        new Range(line, 0, line, 1), "ace_selected_line", "fullLine"
    );
    editor.scrollToLine(line, true, true, undefined);
}

function createBreakPoint(line) {
    // editor.getSession().addGutterDecoration(line, "fas fa-star ico");
    // $("div.ace_gutter .ace_gutter-cell").text("m");
    // editor.getSession().setBreakpoint(line, "fas fa-list-ul");
    // editor.getSession().setBreakpoint(line, "");
    // removeGutterDecoration(Number row, String className)
    var marker = editor.getSession().addMarker(
        new Range(line, 0, line, 1), "ace_breakpoint_line", "fullLine"
    );
    breakPoints[line] = marker;
    alertify.message('Punto de ruptura: Línea: ' + (line + 1));
}

function deleteBreakPoint(line) {
    deleteMarker(breakPoints[line]);
    delete breakPoints[line];
}

function deleteMarker(id) {
    editor.getSession().removeMarker(id);
}

function getUISpeed() {
    return (VELOCIDADNORMALMS / parseFloat($('#spdSelector a.active').attr("data-vel")));
}

function showSelectionVarsVisualizer() {
    var paused = tryPauseAutoExecute();
    alertify.alert(
        '<h4 class="text-center">¡Seleccione las variables a mostrar para: ' + subprogram.name + '!</h4>' +
        '<div class="btn-group-vertical w-100">' +
        Object.keys(subprogram.localVariables).reduce(function (VarList, nameAct) {
            return VarList + '<button type="button" class="btn btn-secondary  w-100 mb-1" onclick="selectVariableToShow(' + "'" + nameAct + "', this" + ')">' + nameAct + '</button>';
        }, "") +
        '</div>'
    ).set('onok', function () {
        showVariablesVisualizer();
        if (paused) {
            $("#btnPlay").click();
        }
    });
}

function selectVariableToShow(id, button) {
    var index = VarsVisualized.indexOf(id);
    if (index == -1) {
        VarsVisualized.push(id);
    } else {
        VarsVisualized.splice(index, 1);
    }
    $(button).toggleClass("btn-secondary btn-primary");
}

function createArrayCanvas(id) {
    visualizerIF.createCanvas(id, getVariableValue(id));
}

function showVariablesVisualizer() {
    for (let i = 0; i < VarsVisualized.length; i++) {
        const varId = VarsVisualized[i];
        createArrayCanvas(varId);
    }
}

function swapArrayCanvas(left, right) {
    if (left.type == "ArrayAccess" && right.type == "ArrayAccess" && left.id == right.id) {
        SelectCanvas(left.id);
        var i = getArrayIndex(left.index)[0] - 1;
        var j = getArrayIndex(right.index)[0] - 1;
        // selectIndexArray(left.id, i);
        // selectIndexArray(left.id, j);
        visualizerIF.swap(i, j);
        // unselectIndexArray(left.id, i);
        // unselectIndexArray(left.id, j);
    }
}

function SelectCanvas(id) {
    visualizerIF.init(getVariableValue(id), id);
}

function selectIndexArray(id, index) {
    SelectCanvas(id);
    visualizerIF.barColorChange(index);
}

function unselectIndexArray(id, index) {
    SelectCanvas(id);
    visualizerIF.resetbarColorChange(index);
}

function removeViewContent(id) {
    visualizerIF.removeViewContent(id);
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