// var lineCounting = {};

// function countLine(line) {
//     if (lineCounting[line] !== undefined) {
//         lineCounting[line]++;
//     } else {
//         lineCounting[line] = 1;
//     }
// }

var breakPointsCount = {};

function initializeBreakPointCount() {
    let keys = Object.keys(breakPoints);
    let hasBP = keys.length > 0;
    let tabVisualizer = document.getElementById("btnBreakpoints");
    if (hasBP) {
        for (let index = 0; index < keys.length; index++) {
            const key = keys[index];
            breakPointsCount[key] = 0;
        }
        showBreakPoints();
        tabVisualizer.parentElement.parentElement.style.display = 'block';
    } else {
        tabVisualizer.parentElement.parentElement.style.display = 'none';
    }
    tabVisualizer.checked = hasBP;
    $(tabVisualizer).change();
}

function countLine(line) {
    if (typeof breakPointsCount[line] !== "undefined") {
        breakPointsCount[line]++;
        updateBreakPointValue(line);
    }
}

function showBreakPoints() {
    let breakpointInfo = "";
    $("#tbodyBreakPoints tr").remove();
    for (let [line] of Object.entries(breakPointsCount)) {
        breakpointInfo += "<tr>" +
            '<th scope="row">' + (parseInt(line) + 1) + '</th>' +
            '<td id="bp_' + line + '">' + '0</td>' +
            "</tr>";
    }
    $('#tbodyBreakPoints').append(breakpointInfo);
}

function updateBreakPointValue(line) {
    var valueContainer = $("#bp_" + line);
    $(valueContainer).fadeOut(VELOCIDADUICAMBIOSMS, function () {
        $(valueContainer).text(breakPointsCount[line]);
        $(valueContainer).fadeIn(VELOCIDADUICAMBIOSMS);
    });
}