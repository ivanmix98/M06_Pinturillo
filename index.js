/*
 * Utilització de parametres amb ExpressJS
 * @author sergi grau, sergi.grau@fje.edu
 * @version 1.0
 * date 14.01.2016
 * format del document UTF-8
 *
 * CHANGELOG
 * 14.01.2016
 * - Utilització de paràmetres
 *
 * NOTES
 * ORIGEN
 * Desenvolupament Aplicacions Web. Jesuïtes El Clot
 */
var express = require('express');
var app = express();
var port = 3000;
var MongoClient = require('mongodb').MongoClient;
var url = require("url");
var assert = require('assert');

app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/views');
app.set('view engine', "jade");
app.engine('jade', require('jade').__express);

app.get("/", function (req, res) {
  res.render("index");
});

app.get("/comprovat", function (req, res) {
  var rutadb = 'mongodb://localhost:27017';
  var user = req.query.usuari;
  var pass = req.query.password;

  MongoClient.connect(rutadb, function (err, client) {
    assert.equal(null, err);
    console.log("Connexió correcta");
    var db = client.db('pinturillo');
    var trobat = false;
    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8"
    });
    console.log("consulta document a col·lecció jugadors");

    var cursor = db.collection('jugadors').find({});
    cursor.each(function (err, doc) {
      assert.equal(err, null);

      if (doc != null) {

        if (doc.nom == user && doc.password == pass) {
          trobat = true;

          res.write(`<!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
            <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">
          </head>
          <body class="p-3 mb-2 bg-dark text-white">
            <div class="container" align="center" style="margin-top:10%;">
              <h1 class= 'h1'>Hola ` + doc.nom + `</h1>
              <form class="form-group" style="margin-left: 31%;margin-right: 31%;" action="/pinturillo">
                <input class="btn btn-outline-danger" type="submit" value="Iniciar partida"><br><br>
              </form>
            </div>
          </body>
          </html>`);

        }


      }
      else {
        if (trobat == false) res.write(`<!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
          <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">
        </head>
        <body class="p-3 mb-2 bg-dark text-white">
          <div class="container" align="center" style="margin-top:10%;">
            <h1 class="h1">No existeix aquest jugador</h1>
            <a class="btn btn-link" href="/">Prova de nou</a>
          </div>
        </body>
        </html>`);


        res.end();

      }
    }); client.close();
  });
});

app.get('/registre', function (req, res) {
  res.render("registre");
});

app.get('/registrat', function (req, res) {
  var rutadb = 'mongodb://localhost:27017';
  var user = req.query.usuari;
  var pass = req.query.password;

  MongoClient.connect(rutadb, function (err, client) {
    assert.equal(null, err);
    console.log("Connexió correcta");
    var db = client.db('pinturillo');
    db.collection('jugadors').insertOne({
      "nom": user,
      "password": pass,
      "puntuació": 0,
    });
    assert.equal(err, null);
    console.log("Afegit document a col·lecció jugadors");

    res.write(`
    <!DOCTYPE html>
    <html>
    <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">
    </head>
    <body class="p-3 mb-2 bg-dark text-white">
    <div class="container" align="center" style="margin-top:10%;">
    <h1 class="h1">REGISTRE CONFIRMAT</h1>
    <a class="btn btn-link" href="/">Fes login</a>
    </div>
    </body>
    </html>
    `);
    res.end();
    client.close();
  });

});

app.get('/pinturillo', function (req, res) {
  res.render("pinturillo");
});


// qualsevol altre petició retorna 404 not found
//req i res són els mateixos objectes de NodeJS




var io = require('socket.io').listen(app.listen(port));
console.log("Listening on port " + port);

var lastPlayerID = 0;
var players = {};

class Player {
    constructor (id){
        this.id = id;
    }
}

io.sockets.on('connection', function (socket) {
	lastPlayerID++;
	var newcommer = new Player({id: lastPlayerID});      
	players[lastPlayerID] = newcommer;
	socket.player = newcommer; // or lastPlayerID
	
  console.log(lastPlayerID);
  socket.broadcast.emit('jugadors', lastPlayerID);
  console.log(players);

	socket.emit('missatge', { missatge: 'Benvingut' });
	socket.on('enviar', function (data) {
		io.sockets.emit('missatge', data);
	});

	socket.on('startLine', function (e) {
		console.log('Dibujando...');
		io.sockets.emit('down', e);
	});

	socket.on('closeLine', function (e) {
		console.log('Trazo Terminado');
		io.sockets.emit('up', e);
	});

	socket.on('draw', function (e) {
		io.sockets.emit('move', e);
	});

	socket.on('clean', function () {
		console.log('Pizarra Limpia');
		io.sockets.emit('clean', true);
  });
  
  socket.on('turno', function () {
		console.log('Pasando el turno');
		io.sockets.emit('turno', true);
	});

});