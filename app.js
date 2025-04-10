// toastify
function toast(toastText) {
  Toastify({
    text: toastText,
    duration: 1500,
    close: true,
    gravity: "top",
    position: "center",
    stopOnFocus: true,
    style: {
      background: "linear-gradient(to bottom,rgb(25, 100, 143),rgb(22, 79, 155))",
    },
    onClick: function () { }
  }).showToast();
}

function endToast(toastText) {
  Toastify({
    text: toastText,
    close: true,
    gravity: "top",
    position: "center",
    stopOnFocus: true,
    style: {
      background: "linear-gradient(to bottom,rgb(25, 100, 143),rgb(22, 79, 155))",
    },
    onClick: function () { }
  }).showToast();
}
// Locking inputs
let inputLock = false;

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
let hintsUsed = 0;
const proxContainer = document.getElementsByClassName('prox-grid-item');
const proxBar = document.getElementsByClassName('prox-bar');
const proxTexts = document.getElementsByClassName('prox-text');
function getProximity(joinedGuess) {
  fetch(`https://api.conceptnet.io/related/c/en/${targetWord}?filter=/c/en/${joinedGuess}`)
    .then(response => response.json())
    .then(data => {
      if (data.related && data.related.length > 0) {
        guesses.push(joinedGuess);
        proxContainer[currentRowIndex - 2].classList.add('visible');
        proxTexts[currentRowIndex - 2].textContent = `Proximity: ${(data.related[0].weight * 100).toFixed(2)}%`
        if (data.related[0].weight < 0) {
          proxBar[currentRowIndex - 2].style.backgroundColor = 'rgba(168, 0, 0, 0.77)';
          proxBar[currentRowIndex - 2].style.width = `${(data.related[0].weight * -100).toFixed(2)}%`;
          inputLock = false;
        } else if (data.related[0].weight == 1) {
          if (hintsUsed == 1) {
            endToast("Correct! Review your guesses and feel free to play again. \n You used 1 hint.")
          } else {
            endToast(`Correct! Review your guesses and feel free to play again. \n You used ${hintsUsed} hint.`)
          }
          document.querySelector('.keyboard-container').classList.remove('visible');
          proxBar[currentRowIndex - 2].style.width = '100%';
        } else {
          proxBar[currentRowIndex - 2].style.width = `${(data.related[0].weight * 100).toFixed(2)}%`
        }
        if (guesses.length == 6) {
          endToast(`You are out of guesses! The word was ${targetWord}`);
          document.querySelector('.keyboard-container').classList.remove('visible');
          document.querySelector('.playAgainBtn').classList.add('visible');
        }
      } else {
        toast(`The word ${joinedGuess} is not recognized. Try again.`)
        currentRowIndex--
        let l = 1;
        incorrectInterval = setInterval(function () {
          deleteLetter()
          if (muted == false) {
            const popClone = pop.cloneNode();
            popClone.play();
          }
          if (l >= joinedGuess.length) {
            clearInterval(incorrectInterval)
            inputLock = false;
          }
          l++
        }, 50)
      }
      inputLock = false;
    })
}

document.querySelector('.reroll').addEventListener('click', function () {
  hintRoll = [];
  hintsUsed++;
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
  if (!inputLock) {
    if (key === "ENTER") {
      // Handle word submission logic 
      inputLock = true;
      if (currentTileIndex == currentRowIndex * 5) {
        joinedGuess = currentGuessList.join('').toLowerCase();
        getProximity(joinedGuess);
        currentGuessList = [];
        joinedGuess = "";
        currentRowIndex++;
      }
    } else if (key === "<") {
      if (currentRowIndex != (currentTileIndex / 5) + 1) {
        deleteLetter();
      }
    } else if (/^[A-Z]$/.test(key)) {
      addLetter(key);
    }
  } else {
    toast('Input locked')
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
  if (event.ctrlKey) {
    event.preventDefault();
    return;
  }

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
  inputLock = true;
  tileInterval = setInterval(function () {
    deleteLetter()
    if (muted == false) {
      const popClone = pop.cloneNode();
      popClone.play();
    }
    if (currentTileIndex == 0) {
      clearInterval(tileInterval)
    } else {
      inputLock = false;
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
  hintsUsed = 0;
  getRandom();
};

document.querySelector('.playAgainBtn').addEventListener('click', function () {
  document.querySelector('.playAgainBtn').classList.remove('visible');
  document.querySelector('.keyboard-container').classList.add('visible');
  clearBoard();
});

// Muting
let muted = false;

document.querySelector('.mute-container').addEventListener('click', function () {
  if (muted == false) {
    muted = true;
    document.querySelector('.mute-container').style.backgroundImage = "url('img/muted.png')"
    document.querySelector('.mute-container').title = "unmute"
  } else {
    muted = false;
    document.querySelector('.mute-container').style.backgroundImage = "url('img/unmuted.png')"
    document.querySelector('.mute-container').title = "mute"
  }
})

window.onload = function () {
  getRandom();
};