var parser;
$(document).ready(function () {
    //Lee el archivo de la gramatica y crea el parser
    $.get('http://localhost:8000/assets/gramatica.pegjs', (gramatica) => {
        parser = peg.generate(gramatica);
    }, 'text');

    //Pruebas

    //------------------------------

    //Creación del editor de código
    var editor = ace.edit($("#editor")[0], {
        theme: "ace/theme/chrome",
        mode: "ace/mode/pseudo",
        autoScrollEditorIntoView: true,
        maxLines: 50,
        minLines: 10
    });

    //Cambio de tema del editor
    $('#estiloEditor a').on('click', function () {
        if (!$(this).hasClass("active")) {
            $('#estiloEditor a.active').removeClass("active");
            $(this).addClass("active");
            editor.setTheme("ace/theme/" + $(this).attr("data-tema"));
        }
    });

    //Código para mostrar una anotación en el editor
    /*  
    editor.session.clearAnnotations(); // Limpiar anotaciones
    editor.getSession().setAnnotations([{
        row: 0,
        column: 0,
        text: "se ejecuto n",
        type: "info" // (warning, info, error)
    }]);
    */

    //Análisis y Ejecución del pseudo-código
    $("#btnExe").on("click", function () {
        try {
            var programa = parser.parse(editor.getValue());
            alert(programa);
            alert("Exito");
        } catch (err) {
            editor.getSession().setAnnotations([{
                row: err.location.start.line - 1,
                column: err.location.start.column - 1,
                text: err.message,
                type: "error" // (warning, info, error)
            }]);
            // console.log(err.location); // Ubicación del error: {start:{offset:X,line:Y,column:Z},end:{offset:X,line:Y,column:Z}}
            // console.log(err.found); // Valor encontrado
            // console.log(err.message); // Mensaje de error
        }
    });
});