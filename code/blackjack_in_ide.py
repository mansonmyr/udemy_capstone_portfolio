logo = """  _____
         |A .  | _____
         | /.\ ||A ^  | _____
         |(_._)|| / \ ||A _  | _____
         |  |  || \ / || ( ) ||A_ _ |
         |____V||  .  ||(_'_)||( v )|
                |____V||  |  || \ / |
                       |____V||  .  |
                              |____V|
_     _            _    _            _
| |   | |          | |  (_)          | |
| |__ | | __ _  ___| | ___  __ _  ___| | __
| '_ \| |/ _` |/ __| |/ / |/ _` |/ __| |/ /
| |_) | | (_| | (__|   <| | (_| | (__|   <
|_.__/|_|\__,_|\___|_|\_\ |\__,_|\___|_|\_\
                       _/ |
                      |__/    """

import random
def deal_card():
	"""Returns a random card from the deck"""
	cards = [11, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10]
	card = random.choice(cards)
	return card

def calculate_score(cards):
	"""Take a list of cards and return the score calculated from the cards"""
	if sum(cards) == 21 and len(cards) == 2:
		return 0
	if 11 in cards and sum(cards) > 21:
		cards.remove(11)
		cards.append(1)
	return sum(cards)

def compare(u_score, c_score):
	if u_score == c_score:
		return "Draw :)"
	elif c_score == 0:
		return "You loseee... Computer has a Blackjack :("
	elif u_score == 0:
		return "Win with a Blackjack"
	elif u_score > 21:
		return "You went over. You loseee... :("
	elif c_score > 21:
		return "Computer went over. You Win!!!"
	elif u_score > c_score:
		return "You Winnn! ;)"
	else:
		return "You loseee... :("

def play_game():
	user_cards = []
	computer_cards = []
	com_score = -1
	usr_score = -1
	is_game_over = False

	for _ in range(2):
		new_card = deal_card()
		user_cards.append(new_card)
		computer_cards.append(deal_card())
	while not is_game_over:
		usr_score = calculate_score(user_cards)
		com_score = calculate_score(computer_cards)
		print(f"Your cards: {user_cards}, current score: {usr_score}")
		print(f"Computer's first card: {computer_cards[0]}")

		if usr_score == 0 or com_score == 0 or usr_score > 21:
			is_game_over = True
		else:
			usr_deal = input("Type 'y' to get another card, type 'n' to pass: ")
			if usr_deal == "y":
				user_cards.append(deal_card())
			else:
				is_game_over = True

	while com_score != 0 and com_score < 17:
		computer_cards.append(deal_card())
		com_score = calculate_score(computer_cards)

	print(f"Your final hand: {user_cards}, final score: {usr_score}")
	print(f"Computer's final hand: {computer_cards}, final score: {com_score}")
	print(compare(usr_score, com_score))

while input("Do you want to replay again? Type 'y' or 'n': ") == "y":
  print("\n" * 20)
  print(logo)
  play_game()
