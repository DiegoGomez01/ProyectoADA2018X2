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
var isVisualicerActive = true;

$(document).ready(function () {
    //---------------------------------PRUEBAS-----------------------------------------------------------
    $("#headerBar").on("click", function () {
        alert(visualizerIF.isCanvas("A"));
    });
    //---------------------------------------------------------------------------------------------------

    //Abrir Documentación
    $("#btnDoc").on("click", function () {
        openDocumentation();
    });

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

    //Evita seleccionar todo el código al dar click
    editor.on("guttermousedown", function (e) {
        e.stop();
    }, true);

    //Permite agregar breakpoints
    editor.on("gutterdblclick", function (e) {
        e.stop();
        if (!editor.getReadOnly()) {
            var line = parseInt(e.getDocumentPosition().row);
            if (breakPoints[line] == undefined) {
                createBreakPoint(line);
            } else {
                deleteBreakPoint(line);
            }
        } else {
            alertify.warning("No se pueden modificar los puntos de ruptura en ejecución.");
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

    //Inicializar Visualizer y Tree
    visualizerIF = document.getElementById("iframeVisualizer").contentWindow;
    treeIF = document.getElementById("iframeTree").contentWindow;

    //escoger un algoritmo para cargarlo
    $('#examplesChooser a').on('click', function (evt) {
        evt.preventDefault();
        $.get('../assets/algorithms/' + $(this).attr("data-fname"), (pseudo) => {
            editor.setValue(pseudo, 1);
        }, 'text');
    });

    document.getElementById("checkVisualizer").checked = true;
    $("#checkVisualizer").on("change", function () {
        isVisualicerActive = this.checked;
        let tabVisualizer = document.getElementById("btnShowVisualizer");
        tabVisualizer.checked = this.checked;
        $(tabVisualizer).change();
        if (this.checked) {
            tabVisualizer.parentElement.parentElement.style.display = 'block';
        } else {
            tabVisualizer.parentElement.parentElement.style.display = 'none';
        }
    });

    $("#btnRun").on("click", function () {
        if (program !== undefined) {
            if (program.SUBPROGRAMS.main === undefined) {
                if (!alertify.selectMainSubprogram) {
                    alertify.dialog('selectMainSubprogram', function factory() {
                        return {
                            main: function (message) {
                                this.message = message;
                            },
                            setup: function () {
                                return {};
                            },
                            prepare: function () {
                                this.setContent(this.message);
                                this.setHeader('<h4 class="text-center">¡Seleccione la subrutina inicial (main)!</h4>');
                            }
                        };
                    });
                }
                alertify.selectMainSubprogram('<div class="btn-group-vertical w-100">' +
                    Object.keys(program.SUBPROGRAMS).reduce(function (VarList, nameAct) {
                        return VarList + '<button type="button" class="btn btn-secondary  w-100 mb-1" onclick="startProgram(' + "'" + nameAct + "'" + ')">' + nameAct + '</button>';
                    }, "") +
                    '</div>');
            } else {
                startProgram("main");
            }
        } else {
            alertify.error('El programa no se puede ejecutar.');
        }
    });

    $("#btnGame").on("click", function () {
        if (program !== undefined) {
            if (program.SUBPROGRAMS.main === undefined) {
                if (!alertify.selectAnalyzedSubprogram) {
                    alertify.dialog('selectAnalyzedSubprogram', function factory() {
                        return {
                            main: function (message) {
                                this.message = message;
                            },
                            setup: function () {
                                return {};
                            },
                            prepare: function () {
                                this.setContent(this.message);
                                this.setHeader('<h4 class="text-center">¡Seleccione la subrutina inicial (main)!</h4>');
                            }
                        };
                    });
                }
                alertify.selectAnalyzedSubprogram('<div class="btn-group-vertical w-100">' +
                    Object.keys(program.SUBPROGRAMS).reduce(function (VarList, nameAct) {
                        return VarList + '<button type="button" class="btn btn-secondary  w-100 mb-1" onclick="startAnalyzing(' + "'" + nameAct + "'" + ')">' + nameAct + '</button>';
                    }, "") +
                    '</div>');
            } else {
                startAnalyzing("main");
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
            alertify.success("Disponible, pronto");
        }
    });

    $("#btnNextStep").on("click", function () {
        if (!$(this).hasClass('disabled')) {
            executeStatement();
        }
    });

    $('#btnShowTree, #btnShowVars, #btnShowVisualizer, #btnBreakpoints').on('change', function () {
        if (this.checked) {
            $(this).parent().parent().removeClass("disabled");
            switch ($(this).data("tab")) {
                case 1:
                    $("#containerVisualizer").slideDown(VELOCIDADUICAMBIOSMS);
                    break;
                case 2:
                    $("#containerTree").slideDown(VELOCIDADUICAMBIOSMS);
                    break;
                case 3:
                    $("#containerVariables").slideDown(VELOCIDADUICAMBIOSMS);
                    break;
                case 4:
                    $("#containerBreakPoints").slideDown(VELOCIDADUICAMBIOSMS);
                    break;
            }
        } else {
            $(this).parent().parent().addClass("disabled");
            switch ($(this).data("tab")) {
                case 1:
                    $("#containerVisualizer").slideUp(VELOCIDADUICAMBIOSMS);
                    break;
                case 2:
                    $("#containerTree").slideUp(VELOCIDADUICAMBIOSMS);
                    break;
                case 3:
                    $("#containerVariables").slideUp(VELOCIDADUICAMBIOSMS);
                    break;
                case 4:
                    $("#containerBreakPoints").slideUp(VELOCIDADUICAMBIOSMS);
                    break;
            }
        }
    });
    document.getElementById("btnShowVars").checked = false;
    document.getElementById("btnBreakpoints").checked = false;
    document.getElementById("btnShowTree").checked = true;
    document.getElementById("btnShowVisualizer").checked = true;

    $("#fileURLInput").on("change", function () {
        cargarArchivo();
    });

    $("#btnDownloadFile").on("click", function () {
        getNameFile();
    });

    $("#btnUploadFile").on("click", function () {
        $("#fileURLInput").click();
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
//ui
function showGamingUI() {
    $("#hubExecutionControllerContainer button").prop('disabled', false);
    $("#containerSideBtns").fadeIn(VELOCIDADUINORMALMS);
    $("#viewerCointainer").fadeIn(VELOCIDADUINORMALMS);
    $("#configBar").slideUp(VELOCIDADUINORMALMS);
    $("#hubExecutionControllerContainer").fadeIn(VELOCIDADUINORMALMS);
    editor.setReadOnly(true);
    editor.setOption("maxLines", 33);
    editor.resize();
}

function hideGamingUI() {
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

function showSelectionVarsVisualizer(VarsToShow) {
    resetVisualizer();
    if (VarsToShow != null) {
        for (let index = 0; index < VarsToShow.length; index++) {
            const element = VarsToShow[index];
            VarsVisualized[index] = element;
        }
        showVariablesVisualizer();
    } else if (isVisualicerActive) {
        var paused = tryPauseAutoExecute();
        if (!alertify.selectVarsVisualizer) {
            alertify.dialog('selectVarsVisualizer', function factory() {
                return {
                    main: function (message) {
                        this.message = message;
                    },
                    setup: function () {
                        return {
                            buttons: [{
                                text: "¡Iniciar Ejecución!",
                                className: alertify.defaults.theme.ok
                            }],
                            focus: {
                                element: 0
                            }
                        };
                    },
                    hooks: {
                        onclose: function () {
                            showVariablesVisualizer();
                            if (paused) {
                                $("#btnPlay").click();
                            }
                        }
                    },
                    prepare: function () {
                        this.setContent(this.message);
                        this.setHeader('<h4 class="text-center">¡Seleccione las variables a mostrar para: ' + subprogram.name + '!</h4>');
                    }
                };
            });
        }
        alertify.selectVarsVisualizer('<div class="btn-group-vertical w-100">' +
            Object.keys(subprogram.localVariables).reduce(function (VarList, nameAct) {
                return VarList + '<button type="button" class="btn btn-secondary  w-100 mb-1" onclick="selectVariableToShow(' + "'" + nameAct + "', this" + ')">' + nameAct + '</button>';
            }, "") +
            '</div>');
    }
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
            visualizerIF.drawMatriz(getVariableValue(varId), varId);
        } else if (varDataType.includes("[]")) {
            if (varDataType.slice(0, -2) == "int") {
                visualizerIF.createCanvas(varId, getVariableValue(varId));
            } else {
                visualizerIF.drawMatriz([getVariableValue(varId)], varId);
            }
        } else if (varDataType.includes("pila")) {
            visualizerIF.createCanvasStack(varId);
        } else if (varDataType.includes("cola")) {
            visualizerIF.createCanvasQueue(varId);
        } else if (varDataType.includes("lista")) {
            alertify.success("La visualización de listas estará disponible proximamente");
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

function visualizeVariableChange(id, value) {
    if (checkIsOnVisualizer(id)) {
        visualizerIF.animationChangeVariable(id, value);
    }
}

function visualizeswapArrayCanvas(left, right) {
    if (checkIsOnVisualizer(left.id) && left.type == "ArrayAccess" && right.type == "ArrayAccess" && left.id == right.id && visualizerIF.isCanvas(left.id)) {
        SelectCanvas(left.id);
        var i = getArrayIndex(left.index)[0] - 1;
        var j = getArrayIndex(right.index)[0] - 1;
        visualizerIF.swap(i, j);
        return true;
    }
}

function visualizeArrayAccess(exp) {
    if (checkIsOnVisualizer(exp.id)) {
        let index = getArrayIndex(exp.index);
        index[0]--;
        if (index.length == 1) {
            if (visualizerIF.isCanvas(exp.id) && exp.index[0].type == "Variable") {
                SelectCanvas(exp.id);
                selectIndexArray(index[0]);
                visualizerIF.setIndexBar(index[0], exp.index[0].id);
            } else if (false) {
                visualizerIF.drawCell(exp.id, 0, index[0]);
            }
        } else {
            index[1]--;
            visualizerIF.drawCell(exp.id, index[0], index[1]);
        }
    }
}

function visualizeArrayChangeValue(exp, value, vsChange) {
    if (vsChange == undefined && checkIsOnVisualizer(exp.id)) {
        let index = getArrayIndex(exp.index);
        index[0]--;
        if (index.length == 1) {
            if (visualizerIF.isCanvas(exp.id)) {
                SelectCanvas(exp.id);
                selectIndexArray(index[0]);
                visualizerIF.changeSizeBar(index[0], value);
                setTimeout(() => {
                    unselectIndexArray(index[0]);
                }, VELOCIDADUICAMBIOSMS);
            } else {
                visualizerIF.animationChangeVariable(exp.id, 0, index[0]);
                visualizerIF.changeValueCell(exp.id, 0, index[0], value);
            }
        } else {
            index[1]--;
            visualizerIF.animationChangeVariable(exp.id, index[0], index[1]);
            visualizerIF.changeValueCell(exp.id, index[0], index[1], value);
        }
    }
}

function pushStackVisualizer(varid, value) {
    if (checkIsOnVisualizer(varid)) {
        visualizerIF.pushStack(value);
    }
}

function popStackVisualizer(varid) {
    if (checkIsOnVisualizer(varid)) {
        visualizerIF.popStack();
    }
}

function enqueueQueueVisualizer(varid, value) {
    // SelectCanvas(id)
    if (checkIsOnVisualizer(varid)) {
        visualizerIF.enqueueCall(value);
    }
}

function enqueueQueueVisualizer(varid) {
    if (checkIsOnVisualizer(varid)) {
        visualizerIF.dequeueCall();
    }
}

function openDocumentation() {
    window.open("../docs/DOCUMETATION_ADA.pdf", '_blank');
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