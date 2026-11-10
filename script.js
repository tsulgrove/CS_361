/* Recipe Book demo: one profile and its recipes saved in this browser.
   GitHub Pages-compatible. No real login, database, or cross-device sharing. */
'use strict';

const STORAGE_KEY = 'recipe-book.profile.v1';
const RECIPES_STORAGE_KEY = 'recipe-book.recipes.v1';
const RECIPE_CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'Drink', 'Other'];
const MAX_BIO_LENGTH = 240;
const ALLOWED_CUISINES = ['American', 'Italian', 'Mexican', 'Asian', 'Mediterranean', 'Indian', 'Other / a little of everything'];
const ALLOWED_EXPERIENCE = ['Just getting started', 'Home cook', 'Experienced cook'];

function getProfile() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const profile = JSON.parse(raw);
    if (!profile || typeof profile !== 'object') return null;
    if (typeof profile.displayName !== 'string' || typeof profile.username !== 'string') return null;
    return profile;
  } catch (error) {
    console.warn('Unable to read saved profile:', error);
    return null;
  }
}

function saveProfile(profile) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    return true;
  } catch (error) {
    console.error('Unable to save profile:', error);
    return false;
  }
}

function getRecipes() {
  try {
    const raw = window.localStorage.getItem(RECIPES_STORAGE_KEY);
    if (!raw) return [];
    const recipes = JSON.parse(raw);
    if (!Array.isArray(recipes)) return [];
    // Ignore malformed records instead of allowing them to break the page.
    return recipes.filter((recipe) => recipe && typeof recipe === 'object' &&
      typeof recipe.id === 'string' && typeof recipe.title === 'string' &&
      typeof recipe.ingredients === 'string' && typeof recipe.instructions === 'string');
  } catch (error) {
    console.warn('Unable to read locally saved recipes:', error);
    return [];
  }
}

function saveRecipes(recipes) {
  try {
    window.localStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify(recipes));
    return true;
  } catch (error) {
    console.error('Unable to save recipes:', error);
    return false;
  }
}

function addTextElement(parent, tag, className, content) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = content;
  parent.appendChild(element);
  return element;
}

function renderProfileRecipes() {
  const section = document.getElementById('my-recipes-section');
  if (!section) return;
  const profile = getProfile();
  section.hidden = !profile;
  if (!profile) return;

  const recipes = getRecipes().slice().sort((a, b) =>
    (b.createdAt || '').localeCompare(a.createdAt || ''));
  const list = document.getElementById('recipes-list');
  list.replaceChildren();
  document.getElementById('recipe-count').textContent =
    `${recipes.length} ${recipes.length === 1 ? 'recipe' : 'recipes'} saved`;
  document.getElementById('recipes-empty').hidden = recipes.length !== 0;

  recipes.forEach((recipe) => {
    const card = document.createElement('article');
    card.className = 'user-recipe-card';
    addTextElement(card, 'span', 'recipe-category', recipe.category || 'Other');
    addTextElement(card, 'h3', '', recipe.title);
    if (recipe.description) addTextElement(card, 'p', 'user-recipe-description', recipe.description);

    const metadata = [];
    if (recipe.prepMinutes !== '' && recipe.prepMinutes != null) metadata.push(`Prep: ${recipe.prepMinutes} min`);
    if (recipe.cookMinutes !== '' && recipe.cookMinutes != null) metadata.push(`Cook: ${recipe.cookMinutes} min`);
    if (recipe.servings !== '' && recipe.servings != null) metadata.push(`Serves: ${recipe.servings}`);
    if (metadata.length) addTextElement(card, 'p', 'user-recipe-meta', metadata.join('  ·  '));

    const details = document.createElement('details');
    details.className = 'recipe-details';
    addTextElement(details, 'summary', '', 'View recipe');
    const detailBody = document.createElement('div');
    detailBody.className = 'recipe-detail-body';
    addTextElement(detailBody, 'h4', '', 'Ingredients');
    addTextElement(detailBody, 'p', 'recipe-multiline', recipe.ingredients);
    addTextElement(detailBody, 'h4', '', 'Instructions');
    addTextElement(detailBody, 'p', 'recipe-multiline', recipe.instructions);
    details.appendChild(detailBody);
    card.appendChild(details);

    const actions = document.createElement('div');
    actions.className = 'recipe-card-actions';
    const editLink = addTextElement(actions, 'a', 'button button-outline button-small', 'Edit');
    editLink.href = `recipe.html?edit=${encodeURIComponent(recipe.id)}`;
    const deleteButton = addTextElement(actions, 'button', 'button button-danger-outline button-small', 'Delete');
    deleteButton.type = 'button';
    deleteButton.dataset.deleteRecipe = recipe.id;
    card.appendChild(actions);
    list.appendChild(card);
  });
}

function updateNavigation() {
  const profile = getProfile();
  document.querySelectorAll('[data-profile-cta]').forEach((link) => {
    // Keep the large home-page CTA friendly to returning users.
    const isLarge = link.classList.contains('button-large');
    if (profile) {
      link.textContent = isLarge ? 'View your profile →' : 'My profile';
    } else {
      link.textContent = isLarge ? 'Create your profile →' : 'Create profile';
    }
  });
  document.querySelectorAll('[data-recipe-cta]').forEach((link) => {
    link.hidden = !profile;
  });
}

function updateHome() {
  const panel = document.getElementById('welcome-back');
  if (!panel) return;
  const profile = getProfile();
  panel.hidden = !profile;
  if (profile) document.getElementById('welcome-name').textContent = profile.displayName;
}

function initializeProfilePage() {
  const form = document.getElementById('profile-form');
  if (!form) return;

  const formPanel = document.getElementById('profile-form-panel');
  const viewPanel = document.getElementById('profile-view-panel');
  const heading = document.getElementById('profile-page-title');
  const subtitle = document.getElementById('profile-page-subtitle');
  const formHeading = document.getElementById('form-heading');
  const saveButton = document.getElementById('save-profile-button');
  const cancelButton = document.getElementById('cancel-edit');
  const message = document.getElementById('profile-message');
  const bio = document.getElementById('bio');
  const bioCount = document.getElementById('bio-count');

  function showMessage(text, isError = false) {
    message.textContent = text;
    message.classList.toggle('error', isError);
    message.hidden = false;
  }

  function clearMessage() {
    message.hidden = true;
    message.textContent = '';
  }

  function showForm(editing = false) {
    const profile = getProfile();
    formPanel.hidden = false;
    viewPanel.hidden = true;
    const recipesSection = document.getElementById('my-recipes-section');
    if (recipesSection) recipesSection.hidden = true;
    heading.textContent = editing ? 'Edit your profile.' : 'Create your profile.';
    subtitle.textContent = editing ? 'Make your details feel like you.' : "Before the recipes, let's get to know the cook.";
    formHeading.textContent = editing ? 'Update your details' : 'Tell us about yourself';
    saveButton.textContent = editing ? 'Save changes →' : 'Create profile →';
    cancelButton.hidden = !editing;
    form.reset();
    if (editing && profile) {
      form.elements.displayName.value = profile.displayName || '';
      form.elements.username.value = profile.username || '';
      form.elements.bio.value = profile.bio || '';
      form.elements.cuisine.value = profile.cuisine || '';
      form.elements.experience.value = profile.experience || '';
    }
    updateBioCount();
  }

  function showProfile() {
    const profile = getProfile();
    if (!profile) {
      showForm();
      return;
    }
    formPanel.hidden = true;
    viewPanel.hidden = false;
    heading.textContent = 'Your profile.';
    subtitle.textContent = 'Your own place in the Recipe Book community.';
    document.getElementById('view-heading').textContent = profile.displayName;
    document.getElementById('view-username').textContent = '@' + profile.username;
    document.getElementById('profile-avatar').textContent = profile.displayName.charAt(0).toUpperCase();
    document.getElementById('view-bio').textContent = profile.bio || 'No bio yet. Add one by editing your profile.';
    document.getElementById('view-cuisine').textContent = profile.cuisine || 'Not specified';
    document.getElementById('view-experience').textContent = profile.experience || 'Not specified';
    renderProfileRecipes();
  }

  function updateBioCount() {
    bioCount.textContent = `${bio.value.length} / ${MAX_BIO_LENGTH}`;
  }

  bio.addEventListener('input', updateBioCount);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearMessage();
    if (!form.reportValidity()) return;

    const displayName = form.elements.displayName.value.trim();
    const username = form.elements.username.value.trim();
    const bioText = form.elements.bio.value.trim();
    const cuisine = form.elements.cuisine.value;
    const experience = form.elements.experience.value;

    if (!displayName || displayName.length > 50 || !/^[A-Za-z0-9_]{3,20}$/.test(username) || bioText.length > MAX_BIO_LENGTH || (cuisine && !ALLOWED_CUISINES.includes(cuisine)) || (experience && !ALLOWED_EXPERIENCE.includes(experience))) {
      showMessage('Please check the form fields and try again.', true);
      return;
    }

    const existed = Boolean(getProfile());
    const profile = { displayName, username, bio: bioText, cuisine, experience };
    if (!saveProfile(profile)) {
      showMessage('Unable to save on this device. Check your browser storage settings and try again.', true);
      return;
    }
    showProfile();
    updateNavigation();
    showMessage(existed ? 'Your profile was updated on this device.' : 'Your profile was created on this device.');
  });

  document.getElementById('edit-profile').addEventListener('click', () => {
    clearMessage();
    showForm(true);
    document.getElementById('display-name').focus();
  });

  cancelButton.addEventListener('click', () => {
    clearMessage();
    showProfile();
  });

  document.getElementById('delete-profile').addEventListener('click', () => {
    if (!window.confirm('Delete your local profile AND all saved recipes? This cannot be undone.')) return;
    try {
      window.localStorage.removeItem(RECIPES_STORAGE_KEY);
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      showMessage('Unable to delete the profile from browser storage.', true);
      return;
    }
    showForm();
    updateNavigation();
    showMessage('Your local profile and recipes were deleted.');
  });

  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) {
      updateNavigation();
      clearMessage();
      showProfile();
    } else if (event.key === RECIPES_STORAGE_KEY) {
      renderProfileRecipes();
    }
  });

  document.getElementById('recipes-list').addEventListener('click', (event) => {
    const button = event.target.closest('[data-delete-recipe]');
    if (!button) return;
    const recipeId = button.dataset.deleteRecipe;
    const recipe = getRecipes().find((item) => item.id === recipeId);
    if (!recipe) return;
    if (!window.confirm(`Delete "${recipe.title}"? This cannot be undone.`)) return;
    if (!saveRecipes(getRecipes().filter((item) => item.id !== recipeId))) {
      showMessage('Could not delete that recipe. Check your browser storage settings.', true);
      return;
    }
    renderProfileRecipes();
    showMessage('Recipe deleted from this browser.');
  });

  // Show a confirmation after returning from the recipe form.
  try {
    const flashMessage = window.sessionStorage.getItem('recipe-book.recipe-flash');
    if (flashMessage) {
      window.sessionStorage.removeItem('recipe-book.recipe-flash');
      showMessage(flashMessage);
    }
  } catch (error) { /* Session storage may be disabled; recipes still work. */ }

  if (getProfile()) showProfile();
  else showForm();
}

function initializeRecipePage() {
  const form = document.getElementById('recipe-form');
  if (!form) return;
  const formPanel = document.getElementById('recipe-form-panel');
  const requiredPanel = document.getElementById('recipe-profile-required');
  const pageTitle = document.getElementById('recipe-page-title');
  const pageSubtitle = document.getElementById('recipe-page-subtitle');
  const saveButton = document.getElementById('save-recipe-button');
  const message = document.getElementById('recipe-message');

  function showError(text) {
    message.textContent = text;
    message.classList.add('error');
    message.hidden = false;
  }

  if (!getProfile()) {
    requiredPanel.hidden = false;
    return;
  }

  const recipeId = new URLSearchParams(window.location.search).get('edit');
  const existing = recipeId ? getRecipes().find((r) => r.id === recipeId) : null;
  if (recipeId && !existing) {
    showError('That recipe could not be found in this browser. Return to your profile to choose a recipe.');
    return;
  }

  formPanel.hidden = false;
  if (existing) {
    pageTitle.textContent = 'Edit your recipe.';
    pageSubtitle.textContent = 'Update the details of your saved recipe.';
    saveButton.textContent = 'Save changes →';
    document.title = 'Recipe Book | Edit Recipe';
    for (const name of ['title', 'category', 'description', 'servings', 'prepMinutes', 'cookMinutes', 'ingredients', 'instructions']) {
      form.elements[name].value = existing[name] ?? '';
    }
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    message.hidden = true;
    if (!form.reportValidity()) return;
    if (!getProfile()) {
      showError('Your profile is missing. Create a profile before saving recipes.');
      return;
    }

    const title = form.elements.title.value.trim();
    const category = form.elements.category.value;
    const description = form.elements.description.value.trim();
    const ingredients = form.elements.ingredients.value.trim();
    const instructions = form.elements.instructions.value.trim();
    const prepMinutes = form.elements.prepMinutes.value;
    const cookMinutes = form.elements.cookMinutes.value;
    const servings = form.elements.servings.value;

    function validNumber(value, min, max) {
      return value === '' || (Number.isInteger(Number(value)) && Number(value) >= min && Number(value) <= max);
    }
    if (!title || title.length > 100 || !RECIPE_CATEGORIES.includes(category) ||
        description.length > 400 || !ingredients || ingredients.length > 5000 ||
        !instructions || instructions.length > 10000 ||
        !validNumber(prepMinutes, 0, 999) || !validNumber(cookMinutes, 0, 999) ||
        !validNumber(servings, 1, 99)) {
      showError('Please fill out the required fields and check the recipe details.');
      return;
    }

    const recipes = getRecipes();
    // Check again to avoid recreating a deleted recipe from a stale edit tab.
    if (existing && !recipes.some((item) => item.id === existing.id)) {
      showError('This recipe was deleted in another tab. Please return to your profile.');
      return;
    }
    const now = new Date().toISOString();
    const recipe = {
      id: existing ? existing.id : (window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`),
      title, category, description, servings, prepMinutes, cookMinutes,
      ingredients, instructions,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now
    };
    const updatedRecipes = existing
      ? recipes.map((item) => item.id === existing.id ? recipe : item)
      : [...recipes, recipe];
    if (!saveRecipes(updatedRecipes)) {
      showError('Unable to save the recipe in this browser. Check storage permissions or available space.');
      return;
    }

    try {
      window.sessionStorage.setItem('recipe-book.recipe-flash', existing ? 'Recipe updated successfully.' : 'Recipe saved successfully.');
    } catch (error) { /* Confirmation message is optional. */ }
    window.location.assign('profile.html#my-recipes-section');
  });
}

document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
updateNavigation();
updateHome();
initializeProfilePage();
initializeRecipePage();
window.addEventListener('storage', (event) => {
  if (event.key === STORAGE_KEY) { updateNavigation(); updateHome(); }
});
