function showAllVariables() {
    $("#tbodyGlobalVars, #tbodyLocalVars").find("tr:gt(0)").remove();
    if (sizeObj(program.GLOBALS) > 0) {
        $("#tbodyGlobalVars").fadeIn();
        var globalsInfo = "";
        for (let [idVar, Var] of Object.entries(program.GLOBALS)) {
            globalsInfo += "<tr>" +
                '<th scope="row">' + idVar + '</th>' +
                '<td>' + Var.dataType + '</td>' +
                '<td id="value_' + idVar + 'G">' + getStringValue(Var.dataType, Var.value) + '</td>' +
                "</tr>";
        }
        $('#tbodyGlobalVars tr:last').after(globalsInfo);
    } else {
        $("#tbodyGlobalVars").fadeOut();
    }
    updateLocalVariables();
}

function updateLocalVariables() {
    $("#tbodyLocalVars").find("tr:gt(0)").remove();
    $("#titleActSubprogram").text(subprogram.name);
    var parametersInfo = "";
    var variablesInfo = "";
    $('#tbodyLocalVars').fadeOut(VELOCIDADUICAMBIOSMS, function () {
        if (sizeObj(subprogram.localVariables) > 0) {
            for (let [idVar, Var] of Object.entries(subprogram.localVariables)) {
                var param = subprogram.parameters[idVar];
                if (param !== undefined) {
                    parametersInfo += "<tr>" +
                        '<th scope="row">' + idVar + '</th>' +
                        '<td> Param [' + (param.mode).toUpperCase() + '] <br>' + Var.dataType + '</td>' +
                        '<td id="value_' + idVar + 'L">' + getStringValue(Var.dataType, Var.value) + '</td>' +
                        "</tr>";
                } else {
                    variablesInfo += "<tr>" +
                        '<th scope="row">' + idVar + '</th>' +
                        '<td>' + Var.dataType + '</td>' +
                        '<td id="value_' + idVar + 'L">' + getStringValue(Var.dataType, Var.value) + '</td>' +
                        "</tr>";
                }
            }
            $('#tbodyLocalVars tr:last').after(parametersInfo + variablesInfo);
            $('#tbodyLocalVars').fadeIn(VELOCIDADUICAMBIOSMS);
        }
    });
}

function getStringValue(dataType, value) {
    switch (dataType) {
        case "char":
            return "'" + value + "'";
        case "string":
            return '"' + value + '"';
        case "int":
        case "float":
        case "boolean":
            return value;
    }
    var subDataType = "";
    if (dataType.includes("[][]")) {
        subDataType = dataType.slice(0, -4);
        var matrixStr = "";
        for (let i = 0; i < value.length; i++) {
            matrixStr += "[" + getDataStructureString(subDataType, value[i]) + "]<br>";
        }
        return matrixStr.slice(0, -4);
    } else if (dataType.includes("[]")) {
        subDataType = dataType.slice(0, -2);
        return "[" + getDataStructureString(subDataType, value) + "]";
    } else if (dataType.includes("lista")) {
        subDataType = dataType.replace('lista<', '').slice(0, -1);
        return "{" + getDataStructureString(subDataType, value) + "}";
    } else if (dataType.includes("cola")) {
        subDataType = dataType.replace('cola<', '').slice(0, -1);
        return "{" + getDataStructureString(subDataType, value) + "}";
    } else if (dataType.includes("pila")) {
        subDataType = dataType.replace('pila<', '').slice(0, -1);
        return "{" + getDataStructureString(subDataType, value) + "}";
    }
}

function getDataStructureString(dataType, dataStructure) {
    if (dataType == "int" || dataType == "float" || dataType == "boolean") {
        return dataStructure.toString().replace(/,/g, ", ");
    }
    var stringDS = "";
    if (dataStructure.length > 0) {
        stringDS += getStringValue(dataType, dataStructure[0]);
        for (let i = 1; i < dataStructure.length; i++) {
            stringDS += ", " + getStringValue(dataType, dataStructure[i]);
        }
    }
    return stringDS;
}

function updateVariableValue(id) {
    var Var = getVariable(id);
    var scope = getVariableScope(id);
    var valueContainer = $("#value_" + id + scope);
    $(valueContainer).fadeOut(VELOCIDADUICAMBIOSMS, function () {
        $(valueContainer).text(getStringValue(Var.dataType, Var.value));
        $(valueContainer).fadeIn(VELOCIDADUICAMBIOSMS);
    });
}