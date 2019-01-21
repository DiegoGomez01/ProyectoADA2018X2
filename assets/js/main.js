var parser;
var editor;
var program;
var isExecuting = false;
var actRangeSelected;
var Range = ace.require('ace/range').Range;

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
        maxLines: 50,
        minLines: 10
    });
});

//Análisis del pseudo-código
function analyzeProgram() {
    try {
        program = parser.parse(editor.getValue());
    } catch (err) {
        editor.getSession().setAnnotations([{
            row: err.location.start.line - 1,
            column: err.location.start.column - 1,
            text: err.message,
            type: "error"
        }]);
    }
}

function selectLine(line) {
    editor.getSession().removeMarker(actRangeSelected);
    actRangeSelected = editor.getSession().addMarker(
        new Range(line, 0, line, 1), "ace_selected_line", "fullLine"
    );
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