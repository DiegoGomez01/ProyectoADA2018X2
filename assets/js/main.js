$(document).ready(function () {
    var editor = ace.edit($("#editor")[0], {
        theme: "ace/theme/chrome",
        mode: "ace/mode/pseudo",
        autoScrollEditorIntoView: true,
        maxLines: 50,
        minLines: 10
    });

    $("#btnExe").on("click", function () {
        try {
            var mon = parser.parse("abbac");
            alert(mon);
            alert("Exito");
        } catch (err) {
            console.log(err.location);
            console.log(err.found);
            console.log(err.message);
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


