"use strict";
(function () {

    let $ = {
        application: document.querySelector(".application"),
        section: {
            canvas: document.querySelector(".section-canvas"),
            storeLink: document.querySelector(".section-store-link")
        }
    };

    let storeLinksData = {
        ios: {
            url: "https://itunes.apple.com/us/app/gardenscapes-new-acres/id1105855019?mt=8",
            text: "Try this game in&nbsp;Apple&nbsp;Store!"
        },
        android: {
            url: "https://play.google.com/store/apps/details?id=com.playrix.gardenscapes&amp;hl=en",
            text: "Try this game in&nbsp;Google&nbsp;Play!"
        }
    };

    const dir = {
        horizontal: 1,
        vertical: 2
    };

    fetch("https://api.myjson.com/bins/uz8vi")
        .then(response => response.json())
        .then(main);

    function main(options = {}) {

        class Playground extends Phaser.Scene {
            constructor(){
                super("Playground");
            }
            preload(){
                const {gemSize, spriteURL} = options;
                this.load.spritesheet("gems", spriteURL, {
                    frameWidth: gemSize,
                    frameHeight: gemSize
                });
            }
            create(){
                this.gemArray = [];
                this.tutorialAllowedGems = [];
                this.poolArray = [];
                this.score = 0;
                this.gemGroup = this.add.group();
                this.canPick = true;
                this.dragging = false;
                this.selectedGem = null;
                this.input.on("pointerdown", this.gemSelect, this);
                this.input.on("pointermove", this.startSwipe, this);
                this.input.on("pointerup", this.stopSwipe, this);
                this.drawField();
                riseCanvas(this.game);
                this.showTutorial();

            }
            drawField(){
                const {fieldSize, gemSize, gemTypes} = options;
                const halfGemSize = gemSize / 2;
                for(let i = 0; i < fieldSize; i += 1){
                    this.gemArray[i] = [];
                    for(let j = 0, gem; j < fieldSize; j += 1){
                        gem = this.add.sprite(gemSize * j + halfGemSize, gemSize * i + halfGemSize, "gems");
                        this.gemGroup.add(gem);
                        do {
                            let randomFigure = Phaser.Math.Between(0, gemTypes - 1);
                            gem.setFrame(randomFigure);
                            this.gemArray[i][j] = {
                                gemType: randomFigure,
                                gemSprite: gem,
                                isEmpty: false
                            }
                        } while (this.isMatch(i, j));
                    }
                }
                return this;
            }
            isMatch(row, col){
                return this.isHorizontalMatch(row, col) || this.isVerticalMatch(row, col);
            }
            isHorizontalMatch(row, col){
                return this.gemAt(row, col).gemType === this.gemAt(row, col - 1).gemType
                        && this.gemAt(row, col).gemType === this.gemAt(row, col - 2).gemType;
            }
            isVerticalMatch(row, col){
                return this.gemAt(row, col).gemType === this.gemAt(row - 1, col).gemType
                        && this.gemAt(row, col).gemType === this.gemAt(row - 2, col).gemType;
            }
            gemAt(row, col){
                const {fieldSize} = options;
                return row < 0 || row >= fieldSize || col < 0 || col >= fieldSize ? -1 : this.gemArray[row][col];
            }
            gemSelect(pointer){
                if(this.canPick){

                    const {gemSize} = options;

                    Typo.isDef(this.selectedGem) && (this.selectedGem = null);

                    this.dragging = true;

                    let row = Math.floor(pointer.y / gemSize),
                        col = Math.floor(pointer.x / gemSize),
                        pickedGem = this.gemAt(row, col);

                    if(pickedGem === -1 || pickedGem.gemSprite.alpha < 1) return this;



                    if(Typo.isntDef(this.selectedGem)){
                        pickedGem.gemSprite.setDepth(1);
                        this.selectedGem = pickedGem;
                    } else {
                        if(Playground.areTheSame(pickedGem, this.selectedGem)){
                            this.selectedGem = null;
                        } else {
                            if(Playground.areNext(pickedGem, this.selectedGem)){
                                this.swapGems(this.selectedGem, pickedGem, true);


                            } else {
                                this.selectedGem = pickedGem;
                            }
                        }
                    }

                }
                return this;
            }
            startSwipe(pointer){

                if(this.dragging && Typo.isDef(this.selectedGem)){
                    for(let array of this.gemArray){
                        for(let gem of array){
                            gem.gemSprite.alpha = 1;
                        }
                    }
                    const {gemSize} = options,
                          {x, y, downX, downY} = pointer;
                    let delta = {
                            x: downX - x,
                            y: downY - y,
                            row: 0,
                            col: 0
                    };
                    let halfGemSize = gemSize / 2, quartGemSize = gemSize / 4;

                    if(Math.abs(delta.y) < quartGemSize){
                        if(delta.x > halfGemSize) delta.col = -1;
                        if(delta.x < -halfGemSize) delta.col = 1;
                    }
                    if(Math.abs(delta.x) < quartGemSize){
                       if(delta.y > halfGemSize) delta.row = -1;
                       if(delta.y < -halfGemSize) delta.row = 1;
                    }
                    if(delta.row + delta.col !== 0){
                        const {selectedGem} = this;
                        let pickedGem = this.gemAt(Playground.getGemRow(selectedGem) + delta.row, Playground.getGemCol(selectedGem) + delta.col);
                        if(pickedGem !== -1){
                            this.swapGems(selectedGem, pickedGem, true);
                            this.dragging = false;
                        }
                    }
                }
            }
            stopSwipe(){
                this.dragging = false;
                return this;
            }

            swapGems(gemA, gemB, swapBack){
                this.swappingGems = 2;
                this.canPick = false;
                const {gemArray} = this;
                const from = {
                        figure: gemA.gemType,
                        sprite: gemA.gemSprite
                    },
                    to = {
                        figure: gemB.gemType,
                        sprite: gemB.gemSprite
                    };

                let inPair = {
                    A: gemArray[Playground.getGemRow(gemA)][Playground.getGemCol(gemA)],
                    B: gemArray[Playground.getGemRow(gemB)][Playground.getGemCol(gemB)]
                };

                inPair.B.gemType = from.figure;
                inPair.B.gemSprite = from.sprite;
                inPair.A.gemType = to.figure;
                inPair.A.gemSprite = to.sprite;

                this.tweenGem(gemA, gemB, swapBack).tweenGem(gemB, gemA, swapBack);

                return this;
            }
            tweenGem(gemA, gemB, swapBack){

                const row = Playground.getGemRow(gemA),
                      col = Playground.getGemCol(gemA);

                const {gemSize, swapSpeed} = options;

                this.tweens.add({
                    targets: this.gemArray[row][col].gemSprite,
                    x: col * gemSize + gemSize / 2,
                    y: row * gemSize + gemSize / 2,
                    duration: swapSpeed,
                    callbackScope: this,
                    onComplete(){
                        this.swappingGems -= 1;
                        if(!this.swappingGems) {
                            !this.matchInBoard() && swapBack
                                ? this.swapGems(gemA, gemB, false)
                                : (this.matchInBoard() ? this.handleMatches() : this.deselectedGem());
                        }
                    }
                });
                return this;
            }
            matchInBoard(){
                const {fieldSize} = options;
                for(let i = 0; i < fieldSize; i ++){
                    for(let j = 0; j < fieldSize; j ++){
                        if(this.isMatch(i, j)) return true;
                    }
                }
                return false;
            }
            handleMatches(){
                const {fieldSize} = options;
                this.removeMap = [];
                for(let i = 0; i < fieldSize; i += 1){
                    this.removeMap[i] = [];
                    for(let j = 0; j < fieldSize; j += 1){
                        this.removeMap[i].push(0);
                    }
                }
                this.score += 1;
                this.markMatches(dir.horizontal).markMatches(dir.vertical).destroyGems();
                return this;
            }
            markMatches(direction){
                const {fieldSize} = options;
                for(let i = 0; i < fieldSize; i += 1){
                    let figureStreak = 1,
                        currentFigure = -1,
                        startStreak = 0,
                        figureToWatch = 0,
                        isDirectionEqHorizontal = direction === dir.horizontal;

                    for(let j = 0; j < fieldSize; j ++){
                        figureToWatch = isDirectionEqHorizontal
                            ? this.gemAt(i, j).gemType
                            : this.gemAt(j, i).gemType;

                        (figureToWatch === currentFigure) && figureStreak++;

                        if(figureToWatch !== currentFigure || j === fieldSize - 1){
                            if(figureStreak >= 3){
                                for(let k = 0; k < figureStreak; k += 1){
                                    if(isDirectionEqHorizontal){
                                        this.removeMap[i][startStreak + k] += 1;
                                    } else {
                                        this.removeMap[startStreak + k][i] += 1;
                                    }
                                }
                            }
                            startStreak = j;
                            figureStreak = 1;
                            currentFigure = figureToWatch;
                        }
                    }
                }

                return this;
            }
            destroyGems(){
                const {fieldSize, destroySpeed} = options;
                let destroyed = 0;
                for(let i = 0; i < fieldSize; i += 1){
                    for(let j = 0; j < fieldSize; j += 1){
                        if(this.removeMap[i][j] > 0){
                            destroyed ++;
                            let gemArrayItem = this.gemArray[i][j];
                            this.tweens.add({
                                targets: gemArrayItem.gemSprite,
                                alpha: .5,
                                duration: destroySpeed,
                                callbackScope: this,
                                onComplete(){
                                    destroyed -= 1;
                                    gemArrayItem.gemSprite.visible = false;
                                    this.poolArray.push(gemArrayItem.gemSprite);
                                    !destroyed && this.makeGemsFall().replenishField();
                                }
                            });
                            gemArrayItem.isEmpty = true;
                        }
                    }
                }
                return this;
            }
            makeGemsFall(){
                const {gemArray} = this;
                const {fieldSize, gemSize, fallSpeed} = options;
                for(let i = fieldSize - 2; i >= 0; i -= 1){
                    for(let j = 0; j < fieldSize; j += 1){
                        let gemArrayItem = gemArray[i][j];
                        if(!gemArrayItem.isEmpty){
                            let fallTiles = this.holesBelow(i, j);
                            const {gemSprite, gemType} = gemArrayItem;
                            if(fallTiles > 0){
                                this.tweens.add({
                                    targets: gemSprite,
                                    y: gemSprite.y + fallTiles * gemSize,
                                    duration: fallSpeed * fallTiles
                                });
                                this.gemArray[i + fallTiles][j] = {
                                    gemSprite: gemSprite,
                                    gemType: gemType,
                                    isEmpty: false
                                };
                                gemArrayItem.isEmpty = true;
                            }
                        }
                    }
                }
                return this;
            }
            holesBelow(row = 0, col = 0){
                let response = 0;
                for(let i = row + 1; i < options.fieldSize; i += 1){
                    response += this.gemArray[i][col].isEmpty ? 1 : 0;
                }
                return response;
            }
            replenishField(){
                let replenished = 0;
                const {fieldSize, gemTypes, gemSize, fallSpeed} = options;
                for(let j = 0; j < fieldSize; j += 1){
                    let emptySpots = this.holesInCol(j);
                    if(emptySpots > 0){
                        for(let i = 0; i < emptySpots; i += 1){
                            replenished ++;
                            let randomFigure = Phaser.Math.Between(0, gemTypes - 1),
                                gemArrayItem = this.gemArray[i][j];

                            gemArrayItem.gemType = randomFigure;
                            gemArrayItem.gemSprite = this.poolArray.pop();
                            gemArrayItem.gemSprite.setFrame(randomFigure);
                            gemArrayItem.gemSprite.visible = true;
                            gemArrayItem.gemSprite.x = gemSize * j + gemSize / 2;
                            gemArrayItem.gemSprite.y = gemSize / 2 - (emptySpots - i) * gemSize;
                            gemArrayItem.gemSprite.alpha = 1;
                            gemArrayItem.isEmpty = false;

                            this.tweens.add({
                                targets: gemArrayItem.gemSprite,
                                y: gemSize * i + gemSize / 2,
                                duration: fallSpeed * emptySpots,
                                callbackScope: this,
                                onComplete(){
                                    replenished -= 1;
                                    if(replenished === 0) {
                                        if(this.matchInBoard()){
                                            this.time.addEvent({
                                                delay: 250,
                                                callbackScope: this,
                                                callback(){
                                                    this.handleMatches();
                                                }
                                            });
                                        } else {
                                            this.deselectedGem();
                                        }
                                    }

                                }
                            });
                        }
                    }
                }
                return this;
            }
            holesInCol(col){
                const {fieldSize} = options;
                let response = 0;
                for(let i = 0; i < fieldSize; i += 1){
                    this.gemArray[i][col].isEmpty && response++;
                }
                return response;
            }
            deselectedGem(){
                this.canPick = true;
                this.selectedGem = null;
                return this;
            }
            showTutorial(){
                this.canPick = false;
                setTimeout(() => {
                    this.showSuggestion();
                }, 1000);
                return this;
            }
            showSuggestion(){
                let matchFound = false;
                const {gemArray} = this;
                const {fieldSize} = options;
                for(let i = 0; i < fieldSize - 1; i ++){
                    for(let j = 0; j < fieldSize - 1; j ++){
                        this.tempSwap(i, j, i + 1, j);
                        if(this.matchInBoard()){
                            let gemA = gemArray[i][j],
                                gemB = gemArray[i + 1][j];

                            fadeNotAllowed(gemA, gemB);
                            this.tweenGem(gemA, gemB, true).tweenGem(gemB, gemA, true);

                            matchFound = true;
                        }
                        this.tempSwap(i, j, i + 1, j);

                        if(matchFound){
                            return this;
                        }

                        this.tempSwap(i, j, i, j + 1);
                        if(this.matchInBoard()){
                            let gemA = gemArray[i][j],
                                gemB = gemArray[i][j + 1];

                            fadeNotAllowed(gemA, gemB);
                            this.tweenGem(gemA, gemB, true).tweenGem(gemB, gemA, true);
                            matchFound = true;
                        }
                        this.tempSwap(i, j, i, j + 1);

                        if(matchFound){
                            return this;
                        }
                    }
                }

                function fadeNotAllowed(...allowed) {
                    for(let array of gemArray){
                        for(let gem of array){
                            if(!allowed.includes(gem)){
                                gem.gemSprite.alpha = .5;
                            }
                        }
                    }
                }
                return this;
            }
            tempSwap(rowA, colA, rowB, colB){
                const {gemArray} = this;
                let tmp = gemArray[rowA][colA];
                gemArray[rowA][colA] = gemArray[rowB][colB];
                gemArray[rowB][colB] = tmp;
            }

            static getGemRow(gem){
                return Math.floor(gem.gemSprite.y / options.gemSize);
            }

            static getGemCol(gem){
                return Math.floor(gem.gemSprite.x / options.gemSize);
            }

            static areTheSame(gemA, gemB){
                return Playground.getGemRow(gemA) === Playground.getGemRow(gemB) && Playground.getGemCol(gemA) === Playground.getGemCol(gemB);
            }

            static areNext(gemA, gemB){
                return Math.abs(Playground.getGemRow(gemA) - Playground.getGemRow(gemB)) + Math.abs(Playground.getGemCol(gemA) - Playground.getGemCol(gemB)) === 1;
            }
        }

        function getDevice(){
            let userAgent = navigator.userAgent || navigator.vendor || window.opera;
            if (/android/i.test(userAgent)) {
                return "android";
            }
            if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
                return "ios";
            }
            return "unknown";
        }

        function resize(game) {
            const {canvas} = $;

            let {innerWidth, innerHeight} = window,
                windowRatio = innerWidth / innerHeight,
                gameRatio = game.config.width / game.config.height,
                compensation = Typo.isTouch() && innerHeight < innerWidth ? 92 : 32;

            let updateWidth = windowRatio < gameRatio ? innerWidth : innerHeight * gameRatio,
                updateHeight = windowRatio < gameRatio ? innerWidth / gameRatio : innerHeight;

            canvas.style.width = `${gate(updateWidth - compensation, 512)}px`;
            canvas.style.height = `${gate(updateHeight - compensation, 512)}px`;

            function gate(a = 0, b = 0) {
                return a > b ? b : a;
            }
        }

        function riseCanvas(game){
            $.section.canvas.classList.add("on");
            $.canvas = $.section.canvas.querySelector("canvas");
            resize(game);
            window.focus();
        }

        function initGame() {
            return new Phaser.Game({
                width: 512,
                height: 512,
                scene: Playground,
                parent: "canvas",
                backgroundColor: "#001309"
            });
        }

        function insertStoreLinkByDevice() {
            let data = storeLinksData[getDevice()];
            if(Typo.isDef(data)){
                const {url, text} = data;
                let html = `<a href="${url}" target="_blank">${text}</a>`;
                $.section.storeLink.insertAdjacentHTML("afterbegin", html);
            }
        }

        let game = initGame();
        insertStoreLinkByDevice();
        window.addEventListener("resize", () => resize(game), false);

    }

})();

