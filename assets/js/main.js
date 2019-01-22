var parser;
var editor;
var program;
var actLineSelected;
var actErrorMarker;
var isExecuting = false;
var Range = ace.require('ace/range').Range;

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

$(document).ready(function () {
    //Lee el archivo de la gramatica y crea el parser
    $.get('http://localhost:8000/assets/gramatica.pegjs', (gramatica) => {
        parser = peg.generate(gramatica);
    }, 'text');

    //Creación del editor de código
    editor = ace.edit($("#editor")[0], {
        theme: "ace/theme/chrome",
        mode: "ace/mode/pseudo",
        autoScrollEditorIntoView: true,
        maxLines: 25,
        minLines: 10
    });

    editor.on("change", function () {
        analyzeProgram();
    });
});

//Análisis del pseudo-código
function analyzeProgram() {
    try {
        program = parser.parse(editor.getValue());
        editor.getSession().clearAnnotations();
        deleteMarker(actErrorMarker);
    } catch (err) {
        program = undefined;
        editor.getSession().setAnnotations([{
            row: err.location.start.line - 1,
            column: err.location.start.column - 1,
            text: err.message,
            type: "error"
        }]);
        deleteMarker(actErrorMarker);
        actErrorMarker = editor.getSession().addMarker(new Range(err.location.start.line - 1, err.location.start.column - 1, err.location.end.line - 1, err.location.end.column - 1), "ace_underline_error", "text");
    }
}

function startProgram(mainFunctionName) {
    alertify.alert().close();
    selectLine(program.SUBPROGRAMS[mainFunctionName].body[0].line);
}

function selectLine(line) {
    deleteMarker(actLineSelected);
    actLineSelected = editor.getSession().addMarker(
        new Range(line, 0, line, 1), "ace_selected_line", "fullLine"
    );
    editor.scrollToLine(line, true, true, undefined);
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