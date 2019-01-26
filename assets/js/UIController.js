$(document).ready(function () {

    //---------------------------------PRUEBAS-----------------------------------------------------------
    $("#headerBar").on("click", function () {
        // $("#visualizationContainer").toggleClass("col-sm-7 d-none");
        // $("#editor").toggleClass("col-sm-5 col");
        var test2 = document.getElementById("iframeVisualizer").contentWindow;
        console.log(test2);
        test2.ComparisonSort.prototype.testn();
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

    //escoger un algoritmo para cargarlo
    $('#examplesChooser a').on('click', function (evt) {
        evt.preventDefault();
        $.get('http://localhost/ProyectoADA2018X2/assets/algorithms/' + $(this).attr("data-fname"), (pseudo) => {
            editor.setValue(pseudo, 1);
        }, 'text');
    });

    $("#btnExe").on("click", function () {
        if (isExecuting) {
            $(this).text("Ejecutar");
            $("#configBar").slideDown(1000, undefined);
            $("#hubExecutionControllerContainer").fadeOut(1000, function () {
                if ($("#btnPlay i").hasClass("fa-pause")) {
                    $("#btnPlay").click();
                }
            });
            editor.setReadOnly(false);
            isExecuting = false;
            deleteMarker(actLineSelected);
        } else if (program !== undefined) {
            editor.setReadOnly(true);
            $(this).text("Detener");
            $("#configBar").slideUp(1000, undefined);
            $("#hubExecutionControllerContainer").fadeIn(1000, undefined);
            isExecuting = true;
            if (program.SUBPROGRAMS.main === undefined) {
                alertify.alert(
                    '<h4 class="text-center">¡Seleccione la función inicial (main)!</h4>' +
                    '<div class="btn-group-vertical w-100">' +
                    Object.keys(program.SUBPROGRAMS).reduce(function (buttons, nameAct) {
                        return buttons + '<button type="button" class="btn btn-secondary  w-100 mb-1" onclick="startProgram(' + "'" + nameAct + "'" + ')">' + nameAct + '</button>';
                    }, "") +
                    '</div>'
                ).set('basic', true);
            } else {
                startProgram("main");
            }

        } else {
            alertify.error('El programa no se puede ejecutar.');
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
            editor.getSession().removeMarker(actLineSelected);
        }
    });

    $("#btnNextStep").on("click", function () {
        if (!$(this).hasClass('disabled')) {
            selectLine(0);
        }
    });
});