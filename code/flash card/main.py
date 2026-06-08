from tkinter import *
import pandas
import random

BACKGROUND_COLOR = "#B1DDC6"
data = pandas.read_csv("korean_flashcard.csv")
to_learn = data.to_dict(orient="records")
current_card ={}

def next_card():
    global current_card
    current_card = random.choice(to_learn)
    canvas.itemconfig(card_title, text="Korean", fill="black")
    display_text = f"{current_card['Korean']}\n {current_card['Romanize']}"
    canvas.itemconfig(card_word, text=display_text, fill= "black")
    canvas.itemconfig(card_word, text=display_text)
    canvas.itemconfig(card_background, image=card_front_img)
    window.after(1500, flip_card)

def flip_card():
    canvas.itemconfig(card_title, text="English", fill="white")
    canvas.itemconfig(card_word, text=current_card["English"], fill="white")
    canvas.itemconfig(card_background, image=card_back_img)


window = Tk()
window.title("Flashy")
window.config(padx=50, pady=50, bg=BACKGROUND_COLOR)

canvas = Canvas(width=800, height=526)

card_front_img = PhotoImage(file="images/card_front.png")
card_back_img = PhotoImage(file="images/card_back.png")
card_background = canvas.create_image(400, 263, image=card_front_img)

card_title = canvas.create_text(400, 150, text="", font=("Arial", 40, "italic"), fill="black")
card_word = canvas.create_text(400, 263, text="", font=("Arial", 60, "bold"), fill="black")
canvas.config(bg=BACKGROUND_COLOR, highlightthickness=0)
canvas.grid(row=0, column=0, columnspan=2)

cross_img = PhotoImage(file="images/wrong.png")
unknown_button = Button(image=cross_img)
unknown_button.config(bg=BACKGROUND_COLOR, highlightthickness=0, command=next_card)
unknown_button.grid(row=1, column=0)

check_img = PhotoImage(file="images/right.png")
check_button = Button(image=check_img)
check_button.config(bg=BACKGROUND_COLOR, highlightthickness=0, command=next_card)
check_button.grid(row=1, column=1)

next_card()

window.mainloop()