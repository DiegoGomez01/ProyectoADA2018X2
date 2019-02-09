var parser;
var program;
var callStack = [];
var auxReturnFunction;

var test2;

//Variable de ambiente
var subprogram = {
    name: undefined,
    statementsBlockStack: [],
    statementIndex: [],
    localVariables: {},
    parameters: {},
    log: [],
    getAct: function () {
        return {
            name: this.name,
            statementsBlockStack: this.statementsBlockStack,
            statementIndex: this.statementIndex,
            localVariables: this.localVariables,
            parameters: this.parameters,
            log: this.log
        };
    },
    reset: function () {
        this.name = undefined;
        this.statementsBlockStack = [];
        this.statementIndex = [];
        this.localVariables = {};
        this.parameters = {};
        this.log = [];
    },
    addBlock: function (block) {
        this.statementsBlockStack.push(block);
        this.statementIndex.push(0);
        this.validateNextStatement();
    },
    actStatement: function () {
        return last(this.statementsBlockStack)[last(this.statementIndex)];
    },
    finishBlock: function () {
        this.statementsBlockStack.pop();
        this.statementIndex.pop();
        locateNextStatement();
    },
    hasStatements: function () {
        return this.statementsBlockStack.length > 0;
    },
    incStatement: function () {
        incLast(this.statementIndex);
    },
    nextStatement: function () {
        this.incStatement();
        this.validateNextStatement();
    },
    validateNextStatement: function () {
        let Statement = this.actStatement();
        if (Statement !== undefined &&
            (Statement.type == "RepeatUntilStatement" ||
                Statement.type == "ForStatementIteration")) {
            this.addBlock(Statement.body);
            return;
        }
        locateNextStatement();
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
        callStack = [];
        subprogram.reset();
        subprogram.name = mainName;
        createLocalVariables(actSubprogram.localVars, actSubprogram.params);
        subprogram.addBlock(actSubprogram.body);
    }
}

function executeStatement() {
    var Statement = subprogram.actStatement();
    switch (Statement.type) {
        case "IfStatement":
        console.log(getVariableValue("j"));
            if (evalExpression(Statement.test)) {
                subprogram.incStatement();
                subprogram.addBlock(Statement.consequent);
            } else if (Statement.alternate !== undefined) {
                subprogram.incStatement();
                subprogram.addBlock(Statement.alternate);
            } else {
                subprogram.nextStatement();
            }
            return;
        case "ForStatement":
            subprogram.incStatement();
            AssignmentFunction(Statement.varFor, Statement.iniValue);
            if (Statement.inc > 0) {
                if (getVariableValue(Statement.varFor.id) > evalExpression(Statement.finValue)) {
                    locateNextStatement();
                    return;
                }
            } else {
                if (getVariableValue(Statement.varFor.id) < evalExpression(Statement.finValue)) {
                    locateNextStatement();
                    return;
                }
            }
            subprogram.addBlock([{
                type: "ForStatementIteration",
                varFor: Statement.varFor,
                finValue: Statement.finValue,
                inc: Statement.inc,
                body: Statement.body,
                line: Statement.line
            }]);
            return;
        case "ForStatementIteration":
            incVariable(Statement.varFor.id, Statement.inc);
            if ((Statement.inc > 0 && (getVariableValue(Statement.varFor.id) > evalExpression(Statement.finValue))) ||
                (Statement.inc < 0 && (getVariableValue(Statement.varFor.id) < evalExpression(Statement.finValue)))) {
                subprogram.finishBlock();
                return;
            }
            subprogram.addBlock(Statement.body);
            return;
        case "AssignmentStatement":
            if (!AssignmentFunction(Statement.left, Statement.right)) {
                return;
            }
        case "CallExpression":
            subprogram.incStatement();
            callSubprogram(Statement.callee, Statement.arguments);
            return;
        case "SwapFunction":
            swapVariables(Statement.left, Statement.right);
            break;
        case "ReturnStatement":
            auxReturnFunction = evalExpression(Statement.exp);
            returnSubprogram();
            return;
        default:
            alert("falta Statement: " + Statement.type);
            break;
    }
    subprogram.nextStatement();
}

function locateNextStatement() {
    if (subprogram.hasStatements()) {
        let Statement = subprogram.actStatement();
        if (Statement == undefined) {
            subprogram.finishBlock();
        } else {
            selectLine(Statement.line);
        }
    } else {
        returnSubprogram();
    }
}

function callSubprogram(name, args) {
    var actSubprogram = program.SUBPROGRAMS[name];
    var argsValues = evalArgs(args);
    callStack.push(subprogram.getAct());
    subprogram.reset();
    subprogram.name = name;
    createLocalVariables(actSubprogram.localVars, actSubprogram.params, args, argsValues);
    subprogram.addBlock(actSubprogram.body);
    test2 = document.getElementById("iframeVisualizer").contentWindow;
    test2.init(cloneArray(getVariableValue("a")));
}

function evalArgs(args) {
    var argsValues = [];
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        argsValues[i] = evalExpression(arg);
    }
    return argsValues;
}

function createLocalVariables(localVars, params, args, argsValues) {
    for (let [key, lVar] of Object.entries(localVars)) {
        subprogram.localVariables[key] = {
            dataType: lVar.dataType,
            value: evalExpression(lVar.value)
        };
    }
    for (let [id, param] of Object.entries(params)) {
        subprogram.localVariables[id] = {
            dataType: param.dataType,
            value: argsValues[param.pos]
        };
        if (param.mode == "s" || param.mode == "es") {
            subprogram.parameters.id = args[param.pos].id; // params: {idAct:idinCaller}
        }
    }
}

function returnSubprogram() {
    var callerSubprogram = callStack.pop();
    if (callerSubprogram == undefined) {
        hideRunningUI();
        console.log(getVariableValue("a"));
        alertify.success("¡Fin del programa!");
    } else {
        subprogram.name = callerSubprogram.name;
        subprogram.statementsBlockStack = callerSubprogram.statementsBlockStack;
        subprogram.statementIndex = callerSubprogram.statementIndex;
        // for (let [idAct, idCaller] of Object.entries(subprogram.parameters)) {
        //     callerSubprogram.localVariables[idCaller].value = subprogram.localVariables[idAct].value;
        // }
        subprogram.localVariables = callerSubprogram.localVariables;
        subprogram.parameters = callerSubprogram.parameters;
        subprogram.log = callerSubprogram.log;
        locateNextStatement();
    }
}

function throwException(txt) {
    hideRunningUI();
    alertify.error(txt + " linea: " + (subprogram.actStatement().line + 1), 15);
    alertify.warning("¡Cierre forzado del programa!");
    throw txt + " linea: " + (subprogram.actStatement().line + 1);
}

function evalExpression(exp) {
    if (exp.type === undefined) {
        return exp;
    }
    switch (exp.type) {
        case "Literal":
            return exp.value;
        case "Variable":
            return getVariableValue(exp.id);
        case "ArrayAccess":
            return getArrayAccessValue(exp.id, exp.index);
        case "ArrayLiteral":
            return cloneArray(exp.arr);
        case "EmptyArray":
            return [];
        case "int":
            return evalIntExpression(exp);
        case "float":
            return evalFloatExpression(exp);
        case "boolean":
            return evalBooleanExpression(exp);
        case "FloorFunction":
            return Math.floor(evalExpression(exp.exp));
        case "CeilingFunction":
            return Math.ceil(evalExpression(exp.exp));
        case "ArrayLengthFunction":
            return getVariableValue(exp.arrVar.id).length;
        case "StringConcatenation":
            return evalStringConcatenation(exp.exps);
        default:
            alert("Falta la expresión: " + exp.type);
            break;
    }
}

function evalIntExpression(IntExp) {
    switch (IntExp.operator) {
        case "+":
            return parseInt(evalExpression(IntExp.left) + evalExpression(IntExp.right));
        case "-":
            return parseInt(evalExpression(IntExp.left) - evalExpression(IntExp.right));
        case "*":
            return parseInt(evalExpression(IntExp.left) * evalExpression(IntExp.right));
        case "/":
            return parseInt(evalExpression(IntExp.left) / evalExpression(IntExp.right));
        case "%":
            return parseInt(evalExpression(IntExp.left) % evalExpression(IntExp.right));
        default:
            alert("falta op: " + IntExp.operator);
            break;
    }
}

function evalFloatExpression(floatExp) {
    switch (floatExp.operator) {
        case "+":
            return parseFloat(evalExpression(floatExp.left) + evalExpression(floatExp.right));
        case "-":
            return parseFloat(evalExpression(floatExp.left) - evalExpression(floatExp.right));
        case "*":
            return parseFloat(evalExpression(floatExp.left) * evalExpression(floatExp.right));
        case "/":
            return parseFloat(evalExpression(floatExp.left) / evalExpression(floatExp.right));
        case "%":
            return parseFloat(evalExpression(floatExp.left) % evalExpression(floatExp.right));
        default:
            alert("falta op: " + floatExp.operator);
            break;
    }
}

function evalBooleanExpression(booleanExp) {
    switch (booleanExp.operator) {
        case "<=":
            return evalExpression(booleanExp.left) <= evalExpression(booleanExp.right);
        case ">=":
            return evalExpression(booleanExp.left) >= evalExpression(booleanExp.right);
        case ">":
            return evalExpression(booleanExp.left) > evalExpression(booleanExp.right);
        case "<":
            return evalExpression(booleanExp.left) < evalExpression(booleanExp.right);
        case "==":
            return evalExpression(booleanExp.left) == evalExpression(booleanExp.right);
        case "!=":
            return evalExpression(booleanExp.left) != evalExpression(booleanExp.right);
        case "and":
            return evalExpression(booleanExp.left) && evalExpression(booleanExp.right);
        case "or":
            return evalExpression(booleanExp.left) || evalExpression(booleanExp.right);
        case "not":
            return !evalExpression(booleanExp.argument);
        default:
            alert("falta op: " + booleanExp.operator);
            break;
    }
}

function evalStringConcatenation(exps) {
    var str = "";
    for (let i = 0; i < exps.length; i++) {
        const exp = exps[i];
        str += evalExpression(exp);
    }
    return str;
}

function AssignmentFunction(left, right) {
    if (right.callee == undefined) {
        changeValueExpVariableAccess(left, evalExpression(right));
    } else if (auxReturnFunction == undefined) {
        callSubprogram(right.callee, right.arguments);
        return false;
    } else {
        changeValueExpVariableAccess(left, auxReturnFunction);
        auxReturnFunction = undefined;
    }
    return true;
}

function swapVariables(left, right) {
    console.log("swap: " +  getVariableValue("j"));
    test2.swap(getVariableValue("j") - 1, getVariableValue("j"));
    console.log("swap des: " +  getVariableValue("j"));
    var leftV = getValueExpVariableAccess(left);
    changeValueExpVariableAccess(left, getValueExpVariableAccess(right));
    changeValueExpVariableAccess(right, leftV);
}

function incVariable(id, inc) {
    changeVariableValue(id, getVariableValue(id) + inc);
}

function getValueExpVariableAccess(exp) {
    if (exp.type == "ArrayAccess") {
        return getArrayAccessValue(exp.id, exp.index);
    } else {
        return getVariableValue(exp.id);
    }
}

function changeValueExpVariableAccess(exp, value) {
    if (exp.type == "ArrayAccess") {
        changeArrayAccessValue(exp.id, exp.index, value);
    } else {
        changeVariableValue(exp.id, value);
    }
}

function changeVariableValue(id, value) {
    getVariableParent(id)[id].value = value;
}

function changeArrayAccessValue(id, index, value) {
    var arrV = getVariableParent(id)[id].value;
    for (let i = 0; i < index.length; i++) {
        const intExp = index[i];
        const valIndex = evalExpression(intExp);
        if (valIndex < 1) {
            throwException("La primera posición de los arreglos es 1.");
        } else if (valIndex > arrV.length) {
            throwException("El indice sobrepasa la longitud del arreglo.");
        }
        if (i === index.length - 1) {
            arrV[valIndex - 1] = value;
        } else {
            arrV = arrV[valIndex - 1];
        }
    }
}

function getVariableValue(id) {
    return getVariableParent(id)[id].value;
}

function getArrayAccessValue(id, index) {
    var arrV = getVariableParent(id)[id].value;
    for (let i = 0; i < index.length; i++) {
        const intExp = index[i];
        const valIndex = evalExpression(intExp);
        if (valIndex < 1) {
            throwException("La primera posición de los arreglos es 1.");
        } else if (valIndex > arrV.length) {
            throwException("El indice sobrepasa la longitud del arreglo.");
        } else {
            arrV = arrV[valIndex - 1];
        }
    }
    return arrV;
}

function getVariableParent(id) {
    if (typeof subprogram.localVariables[id] !== "undefined") {
        return subprogram.localVariables;
    } else {
        return program.GLOBALS;
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

function cloneArray(arr) {
    if (Array.isArray(arr)) {
        var i, copy;
        copy = arr.slice(0);
        for (i = 0; i < copy.length; i++) {
            copy[i] = cloneArray(copy[i]);
        }
        return copy;
    } else {
        return arr;
    }
}