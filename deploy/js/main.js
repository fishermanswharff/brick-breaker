(function(){
	
	var trace = function(){ for(var i = 0; i < arguments.length; i++){ console.log(arguments[i]); } };
	var paddleLeft = false;
	var paddleRight = false;
	/**
	*  The main game class
	*  @class  BrickBreaker 
	*/
	var BrickBreaker = function()
	{
		// create an new instance of a pixi stage with a white background
		this.stage = new PIXI.Stage(0xaaaaaa);

		// create a renderer instance width=640 height=480
		this.renderer = PIXI.autoDetectRenderer(640, 480, {
			view: document.querySelector('#stage')
		});

		// create an empty container
		this.gameContainer = new PIXI.DisplayObjectContainer();

		/// gameplay variables
		this.currentLevel = 1;
		this.gameScore = 0;
		this.livesRemaining = 3;

		/// gameplay UI elements
		this.uiHolder = null;
		this.levelText = null;
		this.scoreText = null;
		this.livesText = null;

		// new properties that I've added.
		this.xDirection = -1;
		this.yDirection = 6;
		this.easing = 7;
		this.isPlaying = false;

		// add the container to the stage
		this.stage.addChild(this.gameContainer);

		// create a new loader
		var loader = new PIXI.AssetLoader(["assets/images.json"]);

		// attach callback
		loader.onComplete = this.onAssetsLoaded.bind(this);

		//begin load
		loader.load();

		// Bind the animate callback
		this.animate = this.animate.bind(this);
	};

	// Reference to the prototype
	var p = BrickBreaker.prototype;

	/**
	*  Callback when the assets have been loaded
	*  @method  onAssetsLoaded
	*/
	p.onAssetsLoaded = function()
	{
		requestAnimFrame(this.animate);
		this.initTitleState();
	};

	/**
	*  Frame update
	*  @method animate
	*/
	p.animate = function()
	{
		requestAnimFrame(this.animate);
		this.renderer.render(this.stage);
		// trace(frame);
		if(this.isPlaying){
			// logic for ball bouncing off the walls
			if(this.ball.position.x <= 0){
				this.xDirection *= -1;
			} else if(this.ball.position.x >= 640 - this.ball.width) {
				this.xDirection *= -1;
			}

			// logic for ball bouncing off the roof
			if(this.ball.position.y >= 480){
				this.isPlaying = false;
				this.loseLife();
			} else if(this.ball.position.y <= 0) {
				this.yDirection *= -1;
			}

			// trace(this.ball.position.x, this.ball.position.y);
			this.ball.position.y -= this.yDirection;
			this.ball.position.x += this.xDirection;

			// if the ball hits the paddle
			var xdist = (this.ball.position.x + this.ball.width/2) - (this.paddle.position.x + this.paddle.width/2);
			if(xdist > -this.paddle.width/2 && xdist < this.paddle.width/2){
				var ydist = (this.paddle.position.y + (this.paddle.height/2)) - (this.ball.position.y + (this.ball.height/2)) ;
				if(ydist > - this.paddle.height/2 && ydist < this.paddle.height/2){
					this.yDirection *= -1;
					this.checkHitLocation(this.ball,this.paddle);
				}
			}

			// if the ball hits a brick
			for(var i = 0; i < this.brickContainer.children.length; i++){
				var brick = this.brickContainer.children[i];
				var xcol = (this.ball.position.x + this.ball.width/2) - (brick.position.x + brick.width/2);
				// var xcol = brick.position.x - (this.ball.position.x + this.ball.width/2);
				if(xcol > -brick.width/2 && xcol < brick.width/2){
					var ycol = brick.position.y - this.ball.position.y;
					if(ycol > -brick.height/2 && ycol < brick.height/2){
						this.yDirection *= -1;
						this.brickContainer.removeChild(brick);
						this.gameScore += 10;
						this.updateScoreDisplay();
					}
				}
			}

			// if user presses left arrow
			if(paddleLeft){
				this.paddle.position.x -= 10;
				if(this.paddle.position.x <= 0){
					this.paddle.position.x = 0;
				}
			}

			// if user presses right arrow
			if(paddleRight){
				this.paddle.position.x += 10;
				if(this.paddle.position.x >= 640 - this.paddle.width){
					this.paddle.position.x = 640 - this.paddle.width;
				}
			}
		}

		if(!this.isPlaying){

		}
	};

	// checking hit location on the paddle to adjust for ball trajectory
	p.checkHitLocation = function(ball,paddle){
		var hitPercent, ballPosition;
		ballPosition = ball.position.x - paddle.position.x;
		hitPercent = (ballPosition / (paddle.width - ball.width)) - .5;
		this.xDirection = hitPercent * 7;
		this.yDirection *= 1.01;
	};

	p.loseLife = function(){
		this.livesRemaining--;
		this.updateLivesDisplay();
		if(this.livesRemaining === 0){
			this.gameOver();
		} else {
			this.resetGame();	
		}
		this.resetDefaults();
	};

	p.levelUp = function(){
		this.currentLevel++;
		this.updateLevelDisplay();
	};

	p.resetDefaults = function(){
		// new properties that I've added.
		this.xDirection = -1;
		this.yDirection = 6;
	};

	/**
	*  Initialize the title state
	*  @method  initTitleState
	*/
	p.initTitleState = function()
	{
		// add assets and show the title screen
		var playButton = PIXI.Sprite.fromFrame("PlayButton0000");
		playButton.buttonMode = true;
		playButton.interactive = true;
		playButton.mouseup = this.leaveTitleState.bind(this);
		playButton.position.x = 320 - Math.round(playButton.texture.width/2);
		playButton.position.y = 240 - Math.round(playButton.texture.height/2);
		this.gameContainer.addChild(playButton);
	};

	/**
	*  Leave the title state
	*  @method  leaveTitleState
	*/
	p.leaveTitleState = function()
	{
		//clean up elements added to the stage
		while (this.gameContainer.children.length)
		{
			this.gameContainer.removeChild(this.gameContainer.getChildAt(0));
		}
		this.initGameState();
	};

	/**
	*  Initialize the game screen
	*  @method  initGameState
	*/
	p.initGameState = function()
	{
		this.buildUiHolder();
		this.updateLevelDisplay();
		this.updateScoreDisplay();
		this.updateLivesDisplay();
		this.buildBricks();
		this.buildPaddle();
		this.buildBall();
		this.buildQuitButton();
		this.addKeyListeners();
		this.isPlaying = true;
	};

	p.buildUiHolder = function(){
		// add UI
		//basic grey background shape
		this.uiHolder = new PIXI.Graphics();
		this.uiHolder.beginFill(0x222222, .8);
		this.uiHolder.drawRect(0, 440, 640, 40);
		this.uiHolder.endFill();
		this.gameContainer.addChild(this.uiHolder);
	};

	p.buildQuitButton = function(){
		// quit button
		var quitButton = PIXI.Sprite.fromFrame("QuitButton0000");
		quitButton.buttonMode = true;
		quitButton.interactive = true;
		quitButton.mouseup = this.leaveGameState.bind(this);
		quitButton.position.x = 5;
		quitButton.position.y = 448;
		this.uiHolder.addChild(quitButton);
	};

	p.buildPaddle = function(){
		var paddle = PIXI.Sprite.fromFrame("Paddle0000");
		paddle.position.x = 320 - Math.round(paddle.texture.width/2);
		paddle.position.y = 400;
		paddle.width = paddle.width * 2
		this.gameContainer.addChild(paddle);
		this.paddle = paddle;
	};

	p.buildBall = function(){
		var ball = PIXI.Sprite.fromFrame("Ball0000");
		ball.position.x = 320 - Math.round(ball.texture.width/2);
		ball.position.y = 250;
		this.gameContainer.addChild(ball);
		this.ball = ball;
	};

	p.buildBricks = function(){
		//build a layout of bricks
		//Note: This is placeholder code
		this.brickContainer = new PIXI.DisplayObjectContainer();
		for (var col=0;col < 9;col++)
		{
			for (var row=0;row < 6;row++)
			{
				var brick = PIXI.Sprite.fromFrame("Brick000" + Math.floor(Math.random() * 4));
				brick.position.x = col * (brick.texture.width + 1);
				brick.position.y = row * (brick.texture.height + 1);
				this.brickContainer.addChild(brick);
			}
		}
		this.gameContainer.addChild(this.brickContainer);
	};

	// listen for keydown, attached to the document
	p.addKeyListeners = function(){
		document.addEventListener('keydown',function(evt){
			switch(evt.which){
				case 37:
					paddleLeft = true;
					break;
				case 39:
					paddleRight = true;
					break;
			}
		});
		// listen for keyup, attached to the document
		document.addEventListener('keyup',function(evt){
			switch(evt.which){
				case 37:
					paddleLeft = false;
					break;
				case 39:
					paddleRight = false;
					break;
			}
		});
	};

	/**
	*  Update the level text display
	*  @method  updateLevelDisplay
	*/
	p.updateLevelDisplay = function()
	{
		//lazy instantiation
		if (!this.levelText)
		{
			this.levelText = new PIXI.Text("", {font: "18px Helvetica, Arial", fill: "#ffffff"});
			this.uiHolder.addChild(this.levelText);
			this.levelText.position.x = 90;
			this.levelText.position.y = 450;
		}
		this.levelText.setText("Level: " + this.currentLevel);
	};

	/**
	*  Update the score text display
	*  @method  updateScoreDisplay
	*/
	p.updateScoreDisplay = function()
	{
		//lazy instantiation
		if (!this.scoreText)
		{
			this.scoreText = new PIXI.Text("", {font: "18px Helvetica, Arial", fill: "#ffffff"});
			this.uiHolder.addChild(this.scoreText);
			this.scoreText.position.x = 420;
			this.scoreText.position.y = 450;
		}
		this.scoreText.setText("Score: " + this.gameScore);
	};

	/**
	*  Update the lives text display
	*  @method  updateLivesDisplay
	*/
	p.updateLivesDisplay = function()
	{
		//lazy instantiation
		if (!this.livesText)
		{
			this.livesText = new PIXI.Text("", {font: "18px Helvetica, Arial", fill: "#ffffff"});
			this.uiHolder.addChild(this.livesText);
			this.livesText.position.x = 550;
			this.livesText.position.y = 450;
		}
		this.livesText.setText("Lives: " + this.livesRemaining);
	};

	p.resetGame = function(){
		if (!this.loseText)
		{
			this.loseText = new PIXI.Text("", {font: "40px Helvetica, Arial", fill: "#000"});
			this.gameContainer.addChild(this.loseText);
			this.loseText.anchor.x = 0.5;
			this.loseText.anchor.y = 0.5;
			this.loseText.position.x = 320;
			this.loseText.position.y = 280;
		}
		this.loseText.setText("You Lose!!!");

		var playButton = PIXI.Sprite.fromFrame("PlayButton0000");
		playButton.buttonMode = true;
		playButton.interactive = true;
		playButton.mouseup = this.continueGame.bind(this);
		playButton.position.x = 320 - Math.round(playButton.texture.width/2);
		playButton.position.y = 240 - Math.round(playButton.texture.height/2);
		this.gameContainer.addChild(playButton);
	};

	p.continueGame = function(evt){
		this.gameContainer.removeChild(evt.target);
		this.gameContainer.removeChild(this.loseText);
		this.brickContainer.removeChildren();
		this.gameContainer.removeChild(this.brickContainer);
		this.gameContainer.removeChild(this.ball);
		this.gameContainer.removeChild(this.paddle);
		this.buildBricks();
		this.buildPaddle();
		this.buildBall();
		this.isPlaying = true;
	};

	p.gameOver = function(){
		if (!this.overText)
		{
			this.overText = new PIXI.Text("", {font: "50px Helvetica, Arial", fill: "#ffffff"});
			this.gameContainer.addChild(this.overText);
			this.overText.anchor.x = 0.5;
			this.overText.anchor.y = 0.5;
			this.overText.position.x = 320;
			this.overText.position.y = 100;
		}
		this.overText.setText("Game Over");
		window.setTimeout(this.leaveGameState.bind(this),3000);
	};

	/**
	*  Leave the game state
	*  @method  leaveGameState
	*/
	p.leaveGameState = function()
	{
		while (this.gameContainer.children.length)
		{
			this.gameContainer.removeChild(this.gameContainer.getChildAt(0));
		}
		this.uiHolder = null;
		this.levelText = null
		this.scoreText = null;
		this.livesText = null;
		this.overText = null;
		this.loseText = null;
		this.initTitleState();
		this.resetDefaults();
	};


	// Create the game
	new BrickBreaker();
	
}());