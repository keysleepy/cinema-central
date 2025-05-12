// Add this code to the beginning of your script.js file

// Modal functionality
const modal = document.getElementById("confirm-modal")
const modalTitle = document.getElementById("modal-title")
const modalMessage = document.getElementById("modal-message")
const modalConfirmBtn = document.getElementById("modal-confirm")
const modalCancelBtn = document.getElementById("modal-cancel")
const modalCloseBtn = document.querySelector("#confirm-modal .close")

// Custom confirm function that returns a promise
function showConfirmModal(message, title = "Confirmation") {
  return new Promise((resolve) => {
    // Set modal content
    modalTitle.textContent = title
    modalMessage.textContent = message

    // Show modal
    modal.classList.add("show")

    // Handle confirm button click
    const confirmHandler = () => {
      modal.classList.remove("show")
      modalConfirmBtn.removeEventListener("click", confirmHandler)
      modalCancelBtn.removeEventListener("click", cancelHandler)
      modalCloseBtn.removeEventListener("click", cancelHandler)
      resolve(true)
    }

    // Handle cancel button click
    const cancelHandler = () => {
      modal.classList.remove("show")
      modalConfirmBtn.removeEventListener("click", confirmHandler)
      modalCancelBtn.removeEventListener("click", cancelHandler)
      modalCloseBtn.removeEventListener("click", cancelHandler)
      resolve(false)
    }

    // Add event listeners
    modalConfirmBtn.addEventListener("click", confirmHandler)
    modalCancelBtn.addEventListener("click", cancelHandler)
    modalCloseBtn.addEventListener("click", cancelHandler)

    // Close modal when clicking outside
    modal.addEventListener(
      "click",
      (event) => {
        if (event.target === modal) {
          cancelHandler()
        }
      },
      { once: true },
    )

    // Add keyboard support (Enter for confirm, Escape for cancel)
    const keyHandler = (e) => {
      if (e.key === "Enter") {
        confirmHandler()
      } else if (e.key === "Escape") {
        cancelHandler()
      }
    }

    document.addEventListener("keydown", keyHandler)

    // Clean up keyboard event listener when modal is closed
    const cleanupKeyHandler = () => {
      document.removeEventListener("keydown", keyHandler)
    }

    modalConfirmBtn.addEventListener("click", cleanupKeyHandler, { once: true })
    modalCancelBtn.addEventListener("click", cleanupKeyHandler, { once: true })
    modalCloseBtn.addEventListener("click", cleanupKeyHandler, { once: true })
  })
}

//TMDB

const API_KEY = "api_key=06b53bf4b7553afa7ae481b123f2cb47"
const BASE_URL = "https://api.themoviedb.org/3"
const API_URL = BASE_URL + "/discover/movie?sort_by=popularity.desc&" + API_KEY
const IMG_URL = "https://image.tmdb.org/t/p/w500"
const searchURL = BASE_URL + "/search/movie?" + API_KEY
// New URLs for actor/actress search
const searchPersonURL = BASE_URL + "/search/person?" + API_KEY
const personDetailsURL = BASE_URL + "/person/"

// Firebase references
let auth
let db
let currentUser = null

// Authentication check
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Initialize Firebase references from the window object (set in index.html)
    auth = window.firebaseAuth
    db = window.firebaseDb

    // Check if user is logged in
    const isAuthenticated = await window.checkAuth()
    const userFromStorage = JSON.parse(localStorage.getItem("user"))

    if (!isAuthenticated && !userFromStorage) {
      // Redirect to login page if not authenticated
      window.location.href = "login.html"
      return
    }

    // Set current user
    currentUser = auth.currentUser || (userFromStorage ? { uid: userFromStorage.uid } : null)

    if (!currentUser) {
      window.location.href = "login.html"
      return
    }

    // User is authenticated, continue loading the app
    initializeApp()
  } catch (error) {
    console.error("Authentication check failed:", error)
    // Redirect to login page on error
    window.location.href = "login.html"
  }
})

const genres = [
  {
    id: 28,
    name: "Action",
  },
  {
    id: 12,
    name: "Adventure",
  },
  {
    id: 16,
    name: "Animation",
  },
  {
    id: 35,
    name: "Comedy",
  },
  {
    id: 80,
    name: "Crime",
  },
  {
    id: 99,
    name: "Documentary",
  },
  {
    id: 18,
    name: "Drama",
  },
  {
    id: 10751,
    name: "Family",
  },
  {
    id: 14,
    name: "Fantasy",
  },
  {
    id: 36,
    name: "History",
  },
  {
    id: 27,
    name: "Horror",
  },
  {
    id: 10402,
    name: "Music",
  },
  {
    id: 9648,
    name: "Mystery",
  },
  {
    id: 10749,
    name: "Romance",
  },
  {
    id: 878,
    name: "Science Fiction",
  },
  {
    id: 10770,
    name: "TV Movie",
  },
  {
    id: 53,
    name: "Thriller",
  },
  {
    id: 10752,
    name: "War",
  },
  {
    id: 37,
    name: "Western",
  },
]

const main = document.getElementById("main")
const form = document.getElementById("form")
const search = document.getElementById("search")
const searchSuggestions = document.getElementById("search-suggestions")
const tagsEl = document.getElementById("tags")
const clearGenresContainer = document.getElementById("clear-genres-container")
const splashScreen = document.getElementById("splash-screen")

const prev = document.getElementById("prev")
const next = document.getElementById("next")
const current = document.getElementById("current")

// Sidebar elements
const sidebar = document.getElementById("sidebar")
const sidebarToggle = document.getElementById("sidebar-toggle")
const sidebarClose = document.getElementById("sidebar-close")
const historyList = document.getElementById("history-list")
const favoritesList = document.getElementById("favorites-list")
const content = document.querySelector(".content")

// Search type toggle elements
const searchTypeToggle = document.getElementById("search-type-toggle")
const movieSearchBtn = document.getElementById("movie-search")
const actorSearchBtn = document.getElementById("actor-search")
const searchTypeLabel = document.getElementById("search-type-label")

// Person details container
const personDetailsContainer = document.getElementById("person-details")

// Initialize history and favorites
let watchHistory = []
let favorites = []

var currentPage = 1
var nextPage = 2
var prevPage = 3
var lastUrl = ""
var totalPages = 100

var selectedGenre = []
let searchTimeout = null
let currentSuggestions = []

// Search type: 'movie' or 'person'
let currentSearchType = "movie"

// Currently selected person
let selectedPerson = null

// Handle splash screen with extended duration
document.addEventListener("DOMContentLoaded", () => {
  // Extended intro sequence
  setTimeout(() => {
    // Start the fade-out transition after 5 seconds
    splashScreen.classList.add("fade-out")
  }, 5000)
})

// Sidebar toggle functionality
sidebarToggle.addEventListener("click", showSidebar)
sidebarClose.addEventListener("click", hideSidebar)

// Search type toggle functionality
movieSearchBtn.addEventListener("click", () => {
  // Clear search bar when switching tabs
  search.value = ""
  setSearchType("movie")
  // Force refresh to show movies
  getMovies(API_URL)
})

actorSearchBtn.addEventListener("click", () => {
  // Clear search bar when switching tabs
  search.value = ""
  setSearchType("person")
  // Force refresh to show actors
  getPopularActors()
})

function setSearchType(type) {
  currentSearchType = type

  // Update UI
  if (type === "movie") {
    movieSearchBtn.classList.add("active")
    actorSearchBtn.classList.remove("active")
    search.placeholder = "Search for movies..."

    // Show genres section for movies
    document.querySelector(".genres-container").style.display = "block"

    // Hide person details if shown
    if (personDetailsContainer) {
      personDetailsContainer.style.display = "none"
    }

    // Always refresh to show movies when switching to movie tab
    getMovies(API_URL)
  } else {
    movieSearchBtn.classList.remove("active")
    actorSearchBtn.classList.add("active")
    search.placeholder = "Search for actors/actresses..."

    // Hide genres for actor search
    document.querySelector(".genres-container").style.display = "none"

    // Always refresh to show actors when switching to actor tab
    getPopularActors()
  }

  // Clear search suggestions
  searchSuggestions.innerHTML = ""
  searchSuggestions.classList.remove("active")

  // Hide sidebar after selection (on mobile and desktop)
  hideSidebar()
}

function showSidebar() {
  const isMobile = window.innerWidth <= 768

  if (isMobile) {
    sidebar.classList.add("expanded")
    sidebar.classList.remove("collapsed")
  } else {
    sidebar.classList.remove("collapsed")
    content.classList.remove("expanded")
  }
}

// Update the hideSidebar function to always hide sidebar regardless of screen size
function hideSidebar() {
  const isMobile = window.innerWidth <= 768

  if (isMobile) {
    sidebar.classList.remove("expanded")
  } else {
    sidebar.classList.add("collapsed")
    content.classList.add("expanded")
  }
}

// Check if we should start with collapsed sidebar on mobile
function checkScreenSize() {
  if (window.innerWidth <= 768) {
    sidebar.classList.remove("collapsed")
    sidebar.classList.remove("expanded")
    content.classList.remove("expanded")
  } else {
    // On desktop, start with sidebar visible
    sidebar.classList.remove("collapsed")
    content.classList.remove("expanded")
  }
}

// Run on page load and resize
window.addEventListener("resize", checkScreenSize)
checkScreenSize()

// Function to load user data from Firestore
async function loadUserData() {
  // Clear previous data first to prevent inheritance between users
  watchHistory = []
  favorites = []

  if (currentUser) {
    const userId = currentUser.uid

    try {
      // Get user document from Firestore
      const userDoc = await db.collection("users").doc(userId).get()

      if (userDoc.exists) {
        const userData = userDoc.data()

        // Load watch history from Firestore
        if (userData.watchHistory && userData.watchHistory.length > 0) {
          watchHistory = [...userData.watchHistory]

          // Sort by most recent first
          watchHistory.sort((a, b) => {
            const aTimestamp = a.timestamp || 0
            const bTimestamp = b.timestamp || 0
            return bTimestamp - aTimestamp
          })

          // Keep only the last 10 movies
          if (watchHistory.length > 10) {
            watchHistory = watchHistory.slice(0, 10)
          }

          // Store in localStorage with user-specific key
          localStorage.setItem(`watchHistory_${userId}`, JSON.stringify(watchHistory))
        } else {
          // Try to load from localStorage if Firestore is empty
          const localHistory = localStorage.getItem(`watchHistory_${userId}`)
          if (localHistory) {
            watchHistory = JSON.parse(localHistory)
          }
        }

        // Load favorites from Firestore
        if (userData.favorites && userData.favorites.length > 0) {
          favorites = [...userData.favorites]

          // Store in localStorage with user-specific key
          localStorage.setItem(`favorites_${userId}`, JSON.stringify(favorites))
        } else {
          // Try to load from localStorage if Firestore is empty
          const localFavorites = localStorage.getItem(`favorites_${userId}`)
          if (localFavorites) {
            favorites = JSON.parse(localFavorites)
          }
        }
      } else {
        // Create user document if it doesn't exist
        // First check if we have any local data for this user
        const localHistory = localStorage.getItem(`watchHistory_${userId}`)
        const localFavorites = localStorage.getItem(`favorites_${userId}`)

        if (localHistory) {
          watchHistory = JSON.parse(localHistory)
        }

        if (localFavorites) {
          favorites = JSON.parse(localFavorites)
        }

        // Create the user document with any existing data
        await db.collection("users").doc(userId).set({
          watchHistory: watchHistory,
          favorites: favorites,
          email: currentUser.email,
          lastUpdated: new Date(),
        })
      }
    } catch (error) {
      console.error("Error loading user data:", error)

      // Try to load from localStorage as fallback
      const localHistory = localStorage.getItem(`watchHistory_${userId}`)
      const localFavorites = localStorage.getItem(`favorites_${userId}`)

      if (localHistory) {
        watchHistory = JSON.parse(localHistory)
      }

      if (localFavorites) {
        favorites = JSON.parse(localFavorites)
      }
    }
  }

  // Update UI with loaded data
  updateHistoryUI()
  updateFavoritesUI()
}

// Function to save user data to Firestore
async function saveUserData() {
  if (!currentUser) return

  const userId = currentUser.uid

  try {
    await db.collection("users").doc(userId).update({
      watchHistory: watchHistory,
      favorites: favorites,
      lastUpdated: new Date(),
    })

    // Also update localStorage with user-specific keys
    localStorage.setItem(`watchHistory_${userId}`, JSON.stringify(watchHistory))
    localStorage.setItem(`favorites_${userId}`, JSON.stringify(favorites))
  } catch (error) {
    console.error("Error saving user data:", error)

    // Still update localStorage even if Firestore fails
    localStorage.setItem(`watchHistory_${userId}`, JSON.stringify(watchHistory))
    localStorage.setItem(`favorites_${userId}`, JSON.stringify(favorites))
  }
}

// Function to add a movie to watch history
async function addToHistory(movie) {
  if (!currentUser) return

  // Add timestamp to the movie object
  movie.timestamp = Date.now()

  // Remove the movie if it already exists in history
  watchHistory = watchHistory.filter((m) => m.id !== movie.id)

  // Add movie to the beginning of the array
  watchHistory.unshift(movie)

  // Keep only the last 10 movies
  if (watchHistory.length > 10) {
    watchHistory.pop()
  }

  // Save to Firestore and localStorage
  await saveUserData()

  // Update the UI
  updateHistoryUI()
}

// Function to remove a movie from watch history
async function removeFromHistory(movieId) {
  if (!currentUser) return

  watchHistory = watchHistory.filter((movie) => movie.id !== movieId)

  // Save to Firestore and localStorage
  await saveUserData()

  // Update the UI
  updateHistoryUI()
}

// Modify the toggleFavorite function to show sidebar when adding to favorites
async function toggleFavorite(movie) {
  if (!currentUser) return false

  const index = favorites.findIndex((m) => m.id === movie.id)
  let added = false

  if (index === -1) {
    // Add to favorites
    favorites.push(movie)
    added = true

    // Show sidebar when adding to favorites (optional enhancement)
    showSidebar()
  } else {
    // Remove from favorites
    favorites.splice(index, 1)
    added = false
  }

  // Save to Firestore and localStorage
  await saveUserData()

  // Update the UI
  updateFavoritesUI()

  // Update all favorite buttons for this movie
  updateAllFavoriteButtons(movie.id, added)

  return added // Return true if added, false if removed
}

// Function to remove a movie from favorites
async function removeFromFavorites(movieId) {
  if (!currentUser) return

  favorites = favorites.filter((movie) => movie.id !== movieId)

  // Save to Firestore and localStorage
  await saveUserData()

  // Update the UI
  updateFavoritesUI()

  // Update all favorite buttons for this movie
  updateAllFavoriteButtons(movieId, false)
}

// Check if a movie is in favorites
function isInFavorites(movieId) {
  return favorites.some((movie) => movie.id === movieId)
}

// Update the clearAllHistory function to use the custom modal
async function clearAllHistory() {
  if (!currentUser) return

  const confirmed = await showConfirmModal("Are you sure you want to clear all watch history?", "Clear Watch History")

  if (confirmed) {
    watchHistory = []

    // Save to Firestore and localStorage
    await saveUserData()

    updateHistoryUI()

    // Show toast notification
    showToast("Watch history cleared", "🗑️")
  }
}

// Update the clearAllFavorites function to use the custom modal
async function clearAllFavorites() {
  if (!currentUser) return

  const confirmed = await showConfirmModal("Are you sure you want to clear all favorites?", "Clear Favorites")

  if (confirmed) {
    favorites = []

    // Save to Firestore and localStorage
    await saveUserData()

    updateFavoritesUI()

    // Update all movie cards to show "Add Favorite" instead of "Remove Favorite"
    updateAllMovieCardFavoriteButtons()

    // Show toast notification
    showToast("Favorites cleared", "🗑️")
  }
}

// Update all movie card favorite buttons after clearing favorites
function updateAllMovieCardFavoriteButtons() {
  const allFavoriteButtons = document.querySelectorAll(".favorite-btn[data-id]")
  allFavoriteButtons.forEach((button) => {
    button.textContent = "Add Favorite"
    button.classList.remove("active")
  })
}

// Update the history list in the sidebar
function updateHistoryUI() {
  historyList.innerHTML = ""

  if (watchHistory.length === 0) {
    historyList.innerHTML = "<p>No watch history yet</p>"
    return
  }

  // Add clear all button
  const clearAllBtn = document.createElement("button")
  clearAllBtn.classList.add("clear-all-btn")
  clearAllBtn.textContent = "Clear All"
  clearAllBtn.addEventListener("click", clearAllHistory)
  historyList.appendChild(clearAllBtn)

  watchHistory.forEach((movie) => {
    const historyItem = document.createElement("div")
    historyItem.classList.add("sidebar-item")
    historyItem.innerHTML = `
            <img src="${movie.poster_path ? IMG_URL + movie.poster_path : "http://via.placeholder.com/40x60"}" alt="${movie.title}">
            <div class="sidebar-item-info">
                <div class="sidebar-item-title">${movie.title}</div>
                <div class="sidebar-item-actions">
                    <button class="watch-btn">Watch</button>
                    <button class="favorite-btn ${isInFavorites(movie.id) ? "active" : ""}">★</button>
                    <button class="remove-btn" data-id="${movie.id}">✕</button>
                </div>
            </div>
        `

    // Add event listeners
    historyItem.querySelector(".watch-btn").addEventListener("click", () => {
      openNav(movie)
    })

    historyItem.querySelector(".favorite-btn").addEventListener("click", (e) => {
      toggleFavorite(movie).then((added) => {
        e.target.classList.toggle("active", added)
      })
    })

    historyItem.querySelector(".remove-btn").addEventListener("click", (e) => {
      const movieId = Number.parseInt(e.target.getAttribute("data-id"))
      removeFromHistory(movieId)
    })

    historyList.appendChild(historyItem)
  })
}

// Update the favorites list in the sidebar
function updateFavoritesUI() {
  favoritesList.innerHTML = ""

  if (favorites.length === 0) {
    favoritesList.innerHTML = "<p>No favorites yet</p>"
    return
  }

  // Add clear all button
  const clearAllBtn = document.createElement("button")
  clearAllBtn.classList.add("clear-all-btn")
  clearAllBtn.textContent = "Clear All"
  clearAllBtn.addEventListener("click", clearAllFavorites)
  favoritesList.appendChild(clearAllBtn)

  favorites.forEach((movie) => {
    const favoriteItem = document.createElement("div")
    favoriteItem.classList.add("sidebar-item")
    favoriteItem.innerHTML = `
            <img src="${movie.poster_path ? IMG_URL + movie.poster_path : "http://via.placeholder.com/40x60"}" alt="${movie.title}">
            <div class="sidebar-item-info">
                <div class="sidebar-item-title">${movie.title}</div>
                <div class="sidebar-item-actions">
                    <button class="watch-btn">Watch</button>
                    <button class="favorite-btn active">★</button>
                    <button class="remove-btn" data-id="${movie.id}">✕</button>
                </div>
            </div>
        `

    // Add event listeners
    favoriteItem.querySelector(".watch-btn").addEventListener("click", () => {
      openNav(movie)
    })

    favoriteItem.querySelector(".favorite-btn").addEventListener("click", (e) => {
      toggleFavorite(movie).then(() => {
        e.target.classList.remove("active")
      })
    })

    favoriteItem.querySelector(".remove-btn").addEventListener("click", (e) => {
      const movieId = Number.parseInt(e.target.getAttribute("data-id"))
      removeFromFavorites(movieId)
    })

    favoritesList.appendChild(favoriteItem)
  })
}

// Search suggestions functionality
search.addEventListener("input", function () {
  const query = this.value.trim()

  // Clear previous timeout
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  // Hide suggestions if query is empty
  if (!query) {
    searchSuggestions.innerHTML = ""
    searchSuggestions.classList.remove("active")
    return
  }

  // Set a timeout to avoid making too many API calls
  searchTimeout = setTimeout(() => {
    if (currentSearchType === "movie") {
      fetchSearchSuggestions(query)
    } else {
      fetchPersonSuggestions(query)
    }
  }, 500) // Wait 500ms after user stops typing
})

// Close suggestions when clicking outside
document.addEventListener("click", (e) => {
  if (!search.contains(e.target) && !searchSuggestions.contains(e.target)) {
    searchSuggestions.classList.remove("active")
  }
})

// Fetch search suggestions from API
function fetchSearchSuggestions(query) {
  fetch(`${BASE_URL}/search/movie?${API_KEY}&query=${query}&page=1`)
    .then((res) => res.json())
    .then((data) => {
      if (data.results && data.results.length > 0) {
        // Store current suggestions for later use
        currentSuggestions = data.results.slice(0, 5) // Limit to 5 suggestions
        displaySearchSuggestions(currentSuggestions)
      } else {
        searchSuggestions.innerHTML = "<div class='suggestion-item'>No results found</div>"
        searchSuggestions.classList.add("active")
      }
    })
    .catch((err) => {
      console.error("Error fetching search suggestions:", err)
    })
}

// Fetch person/actor suggestions from API
function fetchPersonSuggestions(query) {
  fetch(`${searchPersonURL}&query=${query}&page=1`)
    .then((res) => res.json())
    .then((data) => {
      if (data.results && data.results.length > 0) {
        // Store current suggestions for later use
        currentSuggestions = data.results.slice(0, 5) // Limit to 5 suggestions
        displayPersonSuggestions(currentSuggestions)
      } else {
        searchSuggestions.innerHTML = "<div class='suggestion-item'>No actors/actresses found</div>"
        searchSuggestions.classList.add("active")
      }
    })
    .catch((err) => {
      console.error("Error fetching person suggestions:", err)
    })
}

// Display search suggestions in the dropdown
function displaySearchSuggestions(suggestions) {
  searchSuggestions.innerHTML = ""

  suggestions.forEach((movie) => {
    const { id, title, poster_path, vote_average, release_date } = movie
    const year = release_date ? new Date(release_date).getFullYear() : "Unknown"

    const suggestionItem = document.createElement("div")
    suggestionItem.classList.add("suggestion-item")
    suggestionItem.innerHTML = `
      <img src="${poster_path ? IMG_URL + poster_path : "http://via.placeholder.com/40x60"}" alt="${title}">
      <div class="suggestion-info">
        <div class="suggestion-title">${title}</div>
        <div class="suggestion-year">${year}</div>
      </div>
      <div class="suggestion-rating ${getColor(vote_average)}">${vote_average.toFixed(1)}</div>
    `

    // Add click event to select this suggestion
    suggestionItem.addEventListener("click", () => {
      selectMovieSuggestion(movie)
    })

    searchSuggestions.appendChild(suggestionItem)
  })
  searchSuggestions.classList.add("active")
}

// Display person suggestions in the dropdown
function displayPersonSuggestions(suggestions) {
  searchSuggestions.innerHTML = ""

  suggestions.forEach((person) => {
    const { id, name, profile_path, popularity, known_for } = person

    // Get the most popular movie they're known for
    const knownForTitle = known_for && known_for.length > 0 ? known_for[0].title || known_for[0].name : "Actor/Actress"

    const suggestionItem = document.createElement("div")
    suggestionItem.classList.add("suggestion-item")
    suggestionItem.innerHTML = `
      <img src="${profile_path ? IMG_URL + profile_path : "http://via.placeholder.com/40x60"}" alt="${name}" class="person-img">
      <div class="suggestion-info">
        <div class="suggestion-title">${name}</div>
        <div class="suggestion-year">Known for: ${knownForTitle}</div>
      </div>
      <div class="suggestion-popularity">${popularity.toFixed(1)}</div>
    `

    // Add click event to select this suggestion
    suggestionItem.addEventListener("click", () => {
      selectPersonSuggestion(person)
    })

    searchSuggestions.appendChild(suggestionItem)
  })
  searchSuggestions.classList.add("active")
}

// Update selectMovieSuggestion to hide sidebar after selection
function selectMovieSuggestion(movie) {
  // Set the search input to the selected movie title
  search.value = movie.title

  // Hide the suggestions
  searchSuggestions.classList.remove("active")

  // Show the selected movie details
  showMovieDetails(movie)

  // Hide sidebar after selection
  hideSidebar()
}

// Update selectPersonSuggestion to hide sidebar after selection
function selectPersonSuggestion(person) {
  // Set the search input to the selected person name
  search.value = person.name

  // Hide the suggestions
  searchSuggestions.classList.remove("active")

  // Fetch and show the person details and their movies
  fetchPersonDetails(person.id)

  // Hide sidebar after selection
  hideSidebar()
}

// Show details for a selected movie
function showMovieDetails(movie) {
  // Clear the main content
  main.innerHTML = ""

  // Display the selected movie
  showMovies([movie])

  // Add to watch history
  addToHistory(movie)
}

// Fetch person details and their movies
function fetchPersonDetails(personId) {
  // Show loading state
  main.innerHTML = `
    <div class="loading">
      <div class="loading-spinner"></div>
      <p>Loading actor details...</p>
    </div>
  `

  // Fetch person details
  fetch(`${personDetailsURL}${personId}?${API_KEY}&append_to_response=combined_credits`)
    .then((res) => res.json())
    .then((data) => {
      selectedPerson = data

      // Create person details section
      createPersonDetailsUI(data)

      // Get their movies from combined_credits
      if (data.combined_credits && data.combined_credits.cast) {
        // Filter to only movies (not TV shows) and sort by popularity
        const movies = data.combined_credits.cast
          .filter((item) => item.media_type === "movie")
          .sort((a, b) => b.popularity - a.popularity)

        // Show the movies
        showMovies(movies)
      } else {
        main.innerHTML += `<h2 class="no-results">No movies found for this actor</h2>`
      }
    })
    .catch((err) => {
      console.error("Error fetching person details:", err)
      main.innerHTML = `<h2 class="no-results">Error loading actor details</h2>`
    })
}

// Fix the createPersonDetailsUI function to correctly position the back button
function createPersonDetailsUI(person) {
  // Create person details container
  const personDetails = document.createElement("div")
  personDetails.classList.add("person-details")
  personDetails.id = "person-details"

  // Format birthday if available
  const birthday = person.birthday
    ? new Date(person.birthday).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Unknown"

  // Create HTML for person details with fixed back button position
  personDetails.innerHTML = `
    <div class="back-button" style="position: absolute; top: 80px; left: 20px; z-index: 10;">
      <button id="back-to-actors" style="background-color: var(--accent-color); color: white; border: none; padding: 8px 16px; border-radius: 50px; cursor: pointer; font-weight: bold; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2); transition: all 0.3s ease;">
        ← Back to Actors
      </button>
    </div>
    
    <div class="person-header">
      <div class="person-image">
        <img src="${person.profile_path ? IMG_URL + person.profile_path : "http://via.placeholder.com/300x450"}" 
             alt="${person.name}">
      </div>
      <div class="person-info">
        <h2 class="person-name">${person.name}</h2>
        <p class="person-department">${person.known_for_department || "Actor/Actress"}</p>
        
        <div class="person-meta">
          ${person.birthday ? `<span class="person-birthday">Born: ${birthday}</span>` : ""}
          ${person.place_of_birth ? `<span class="person-birthplace">in ${person.place_of_birth}</span>` : ""}
        </div>
        
        ${
          person.biography
            ? `
          <div class="person-bio">
            <h3>Biography</h3>
            <p>${person.biography}</p>
          </div>
        `
            : ""
        }
      </div>
    </div>
    
    <div class="person-filmography">
      <h3>Filmography</h3>
    </div>
  `

  // Clear main and add person details
  main.innerHTML = ""
  main.appendChild(personDetails)

  // Add event listener to back button
  document.getElementById("back-to-actors").addEventListener("click", () => {
    // Go back to actor grid
    getPopularActors(currentPage)
  })
}

// Enhanced genre setup
function setGenre() {
  tagsEl.innerHTML = ""

  // Sort genres alphabetically for better organization
  const sortedGenres = [...genres].sort((a, b) => a.name.localeCompare(b.name))

  sortedGenres.forEach((genre) => {
    const t = document.createElement("div")
    t.classList.add("tag")
    t.id = genre.id
    t.innerText = genre.name

    // Add animation delay for staggered appearance
    t.style.animationDelay = `${Math.random() * 0.5}s`

    t.addEventListener("click", () => {
      // Add animation class when clicked
      t.classList.add("clicked")

      // Remove the animation class after animation completes
      setTimeout(() => {
        t.classList.remove("clicked")
      }, 300)

      if (selectedGenre.length == 0) {
        selectedGenre.push(genre.id)
      } else {
        if (selectedGenre.includes(genre.id)) {
          selectedGenre.forEach((id, idx) => {
            if (id == genre.id) {
              selectedGenre.splice(idx, 1)
            }
          })
        } else {
          selectedGenre.push(genre.id)
        }
      }

      console.log(selectedGenre)
      getMovies(API_URL + "&with_genres=" + encodeURI(selectedGenre.join(",")))
      highlightSelection()

      // Scroll to results with smooth animation
      setTimeout(() => {
        main.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 500)
    })

    tagsEl.append(t)
  })

  updateClearButton()
}

function highlightSelection() {
  const tags = document.querySelectorAll(".tag")
  tags.forEach((tag) => {
    tag.classList.remove("highlight")
  })

  updateClearButton()

  if (selectedGenre.length != 0) {
    selectedGenre.forEach((id) => {
      const highlightedTag = document.getElementById(id)
      if (highlightedTag) {
        highlightedTag.classList.add("highlight")
      }
    })
  }
}

function updateClearButton() {
  clearGenresContainer.innerHTML = ""

  if (selectedGenre.length > 0) {
    const clearBtn = document.createElement("button")
    clearBtn.classList.add("clear-btn")
    clearBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
      Clear Filters (${selectedGenre.length})
    `

    clearBtn.addEventListener("click", () => {
      // Add animation to the button
      clearBtn.classList.add("clicked")

      // Clear with slight delay for animation
      setTimeout(() => {
        selectedGenre = []
        setGenre()
        getMovies(API_URL)
      }, 200)
    })

    clearGenresContainer.appendChild(clearBtn)
  }
}

function getMovies(url) {
  lastUrl = url

  // Show loading state
  main.innerHTML = `
    <div class="loading">
      <div class="loading-spinner"></div>
      <p>Loading movies...</p>
    </div>
  `

  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      console.log(data.results)
      if (data.results.length !== 0) {
        showMovies(data.results)
        currentPage = data.page
        nextPage = currentPage + 1
        prevPage = currentPage - 1
        totalPages = data.total_pages

        current.innerText = currentPage

        if (currentPage <= 1) {
          prev.classList.add("disabled")
          next.classList.remove("disabled")
        } else if (currentPage >= totalPages) {
          prev.classList.remove("disabled")
          next.classList.add("disabled")
        } else {
          prev.classList.remove("disabled")
          next.classList.remove("disabled")
        }
      } else {
        main.innerHTML = `<h1 class="no-results">No Results Found</h1>`
      }
    })
    .catch((err) => {
      main.innerHTML = `<h1 class="no-results">Error Loading Movies</h1>`
      console.error(err)
    })
}

// Function to update all favorite buttons for a movie
function updateAllFavoriteButtons(movieId, added) {
  const favoriteButtons = document.querySelectorAll(`.favorite-btn[data-id="${movieId}"]`)
  favoriteButtons.forEach((button) => {
    button.textContent = added ? "Remove Favorite" : "Add Favorite"
    button.classList.toggle("active", added)
  })
}

function showMovies(data) {
  // If we're showing a person's filmography, keep the person details at the top
  if (currentSearchType === "person" && selectedPerson) {
    // Only replace the filmography section
    const filmographySection = document.querySelector(".person-filmography")
    if (filmographySection) {
      filmographySection.innerHTML = `<h3>Filmography (${data.length} movies)</h3>`

      const moviesGrid = document.createElement("div")
      moviesGrid.classList.add("movies-grid")
      filmographySection.appendChild(moviesGrid)

      // Now show movies in the grid
      data.forEach((movie) => {
        const { title, poster_path, vote_average, overview, id, release_date } = movie
        const year = release_date ? new Date(release_date).getFullYear() : "Unknown"

        const movieEl = document.createElement("div")
        movieEl.classList.add("movie")
        movieEl.innerHTML = `
                 <img src="${poster_path ? IMG_URL + poster_path : "http://via.placeholder.com/1080x1580"}" alt="${title}">

                <div class="movie-info">
                    <h3>${title}</h3>
                    <span class="${getColor(vote_average)}">${vote_average.toFixed(1)}</span>
                </div>

                <div class="overview">
                    <h3>${title} ${year !== "Unknown" ? `(${year})` : ""}</h3>
                    <div class="overview-text">${overview || "No overview available."}</div>
                    <div class="overview-actions">
                        <button class="know-more" id="${id}">Watch Trailer</button>
                        <button class="favorite-btn ${isInFavorites(id) ? "active" : ""}" data-id="${id}">
                            ${isInFavorites(id) ? "Remove Favorite" : "Add Favorite"}
                        </button>
                    </div>
                </div>
            `

        moviesGrid.appendChild(movieEl)

        document.getElementById(id).addEventListener("click", () => {
          console.log(id)
          // Find the full movie object
          const movieObj = data.find((m) => m.id === id)
          if (movieObj) {
            // Add to watch history when "Know More" is clicked
            addToHistory(movieObj)
            openNav(movieObj)
          }
        })

        // Add favorite button functionality
        const favoriteBtn = movieEl.querySelector(`.favorite-btn[data-id="${id}"]`)
        favoriteBtn.addEventListener("click", () => {
          const movieObj = data.find((m) => m.id === id)
          if (movieObj) {
            toggleFavorite(movieObj).then((added) => {
              favoriteBtn.textContent = added ? "Remove Favorite" : "Add Favorite"
              favoriteBtn.classList.toggle("active", added)
            })
          }
        })
      })

      return
    }
  }

  // Regular movie display (not in person view)
  main.innerHTML = ""

  data.forEach((movie) => {
    const { title, poster_path, vote_average, overview, id, release_date } = movie
    const year = release_date ? new Date(release_date).getFullYear() : "Unknown"

    const movieEl = document.createElement("div")
    movieEl.classList.add("movie")
    movieEl.innerHTML = `
             <img src="${poster_path ? IMG_URL + poster_path : "http://via.placeholder.com/1080x1580"}" alt="${title}">

            <div class="movie-info">
                <h3>${title}</h3>
                <span class="${getColor(vote_average)}">${vote_average.toFixed(1)}</span>
            </div>

            <div class="overview">
                <h3>${title} ${year !== "Unknown" ? `(${year})` : ""}</h3>
                <div class="overview-text">${overview || "No overview available."}</div>
                <div class="overview-actions">
                    <button class="know-more" id="${id}">Watch Trailer</button>
                    <button class="favorite-btn ${isInFavorites(id) ? "active" : ""}" data-id="${id}">
                        ${isInFavorites(id) ? "Remove Favorite" : "Add Favorite"}
                    </button>
                </div>
            </div>
        `

    main.appendChild(movieEl)

    document.getElementById(id).addEventListener("click", () => {
      console.log(id)
      // Find the full movie object
      const movieObj = data.find((m) => m.id === id)
      if (movieObj) {
        // Add to watch history when "Know More" is clicked
        addToHistory(movieObj)
        openNav(movieObj)
      }
    })

    // Add favorite button functionality
    const favoriteBtn = movieEl.querySelector(`.favorite-btn[data-id="${id}"]`)
    favoriteBtn.addEventListener("click", () => {
      const movieObj = data.find((m) => m.id === id)
      if (movieObj) {
        toggleFavorite(movieObj).then((added) => {
          favoriteBtn.textContent = added ? "Remove Favorite" : "Add Favorite"
          favoriteBtn.classList.toggle("active", added)
        })
      }
    })
  })
}

const overlayContent = document.getElementById("overlay-content")
/* Open when someone clicks on the span element */
// Update the openNav function in script.js
function openNav(movie) {
  const id = movie.id
  const overlay = document.getElementById("myNav")

  // Start opening the overlay
  overlay.style.width = "100%"

  // Auto-hide sidebar when trailer plays
  hideSidebar()

  // Show loading indicator
  overlayContent.innerHTML = `
    <div class="loading">
      <h2>Loading trailer...</h2>
    </div>
  `

  fetch(BASE_URL + "/movie/" + id + "/videos?" + API_KEY)
    .then((res) => res.json())
    .then((videoData) => {
      console.log(videoData)
      if (videoData) {
        if (videoData.results.length > 0) {
          var embed = []
          var dots = []
          videoData.results.forEach((video, idx) => {
            const { name, key, site } = video

            if (site == "YouTube") {
              embed.push(`
              <iframe width="560" height="315" src="https://www.youtube.com/embed/${key}" title="${name}" class="embed hide" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
          
          `)

              dots.push(`
              <span class="dot">${idx + 1}</span>
            `)
            }
          })

          var content = `
        <h1 class="no-results">${movie.original_title || movie.title}</h1>
        <br/>
        
        ${embed.join("")}
        <br/>

        <div class="dots">${dots.join("")}</div>
        
        `
          overlayContent.innerHTML = content
          activeSlide = 0
          showVideos()
        } else {
          overlayContent.innerHTML = `<h1 class="no-results">No Trailers Found</h1>`
        }
      }
    })
    .catch((err) => {
      overlayContent.innerHTML = `<h1 class="no-results">Error Loading Trailers</h1>`
      console.error(err)
    })
}

/* Close when someone clicks on the "x" symbol inside the overlay */
function closeNav() {
  document.getElementById("myNav").style.width = "0%"

  // Find all iframes in the overlay and stop them from playing
  const iframes = document.querySelectorAll("#overlay-content iframe")
  iframes.forEach((iframe) => {
    // Get the current src
    const src = iframe.src
    // Reset the src to stop the video
    iframe.src = ""
    // Set it back after a brief moment (optional, only if you want to preserve the video source)
    setTimeout(() => {
      iframe.src = src.replace("autoplay=1", "autoplay=0")
    }, 100)
  })
}

var activeSlide = 0
var totalVideos = 0

function showVideos() {
  const embedClasses = document.querySelectorAll(".embed")
  const dots = document.querySelectorAll(".dot")

  totalVideos = embedClasses.length
  embedClasses.forEach((embedTag, idx) => {
    if (activeSlide == idx) {
      embedTag.classList.remove("hide")
      embedTag.classList.add("show")
    } else {
      embedTag.classList.remove("show")
      embedTag.classList.add("hide")
    }
  })

  dots.forEach((dot, indx) => {
    if (activeSlide == indx) {
      dot.classList.add("active")
    } else {
      dot.classList.remove("active")
    }
  })
}

const leftArrow = document.getElementById("left-arrow")
const rightArrow = document.getElementById("right-arrow")

leftArrow.addEventListener("click", () => {
  if (activeSlide > 0) {
    activeSlide--
  } else {
    activeSlide = totalVideos - 1
  }

  showVideos()
})

rightArrow.addEventListener("click", () => {
  if (activeSlide < totalVideos - 1) {
    activeSlide++
  } else {
    activeSlide = 0
  }
  showVideos()
})

function getColor(vote) {
  if (vote >= 8) {
    return "green"
  } else if (vote >= 5) {
    return "orange"
  } else {
    return "red"
  }
}

// Update form submit handler to hide sidebar after search
form.addEventListener("submit", (e) => {
  e.preventDefault()

  const searchTerm = search.value

  if (!searchTerm) {
    return
  }

  if (currentSearchType === "movie") {
    selectedGenre = []
    setGenre()
    getMovies(searchURL + "&query=" + searchTerm)
  } else {
    // Search for person/actor
    fetch(`${searchPersonURL}&query=${searchTerm}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.results && data.results.length > 0) {
          // Get the first person's details
          fetchPersonDetails(data.results[0].id)
        } else {
          main.innerHTML = `<h1 class="no-results">No Actors/Actresses Found</h1>`
        }
      })
      .catch((err) => {
        console.error("Error searching for person:", err)
        main.innerHTML = `<h1 class="no-results">Error Searching</h1>`
      })
  }

  // Hide sidebar after search
  hideSidebar()
})

prev.addEventListener("click", () => {
  if (prevPage > 0) {
    pageCall(prevPage)
  }
})

next.addEventListener("click", () => {
  if (nextPage <= totalPages) {
    pageCall(nextPage)
  }
})

function pageCall(page) {
  const urlSplit = lastUrl.split("?")
  const queryParams = urlSplit[1].split("&")
  const key = queryParams[queryParams.length - 1].split("=")
  if (key[0] != "page") {
    const url = lastUrl + "&page=" + page
    getMovies(url)
  } else {
    key[1] = page.toString()
    const a = key.join("=")
    queryParams[queryParams.length - 1] = a
    const b = queryParams.join("&")
    const url = urlSplit[0] + "?" + b
    getMovies(url)
  }
}

// Add this code to your script.js file

// Modify the getPopularActors function to show a grid of actors
function getPopularActors(page = 1) {
  // Show loading state
  main.innerHTML = `
    <div class="loading">
      <div class="loading-spinner"></div>
      <p>Loading actors...</p>
    </div>
  `

  fetch(`${BASE_URL}/person/popular?${API_KEY}&page=${page}`)
    .then((res) => res.json())
    .then((data) => {
      if (data.results && data.results.length > 0) {
        showActorGrid(data.results)

        // Update pagination
        currentPage = data.page
        nextPage = currentPage + 1
        prevPage = currentPage - 1
        totalPages = data.total_pages

        current.innerText = currentPage

        if (currentPage <= 1) {
          prev.classList.add("disabled")
          next.classList.remove("disabled")
        } else if (currentPage >= totalPages) {
          prev.classList.remove("disabled")
          next.classList.add("disabled")
        } else {
          prev.classList.remove("disabled")
          next.classList.remove("disabled")
        }
      } else {
        main.innerHTML = `<h1 class="no-results">No Actors Found</h1>`
      }
    })
    .catch((err) => {
      main.innerHTML = `<h1 class="no-results">Error Loading Actors</h1>`
      console.error(err)
    })
}

// Function to display actors in a grid
function showActorGrid(actors) {
  main.innerHTML = ""

  // Create actor grid container with proper wrapping
  const actorGrid = document.createElement("div")
  actorGrid.classList.add("actor-grid")
  actorGrid.style.display = "grid"
  actorGrid.style.gridTemplateColumns = "repeat(auto-fill, minmax(200px, 1fr))"
  actorGrid.style.gap = "20px"
  actorGrid.style.padding = "20px"
  actorGrid.style.width = "100%" // Ensure full width for proper wrapping

  actors.forEach((actor) => {
    const { id, name, profile_path, popularity, known_for_department } = actor

    // Get known for movies
    const knownForMovies = actor.known_for || []
    const knownForTitles = knownForMovies
      .map((movie) => movie.title || movie.name)
      .slice(0, 2)
      .join(", ")

    const actorEl = document.createElement("div")
    actorEl.classList.add("actor-card")
    actorEl.style.backgroundColor = "var(--card-bg)"
    actorEl.style.borderRadius = "8px"
    actorEl.style.overflow = "hidden"
    actorEl.style.boxShadow = "0 4px 15px rgba(0, 0, 0, 0.3)"
    actorEl.style.transition = "transform 0.3s ease, box-shadow 0.3s ease"
    actorEl.style.cursor = "pointer"

    actorEl.innerHTML = `
      <div class="actor-image" style="position: relative; height: 300px; overflow: hidden;">
        <img 
          src="${profile_path ? IMG_URL + profile_path : "http://via.placeholder.com/300x450"}" 
          alt="${name}"
          style="width: 100%; height: 100%; object-fit: cover; object-position: left; transition: filter 0.5s ease;"
        >
      </div>
      <div class="actor-info" style="padding: 12px;">
        <h3 style="margin: 0 0 5px; font-weight: 600;">${name}</h3>
        <p style="margin: 0; font-size: 0.9rem; color: var(--text-secondary);">${known_for_department}</p>
        ${knownForTitles ? `<p style="margin: 5px 0 0; font-size: 0.8rem; color: var(--accent-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Known for: ${knownForTitles}</p>` : ""}
      </div>
    `

    // Add hover effect
    actorEl.addEventListener("mouseenter", () => {
      actorEl.style.transform = "translateY(-5px) scale(1.02)"
      actorEl.style.boxShadow = "0 8px 25px rgba(0, 0, 0, 0.4)"
      actorEl.querySelector("img").style.filter = "brightness(0.7)"
    })

    actorEl.addEventListener("mouseleave", () => {
      actorEl.style.transform = ""
      actorEl.style.boxShadow = "0 4px 15px rgba(0, 0, 0, 0.3)"
      actorEl.querySelector("img").style.filter = ""
    })

    // Add click event to show actor details
    actorEl.addEventListener("click", () => {
      fetchPersonDetails(id)
    })

    actorGrid.appendChild(actorEl)
  })

  main.appendChild(actorGrid)
}

// Modify the setSearchType function to load popular actors when switching to actor search
const originalSetSearchType = setSearchType
setSearchType = (type) => {
  originalSetSearchType(type)

  if (type === "person" && !search.value.trim()) {
    getPopularActors()
  }
}

// Update pagination for actors
const originalPageCall = pageCall
pageCall = (page) => {
  if (currentSearchType === "person" && !search.value.trim()) {
    getPopularActors(page)
  } else {
    originalPageCall(page)
  }
}

// Add CSS for actor grid
const style = document.createElement("style")
style.textContent = `
  .actor-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 20px;
    padding: 20px;
    width: 100%;
  }
  
  @media (max-width: 768px) {
    .actor-grid {
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    }
    
    .actor-image {
      height: 225px !important;
    }
  }
`
document.head.appendChild(style)

// Add user profile and logout button to header
function addUserProfileToHeader() {
  const header = document.querySelector("header")
  const userFromStorage = JSON.parse(localStorage.getItem("user"))

  if (userFromStorage) {
    const userProfileContainer = document.createElement("div")
    userProfileContainer.classList.add("user-profile")
    userProfileContainer.style.display = "flex"
    userProfileContainer.style.alignItems = "center"
    userProfileContainer.style.marginLeft = "15px"

    userProfileContainer.innerHTML = `
      <div class="user-info" style="margin-right: 10px; color: var(--text-secondary);">
        ${userFromStorage.email}
      </div>
      <button id="logout-btn" style="background-color: var(--accent-color); color: white; border: none; padding: 5px 10px; border-radius: 50px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease;">
        Logout
      </button>
    `

    header.appendChild(userProfileContainer)

    // Add logout functionality
    document.getElementById("logout-btn").addEventListener("click", () => {
      window.signOutUser()
    })

    // Add hover effect for logout button
    const logoutBtn = document.getElementById("logout-btn")
    logoutBtn.addEventListener("mouseenter", () => {
      logoutBtn.style.backgroundColor = "rgba(255, 255, 255, 0.15)"
    })
    logoutBtn.addEventListener("mouseleave", () => {
      logoutBtn.style.backgroundColor = "var(--accent-color)"
    })
  }
}

// Wrap the existing initialization code in a function
async function initializeApp() {
  // Load user data from Firestore and localStorage
  await loadUserData()

  // Add user profile to header
  addUserProfileToHeader()

  // Continue with the rest of the initialization
  setGenre()
  getMovies(API_URL)
}

// Add this script to handle scroll behavior for the sticky header
document.addEventListener("DOMContentLoaded", () => {
  // This code will run after the authentication check
  const header = document.querySelector("header")
  let lastScrollTop = 0
  const overlay = document.getElementById("myNav")
  const personDetails = document.getElementById("person-details")

  // Function to handle scroll events
  function handleScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop

    // Add shadow effect when scrolled
    if (scrollTop > 10) {
      header.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.3)"
    } else {
      header.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.2)"
    }

    lastScrollTop = scrollTop
  }

  // Function to check if overlay is open
  function checkOverlayState() {
    // If overlay is open (width > 0), hide header
    if (overlay && overlay.style.width && overlay.style.width !== "0%") {
      header.style.display = "none"
    } else {
      header.style.display = "flex"
    }
  }

  // Add scroll event listener
  window.addEventListener("scroll", handleScroll)

  // Monitor overlay state
  const observeOverlay = new MutationObserver(checkOverlayState)
  if (overlay) {
    observeOverlay.observe(overlay, { attributes: true, attributeFilter: ["style"] })
  }

  // Add event listeners for overlay open/close
  document.addEventListener("click", (e) => {
    // Check if the trailer button was clicked
    if (e.target && e.target.classList.contains("know-more")) {
      // Hide header when trailer is opened
      setTimeout(() => {
        header.style.display = "none"
      }, 100)
    }

    // Check if the overlay close button was clicked
    if (e.target && e.target.classList.contains("closebtn")) {
      // Show header when overlay is closed
      setTimeout(() => {
        header.style.display = "flex"
      }, 500) // Wait for overlay transition
    }
  })

  // Handle actor detail view
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length) {
        // Check if person details were added to the DOM
        if (document.getElementById("person-details")) {
          // Add padding to person details to prevent header overlap
          const personDetails = document.getElementById("person-details")
          if (personDetails) {
            const backButton = personDetails.querySelector(".back-button")
            if (backButton) {
              // Adjust the back button position based on header height
              const headerHeight = header.offsetHeight
              backButton.style.top = `${headerHeight + 10}px`

              // Also adjust on window resize
              window.addEventListener("resize", () => {
                const headerHeight = header.offsetHeight
                backButton.style.top = `${headerHeight + 10}px`
              })
            }
          }
        }
      }
    })
  })

  // Observe the main content for changes
  observer.observe(document.getElementById("main"), { childList: true, subtree: true })
})

// Modify the signOutUser function to preserve user-specific data
window.signOutUser = () => {
  // We don't need to clear user-specific localStorage data when logging out
  // This ensures data persists between login sessions for the same user

  // Clear general user data
  localStorage.removeItem("user")

  // Sign out from Firebase
  window.firebaseAuth
    .signOut()
    .then(() => {
      window.location.href = "login.html"
    })
    .catch((error) => {
      console.error("Sign out error:", error)
      // Force redirect even if there's an error
      window.location.href = "login.html"
    })
}

// Toast notification function
function showToast(message, icon = "✓") {
  // Remove any existing toast
  const existingToast = document.querySelector(".toast")
  if (existingToast) {
    existingToast.remove()
  }

  // Create new toast
  const toast = document.createElement("div")
  toast.className = "toast"
  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span>${message}</span>
  `

  document.body.appendChild(toast)

  // Show the toast
  setTimeout(() => {
    toast.classList.add("show")
  }, 10)

  // Hide the toast after 3 seconds
  setTimeout(() => {
    toast.classList.remove("show")
    setTimeout(() => {
      toast.remove()
    }, 300)
  }, 3000)
}
