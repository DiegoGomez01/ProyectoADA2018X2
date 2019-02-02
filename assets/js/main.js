var parser;
var program;

//Variables de ambiente
var callStack = [];
var subprogram = {
    name: undefined,
    statementIndex: [0],
    localVariables: {},
    parameters: {},
    body: undefined,
    log: [],
    getAct: function () {
        return {
            name: this.name,
            statementIndex: this.statementIndex,
            localVariables: this.localVariables,
            parameters: this.parameters,
            body: this.body,
            log: this.log
        };
    },
    reset: function () {
        this.name = undefined;
        this.statementIndex = [];
        this.localVariables = {};
        this.parameters = {};
        this.body = undefined;
        this.log = [];
    }
};

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

function startProgram(mainName) {
    var actSubprogram = program.SUBPROGRAMS[mainName];
    if (sizeObj(actSubprogram.params) > 0) {
        alertify.error('La subrutina inicial no debe tener parametros.');
    } else {
        alertify.alert().close();
        showRunningUI();
        subprogram.reset();
        subprogram.name = mainName;
        subprogram.body = actSubprogram.body;
        createLocalVariables(actSubprogram.localVars, actSubprogram.params);
        getInStatementBody(subprogram.body);
    }
}

function executeStatement() {
    var Statement = getStatement();
    switch (Statement.type) {
        case "IfStatement":
            getInStatementBody(Statement.consequent);
            return;
        case "ForStatement":
            getInStatementBody(Statement.body);
            return;
        case "CallExpression":
            callSubprogram(Statement.callee, Statement.arguments);
            return;
        default:
            alert("falta: " + Statement.type);
            break;
    }
    getNextStatement();
}

function getStatement() {
    let Statement = subprogram;
    for (let i = 0; i < subprogram.statementIndex.length; i++) {
        Statement = Statement.body[subprogram.statementIndex[i]];
    }
    return Statement;
}

function getInStatementBody(body) {
    if (body.length > 0) {
        subprogram.statementIndex.push(0);
        if (body[0].type === "RepeatUntilStatement") {
            getInStatementBody(body[0].body);
        } else {
            selectLine(body[0].line);
        }
    }
}

function getNextStatement() {
    incLast(subprogram.statementIndex);
    let Statement = getStatement();
    if (Statement === undefined) {
        subprogram.statementIndex.pop();
    } else if (Statement.body[0].type === "RepeatUntilStatement") {
        getInStatementBody(Statement.body[0].body);
    } else {
        selectLine(Statement.line);
    }
}

function callSubprogram(name, args) {
    var actSubprogram = program.SUBPROGRAMS[name];
    callStack.push(subprogram.getAct());
    subprogram.reset();
    subprogram.name = name;
    subprogram.body = actSubprogram.body;
    createLocalVariables(actSubprogram.localVars, actSubprogram.params, args);
    getInStatementBody(subprogram.body);
}

function createLocalVariables(localVars, params, args) {
    for (let [key, lVar] of Object.entries(localVars)) {
        subprogram.localVariables[key] = {
            dataType: lVar.dataType,
            value: evalExpression(lVar.value)
        };
    }
    for (let [id, param] of Object.entries(params)) {
        subprogram.localVariables[id] = {
            dataType: param.dataType,
            value: evalExpression(args[param.pos])
        };
        if (param.mode == "s" || param.mode == "es") {
            subprogram.parameters.id = args[param.pos].id;
        }
    }
}

function resumeCallerSubprogram() {
    var callerSubprogram = callStack.pop();
    if (callerSubprogram == undefined) {
        hideRunningUI();
        alertify.success("¡Fin del programa!");
    }
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

function sizeObj(obj) {
    return Object.keys(obj).length;
}

function getDefaultValue(dataType) {
    switch (dataType) {
        case "string":
        case "char":
            return "";
        case "float":
        case "int":
            return 0;
        case "boolean":
            return true;
    }
}