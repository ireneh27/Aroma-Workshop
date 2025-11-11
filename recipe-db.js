// Recipe Database Module
// Manages recipe storage, CRUD operations, and data persistence

const RecipeDB = {
    // Storage keys
    DB_KEY: 'eo_recipes_v1',
    LIST_KEY: 'eo_lists_v1',
    
    // Default inventory lists (empty by default)
    DEFAULTS: {
        oils: [],
        carriers: [],
        solvents: []
    },
    
    // Load recipes from localStorage
    loadRecipes() {
        try {
            const data = localStorage.getItem(this.DB_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error loading recipes:', e);
            return [];
        }
    },
    
    // Save recipes to localStorage
    saveRecipes(recipes) {
        try {
            localStorage.setItem(this.DB_KEY, JSON.stringify(recipes));
            return true;
        } catch (e) {
            console.error('Error saving recipes:', e);
            return false;
        }
    },
    
    // Load inventory lists
    loadLists() {
        try {
            const data = localStorage.getItem(this.LIST_KEY);
            const saved = data ? JSON.parse(data) : {};
            return Object.assign({}, this.DEFAULTS, saved);
        } catch (e) {
            return Object.assign({}, this.DEFAULTS);
        }
    },
    
    // Save inventory lists
    saveLists(lists) {
        try {
            localStorage.setItem(this.LIST_KEY, JSON.stringify(lists));
            return true;
        } catch (e) {
            console.error('Error saving lists:', e);
            return false;
        }
    },
    
    // Add a recipe
    addRecipe(recipe) {
        const recipes = this.loadRecipes();
        if (!recipe.id) {
            recipe.id = crypto.randomUUID();
        }
        recipe.updatedAt = new Date().toISOString();
        recipes.unshift(recipe);
        this.saveRecipes(recipes);
        return recipe;
    },
    
    // Update a recipe
    updateRecipe(recipe) {
        const recipes = this.loadRecipes();
        const index = recipes.findIndex(r => r.id === recipe.id);
        if (index >= 0) {
            recipe.updatedAt = new Date().toISOString();
            recipes[index] = recipe;
            this.saveRecipes(recipes);
            return true;
        }
        return false;
    },
    
    // Delete a recipe
    deleteRecipe(id) {
        const recipes = this.loadRecipes();
        const filtered = recipes.filter(r => r.id !== id);
        this.saveRecipes(filtered);
        return recipes.length !== filtered.length;
    },
    
    // Get a recipe by ID
    getRecipe(id) {
        const recipes = this.loadRecipes();
        return recipes.find(r => r.id === id);
    },
    
    // Get all recipes
    getAllRecipes() {
        return this.loadRecipes();
    },
    
    // Search recipes
    searchRecipes(query, filterOil = '') {
        const recipes = this.loadRecipes();
        const q = query.trim().toLowerCase();
        
        return recipes.filter(r => {
            const hay = (r.name + '\n' + r.purpose + '\n' + r.notes + '\n' + 
                        (r.oils || []).map(o => o.name + o.note).join('\n')).toLowerCase();
            const hitQ = !q || hay.includes(q);
            const hitOil = !filterOil || (r.oils || []).some(o => o.name === filterOil);
            return hitQ && hitOil;
        });
    },
    
    // Export recipes as JSON
    exportJSON() {
        const recipes = this.loadRecipes();
        const lists = this.loadLists();
        return JSON.stringify({ recipes, lists }, null, 2);
    },
    
    // Import recipes from JSON
    importJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (data.recipes) {
                this.saveRecipes(data.recipes);
            }
            if (data.lists) {
                const lists = Object.assign({}, this.DEFAULTS, data.lists);
                this.saveLists(lists);
            }
            return true;
        } catch (e) {
            console.error('Error importing JSON:', e);
            return false;
        }
    },
    
    // Clear all recipes
    clearAll() {
        this.saveRecipes([]);
        this.saveLists(Object.assign({}, this.DEFAULTS));
    }
};

