var peg = require("./gramatica.js");
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
app.use(express.static(__dirname + "/../"));

app.get('/', function (req, res) {
    res.sendFile('index.html');
});

server.listen(8000, function () {
    console.log('Servidor Corriendo en el puerto 8000');
});

io.on('connection', function (socket) {
    console.log('Se Establecio una nueva conexión WebSocket');
});

setInterval(function () {
    var stockprice;
    io.emit('hola', stockprice);
}, 5000);

// try {
//     var hola = peg.parse("aaaaaaaaaaaaaaabba");
//   } catch (err) {
//     console.log(err.location);
//     console.log(err.found);
//     console.log(err.message);
//   }

// console.log(hola);