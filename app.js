// random words api integration
let hintRoll = [];
const hintLabel = document.getElementById('hintLabel');
function getRandom() {
  fetch("https://random-word-api.herokuapp.com/word?length=5&lang=en")
    .then(response => {
      if (!response.ok) {
        throw new Error(`response status: ${response.status}`)
      }
      return response.json();
    })
    .then(wordData => {
      targetWord = wordData[0]
      getHints(targetWord)
      console.log(targetWord)
    })
}
// hints api integration
function getHints(targetWord) {
  fetch(`https://api.datamuse.com/words?rel_trg=${targetWord}`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`response status: ${response.status}`)
      }
      return response.json();
    })
    .then(data => {
      if (data.length < 15) {
        getRandom()
      } else {
        for (let i = 0; i < 5; i++) {
          index = Math.floor(Math.random() * data.length)
          hintRoll.push(data[index]['word']);
        }
        hintLabel.textContent = hintRoll.join(', ');
      }
    })
    .catch(error => {
      console.error('Error:', error);
    })
}


// proximity api integration
function getProximity(joinedGuess) {
  fetch(`https://api.conceptnet.io/related/c/en/${targetWord}?filter=/c/en/${joinedGuess}`)
    .then(response => response.json())
    .then(data => {
      if (data.related && data.related.length > 0) {
        if (data.related[0].weight == 1) {
          alert("Correct!")
          clearBoard();
        } else {
          alert(`Proximity: ${(data.related[0].weight * 100).toFixed(2)}%`);
        }
      } else {
        alert(`Proximity: 0`)
      }
    })
}



const gridItems = document.querySelectorAll(".grid-item");
const keyboardItems = document.querySelectorAll(".keyboard-item");
let currentTileIndex = 0;
let currentRowIndex = 1;
let currentGuessList = [];
let guesses = [];
let joinedGuess = null;
// Handle keyboard input clicks
keyboardItems.forEach(item => {
  item.addEventListener("click", () => handleInput(item.textContent));
});

function handleInput(key) {
  if (key === "ENTER") {
    // Handle word submission logic
    if (currentTileIndex == currentRowIndex * 5) {
      // get the guessed word
      joinedGuess = currentGuessList.join('').toLowerCase(),
        guesses.push(joinedGuess)
      getProximity(joinedGuess);
      currentGuessList = [];
      joinedGuess = "";
      currentRowIndex++;
    }
    else if (guesses.length == 6) {
      alert('Kill yourself')
    }
    else {
      alert("Invalid input!")
    }
  } else if (key === "<") {
    if (currentRowIndex != (currentTileIndex / 5) + 1) {
      deleteLetter();
    }
  } else if (/^[A-Z]$/.test(key)) {
    addLetter(key);
  }
}

function addLetter(letter) {
  if (currentTileIndex < gridItems.length) {
    if (currentTileIndex < currentRowIndex * 5) {
      gridItems[currentTileIndex].textContent = letter;
      currentTileIndex++;
      currentGuessList.push(letter)
    }
  }
}

function deleteLetter() {
  if (currentTileIndex > 0) {
    currentTileIndex--;
    currentGuessList.pop(-1)
    gridItems[currentTileIndex].textContent = null;
  }
}

// handle user keyboard input
document.addEventListener("keydown", (event) => {
  let key = event.key.toUpperCase();

  if (key === "ENTER") {
    handleInput("ENTER");
  } else if (key === "BACKSPACE") {
    handleInput("<");
  } else if (/^[A-Z]$/.test(key)) {
    handleInput(key);
  }
});

const pop = new Audio('pop.mp3')

function clearBoard() {
  deleteInterval = setInterval(function () {
    deleteLetter()
    const popClone = pop.cloneNode();
    popClone.play();
    if (currentTileIndex == 0) {
      clearInterval(deleteInterval)
    }
  }, 50)
  currentRowIndex = 1;
  guesses = [];
  joinedGuess = null;
  hintRoll = [];
  getRandom()
}

document.getElementById('reroll').addEventListener('click', function() {
  hintRoll = [];
  getHints(targetWord)
});

getRandom();