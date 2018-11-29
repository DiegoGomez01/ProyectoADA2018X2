var parser;
$(document).ready(function () {
    $.get('http://localhost:8000/assets/gramatica.pegjs', function (gramatica) {
        parser = peg.generate(gramatica);
    }, 'text');

    alert(2e3);

    var editor = ace.edit($("#editor")[0], {
        theme: "ace/theme/chrome",
        mode: "ace/mode/pseudo",
        autoScrollEditorIntoView: true,
        maxLines: 50,
        minLines: 10
    });

    $("#btnExe").on("click", function () {
        try {
            var mon = parser.parse(editor.getValue());
            alert(mon);
            alert("Exito");

        } catch (err) {
            editor.getSession().setAnnotations([{
                row: err.location.start.line - 1,
                column: err.location.start.column - 1,
                text: err.message,
                type: "error" // (warning, info, error)
            }]);
            // editor.session.clearAnnotations();
            // console.log(err.location); // {start:{offset:X,line:Y,column:Z},end:{offset:X,line:Y,column:Z}}
            // console.log(err.found); // Valor encontrado
            // console.log(err.message); // Mensaje de error
        }
    });

    $('#estiloEditor a').on('click', function () {
        if (!$(this).hasClass("active")) {
            $('#estiloEditor a.active').removeClass("active");
            $(this).addClass("active");
            editor.setTheme("ace/theme/" + $(this).attr("data-tema"));
        }
    });
});