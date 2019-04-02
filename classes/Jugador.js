class Jugador{

    constructor (id){
        this.id = id;
        this.torn = true;
    }

    pasarturno () {
        this.torn = false;
      }


}

exports.Jugador = Jugador;

//var j = require('./classes/Jugador');
//var p = require('./classes/Partida');

