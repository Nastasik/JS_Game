'use strict';
'use strict';

class Vector {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    plus(vector) {
        if (!(vector instanceof Vector)) {
            throw new Error("Можно прибавлять к вектору только вектор типа Vector");
        }
        return new Vector(vector.x + this.x, vector.y + this.y);
    }

    times(multiplier) {
        return new Vector(this.x * multiplier, this.y * multiplier);

    }
}


class Actor {
    constructor(pos = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {

        if (!(pos instanceof Vector)) {
            throw new Error("Не вектор в качестве расположения");
        }

        if (!(size instanceof Vector)) {
            throw new Error("Не вектор в качестве размера");
        }

        if (!(speed instanceof Vector)) {
            throw new Error("Не вектор в качестве скорости");
        }
        
        this.pos = pos;
        this.size = size;
        this.speed = speed;
    }
    get type() {
        return 'actor';
    }
    get left() {
        return this.pos.x;
    }

    get right() {
        return this.pos.x + this.size.x;
    }

    get top() {
        return this.pos.y;
    }

    get bottom() {
        return this.pos.y + this.size.y;
    }

    act() {}

    isIntersect(actor) {

        if (!(actor instanceof Actor)) {
            throw new Error("Объект не является экземпляром Actor");
        }

        if (this === actor) {
            return false;
        }

        if ((actor.left === this.right) || (actor.right === this.left) || (actor.top === this.bottom) || (actor.bottom === this.top)) {
            return false;
        }

        return ((actor.left < this.right) && (actor.right > this.left) && (actor.top < this.bottom) && (actor.bottom > this.top));
    }
}



class Level {
    constructor(grid = [], objList = []) {
        this.grid = grid;          
        this.actors = objList;
        this.height = grid.length;
        this.width = grid.reduce((prevIndex, nextValue)  => prevIndex < nextValue.length ? nextValue.length : prevIndex, 0);
        this.player = this.actors.find(actor => actor.type == 'player');
        this.status = null;
        this.finishDelay = 1;
    }

    isFinished() {
        return (this.status !== null) && (this.finishDelay < 0);
    }



    actorAt(actor) {
        if (!(actor instanceof Actor)) {
            throw new Error("Передан не движущийся объект Actor");
        }        
        return this.actors.find(obj => actor.isIntersect(obj)); 
    }

    
    obstacleAt(pos, size) {
        if (!(pos instanceof Vector) || !(size instanceof Vector)) {
            throw new Error("Здесь должен быть объект типа Vector");
        }
        let actor = new Actor(pos, size);

        if (actor.bottom > this.height) {
            return 'lava';
        }

        if (actor.left < 0 || actor.top < 0 || actor.right > this.width) {
            return 'wall';
        }
        for (let y = Math.floor(actor.left); y < actor.right; y++) {
            for (let x = Math.floor(actor.top); x < actor.bottom; x++) {
                const result = this.grid[x][y];
                if (result !== undefined) {
                    return this.grid[x][y];
                }
            }
        }

    }


    removeActor(actor) {       
        let actorIndex = this.actors.indexOf(actor);
        return this.actors.splice(actorIndex, 1);
    }

    noMoreActors(type) {        
        return !this.actors.some(item => item.type === type);
    }

    playerTouched(type, actor) {
        if (this.status === null) {
            if (type === 'lava' || type === 'fireball') {
                return this.status = 'lost';
            }
            if (type === 'coin') {
                this.removeActor(actor);
                if (this.noMoreActors('coin')) {
                    return this.status = 'won';
                }
            }
        }
    }
}



class LevelParser {
    constructor(actorSymbols) {
        this.actorSymbols = actorSymbols;
    }

    actorFromSymbol(symbol) {
        if (!symbol) {
            return undefined;
        }
        if (symbol in this.actorSymbols) {
            console.log(this.actorSymbols[symbol], 'actorSumbols[sumbol]');
            return this.actorSymbols[symbol];
        }
    }


    obstacleFromSymbol(symbol) {

        if (symbol === undefined) {
            return undefined;
        }

        if (symbol === 'x') {
            return 'wall';
        }
        if (symbol === '!') {
            return 'lava';
        } 
    }

    createGrid(arrayString) {        
        const arrayArray = arrayString.map((item) => {
            return item.split('').map(item2 => this.obstacleFromSymbol(item2));
        });
        return arrayArray;

    }


    createActors(arrayStrings) {
        let actorsArray = [];

        for (let y = 0; y < arrayStrings.length; y++) {
            console.log(arrayStrings[y], 'arrayStrings[y]');
            arrayStrings[y].split('').forEach((symbol, x) => {
               // try { //Тут не работает, но нужен
                    if (symbol != undefined) {
                        const actor = this.actorFromSymbol(symbol);
                        if ((actor) && (typeof actor === 'function')) {
                            const result = new actor(new Vector(x, y));
                            console.log(result, 'result');
                            if (result instanceof Actor) {
                                return actorsArray.push(result);
                            }
                        }
                    }
                // } catch {
                //     return actorsArray;
                // }
            });
        }
        console.log(actorsArray, 'actorsArray');
        return actorsArray;
    }


    parse(arrayString) {        
        return new Level(this.createGrid(arrayString), this.createActors(arrayString));
    }
}


class Fireball extends Actor {
    constructor(pos = new Vector(0, 0), speed = new Vector(0, 0)) {
        super(pos, new Vector(1, 1), speed);        
    }

    get type() {
        return 'fireball';
    }

    getNextPosition(time = 1) {        
        return this.pos.plus(new Vector(this.speed.x * time, this.speed.y * time));            
    }

    handleObstacle() {        
        this.speed = this.speed.times(-1);        
    }

    act(time, level) {
        let posNext = this.getNextPosition(time);
        if (level.obstacleAt(posNext, this.size)) {
            this.handleObstacle();
        } else {
            this.pos = posNext;
        }
    }
}


class HorizontalFireball extends Fireball {
    constructor(pos = new Vector(0, 0)) {
        super(pos, new Vector(2, 0), new Vector(1, 1));        
    }

}

class VerticalFireball extends Fireball {
    constructor(pos = new Vector(0, 0)) {
        super(pos, new Vector(0, 2), new Vector(1, 1));        
    }

    act(time, level) {
        super.act(time, level);
    }
}

class FireRain extends Fireball {
    constructor(pos = new Vector(0, 0)) {
        super(pos, new Vector(0, 3), new Vector(1, 1));        
        this.posStart = this.pos;
    }

    get type() {
        return 'FireRain';
    }

    handleObstacle() {
        this.pos = this.posStart;
    }
   
}


class Coin extends Actor {
    constructor(pos = new Vector(0, 0)) {
        super(pos.plus(new Vector(0.2, 0.1)), new Vector(0.6, 0.6),  new Vector(2, 0));
        this.startPos = this.pos;        
        this.springSpeed = 8;
        this.springDist = 0.07;
        this.spring = Math.random() * Math.PI * 2; 
    }

    get type() {
        return 'coin';
    }

    updateSpring(time = 1) {
        this.spring += (time * this.springSpeed);
    }

    getSpringVector() {
        return new Vector(0, Math.sin(this.spring) * this.springDist);
    }

    getNextPosition(time = 1) {
        this.updateSpring(time);
        return this.startPos.plus(this.getSpringVector());
    }

    act(time) {
        this.pos = this.getNextPosition(time);
    }
}

class Player extends Actor {
    constructor(pos = new Vector(0, 0)) {
        super(pos.plus(new Vector(0, -0.5)), new Vector(0.8, 1.5), new Vector(0, 0));        
    }

    get type() {
        return 'player';
    }
}


const actorSumbols = {
    '@': Player,
    'v': FireRain,
    '=': HorizontalFireball,
    '|': VerticalFireball,
    'o': Coin,
};
 
const schemas = [
    [
        '     o   ',
        '     o   ',
        '        =',
        '   x!x   ',
        '       o ',
        ' o   !  x',
        '   |  x  ',
        'xxxx    @',
        '       xx'
    ],
    [
        '         ',
        'v    o   ',
        '     x   ',
        '   x     ',
        'x      o ',
        '  x!x   o',
        '@       x',
        'xxx!xxx  ',
        '       | '
    ],
    [
        '  v      ',
        '   o   = ',
        'o  x!x   ',
        '         ',
        'x      o ',
        '   xxx ! ',
        '@        ',
        'xxx! xxxx',
        '    |    '
    ]
];
const parser = new LevelParser(actorSumbols);

runGame(schemas, parser, DOMDisplay)
    .then(() => console.log('Вы выиграли приз!'));