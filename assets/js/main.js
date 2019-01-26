var parser;
var program;
var actLog = [];
var actSubprogram;
var actStatementId = [0];
var actParameters = [];
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

function executeNextStatement() {
    var Statement = getStatement();
    switch (Statement.type) {
        case "ForStatement":

            break;
        case "CallExpression":
            callSubprogram(Statement.callee, Statement.arguments);
            return;
        default:
            alert("falta: " + Statement.type);
            break;
    }
    incLast(actStatementId);
    if (last(actStatementId) == getStatement(-1).body.length) {
        actStatementId.pop();
    }
    selectLine(getStatement().line);
}

function getStatement(p) {
    if (p == undefined || p > 0) p = 0;
    let Statement = actSubprogram;
    for (let i = 0; i < actStatementId.length + p; i++) {
        Statement = Statement.body[actStatementId[i]];
    }
    return Statement;
}

function callSubprogram(name, args) {
    subprogramsCalls.push({
        subprogram: actSubprogram,
        actStatement: actStatementId,
        log: actLog
    });
    actLog = [];
    actStatementId = [0];
    actSubprogram = program.SUBPROGRAMS[name];
    actParameters = []; /////////////////////
    selectLine(actSubprogram.body[0].line);
}

function evalExpression(exp) {
    switch (exp.type) {
        case "Literal":
            return exp.value;
        default:
            break;
    }
}

function last(arr) {
    return arr[arr.length - 1];
}

function incLast(arr) {
    arr[arr.length - 1]++;
}