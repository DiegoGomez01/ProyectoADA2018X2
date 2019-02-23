var lineCounting = {};

function countLine(line) {
    if (lineCounting[line] !== undefined) {
        lineCounting[line]++;
    } else {
        lineCounting[line] = 1;
    }
}