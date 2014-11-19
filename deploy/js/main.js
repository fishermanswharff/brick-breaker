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
		this.xDirection = 2;
		this.yDirection = 3;
		this.easing = 7;
		this.isPlaying = false;
		this.bricks = [];

		
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

		if(this.isPlaying){
			// get the ball from the gameContainer
			// must be better way than by index????
			// var ball = this.gameContainer.getChildAt(56);
			// var paddle = this.gameContainer.getChildAt(55);	
			
			// logic for ball bounces off the walls
			if(this.ball.position.x <= 0){
				this.xDirection *= -1;
			} else if(this.ball.position.x >= 640 - this.ball.width) {
				this.xDirection *= -1;
			}

			// logic for this.ball bouncing off the roof
			if(this.ball.position.y >= 480){
				// session ends
				// this.initGameState();
				// this.livesRemaining--;
			} else if(this.ball.position.y <= 0) {
				this.yDirection *= -1;
			}

			// trace(this.ball.position.x, this.ball.position.y);
			this.ball.position.y -= this.yDirection;
			this.ball.position.x += this.xDirection;

			// if the ball hits the paddle
			var xdist = this.ball.position.x - this.paddle.position.x;
			if(xdist > -this.paddle.width/2 && xdist < this.paddle.width/2){
				var ydist = this.paddle.position.y - this.ball.position.y;
				if(ydist > - this.paddle.height/2 && ydist < this.paddle.height/2){
					this.yDirection *= -1;
					this.checkHitLocation(this.ball,this.paddle);
					// trace('hit code!!!');
				}
			}

			// if the ball hits a brick
			for(var i = 0; i < this.bricks.length; i++){
				var brick = this.bricks[i];
				var xcol = brick.position.x - this.ball.position.x;
				if(xcol > -brick.width/2 && xcol < brick.width/2){
					var ycol = brick.position.y - this.ball.position.y;
					if(ycol > -brick.height/2 && ycol < brick.height/2){
						// this.bricks.splice(brick[i], 1);
						this.yDirection *= -1;
						this.brickContainer.removeChild(brick);
						this.brickContainer.removeStageReference(brick);
						// trace(brick);
					}
				}
			}

			// if user presses left arrow
			if(paddleLeft){
				this.paddle.position.x -= 5;
			}

			// if user presses right arrow
			if(paddleRight){
				this.paddle.position.x += 5;
			}
		}
	};

	// checking hit location on the paddle to adjust for ball trajectory
	p.checkHitLocation = function(ball,paddle){
		var hitPercent, ballPosition;
		ballPosition = ball.position.x - paddle.position.x;
		hitPercent = (ballPosition / (paddle.width - ball.width)) - .5;
		this.xDirection = hitPercent * 10;
		this.yDirection *= 1.03;
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
		this.isPlaying = true;
		
		// add UI
		//basic grey background shape
		this.uiHolder = new PIXI.Graphics();
		this.uiHolder.beginFill(0x222222, .8);
		this.uiHolder.drawRect(0, 440, 640, 40);
		this.uiHolder.endFill();
		this.gameContainer.addChild(this.uiHolder);

		// quit button
		var quitButton = PIXI.Sprite.fromFrame("QuitButton0000");
		quitButton.buttonMode = true;
		quitButton.interactive = true;
		quitButton.mouseup = this.leaveGameState.bind(this);
		quitButton.position.x = 5;
		quitButton.position.y = 448;
		this.uiHolder.addChild(quitButton);

		//level/score/lives text
		this.updateLevelDisplay();
		this.updateScoreDisplay();
		this.updateLivesDisplay();

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
				brick.anchor.x = 0.5;
				brick.anchor.y = 0.5;
				this.brickContainer.position.x = 0;
				this.brickContainer.position.y = 0;
				this.brickContainer.addChild(brick);
				this.bricks.push(brick);
			}
		}
		this.gameContainer.addChild(this.brickContainer);

		//add the ball and paddle
		var paddle = PIXI.Sprite.fromFrame("Paddle0000");
		paddle.position.x = 320 - Math.round(paddle.texture.width/2);
		paddle.position.y = 400;
		paddle.anchor.x = 0.5;
		paddle.anchor.y = 0.5;
		this.gameContainer.addChild(paddle);
		this.paddle = paddle;

		var ball = PIXI.Sprite.fromFrame("Ball0000");
		ball.position.x = 320 - Math.round(ball.texture.width/2);
		ball.position.y = 250;
		ball.anchor.x = 0.5;
		ball.anchor.y = 0.5;
		this.gameContainer.addChild(ball);
		this.ball = ball;
		
		this.addKeyListeners();
	};

	p.addKeyListeners = function(){
		// trace(object,this,document);
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
		this.initTitleState();
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
		this.levelText.text = "Level: " + this.currentLevel;
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
		this.scoreText.text = "Score: " + this.gameScore;
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
		this.livesText.text = "Lives: " + this.livesRemaining;
	};

	// Create the game
	new BrickBreaker();
	
}());