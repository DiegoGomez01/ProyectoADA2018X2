var parser;
var program;
var actLog = [];
var actSubprogram;
var actStatement = [0];
var subprogramsCalls = [];

//Lee el archivo de la gramatica y crea el parser
$.get('http://localhost/ProyectoADA2018X2/assets/gramatica.pegjs', (gramatica) => {
    parser = peg.generate(gramatica);
}, "text");

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
    actSubprogram = program.SUBPROGRAMS[mainFunctionName];
    selectLine(actSubprogram.body[0].line);
}

function executeSubprogram(name) {
    subprogramsCalls.push({subprogram:actSubprogram, NextStatement:actStatement, log:actLog});
    actLog = [];
    actStatement = [0];
    actSubprogram = program.SUBPROGRAMS[name];
}

function evalExpression(exp) {
    switch (exp.type) {
        case "Literal":
            return exp.value;
            break;
    
        default:
            break;
    }
}

