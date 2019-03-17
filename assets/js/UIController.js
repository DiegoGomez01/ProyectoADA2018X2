//---------------------------CONSTANTES---------------------------
const VELOCIDADNORMALMS = 1000;
const VELOCIDADUINORMALMS = 500;
const VELOCIDADUICAMBIOSMS = 250;
//----------------------------------------------------------------

var editor;
var editorSession;
var actLineSelected = [];
var actErrorMarker;
var Range = ace.require('ace/range').Range;
var breakPoints = {};
var visualizerIF;
var VarsVisualized = [];

$(document).ready(function () {
    //---------------------------------PRUEBAS-----------------------------------------------------------
    $("#headerBar").on("click", function () {

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

    editorSession = editor.getSession();

    //Cambio de tema del editor
    $('#estiloEditor a').on('click', function (evt) {
        evt.preventDefault();
        if (!$(this).hasClass("active")) {
            $('#estiloEditor a.active').removeClass("active");
            $(this).addClass("active");
            editor.setTheme("ace/theme/" + $(this).attr("data-tema"));
        }
    });

    //Inicializar Visualizer
    visualizerIF = document.getElementById("iframeVisualizer").contentWindow;

    //escoger un algoritmo para cargarlo
    $('#examplesChooser a').on('click', function (evt) {
        evt.preventDefault();
        $.get('../assets/algorithms/' + $(this).attr("data-fname"), (pseudo) => {
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
            unSelectActLine();
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
    unSelectActLine();
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

function selectActLine(line) {
    unSelectActLine();
    editorSession.addGutterDecoration(line, "ace_selected_gutter");
    actLineSelected[0] = editorSession.addMarker(
        new Range(line, 0, line, 1), "ace_selected_line", "fullLine"
    );
    editor.scrollToLine(line, true, true, undefined);
    actLineSelected[1] = line;
}

function unSelectActLine() {
    editorSession.removeGutterDecoration(actLineSelected[1], "ace_selected_gutter");
    deleteMarker(actLineSelected[0]);
}

function createBreakPoint(line) {
    editorSession.addGutterDecoration(line, "fas fa-star ace_breakpoint_gutter");
    var marker = editorSession.addMarker(
        new Range(line, 0, line, 1), "ace_breakpoint_line", "fullLine"
    );
    breakPoints[line] = marker;
}

function deleteBreakPoint(line) {
    editorSession.removeGutterDecoration(line, "fas fa-star ace_breakpoint_gutter");
    deleteMarker(breakPoints[line]);
    delete breakPoints[line];
}

function deleteMarker(id) {
    editorSession.removeMarker(id);
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
        alertify.alert().destroy();
    });
}

function resetVisualizer() {
    VarsVisualized = [];
    visualizerIF.clearAllDivs();
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

function showVariablesVisualizer() {
    for (let i = 0; i < VarsVisualized.length; i++) {
        const varId = VarsVisualized[i];
        const varDataType = getVariableDataType(varId);
        if (varDataType.includes("[][]")) {
            visualizerIF.drawMatriz(getVariableValue(varId), varId); //arreglar alert
        } else if (varDataType.includes("[]")) {
            if (varDataType.slice(0, -2) == "int") {
                visualizerIF.createCanvas(varId, getVariableValue(varId));
            } else {
                visualizerIF.drawMatriz([getVariableValue(varId)], varId);
            }
        } else if (varDataType.includes("pila")) {
            alert("disponible proximamente");
        } else if (varDataType.includes("cola")) {
            alert("disponible proximamente");
        } else if (varDataType.includes("lista")) {
            alert("disponible proximamente");
        } else {
            visualizerIF.addVisibleVariable(varId, getVariableValue(varId));
        }
    }
}

function SelectCanvas(id) {
    visualizerIF.init(getVariableValue(id), id);
}

function selectIndexArray(index) {
    visualizerIF.barColorChange(index);
}

function unselectIndexArray(index) {
    visualizerIF.resetbarColorChange(index);
}

function removeViewContent(id) {
    visualizerIF.removeViewContent(id);
}

function checkIsOnVisualizer(id) {
    return VarsVisualized.indexOf(id) > -1;
}

function visualizeVariableChange(id) {
    if (checkIsOnVisualizer(id)) {
        visualizerIF.animationChangeVariable(id);
    }
}

function visualizeswapArrayCanvas(left, right) {
    if (checkIsOnVisualizer(left.id) && left.type == "ArrayAccess" && right.type == "ArrayAccess" && left.id == right.id && true) { // && true if is canvas
        SelectCanvas(left.id);
        var i = getArrayIndex(left.index)[0] - 1;
        var j = getArrayIndex(right.index)[0] - 1;
        visualizerIF.swap(i, j);
        return true;
    }
}

function visualizeArrayAccess(exp) {
    if (checkIsOnVisualizer(exp.id)) {
        if (exp.index.length == 1) {
            if (exp.index[0].type == "Variable" && true) { // && true if is canvas
                SelectCanvas(exp.id);
                let index = evalExpression(exp.index[0]) - 1;
                selectIndexArray(index);
                visualizerIF.setIndexBar(index, exp.index[0].id);
            } else {

            }
        } else {
            //---
        }
    }
}

function visualizeArrayChangeValue(exp, value, vsChange) {
    if (vsChange == undefined && checkIsOnVisualizer(exp.id)) {
        if (exp.index.length == 1) {
            if (true) {
                SelectCanvas(exp.id);
                let index = evalExpression(exp.index[0]) - 1;
                selectIndexArray(index);
                visualizerIF.changeSizeBar(index, value);
                setTimeout(() => {
                    unselectIndexArray(index);
                }, VELOCIDADUICAMBIOSMS);
            }
        } else {
            //---
        }
    }
}

alertify.defaults = {
    autoReset: true,
    basic: false,
    closable: false,
    closableByDimmer: false,
    frameless: false,
    maintainFocus: true,
    maximizable: false,
    modal: true,
    movable: true,
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