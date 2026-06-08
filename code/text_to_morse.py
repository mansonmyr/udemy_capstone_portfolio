MORSE_CODE_DICT = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
    'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
    'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
    'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
    'Y': '-.--', 'Z': '--..', '1': '.----', '2': '..---', '3': '...--',
    '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..',
    '9': '----.', '0': '-----'
}


def convert_to_morse(text):
    """Converts a string into Morse code symbols."""
    encoded_message = []

    # Standardize input to uppercase to match dictionary keys
    for char in text.upper():
        if char in MORSE_CODE_DICT:
            encoded_message.append(MORSE_CODE_DICT[char])
        else:
            # Handle characters not in the dictionary (e.g., emojis, special symbols)
            encoded_message.append("[?]")

    return " ".join(encoded_message)


def main():
    print("--- Text to Morse Code Converter ---")
    print("Type 'exit' to quit the program.")

    while True:
        user_input = input("\nEnter text to convert: ").strip()

        if user_input.lower() == 'exit':
            print("Goodbye!")
            break

        if not user_input:
            print("Please enter a valid string.")
            continue

        result = convert_to_morse(user_input)
        print(f"Morse Code: {result}")


if __name__ == "__main__":
    main()