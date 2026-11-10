# Recipe Book — GitHub Pages starter

A small HTML/CSS/JavaScript website with a home page, one local cooking profile, and locally saved recipes. No framework or build step is required.

## What's included

- `index.html` — your centered home page
- `profile.html` — create/edit/delete a profile, view your recipes, expand ingredients and instructions, edit/delete recipes
- `recipe.html` — create and edit recipes (name, category, description, servings, prep/cook time, ingredients, instructions)
- `styles.css` — original cream-and-green styling plus recipe cards and mobile styles
- `script.js` — profile and recipe persistence using browser `localStorage`
- `favicon.svg` — simple site icon

## Run locally

In this directory on Windows, run:

```cmd
py -m http.server 8000
```

Then visit http://localhost:8000 and open **My profile**. Create a profile first, then select **Add recipe**.

## Publish to GitHub Pages

Upload all files to the root of your repository. Under repository **Settings → Pages**, select **Deploy from a branch**, `main`, `/(root)`, and save. The pages use relative links and will work in a GitHub Pages project repository.

## Storage limitations

This is still a **local demo**, not a multi-user application. A single profile is stored under the localStorage key `recipe-book.profile.v1`, and its recipe list under `recipe-book.recipes.v1`. Data stays within the same browser and site origin, cannot be accessed from another device or browser, and can be lost when browser storage is cleared. GitHub Pages cannot serve as an application database or authenticate users by itself. For shared accounts and public recipes, add a managed backend with authentication (for example, Supabase or Firebase).

Deleting the local profile also deletes its saved recipes. Export or copy any recipes you want to keep before deleting your profile or clearing the browser's site data.
