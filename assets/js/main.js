var parser;
var program;
var callStack = [];
var auxLineCreation;
var autoExecuteID;
var log;

//Variable de ambiente
var subprogram = {
    name: undefined,
    statementsBlockStack: [],
    statementIndex: [],
    localVariables: {},
    parameters: {},
    returnVariable: undefined,
    getAct: function () {
        return {
            name: this.name,
            statementsBlockStack: this.statementsBlockStack,
            statementIndex: this.statementIndex,
            localVariables: this.localVariables,
            parameters: this.parameters,
            returnVariable: this.returnVariable,
        };
    },
    reset: function () {
        this.name = undefined;
        this.statementsBlockStack = [];
        this.statementIndex = [];
        this.localVariables = {};
        this.parameters = {};
        this.returnVariable = undefined;
    },
    actStatement: function () {
        return last(this.statementsBlockStack)[last(this.statementIndex)];
    },
    addBlock: function (block) {
        this.statementsBlockStack.push(block);
        this.statementIndex.push(0);
        this.validateNextStatement();
    },
    popBlock: function () {
        this.statementsBlockStack.pop();
        this.statementIndex.pop();
    },
    finishBlock: function () {
        this.popBlock();
        locateNextStatement();
    },
    changeBlock: function (newBlock) {
        this.popBlock();
        this.addBlock(newBlock);
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
$.get('../assets/gramatica.pegjs', (gramatica) => {
    parser = peg.generate(gramatica);
}, "text");

//Análisis del pseudo-código
function analyzeProgram() {
    try {
        program = parser.parse(editor.getValue());
        editorSession.clearAnnotations();
        deleteMarker(actErrorMarker);
    } catch (err) {
        program = undefined;
        editorSession.setAnnotations([{
            row: err.location.start.line - 1,
            column: err.location.start.column - 1,
            text: err.message,
            type: "error"
        }]);
        deleteMarker(actErrorMarker);
        actErrorMarker = editorSession.addMarker(new Range(err.location.start.line - 1, err.location.start.column - 1, err.location.end.line - 1, err.location.end.column - 1), "ace_underline_error", "text");
    }
}

function startProgram(mainName) {
    var actSubprogram = program.SUBPROGRAMS[mainName];
    if (sizeObj(actSubprogram.params) > 0) {
        alertify.error('La subrutina inicial no debe tener parametros.');
    } else {
        for (var idVar in program.GLOBALS) {
            program.GLOBALS[idVar].value = evalExpression(program.GLOBALS[idVar].value);
        }
        if (alertify.selectMainSubprogram) {
            alertify.selectMainSubprogram().close();
        }
        showRunningUI();
        treeIF.resetTree();
        callStack = [];
        subprogram.reset();
        subprogram.name = mainName;
        createLocalVariables(actSubprogram.localVars, actSubprogram.params);
        subprogram.addBlock(actSubprogram.body);
        // alert(actSubprogram.skipV);
        showAllVariables();
    }
}

function startAutoExecute() {
    var exeSpd = getUISpeed();
    autoExecuteID = setInterval(executeStatement, exeSpd);
}

function changeSpeed(spd) {
    var exeSpd = VELOCIDADNORMALMS / spd;
    pauseAutoExecute();
    autoExecuteID = setInterval(executeStatement, exeSpd);
}

function tryPauseAutoExecute() {
    if (autoExecuteID !== undefined) {
        pauseAutoExecute();
        pauseUI();
        return true;
    }
}

function pauseAutoExecute() {
    clearInterval(autoExecuteID);
    autoExecuteID = undefined;
}

function stopExecution() {
    tryPauseAutoExecute();
    hideRunningUI();
}

function executeStatement() {
    var Statement = subprogram.actStatement();
    countLine(Statement.line);
    switch (Statement.type) {
        case "IfStatement":
            if (evalExpression(Statement.test)) {
                subprogram.incStatement();
                subprogram.addBlock(Statement.consequent);
                return;
            } else if (Statement.alternate !== undefined) {
                subprogram.incStatement();
                subprogram.addBlock(Statement.alternate);
                return;
            }
            break;
        case "SwitchStatement":
            subprogram.incStatement();
            subprogram.addBlock(Statement.cases);
            return;
        case "CaseSwitchStatement":
            if (Statement.caseVal == evalExpression(Statement.exp)) {
                subprogram.changeBlock(Statement.block);
                return;
            }
            break;
        case "DefaultCaseSwitchStatement":
            subprogram.changeBlock(Statement.block);
            return;
        case "WhileStatement":
        case "RepeatUntilStatement":
            if (evalExpression(Statement.test)) {
                subprogram.addBlock(Statement.body);
                return;
            }
            break;
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
            break;
        case "PushStatement":
        case "EnqueueStatement":
        case "AddStatement":
        case "AddLastStatement":
            DataStructurePush(Statement.DSVar.id, Statement.exp, Statement.type);
            break;
        case "AddFirstStatement":
            DataStructureAddFirst(Statement.DSVar.id, Statement.exp);
            break;
        case "CallExpression":
            subprogram.incStatement();
            callSubprogram(Statement.callee, Statement.arguments);
            return;
        case "SwapFunction":
            swapVariables(Statement.left, Statement.right);
            break;
        case "ReturnStatement":
            returnSubprogram(evalExpression(Statement.exp));
            return;
        case "PrintFunction":
            PrintFunction(evalExpression(Statement.exp));
            break;
        case "ShowFunction":
            ShowFunction(evalExpression(Statement.exp));
            break;
        case "ExpressionStatement":
            evalExpression(Statement.exp);
            break;
        case "BreakStatement":
            subprogram.finishBlock();
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
            selectActLine(Statement.line);
        }
    } else {
        returnSubprogram();
    }
}

function callSubprogram(name, args) {
    var actSubprogram = program.SUBPROGRAMS[name];
    var argsValues = evalArgs(args);
    callStack.push(subprogram.getAct());
    var oldName = subprogram.name;
    subprogram.reset();
    subprogram.name = name;
    createLocalVariables(actSubprogram.localVars, actSubprogram.params, args, argsValues);
    subprogram.addBlock(actSubprogram.body);
    // alert(actSubprogram.skipV);
    updateLocalVariables();
    treeIF.addCircle(getLocalVariablesString(), name, oldName == name);
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
    for (let [id, param] of Object.entries(params)) {
        let value;
        if (param.mode == "s") {
            value = getDefaultValueToParam(param.dataType, argsValues[param.pos]);
        } else {
            value = argsValues[param.pos];
            if (param.mode == "e" && Array.isArray(value)) {
                value = cloneArray(value);
            }
        }
        subprogram.localVariables[id] = {
            dataType: param.dataType,
            value: value
        };
        subprogram.parameters[id] = {
            idCaller: args[param.pos].id,
            mode: param.mode
        };
    }
    for (let [key, lVar] of Object.entries(localVars)) {
        auxLineCreation = lVar.line;
        subprogram.localVariables[key] = {
            dataType: lVar.dataType,
            value: evalExpression(lVar.value)
        };
    }
    auxLineCreation = undefined;
    resetVisualizer();
    showSelectionVarsVisualizer();
}

function getLocalVariablesString() {
    var textParams = "Parámetros: <br>";
    var textLocalVars = "Variables Locales: <br>";
    for (let [id, Var] of Object.entries(subprogram.localVariables)) {
        if (typeof subprogram.parameters[id] !== "undefined") {
            textParams += id + " : " + getStringValue(Var.dataType, Var.value) + "<br>";
        } else {
            textLocalVars += id + " : " + getStringValue(Var.dataType, Var.value) + "<br>";
        }
    }
    return textParams + textLocalVars;
}

function returnSubprogram(returnExpValue) {
    var callerSubprogram = callStack.pop();
    if (callerSubprogram == undefined) {
        disableExecutionUI();
        console.log(lineCounting);
        alertify.success("¡Fin del programa!", 5);
    } else {
        subprogram.name = callerSubprogram.name;
        subprogram.statementsBlockStack = callerSubprogram.statementsBlockStack;
        subprogram.statementIndex = callerSubprogram.statementIndex;
        for (let [idAct, param] of Object.entries(subprogram.parameters)) {
            if (param.mode == "s" || param.mode == "es") {
                callerSubprogram.localVariables[param.idCaller].value = subprogram.localVariables[idAct].value;
            }
        }
        subprogram.localVariables = callerSubprogram.localVariables;
        subprogram.parameters = callerSubprogram.parameters;
        if (returnExpValue !== undefined) {
            changeValueExpVariableAccess(callerSubprogram.returnVariable, returnExpValue);
            subprogram.returnVariable = undefined;
        }
        locateNextStatement();
        updateLocalVariables();
        treeIF.disableCircle();
    }
}

function throwException(txt) {
    stopExecution();
    let linea;
    if (subprogram.hasStatements()) {
        linea = " línea: " + (subprogram.actStatement().line + 1);
    } else {
        linea = " línea: " + (auxLineCreation + 1);
    }
    alertify.error(txt + linea, 15);
    alertify.warning("¡Cierre forzado del programa!");
    throw txt + linea;
}

function evalExpression(exp) {
    if (exp.type === undefined) {
        return exp;
    }
    switch (exp.type) {
        case "Literal":
            return exp.value;
        case "ArrayLiteral":
            var arr = cloneArray(exp.arr);
            if (checkArrayDimensions(arr, getArrayIndex(exp.d))) {
                return arr;
            }
            return throwException("Las dimensiones no coinciden");
        case "EmptyArray":
            return [];
        case "ArrayCreation":
            return createNewArray(getArrayIndex(exp.d), exp.valueDefault);
        case "Variable":
            return getVariableValue(exp.id);
        case "ArrayAccess":
            visualizeArrayAccess(exp);
            return getArrayAccessValue(exp.id, getArrayIndex(exp.index));
        case "int":
            return getValidatedNumberExpression(evalIntExpression(exp));
        case "float":
            return getValidatedNumberExpression(evalFloatExpression(exp));
        case "boolean":
            return evalBooleanExpression(exp);
        case "FloorFunction":
            return Math.floor(evalExpression(exp.exp));
        case "CeilingFunction":
            return Math.ceil(evalExpression(exp.exp));
        case "CastingIntFunction":
            return parseInt(evalExpression(exp.exp));
        case "PowFunction":
            return getValidatedNumberExpression(powFunction(evalExpression(exp.base), evalExpression(exp.exp)));
        case "SqrtFunction":
            return getValidatedNumberExpression(sqrtFunction(evalExpression(exp.base)));
        case "ArrayLengthFunction":
            return getVariableValue(exp.arrVar.id).length;
        case "StringLengthFunction":
            return getVariableValue(exp.strVar.id).length;
        case "StringConcatenation":
            return evalStringConcatenation(exp.exps);
        case "CharAtFunction":
            return getCharAt(exp);
        case "SizeFunction":
            return getVariableValue(exp.DSVar.id).length;
        case "IsEmptyFunction":
            return IsEmptyDataStructureFunction(getVariableValue(exp.DSVar.id));
        case "PopExpression":
            popStackVisualizer(exp.StackVar.id);
            return RemoveLastDSFunction(exp.StackVar.id, "La pila está vacía");
        case "PeekExpression":
            return GetLastDSFunction(exp.StackVar.id, "La pila está vacía");
        case "DequeueExpression":
            enqueueQueueVisualizer(exp.QueueVar.id);
            return RemoveFirstDSFunction(exp.QueueVar.id, "La cola está vacía");
        case "FrontExpression":
            return GetFirstDSFunction(exp.QueueVar.id, "La cola está vacía");
        case "IndexFunction":
            return IndexOfFunction(getVariableValue(exp.ListVar.id), evalExpression(exp.element));
        case "RemoveElementByIndexExpression":
            return RemoveElementByIndexFunction(exp.ListVar.id, evalExpression(exp.index));
        case "RemoveElementExpression":
            return RemoveElementFunction(exp.ListVar.id, evalExpression(exp.element));
        case "RemoveFirstExpression":
            return RemoveFirstDSFunction(exp.ListVar.id, "La lista está vacía");
        case "RemoveLastExpression":
            return RemoveLastDSFunction(exp.ListVar.id, "La lista está vacía");
        case "GetElementByIndexExpression":
            return GetElementByIndexFunction(getVariableValue(exp.ListVar.id), evalExpression(exp.index));
        case "GetFirstExpression":
            return GetFirstDSFunction(exp.ListVar.id, "La lista está vacía");
        case "GetLastExpression":
            return GetLastDSFunction(exp.ListVar.id, "La lista está vacía");
        case "DSContainsFunction":
            return ContainsFunction(getVariableValue(exp.DSVar.id), evalExpression(exp.element));
        case "StringContainsFunction":
            return getVariableValue(exp.strVar.id).includes(evalExpression(exp.strExp));
        case "AbsoluteValueFunction":
            return Math.abs(evalExpression(exp.numExp));
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

function powFunction(x, y) {
    return Math.pow(x, y);
}

function sqrtFunction(x) {
    return Math.sqrt(x);
}

function getValidatedNumberExpression(num) {
    if (isNaN(num)) {
        throwException("La expresión no es numérica.");
    }
    return num;
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
            if (evalExpression(booleanExp.left)) {
                return evalExpression(booleanExp.right);
            }
            return false;
        case "or":
            if (!evalExpression(booleanExp.left)) {
                return evalExpression(booleanExp.right);
            }
            return true;
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

function getCharAt(exp) {
    var strV = getVariableValue(exp.strVar.id);
    var index = evalExpression(exp.index);
    if (index <= 0) {
        throwException("No puede acceder a un indice menor a 0");
    }
    return strV.charAt(index - 1);
}

function PrintFunction(exp) {
    console.log(exp);
}

function ShowFunction(text) {
    alertify.alert("Alert", '<p class="text-center">' + text + '</p>');
}

function AssignmentFunction(left, right) {
    if (right.callee == undefined) {
        changeValueExpVariableAccess(left, evalExpression(right));
        return true;
    } else {
        subprogram.incStatement();
        subprogram.returnVariable = left;
        callSubprogram(right.callee, right.arguments);
        return false;
    }
}

function DataStructurePush(id, exp, typeAction) {
    var expValue = evalExpression(exp);
    if (checkIsOnVisualizer(varid)) {
        if (typeAction == "PushStatement") {
            pushStackVisualizer(id, expValue);
        } else if (typeAction == "EnqueueStatement") {
            enqueueQueueVisualizer(id, expValue);
        }
    }
    getVariableValue(id).push(expValue);
    updateVariableValue(id);
}

function DataStructureAddFirst(id, exp) {
    getVariableValue(id).unshift(evalExpression(exp));
    updateVariableValue(id);
}

function RemoveElementFunction(id, element) {
    let dataStructure = getVariableValue(id);
    if (ContainsFunction(dataStructure, element)) {
        let index = dataStructure.indexOf(element);
        dataStructure.splice(index, 1);
        updateVariableValue(id);
        return true;
    } else {
        return false;
    }
}

function RemoveElementByIndexFunction(id, index) {
    let dataStructure = getVariableValue(id);
    if (index > 0 && index <= dataStructure.length) {
        let returned = dataStructure.splice(index - 1, 1);
        updateVariableValue(id);
        return returned;
    } else {
        throwException("El índice sobre pasa las dimensiones de la lista");
    }
}

function RemoveFirstDSFunction(id, EMPTYEXCEPTION) {
    let dataStructure = getVariableValue(id);
    if (IsEmptyDataStructureFunction(dataStructure)) {
        throwException(EMPTYEXCEPTION);
    }
    let returned = dataStructure.shift();
    updateVariableValue(id);
    return returned;
}

function RemoveLastDSFunction(id, EMPTYEXCEPTION) {
    let dataStructure = getVariableValue(id);
    if (IsEmptyDataStructureFunction(dataStructure)) {
        throwException(EMPTYEXCEPTION);
    }
    let returned = dataStructure.pop();
    updateVariableValue(id);
    return returned;
}

function GetElementByIndexFunction(dataStructure, index) {
    if (index > 0 && index <= dataStructure.length) {
        return dataStructure[index - 1];
    } else {
        throwException("El índice sobre pasa las dimensiones de la lista");
    }
}

function GetFirstDSFunction(id, EMPTYEXCEPTION) {
    let dataStructure = getVariableValue(id);
    if (IsEmptyDataStructureFunction(dataStructure)) {
        throwException(EMPTYEXCEPTION);
    }
    return dataStructure[0];
}

function GetLastDSFunction(id, EMPTYEXCEPTION) {
    let dataStructure = getVariableValue(id);
    if (IsEmptyDataStructureFunction(dataStructure)) {
        throwException(EMPTYEXCEPTION);
    }
    return last(dataStructure);
}

function ContainsFunction(dataStructure, element) {
    return IndexOfFunction(dataStructure, element) > 0;
}

function IndexOfFunction(dataStructure, element) {
    return dataStructure.indexOf(element) + 1;
}

function IsEmptyDataStructureFunction(dataStructure) {
    return dataStructure.length == 0;
}

function swapVariables(left, right) {
    let swapMaked = visualizeswapArrayCanvas(left, right);
    var leftV = getValueExpVariableAccess(left);
    changeValueExpVariableAccess(left, getValueExpVariableAccess(right), swapMaked);
    changeValueExpVariableAccess(right, leftV, swapMaked);
}

function incVariable(id, inc) {
    changeVariableValue(id, getVariableValue(id) + inc);
}

function getValueExpVariableAccess(exp) {
    if (exp.type == "ArrayAccess") {
        return getArrayAccessValue(exp.id, getArrayIndex(exp.index));
    } else {
        return getVariableValue(exp.id);
    }
}

function changeValueExpVariableAccess(exp, value, vsChange) {
    if (exp.type == "ArrayAccess") {
        visualizeArrayChangeValue(exp, value, vsChange);
        changeArrayAccessValue(exp.id, getArrayIndex(exp.index), value);
    } else {
        changeVariableValue(exp.id, value);
        visualizeVariableChange(exp.id, value);
    }
}

function changeVariableValue(id, value) {
    getVariable(id).value = value;
    updateVariableValue(id);
}

function changeArrayAccessValue(id, index, value) {
    var arrV = getVariable(id).value;
    for (let i = 0; i < index.length; i++) {
        if (index[i] < 1) {
            throwException("La primera posición de los arreglos es 1.");
        } else if (index[i] > arrV.length) {
            throwException("El indice sobrepasa la longitud del arreglo.");
        }
        if (i === index.length - 1) {
            arrV[index[i] - 1] = value;
        } else {
            arrV = arrV[index[i] - 1];
        }
    }
    updateVariableValue(id);
}

function getVariableValue(id) {
    return getVariable(id).value;
}

function getVariableDataType(id) {
    return getVariable(id).dataType;
}

function getArrayAccessValue(id, index) {
    var arrV = getVariable(id).value;
    for (let i = 0; i < index.length; i++) {
        if (index[i] < 1) {
            throwException("La primera posición de los arreglos es 1.");
        } else if (index[i] > arrV.length) {
            throwException("El indice sobrepasa la longitud del arreglo.");
        } else {
            arrV = arrV[index[i] - 1];
        }
    }
    return arrV;
}

function getVariable(id) {
    var Var = subprogram.localVariables[id];
    if (typeof Var == "undefined") {
        Var = program.GLOBALS[id];
    }
    return Var;
}

function getVariableScope(id) {
    if (typeof subprogram.localVariables[id] !== "undefined") {
        return "L";
    }
    return "G";
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

function getArrayIndex(index) {
    var newIndex = [];
    for (let i = 0; i < index.length; i++) {
        const indexExp = index[i];
        newIndex[i] = evalExpression(indexExp);
    }
    return newIndex;
}

function createNewArray(dimensions, value) {
    if (dimensions.length > 0) {
        var dim = dimensions[0];
        var rest = dimensions.slice(1);
        var newArray = [];
        if (dim > 0) {
            for (var i = 0; i < dim; i++) {
                newArray[i] = createNewArray(rest, value);
            }
        } else {
            throwException("No se puede crear un arreglo con tamaño menor a 1");
        }
        return newArray;
    } else {
        return value;
    }
}

function checkArrayDimensions(array, dimensions) {
    var dim = dimensions[0];
    var rest = dimensions.slice(1);
    if (array.length != dim) {
        return false;
    }
    for (var i = 0; i < dim; i++) {
        if (rest.length > 0 && Array.isArray(array[i])) {
            if (!checkArrayDimensions(array[i], rest)) {
                return false;
            }
        } else if (Array.isArray(array[i])) {
            return false;
        }
    }
    return true;
}

function getArrayDimensions(array) {
    let dimensions = [];
    dimensions[0] = array.length;
    if (Array.isArray(array[0])) {
        dimensions[1] = array[0].length;
    }
    return dimensions;
}

function getDefaultValueToParam(dataType, value) {
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
    if (dataType.includes("lista") || dataType.includes("pila") || dataType.includes("cola")) {
        return [];
    } else if (dataType.includes("[][]")) {
        return createNewArray(getArrayDimensions(value), getDefaultValueToParam(dataType.slice(0, -4)));
    } else if (dataType.includes("[]")) {
        return createNewArray(getArrayDimensions(value), getDefaultValueToParam(dataType.slice(0, -2)));
    }
}