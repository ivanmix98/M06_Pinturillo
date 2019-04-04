

window.onload = function () {

    var missatges = [];
    var socket = io.connect('http://192.168.1.34:3000');
    var entrada = document.getElementById("entrada");
    var boto = document.getElementById("enviar");
    var contingut = document.getElementById("contingut");
    var resultado = document.getElementById("resultado");
    var tiempo = document.getElementById("tiempo");

    var palabras = ['Linux', 'Pingu'];
    var palabra = 'Linux';
    var jugadors = [];
    var n = 60;
    
    temporizador();

    function temporizador() {

        setInterval(function () {
            tiempo.innerHTML = n;
            if (n == 0) {
                tiempo.innerHTML = "FIN DEL TIEMPO";
            }
            else { n--; }
        }, 1000);

    }
    

    var lastPlayerID = 0;
    var players = {};

    class Player {
        constructor(id) {
            this.id = id;
        }
    }
    
    
    lastPlayerID++;
    var newcommer = new Player({id: lastPlayerID});  
       
	players[lastPlayerID] = newcommer;

	
    
    socket.emit('jugadors', lastPlayerID);
    console.log(players);

    var llistajugadors = document.getElementById("llistajugadors");

    socket.on('jugadors2', function (data) {
        console.log(data);

        
            jugadors = data;

            var html = '';
            for (var i = 0; i < jugadors.length; i++) {
                
                html += 'Jugador ' + jugadors[i] + '<br />';
            }
            llistajugadors.innerHTML = html;
            console.log(jugadors);
        

       // else { console.log('Sala llena'); };


    });

    canvasApp();
    socket.on('missatge', function (data) {
        if (data.missatge) {
            missatges.push(data.missatge);
            var html = '';
            for (var i = 0; i < missatges.length; i++) {
                html += missatges[i] + '<br />';
            }
            contingut.innerHTML = html;
        } else {
            console.log("Problema:", data);
        }
    });




    boto.onclick = function () {
        var text = entrada.value;
        socket.emit('enviar', { missatge: text });

        if (palabras.indexOf(entrada.value) === -1) {
            console.log('Fallaste wey');
            resultado.innerHTML = 'Fallaste wey';
        }
        else if (palabras.indexOf(entrada.value) > -1) {
            console.log('Acertaste!!!');
            resultado.innerHTML = 'Acertaste!!!';

        }


    };



  

    function canvasApp() {


        var theCanvas = document.getElementById("canvas"),
            context = theCanvas.getContext("2d"),
            buttonClean = document.getElementById("clean"),
            buttonturno = document.getElementById("turno");
        init();

        function init() {

            var prueba = 1;

            clean();
            turno();

            var click = false //Cambia a true si el usuario esta pintando
            var block = false; //Cambia a true si hay otro usuario pintando

            /* Las variables click y block funcionan de forma que cuando un usuario esta dibujando, 
            los demás deben esperar a que este termine el trazo para poder dibujar ellos */

            function clean() {
                context.fillStyle = "white";
                context.fillRect(0, 0, theCanvas.width, theCanvas.height);
            }


            function turno() {

                document.getElementById("textoturno").innerHTML = 'Turno del jugador ' + prueba;


                document.getElementById("palabra").innerHTML = 'Paraula a dibuixar: ' + palabra;

                prueba++;

                if (prueba == 4) {
                    prueba = 1;
                }
            }

            //Se inicia al trazo en las coordenadas indicadas.
            function startLine(e) {
                context.beginPath();
                context.strokeStyle = "black";
                context.lineCap = "round";
                context.lineWidth = 5;
                let bound = canvas.getBoundingClientRect();
                let x = e.clientX - bound.left - canvas.clientLeft;
                let y = e.clientY - bound.top - canvas.clientTop;
                context.moveTo(x, y);
            }

            //Se termina el trazo.
            function closeLine(e) {
                context.closePath();
            }


            //Dibujamos el trazo recibiendo la posición actual del ratón.
            function draw(e) {
                let bound = canvas.getBoundingClientRect();
                let x = e.clientX - bound.left - canvas.clientLeft;
                let y = e.clientY - bound.top - canvas.clientTop;
                context.lineTo(x, y);


                context.stroke();

            }

            //Usamos la librería socket.io para comunicarnos con el servidor mediante websockets
            socket.on('connect', function () {

                //Al darle click al botón limpiar enviamos orden de devolver la pizarra a su estado inicial.
                buttonClean.addEventListener("click", function () {

                    if (!block) {
                        socket.emit('clean', true);
                    }

                }, false);

                buttonturno.addEventListener("click", function () {


                    socket.emit('turno', true);


                }, false);

                //Al clickar en la pizarra enviamos el punto de inicio del trazo
                theCanvas.addEventListener("mousedown", function (e) {

                    if (!block) {
                        socket.emit('startLine', { clientX: e.clientX, clientY: e.clientY });
                        click = true;
                        startLine(e);
                    }

                }, false);

                //Al soltar el click (dentro o fuera del canvas) enviamos orden de terminar el trazo
                window.addEventListener("mouseup", function (e) {

                    if (!block) {
                        socket.emit('closeLine', { clientX: e.clientX, clientY: e.clientY });
                        click = false;
                        closeLine(e);
                    }

                }, false);

                //Al mover el ratón mientras esta clickado enviamos coordenadas donde continuar el trazo.
                theCanvas.addEventListener("mousemove", function (e) {

                    if (click) {
                        if (!block) {
                            socket.emit('draw', { clientX: e.clientX, clientY: e.clientY });
                            draw(e);
                        }
                    }

                }, false);


                //Recibimos mediante websockets las ordenes de dibujo

                socket.on('down', function (e) {
                    if (!click) {
                        block = true;
                        startLine(e);
                    }
                });

                socket.on('up', function (e) {
                    if (!click) {
                        block = false;
                        closeLine(e);
                    }
                });

                socket.on('move', function (e) {
                    if (block) {
                        draw(e);
                    }
                });

                socket.on('clean', clean);

                socket.on('turno', turno);
            });

        }
    }


};