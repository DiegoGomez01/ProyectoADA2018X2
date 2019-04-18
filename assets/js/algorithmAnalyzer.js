
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
        // showRunningUI();//
        // treeIF.resetTree();
        // callStack = [];
        // subprogram.reset();
        // subprogram.name = mainName;
        // createLocalVariables(actSubprogram.localVars, actSubprogram.params);
        // subprogram.addBlock(actSubprogram.body);
        // // alert(actSubprogram.skipV);
        // showAllVariables();
    }
}

function isRecursive() {

}