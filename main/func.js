function test() {

    return 1;
}

function other() {

    return 2;
}
class toSt {

    test() {

        return 1;
    }
    other() {

        return 2;
    }

}

function createClass() {
    return new toSt();
}

const inst = new toSt();
module.exports = toSt;