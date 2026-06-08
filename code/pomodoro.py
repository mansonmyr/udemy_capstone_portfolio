import tkinter
import math

# ---------------------------- CONSTANTS ------------------------------- #
BLUE = "#1D546D"
RED = "#DC9B9B"
MINT = "#C0E1D2"
FONT_NAME = "Calibra"
WORK_MIN = 25
SHORT_BREAK_MIN = 5
LONG_BREAK_MIN = 20
reps = 0
timer = None

# ---------------------------- TIMER RESET ------------------------------- # 
def reset_timer():
    window.after_cancel(timer)
    canvas.itemconfig(timer_text, text="00:00")
    title_label.config(text="Timer", fg=BLUE)
    check_marks.config(text="")
    global reps
    reps = 0

# ---------------------------- TIMER MECHANISM ------------------------------- # 
def start_timer():
    global reps
    reps += 1

    work_sec = WORK_MIN * 60
    short_break_sec = SHORT_BREAK_MIN * 60
    long_break_sec = LONG_BREAK_MIN * 60

    if reps % 8 == 0:
        countdown(long_break_sec)
        title_label.config(text="Long Break", fg=RED)
    elif reps % 2 == 0:
        countdown(short_break_sec)
        title_label.config(text="Short Break", fg=RED)
    else:
        countdown(work_sec)
        title_label.config(text="Work", fg=BLUE)

# ---------------------------- COUNTDOWN MECHANISM ------------------------------- # 
def countdown(count):
    count_min = math.floor(count / 60)
    count_sec = count % 60
    if count_sec < 10:
        count_sec = f"0{count_sec}"

    canvas.itemconfig(timer_text, text=f"{count_min}:{count_sec}")
    if count > 0:
        global timer
        window.after(1000, countdown, count - 1)
    else:
        start_timer()
        mark = ""
        work_sessions = math.floor(reps/2)
        for _ in range(work_sessions):
            mark += "💮"
        check_marks.config(text=mark)

# ---------------------------- UI SETUP ------------------------------- #
window = tkinter.Tk()
window.title("Pomodoro")
window.config(padx=100, pady=50, bg=MINT)

title_label = tkinter.Label(window, text="Timer", font=(FONT_NAME, 40, "bold"), fg=BLUE, bg=MINT)
title_label.grid(column=1, row=0)

canvas = tkinter.Canvas(width=200, height=224, bg=MINT, highlightthickness=0)
tomato_img = tkinter.PhotoImage(file="tomato.png")
canvas.create_image(100, 112, image=tomato_img)
timer_text = canvas.create_text(100, 130, text="00:00", fill="white", font=(FONT_NAME, 35, "bold"))
canvas.grid(column=1, row=1)

start_button = tkinter.Button(text="Start", bg=MINT, highlightthickness=0, command=start_timer)
reset_button = tkinter.Button(text="Reset", bg=MINT, highlightthickness=0, command=reset_timer)
start_button.grid(column=0, row=2)
reset_button.grid(column=2, row=2)

check_marks = tkinter.Label(fg=BLUE, bg=MINT, highlightthickness=0)
check_marks.grid(column=1, row=3)

window.mainloop()