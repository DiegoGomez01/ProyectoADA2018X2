//---------------------------CONSTANTES---------------------------
const VELOCIDADNORMALMS = 1000;
const VELOCIDADUINORMALMS = 500;
const VELOCIDADUICAMBIOSMS = 250;
//----------------------------------------------------------------

var editorGrammar;
$(document).ready(function () {
    ace.require("ace/ext/language_tools");
    editorGrammar = ace.edit($("#editorGramatica")[0], {
        theme: "ace/theme/chrome",
        mode: "ace/mode/pseudo",
        enableBasicAutocompletion: true,
        autoScrollEditorIntoView: true,
        maxLines: 342,
        minLines: 342,
        readOnly: true
    });

    $.get('../docs/gramatica.txt', (grammar) => {
        editorGrammar.setValue(grammar, 1);
    }, 'text');
});

function openADA() {
    window.open("../views/index.html", '_self');
}

alertify.defaults = {
    autoReset: true,
    basic: false,
    closable: false,
    closableByDimmer: false,
    frameless: false,
    maintainFocus: true,
    maximizable: false,
    modal: true,
    movable: true,
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