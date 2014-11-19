(function(){
	
	var trace = function(){ for(var i = 0; i < arguments.length; i++){ console.log(arguments[i]); } };
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

		// 
		this.xDirection = 5;
		this.yDirection = 2;
		this.easing = 7;
		
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
		// get the ball from the gameContainer
		// must be better way than by index????
		var ball = this.gameContainer.getChildAt(56);
		
		// logic for ball bounces off the walls
		if(ball.position.x <= 0){
			this.xDirection *= -1;
		} else if(ball.position.x >= 640 - ball.width) {
			this.xDirection *= -1;
		}

		// logic for ball bouncing off the roof
		if(ball.position.y >= 480){
			// session ends
			// this.initGameState();
			// this.livesRemaining--;
		} else if(ball.position.y <= 0) {
			this.yDirection *= -1;
		}

		// trace(ball.position.x, ball.position.y);
		ball.position.y -= this.yDirection;
		ball.position.x += this.xDirection;
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
		for (var col=0;col < 9;col++)
		{
			for (var row=0;row < 6;row++)
			{
				var brick = PIXI.Sprite.fromFrame("Brick000" + Math.floor(Math.random() * 4));
				brick.position.x = col * (brick.texture.width + 1);
				brick.position.y = row * (brick.texture.height + 1);
				this.gameContainer.addChild(brick);
			}
		}

		//add the ball and paddle
		var paddle = PIXI.Sprite.fromFrame("Paddle0000");
		paddle.position.x = 320 - Math.round(paddle.texture.width/2);
		paddle.position.y = 400;
		this.gameContainer.addChild(paddle);

		var ball = PIXI.Sprite.fromFrame("Ball0000");
		ball.position.x = 320 - Math.round(ball.texture.width/2);
		ball.position.y = 250;
		this.gameContainer.addChild(ball);
		
		// listen for keyboard events, pass in `this` to maintain scope of the pixi object
		this.addListeners(this);
	};

	p.addListeners = function(object){
		document.addEventListener('keydown',function(evt){
			switch(evt.which){
				case 37:
					// ew
					BrickBreaker.prototype.leftKeyPressed(object.gameContainer.getChildAt(55));
					break;
				case 39:
					// ew
					BrickBreaker.prototype.rightKeyPressed(object.gameContainer.getChildAt(55));
					break;
			}
		});
	};


	p.leftKeyPressed = function(object){
		object.position.x -= 10;
	};

	p.rightKeyPressed = function(object){
		object.position.x += 10;
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

