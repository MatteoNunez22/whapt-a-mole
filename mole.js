var mole = {
    id: "",
    score: 0
};

var settings = {
    intensity: 255,
    duration: 1000,
    paused: true,
    mode: 0 // Singleplayer :   0
            // Multiplayer  :   1
};

var pressed = {
    id: ""
};

var lastIndex = -1;
var times = 0;

mole.startContainer = function () {
    $('#title').hide();
    $('#selectorView').hide();
    $('#shoeButtons').hide();
    $('.experimentButton').hide();
    $('#moleView').show();
    mole.status = "Not started";
    document.getElementById('status').getElementsByTagName('span')[0].innerText = mole.status;
    //$("#status > #span").html(mole.status);

    mole.score = 0;
    document.getElementById('score').getElementsByTagName('span')[0].innerText = mole.score;
    //$("#score > #span").html(mole.score);
};

$(document).ready(function() {      // Document ready

    mole.play = function () {       // Plays one mole
        //console.log("lastIndex = " + lastIndex);
        if (lastIndex == -1) {
            mole.status = "Started";
            document.getElementById('status').getElementsByTagName('span')[0].innerText = mole.status;
            //console.log("STARTED");
            settings.paused = false;
        }
        times = 0;
        mole.randomize();

        if (settings.paused == false) {
            setTimeout(mole.play, (Math.random() * 1200 + 500));  // Random mole appearence
        }
    };

    mole.pause = function () {
        if (settings.paused) {  // Unpaused
            settings.paused = false;
            mole.status = "Started";
            document.getElementById('status').getElementsByTagName('span')[0].innerText = mole.status;
            document.getElementById('moleView').getElementsByTagName('button')[1].innerText = "Pause";
            //console.log("Unpaused");
            mole.play();
        } else {                // Paused
            settings.paused = true;
            mole.status = "Paused";
            document.getElementById('status').getElementsByTagName('span')[0].innerText = mole.status;
            document.getElementById('moleView').getElementsByTagName('button')[1].innerText = "Unpause";
            //console.log("PAUSED");
        }
    };

    mole.restart = function () {
        mole.score = 0;
        document.getElementById('score').getElementsByTagName('span')[0].innerText = mole.score;
        console.log("RESTART");

        mole.id = "";
        lastIndex = -1;
        settings.paused = true;
        mole.play();
    };

    mole.randomize = function () {
        var index = lastIndex;
        while (lastIndex == index) {
            index = (Math.random() * 4) | 0;
        }
        if (lastIndex = -1) {  // First time
            //settings.paused = false;
        }

        lastIndex = index;
        mole.animate(index);
    };

    mole.pressed = function () {
        //console.log("PRESSED!!!--------------");
        if (pressed.id === mole.id && times === 0) {
            // Whacked!!!
            times++;
            mole.score++;
            console.log("Score: " + mole.score);
            document.getElementById('score').getElementsByTagName('span')[0].innerText = mole.score;
            console.log("WHACKED!!!-----------------------------------");
        }
    };

    mole.animate = function (index) {
        if (index === 0) {
            app.sendMessage(" t " + "t " + settings.intensity + " " + settings.duration + "\r");
            $("#a").css("border-color", "#1aff00");
            mole.id = "a";
            setTimeout(function() {
                $("#a").css("border-color", "#0b7000");
                mole.id = "";
            }, settings.duration + 200);
        } else if (index === 1) {
            app.sendMessage(" t " + "r " + settings.intensity + " " + settings.duration + "\r");
            $("#b").css("border-color", "#ff0b00");
            mole.id = "b";
            setTimeout(function() {
                $("#b").css("border-color", "#c30800");
                mole.id = "";
            }, settings.duration + 200);
        } else if (index === 2) {
            app.sendMessage(" t " + "l " + settings.intensity + " " + settings.duration + "\r");
            $("#c").css("border-color", "#ffec00");
            mole.id = "c";
            setTimeout(function() {
                $("#c").css("border-color", "#c3b400");
                mole.id = "";
            }, settings.duration + 200);
        } else if (index === 3) {
            app.sendMessage(" t " + "h " + settings.intensity + " " + settings.duration + "\r");
            $("#d").css("border-color", "#29abd0");
            mole.id = "d";
            setTimeout(function() {
                $("#d").css("border-color", "#196d85");
                mole.id = "";
            }, settings.duration + 200);
        }
        console.log("Mole: " + mole.id);
        console.log("Pressed: " + pressed.id);

    };

    // Listen to right shoe
    mole.rightPress = function (left, right, heel, toe) {

        winner = 0;
        winnerVal = 0;
        if (left > winnerVal){
            winner = 1;
            winnerVal = left;
        }
        if (right > winnerVal){
            winner = 2;
            winnerVal = right;
        }
        if (heel > winnerVal){
            winner = 3;
            winnerVal = heel;
        }
        if (toe > winnerVal){
            winner = 4;
            winnerVal = toe;
        }
        // Left
        if (winner === 1 && winnerVal < 980){ //980
            return;
        }
        // Right
        if (winner === 2 && winnerVal < 980){ //980
            return;
        }
        // Heel
        if (winner === 3 && winnerVal < 975){ //975
            return;
        }
        // Toe
        if (winner === 4 && winnerVal < 980){ //980
            return;
        }

        if (winner === 0) return;

        app.rightShoe = true;
        app.leftShoe = false;

        switch(winner) {
            case 1: pressed.id = "c";
                break;

            case 2: pressed.id = "b";
                break;

            case 3: pressed.id = "d";
                break;

            case 4: pressed.id = "a";
                break;

            default:
                break;
        }
        mole.pressed();
    };

    // Listen to left shoe
    mole.leftPress = function (left, right, heel, toe) {

        winner = 0;
        winnerVal = 0;
        if (left > winnerVal){
            winner = 1;
            winnerVal = left;
        }
        if (right > winnerVal){
            winner = 2;
            winnerVal = right;
        }
        if (heel > winnerVal){
            winner = 3;
            winnerVal = heel;
        }
        if (toe > winnerVal){
            winner = 4;
            winnerVal = toe;
        }
        // Left
        if (winner === 1 && winnerVal < 920){
            return;
        }
        // Right
        if (winner === 2 && winnerVal < 1005){ //1205
            return;
        }
        // Heel
        if (winner === 3 && winnerVal < 1000){ //1200
            return;
        }
        // Toe
        if (winner === 4 && winnerVal < 910){
            return;
        }

        if (winner === 0) return;

        app.rightShoe = false;
        app.leftShoe = true;

        switch(winner) {
            case 1: pressed.id = "c";
                break;

            case 2: pressed.id = "b";
                break;

            case 3: pressed.id = "d";
                break;

            case 4: pressed.id = "a";
                break;

            default:
                break;
        }
        mole.pressed();
    };

    // SHOE-LESS MOD
    if (app.leftShoe) {
        $("#a").on("click", function () {
            pressed.id = "a";
            //console.log("Pressed A");
            mole.pressed();
        });
        $("#b").on("click", function () {
            pressed.id = "b";
            //console.log("Pressed B");
            mole.pressed();
        });
        $("#c").on("click", function () {
            pressed.id = "c";
            //console.log("Pressed C");
            mole.pressed();
        });
        $("#d").on("click", function () {
            pressed.id = "d";
            //console.log("Pressed D");
            mole.pressed();
        });

    } else {
        $("#a").on("click", function () {
            pressed.id = "a";
            //console.log("Pressed A");
            mole.pressed();
        });
        $("#b").on("click", function () {
            pressed.id = "b";
            //console.log("Pressed B");
            mole.pressed();
        });
        $("#c").on("click", function () {
            pressed.id = "c";
            //console.log("Pressed C");
            mole.pressed();
        });
        $("#d").on("click", function () {
            pressed.id = "d";
            //console.log("Pressed D");
            mole.pressed();
        });
    }
});