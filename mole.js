var mole = {
    id: ""
};

mole.startContainer = function () {
    $('#title').hide();
    $('#selectorView').hide();
    $('#shoeButtons').hide();
    $('.experimentButton').hide();
    $('#moleView').show();
};

$(document).ready(function() {

    mole.start = function () {

    };

    mole.pause = function () {

    };

    mole.restart = function () {

    };

    mole.pressed = function () {

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
            case 1: mole.id = "c";
                break;

            case 2: mole.id = "b";
                break;

            case 3: mole.id = "d";
                break;

            case 4: mole.id = "a";
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
            case 1: mole.id = "c";
                break;

            case 2: mole.id = "b";
                break;

            case 3: mole.id = "d";
                break;

            case 4: mole.id = "a";
                break;

            default:
                break;
        }
        mole.pressed();

    };

}); //document ready