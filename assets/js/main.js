$(document).ready(function () {
    var editor = ace.edit($("#editor")[0], {
        theme: "ace/theme/chrome",
        mode: "ace/mode/pseudo",
        autoScrollEditorIntoView: true,
        maxLines: 50,
        minLines: 10
    });

    $("#btnExe").on("click", function(){
        alert("now");
    });

    $('#estiloEditor a').on('click', function () {
        if (!$(this).hasClass("active")) {
            $('#estiloEditor a.active').removeClass("active");
            $(this).addClass("active");
            editor.setTheme("ace/theme/" + $(this).attr("data-tema"));
        }
    });
});

function prueba() {
    // var socket = io();
    // alert("revisar");
    // socket.on('hola', function (stockprice) {
    //     alert("hola");
    // });
    alert("hulk");
}


