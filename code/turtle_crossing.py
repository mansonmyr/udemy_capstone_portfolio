import time
import random
from turtle import Screen, Turtle
from player import Player
from car_manager import CarManager
from scoreboard import Scoreboard

screen = Screen()
screen.setup(width=600, height=600)
screen.title("Turbo Turtle Crossing")
screen.tracer(0)

# Draw background and road lanes
def draw_background():
    bg_drawer = Turtle()
    bg_drawer.hideturtle()
    bg_drawer.penup()
    # Grass areas
    bg_drawer.color("darkgreen")
    bg_drawer.goto(-300, -300)
    bg_drawer.begin_fill()
    bg_drawer.goto(300, -300)
    bg_drawer.goto(300, -250)
    bg_drawer.goto(-300, -250)
    bg_drawer.end_fill()
    bg_drawer.goto(-300, 250)
    bg_drawer.begin_fill()
    bg_drawer.goto(300, 250)
    bg_drawer.goto(300, 300)
    bg_drawer.goto(-300, 300)
    bg_drawer.end_fill()
    # Road
    bg_drawer.color("grey")
    bg_drawer.goto(-300, -250)
    bg_drawer.begin_fill()
    bg_drawer.goto(300, -250)
    bg_drawer.goto(300, 250)
    bg_drawer.goto(-300, 250)
    bg_drawer.end_fill()
    # Lane markings
    bg_drawer.color("white")
    for y in range(-200, 220, 45):
        bg_drawer.penup()
        bg_drawer.goto(-300, y)
        bg_drawer.setheading(0)
        for _ in range(15):
            bg_drawer.pendown()
            bg_drawer.forward(25)
            bg_drawer.penup()
            bg_drawer.forward(15)

difficulty_choice = 0

def show_difficulty_menu():
    global difficulty_choice
    menu = Turtle()
    menu.hideturtle()
    menu.penup()
    menu.goto(0, 80)
    menu.write("SELECT DIFFICULTY", align="center", font=("Courier", 28, "bold"))
    menu.goto(0, 20)
    menu.write("Press 1: EASY", align="center", font=("Courier", 20, "normal"))
    menu.goto(0, -20)
    menu.write("Press 2: MEDIUM", align="center", font=("Courier", 20, "normal"))
    menu.goto(0, -60)
    menu.write("Press 3: HARD", align="center", font=("Courier", 20, "normal"))

    difficulty_choice = 0
    def set_easy(): global difficulty_choice; difficulty_choice = 1
    def set_medium(): global difficulty_choice; difficulty_choice = 1.5
    def set_hard(): global difficulty_choice; difficulty_choice = 2.2

    screen.onkey(set_easy, "1")
    screen.onkey(set_medium, "2")
    screen.onkey(set_hard, "3")
    screen.listen()

    while difficulty_choice == 0:
        screen.update()
        time.sleep(0.1)

    screen.onkey(None, "1")
    screen.onkey(None, "2")
    screen.onkey(None, "3")
    menu.clear()
    return difficulty_choice

def screen_shake(intensity=3, duration=0.3):
    root = screen.getcanvas().winfo_toplevel()
    original_x = root.winfo_x()
    original_y = root.winfo_y()
    start = time.time()
    while time.time() - start < duration:
        x = random.randint(-intensity, intensity)
        y = random.randint(-intensity, intensity)
        root.geometry(f"+{original_x + x}+{original_y + y}")
        screen.update()
        time.sleep(0.02)
    root.geometry(f"+{original_x}+{original_y}")

def toggle_pause():
    global game_paused
    game_paused = not game_paused
    if game_paused:
        scoreboard.show_pause()
    else:
        scoreboard.update_scoreboard()

# Initialize game
draw_background()
difficulty = show_difficulty_menu()

player = Player()
car_manager = CarManager(difficulty)
scoreboard = Scoreboard()

# Controls
screen.listen()
screen.onkey(player.go_up, "Up")
screen.onkey(player.go_down, "Down")
screen.onkey(player.go_left, "Left")
screen.onkey(player.go_right, "Right")
screen.onkey(toggle_pause, "p")

scoreboard.update_scoreboard()

game_is_on = True
game_paused = False
special_level_counter = 0

while game_is_on:
    time.sleep(0.016)

    if game_paused:
        screen.update()
        continue

    player.update()
    car_manager.create_car()
    car_manager.move_cars()

    # Detect collision
    if car_manager.check_collision(player):
        if player.hit():
            screen_shake()
            scoreboard.update_lives(player.lives)
            if player.lives <= 0:
                game_is_on = False
                scoreboard.game_over()
            else:
                player.go_to_start()

    # Detect successful crossing
    if player.is_at_finish_line():
        player.go_to_start()
        car_manager.level_up()
        scoreboard.increase_level()
        special_level_counter += 1

        # Special level every 3 levels
        if special_level_counter % 3 == 0:
            screen.bgcolor("darkgrey")
            screen.ontimer(lambda: screen.bgcolor("white"), 2000)

    screen.update()

screen.exitonclick()

# Player
from turtle import Turtle

STARTING_POSITION = (0, -280)
MOVE_DISTANCE = 10
FINISH_LINE_Y = 280


class Player(Turtle):

    def __init__(self):
        super().__init__()
        self.shape("turtle")
        self.color("black")
        self.penup()
        self.go_to_start()
        self.setheading(90)
        self.lives = 3
        self.invulnerable = False
        self.invulnerable_timer = 0

    def go_up(self):
        if self.ycor() < 280:
            self.forward(MOVE_DISTANCE)
            self.animate_step()

    def go_down(self):
        if self.ycor() > -280:
            self.backward(MOVE_DISTANCE)
            self.animate_step()

    def go_left(self):
        if self.xcor() > -280:
            self.setheading(180)
            self.forward(MOVE_DISTANCE)
            self.setheading(90)
            self.animate_step()

    def go_right(self):
        if self.xcor() < 280:
            self.setheading(0)
            self.forward(MOVE_DISTANCE)
            self.setheading(90)
            self.animate_step()

    def go_to_start(self):
        self.goto(STARTING_POSITION)
        self.setheading(90)

    def is_at_finish_line(self):
        return self.ycor() > (FINISH_LINE_Y - 30)

    def animate_step(self):
        self.turtlesize(stretch_wid=0.9, stretch_len=1.1)
        self.getscreen().ontimer(lambda: self.turtlesize(stretch_wid=1, stretch_len=1), 100)

    def hit(self):
        if not self.invulnerable:
            self.lives -= 1
            self.invulnerable = True
            self.invulnerable_timer = 120
            self.color("red")
            return True
        return False

    def update(self):
        if self.invulnerable:
            self.invulnerable_timer -= 1
            if self.invulnerable_timer % 20 < 10:
                self.hideturtle()
            else:
                self.showturtle()
            if self.invulnerable_timer <= 0:
                self.invulnerable = False
                self.showturtle()
                self.color("black")

# Car
from turtle import Turtle
import random

CAR_TYPES = [
    {"type": "sports", "width": 1.5, "height": 0.8, "speed_mult": 1.4, "colors": ["red", "black"]},
    {"type": "normal", "width": 2.0, "height": 1.0, "speed_mult": 1.0, "colors": ["blue", "green", "purple"]},
    {"type": "truck",  "width": 3.0, "height": 1.2, "speed_mult": 0.6, "colors": ["orange", "yellow", "grey"]},
]

LANES = [-225, -180, -135, -90, -45, 0, 45, 90, 135, 180, 225]
STARTING_MOVE_DISTANCE = 5
MOVE_INCREMENT = 1.5


class CarManager:

    def __init__(self, difficulty=1):
        self.all_cars = []
        self.car_speed = STARTING_MOVE_DISTANCE * difficulty
        self.spawn_rate = max(3, 7 - difficulty)

    def create_car(self):
        random_chance = random.randint(1, self.spawn_rate)
        if random_chance == 1:
            car_type = random.choices(CAR_TYPES, weights=[0.2, 0.5, 0.3])[0]
            new_car = Turtle("square")
            new_car.shapesize(stretch_wid=car_type["height"], stretch_len=car_type["width"])
            new_car.penup()
            new_car.color(random.choice(car_type["colors"]))
            new_car.speed_mult = car_type["speed_mult"]
            new_car.goto(310, random.choice(LANES))
            self.all_cars.append(new_car)

    def move_cars(self):
        for car in self.all_cars:
            car.backward(self.car_speed * car.speed_mult)
        # Clean up cars that go off screen
        self.all_cars = [car for car in self.all_cars if car.xcor() > -320]

    def level_up(self):
        self.car_speed += MOVE_INCREMENT
        self.spawn_rate = max(2, self.spawn_rate - 1)

    def check_collision(self, player):
        for car in self.all_cars:
            # Only check cars that are actually on the visible road
            if car.xcor() < -290 or car.xcor() > 290:
                continue
            dx = abs(car.xcor() - player.xcor())
            dy = abs(car.ycor() - player.ycor())
            # Correct half-width calculation: turtle base = 20px, so half is 10px per stretch unit
            car_half_width = car.shapesize()[1] * 10
            car_half_height = car.shapesize()[0] * 10
            player_half = 7
            # Perfect collision: sum of half sizes + small overlap margin
            if dx < (car_half_width + player_half) and dy < (car_half_height + player_half):
                return True
        return False

#Scoreboard
from turtle import Turtle

FONT = ("Courier", 24, "normal")
SMALL_FONT = ("Courier", 16, "normal")


class Scoreboard(Turtle):

    def __init__(self):
        super().__init__()
        self.level = 1
        self.lives = 3
        self.paused = False
        self.hideturtle()
        self.penup()

    def update_scoreboard(self):
        self.clear()
        # Level display
        self.goto(-280, 260)
        self.write(f"Level: {self.level}", align="left", font=FONT)
        # Lives display
        self.goto(200, 260)
        lives_display = "❤️ " * self.lives + "🖤 " * (3 - self.lives)
        self.write(lives_display, align="left", font=SMALL_FONT)
        # Pause hint
        self.goto(0, 260)
        self.write("[P] Pause", align="center", font=("Courier", 12, "normal"))

    def increase_level(self):
        self.level += 1
        self.update_scoreboard()

    def update_lives(self, lives):
        self.lives = lives
        self.update_scoreboard()

    def game_over(self):
        self.goto(0, 0)
        self.write("GAME OVER", align="center", font=FONT)
        self.goto(0, -40)
        self.write(f"Final Level: {self.level}", align="center", font=SMALL_FONT)

    def show_pause(self):
        self.goto(0, 0)
        self.write("PAUSED", align="center", font=FONT)
        self.goto(0, -40)
        self.write("Press P to continue", align="center", font=SMALL_FONT)
