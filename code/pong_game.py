from turtle import Screen
from paddle import Paddle
from ball import Ball
from scoreboard import Scoreboard
import time

screen = Screen()
screen.bgcolor("black")
screen.setup(width=800, height=600)
screen.title("Pong")
screen.tracer(0) #turn off animation, but need screen to refresh

r_paddle = Paddle((350, 0))
l_paddle = Paddle((-350, 0))
ball = Ball()
scoreboard = Scoreboard()

screen.listen()
# Track key presses AND releases for smooth holding
screen.onkeypress(r_paddle.start_moving_up, "Up")
screen.onkeyrelease(r_paddle.stop_moving_up, "Up")
screen.onkeypress(r_paddle.start_moving_down, "Down")
screen.onkeyrelease(r_paddle.stop_moving_down, "Down")

screen.onkeypress(l_paddle.start_moving_up, "w")
screen.onkeyrelease(l_paddle.stop_moving_up, "w")
screen.onkeypress(l_paddle.start_moving_down, "s")
screen.onkeyrelease(l_paddle.stop_moving_down, "s")

game_on = True
while game_on:
    time.sleep(0.016) # Consistent 60 FPS update rate
    screen.update()
    
    # Update paddles EVERY frame for smooth movement
    r_paddle.update()
    l_paddle.update()
    
    ball.move()

    #detect collision with wall
    if ball.ycor() > 280 or ball.ycor() < -280:
        ball.bounce_y()

    #detect collision with paddle
    if ball.distance(r_paddle) < 50 and ball.xcor() > 320 or ball.distance(l_paddle) < 50 and ball.xcor() < -320:
        ball.bounce_x()

    # detect r_paddle misses
    if ball.xcor() > 380:
        ball.reset_postion()
        scoreboard.r_point()

    # detect l_paddle misses
    if ball.xcor() < -380:
        ball.reset_postion()
        scoreboard.l_point()

screen.exitonclick()

# Paddle
from turtle import Turtle

class Paddle(Turtle):
    def __init__(self, position):
        super().__init__()
        self.shape("square")
        self.color("white")
        self.shapesize(stretch_wid=5, stretch_len=1)
        self.penup()
        self.goto(position)
        self.moving_up = False
        self.moving_down = False
        self.move_speed = 6

    def update(self):
        if self.moving_up and self.ycor() < 250:
            new_y = self.ycor() + self.move_speed
            self.goto(self.xcor(), new_y)
        if self.moving_down and self.ycor() > -240:
            new_y = self.ycor() - self.move_speed
            self.goto(self.xcor(), new_y)

    def start_moving_up(self):
        self.moving_up = True

    def stop_moving_up(self):
        self.moving_up = False

    def start_moving_down(self):
        self.moving_down = True

    def stop_moving_down(self):
        self.moving_down = False

# Ball
from turtle import Turtle
import random

class Ball(Turtle):
    def __init__(self):
        super().__init__()
        self.shape("triangle")
        self.color("white")
        self.penup()
        self.base_speed = 3.5
        self.x_move = self.base_speed
        self.y_move = self.base_speed
        self.speed_multiplier = 1.0
        self.rotation_speed = 6
        self.colors = ["white", "cyan", "magenta", "yellow", "lime", "orange", "pink", "lightblue"]

    def move(self):
        new_x = self.xcor() + (self.x_move * self.speed_multiplier)
        new_y = self.ycor() + (self.y_move * self.speed_multiplier)
        self.goto(new_x, new_y)
        # Constant spin animation
        self.right(self.rotation_speed)

    def random_color(self):
        self.color(random.choice(self.colors))

    def bounce_y(self):
        self.y_move *= -1
        self.random_color()

    def bounce_x(self):
        self.x_move *= -1
        self.random_color()
        # Gradual speed increase: +2% per paddle hit
        self.speed_multiplier = min(self.speed_multiplier * 2.02, 2.2)

    def reset_postion(self):
        self.goto(0,0)
        self.speed_multiplier = 1.0
        self.color("white")
        self.bounce_x()

# Scoreboard
from turtle import Turtle

class Scoreboard(Turtle):
    def __init__(self):
        super().__init__()
        self.color("white")
        self.penup()
        self.hideturtle()
        self.l_score = 0
        self.r_score = 0
        self.update_score()

    def update_score(self):
        self.clear()
        self.goto(-100,200)
        self.write(self.l_score,align="center",font=("Courier",80,"normal"))
        self.goto(100,200)
        self.write(self.r_score,align="center",font=("Courier",80,"normal"))

    def l_point(self):
        self.l_score += 1
        self.update_score()

    def r_point(self):
        self.r_score += 1
        self.update_score()
