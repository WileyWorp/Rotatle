// random words api integration
let hintRoll = [];
let pastHints = [];
let hintCountDown = 3;
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
        while (hintRoll.length < 5) {
          index = Math.floor(Math.random() * data.length)
          if (!pastHints.includes(data[index]['word'])) {
            hintRoll.push(data[index]['word']);
            pastHints.push(data[index]['word'])
          }
        }
        if (pastHints.length >= 15) {
          document.querySelector('.reroll').style.display = "none";
          hintLabel.textContent = hintRoll.join(', ');
        } else {
          hintLabel.textContent = hintRoll.join(', ');
        }
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
          proxBar[currentRowIndex - 2].style.width = `${(data.related[0].weight * -100).toFixed(2)}%`;
        } else if (data.related[0].weight == 1) {
          proxBar[currentRowIndex - 2].style.width = '100%';
          document.querySelector('.alertText').textContent = "Correct! Click the X to review your guesses and feel free to play again.";
          document.querySelector('.alertContainer').classList.add('visible');
          document.querySelector('.keyboard-container').classList.remove('visible');
        } else {
          proxBar[currentRowIndex - 2].style.width = `${(data.related[0].weight * 100).toFixed(2)}%`
        }
      } else {
        let barContainer = proxContainer[currentRowIndex - 2];
        let barText = proxTexts[currentRowIndex - 2];

        barContainer.classList.add('visible');
        barText.textContent = `Proximity: 0.00%`
        proxBar[currentRowIndex - 2].style.width = `0%`
      }
    })
}

document.querySelector('.reroll').addEventListener('click', function () {
  hintRoll = [];
  getHints(targetWord)
});

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
      joinedGuess = currentGuessList.join('').toLowerCase();
      guesses.push(joinedGuess);
      getProximity(joinedGuess);
      currentGuessList = [];
      joinedGuess = "";
      currentRowIndex++;
      document.querySelector('.reroll').addEventListener('click', function () {
        hintRoll = [];
        getHints(targetWord);
  });
    } else if (currentRowIndex == 7) {
      document.querySelector('.alertContainer').classList.add('visible');
      document.querySelector('.alertText').textContent = "You are out of guesses!";
      document.querySelector('.keyboard-container').classList.remove('visible');
      document.querySelector('.playAgainBtn').classList.add('visible');
    } else {
      proxBar[currentRowIndex - 2].style.animationPlayState = "running";
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
  tileInterval = setInterval(function () {
    deleteLetter()
    const popClone = pop.cloneNode();
    popClone.play();
    if (currentTileIndex == 0) {
      clearInterval(tileInterval)
    }
  }, 50)

  for (p = 0; p < proxContainer.length; p++) {
    proxContainer[p].classList.remove('visible')
  }

  document.querySelector('.reroll').style.display = "flex";
  currentRowIndex = 1;
  guesses = [];
  joinedGuess = null;
  hintRoll = [];
  pastHints = [];
  getRandom()
};

document.querySelector('.alertX').addEventListener('click', function () {
  document.querySelector('.alertContainer').classList.remove('visible');
  document.querySelector('.alertText').textContent = "";
  document.querySelector('.playAgainBtn').classList.add('visible');
});

document.querySelector('.playAgainBtn').addEventListener('click', function () {
  document.querySelector('.playAgainBtn').classList.remove('visible');
  document.querySelector('.keyboard-container').classList.add('visible');
  clearBoard();
});

window.onload = function () {
  getRandom();
};