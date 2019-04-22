var recursiveCalls = [];
var points = 0;
var maxPointsLevel = 100;
var attempts = 5;
var mainNameGame;
var indexLineAct;
var lineActG;

function startAnalyzing(mainName) {
    var actSubprogram = program.SUBPROGRAMS[mainName];
    if (sizeObj(actSubprogram.params) > 0) {
        alertify.error('La subrutina inicial no debe tener parametros.');
    } else {
        for (var idVar in program.GLOBALS) {
            program.GLOBALS[idVar].value = evalExpression(program.GLOBALS[idVar].value);
        }
        if (alertify.selectAnalyzedSubprogram) {
            alertify.selectAnalyzedSubprogram().close();
        }
        showGamingUI();
        mainNameGame = mainName;
        lineOrder = [];
        recursiveCalls = [];
        points = 0;
        updatePointsUI();
        attempts = 5;
        resetAttemptsUI();
        treeIF.resetTree();
        callStack = [];
        subprogram.reset();
        subprogram.name = mainName;
        createLocalVariables(actSubprogram.localVars, actSubprogram.params);
        subprogram.addBlock(actSubprogram.body);
        console.log(lineCounting);
        console.log(lineOrder);
    }
}

function askForRecursive() {
    alertify.confirm('Primera Pregunta', '¿El algoritmo es recursivo?',
        function () {
            if (recursiveCalls.length == 0) {
                alertify.error('¡Error!&nbsp;<i class="far fa-sad-tear"></i>');
                lostAttempts();
            } else {
                alertify.success('¡Bien!&nbsp;<i class="far fa-smile-beam"></i><br>El algoritmo tiene llamados recursivos en: ' + getRecursiveCalls());
                addPoints(sizeObj(program.SUBPROGRAMS));
                loadTreeCreation();
            }
        }
        , function () {
            if (recursiveCalls.length == 0) {
                alertify.success('¡Bien!&nbsp;<i class="far fa-smile-beam"></i><br>¡El algoritmo no tiene llamados recursivos!');
                addPoints(sizeObj(program.SUBPROGRAMS));
                loadIterativeGame();
            } else {
                alertify.error('¡Error!&nbsp;<i class="far fa-sad-tear"></i>');
                lostAttempts();
            }
        }).set('labels', { ok: 'Si', cancel: 'No' });
}

function compareTrees() {
    if (gameTreeIF.compareTree(treeIF.getTree()[0], gameTreeIF.getTree()[0])) {
        alertify.success('¡Bien!&nbsp;<i class="far fa-smile-beam"></i><br>¡Los arboles de ambientes son iguales!');
        addPoints(gameTreeIF.countTreeNodes(treeIF.getTree()[0]));
    } else {
        alertify.error('¡Error!&nbsp;<i class="far fa-sad-tear"></i><br>¡Los arboles de ambientes no son iguales!');
        lostAttempts();
    }
}

function getRecursiveCalls() {
    var str = "" + recursiveCalls[0];
    for (let i = 1; i < recursiveCalls.length; i++) {
        const callR = recursiveCalls[i];
        str += "," + callR;
    }
    return str;
}

function addPoints(np) {
    points += np;
    if (points >= maxPointsLevel) {
        alertify.alert('<h1 class="texto-exito">¡Superaste los ' + maxPointsLevel + ' puntos máximos!&nbsp;<i class="far fa-surprise"></i></h1>', '<p class="text-center">¡Lo Has Hecho Muy Bien! <br> Alcanzaste el mayor puntaje del juego <br><br> ¡Ahora estás a otro nivel!</p>');
    }
    updatePointsUI();
}

function lostAttempts() {
    attempts--;
    removeAttemptsUI();
    if (attempts == 0) {
        lost();
    }
}

function lost() {
    alertify.alert('<h1 class="texto-errorSistema">¡Ya Perdiste!</h1>', '<p class="text-center">Debes estudiar el algoritmo y volver a empezar</p>');
    hideGamingUI();
}

function nextLineGame() {
    let lineTimes = parseInt(getLineGame());
    if (isNaN(lineTimes)) {
        alertify.warning('¡Advertencia!&nbsp;<i class="fas fa-exclamation-triangle"></i><br>Debes ingresar un "número" de veces');
    } else {
        if (lineCounting[lineActG] == lineTimes) {
            addPoints(lineTimes);
            alertify.success('¡Bien!&nbsp;<i class="far fa-smile-beam"></i><br>¡Siguiente línea!');
            indexLineAct++;
            updateLineGame();
        } else {
            alertify.error('¡Error!&nbsp;<i class="far fa-sad-tear"></i><br>Número incorrecto');
            lostAttempts();
        }
    }
}

function lineError() {

}

function startIterativeGame() {
    indexLineAct = 0;
    updateLineGame();
}

function updateLineGame() {
    $("#inputLineGame").val("");
    if (indexLineAct < lineOrder.length) {
        lineActG = lineOrder[indexLineAct];
        selectActLine(lineActG);
        $("#actLineGame").text(lineActG + 1);
    } else {
        unSelectActLine();
        alert("termine");
    }
}