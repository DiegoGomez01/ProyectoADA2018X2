$(document).ready(function () {

    //---------------------------------PRUEBAS-----------------------------------------------------------
    $("#headerBar").on("click", function () {
        alert("algo");
        $("#estiloEditor, #examplesChooser").fadeOut(1000, function () {});
    });
    //---------------------------------------------------------------------------------------------------

    //Cambio de tema del editor
    $('#estiloEditor a').on('click', function (evt) {
        evt.preventDefault();
        if (!$(this).hasClass("active")) {
            $('#estiloEditor a.active').removeClass("active");
            $(this).addClass("active");
            editor.setTheme("ace/theme/" + $(this).attr("data-tema"));
        }
    });

    $('#examplesChooser a').on('click', function (evt) {
        evt.preventDefault();
        $.get('http://localhost:8000/assets/algorithms/' + $(this).attr("data-fname"), (pseudo) => {
            editor.setValue(pseudo, 1);
        }, 'text');
    });

    $("#btnExe").on("click", function () {
        $("span", this).toggleClass("d-none");
        $("i", this).toggleClass("d-none");
        if (isExecuting) {
            $("#configBar").slideDown(1000, undefined);
            $("#hubExecutionControllerContainer").fadeOut(1000, function () {
                if ($("#btnPlay i").hasClass("fa-pause")) {
                    $("#btnPlay").click();
                }
            });
            editor.setReadOnly(false);
            isExecuting = false;
        } else {
            editor.setReadOnly(true);
            $("#configBar").slideUp(1000, undefined);
            $("#hubExecutionControllerContainer").fadeIn(1000, undefined);
            isExecuting = true;
        }
    });

    $('#spdSelector a').on('click', function (evt) {
        evt.preventDefault();
        if (!$(this).hasClass("active")) {
            $('#spdSelector a.active').removeClass("active");
            $(this).addClass("active");
            var spd = parseFloat($(this).attr("data-vel"));
            if (spd == 1) {
                $('#spdSelector button').text("normal");
            } else {
                $('#spdSelector button').text("x" + spd);
            }
        }
    });

    $("#btnPlay").on("click", function () {
        $("i", this).toggleClass("fa-play fa-pause");
        $("#btnBackStep, #btnNextStep, #spdSelector button").toggleClass("disabled");
    });

    $("#btnBackStep").on("click", function () {
        if (!$(this).hasClass('disabled')) {
            editor.getSession().removeMarker(actRangeSelected);
        }
    });

    $("#btnNextStep").on("click", function () {
        if (!$(this).hasClass('disabled')) {
            selectLine(0);
        }
    });
});