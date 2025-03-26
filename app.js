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
      // console.log(targetWord)
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
          let isDuplicate = false;
          for (let w = 0; w < hintRoll.length; w++) {
            if (data[index]['word'] == hintRoll[w]) {
              isDuplicate = true;
              console.log(isDuplicate)
              w -= 1;
              isDuplicate = false;
            }
          }
          if (!isDuplicate) {
            console.log('jimbo')
            hintRoll.push(data[index]['word']);
          }
        }
        hintLabel.textContent = hintRoll.join(', ');
      }
    })
    .catch(error => {
      console.error('Error:', error);
    })
}


// proximity api integration
const proxContainer = document.getElementsByClassName('prox-grid-item');
const proxBar = document.getElementsByClassName('prox-bar');
const proxTexts = document.getElementsByClassName('prox-text');
function getProximity(joinedGuess) {
  fetch(`https://api.conceptnet.io/related/c/en/${targetWord}?filter=/c/en/${joinedGuess}`)
    .then(response => response.json())
    .then(data => {
      if (data.related && data.related.length > 0) {
        let barContainer = proxContainer[currentRowIndex - 2];
        let barText = proxTexts[currentRowIndex - 2];

        barContainer.classList.add('visible');
        barText.textContent = `Proximity: ${(data.related[0].weight * 100).toFixed(2)}%`
        if (data.related[0].weight < 0) {
          proxBar[currentRowIndex - 2].style.width = `${(data.related[0].weight * -100).toFixed(2)}%`
        } else if (data.related[0].weight == 1) {
          proxBar[currentRowIndex - 2].style.width = `${(data.related[0].weight * -100).toFixed(2)}%`

          clearBoard();
        } else {
          proxBar[currentRowIndex - 2].style.width = `${(data.related[0].weight * 100).toFixed(2)}%`
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

document.getElementById('reroll').addEventListener('click', function () {
  hintRoll = [];
  getHints(targetWord)
});

window.onload = function () {
  getRandom();
}