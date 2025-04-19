export type FoodItem = {
  id: string;
  name: string;
  portion: string;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
};

// Database of common foods with nutritional values calculated per specified portion
export const foodItems: FoodItem[] = [
  {
    id: "yogurt-greco",
    name: "Greek yogurt",
    portion: "150g",
    calories: 145,
    proteins: 15,
    carbs: 6,
    fats: 5
  },
  {
    id: "petto-di-pollo",
    name: "Chicken breast",
    portion: "100g",
    calories: 165,
    proteins: 31,
    carbs: 0,
    fats: 4
  },
  {
    id: "uova",
    name: "Eggs",
    portion: "2 medium eggs (100g)",
    calories: 155,
    proteins: 13,
    carbs: 1,
    fats: 11
  },
  {
    id: "pasta",
    name: "Durum wheat pasta",
    portion: "80g (dry)",
    calories: 280,
    proteins: 10,
    carbs: 56,
    fats: 1
  },
  {
    id: "riso",
    name: "White rice",
    portion: "80g (dry)",
    calories: 290,
    proteins: 5,
    carbs: 64,
    fats: 1
  },
  {
    id: "pane",
    name: "Whole wheat bread",
    portion: "50g (1 slice)",
    calories: 120,
    proteins: 5,
    carbs: 20,
    fats: 2
  },
  {
    id: "salmone",
    name: "Salmon",
    portion: "100g",
    calories: 208,
    proteins: 20,
    carbs: 0,
    fats: 13
  },
  {
    id: "tonno",
    name: "Canned tuna in water",
    portion: "100g (drained)",
    calories: 116,
    proteins: 26,
    carbs: 0,
    fats: 1
  },
  {
    id: "avocado",
    name: "Avocado",
    portion: "1 medium (150g)",
    calories: 240,
    proteins: 3,
    carbs: 12,
    fats: 22
  },
  {
    id: "banana",
    name: "Banana",
    portion: "1 medium (120g)",
    calories: 105,
    proteins: 1,
    carbs: 27,
    fats: 0
  },
  {
    id: "mela",
    name: "Apple",
    portion: "1 medium (150g)",
    calories: 80,
    proteins: 0,
    carbs: 21,
    fats: 0
  },
  {
    id: "mandorle",
    name: "Almonds",
    portion: "30g",
    calories: 174,
    proteins: 6,
    carbs: 6,
    fats: 15
  },
  {
    id: "latte",
    name: "Semi-skimmed milk",
    portion: "250ml",
    calories: 115,
    proteins: 8,
    carbs: 12,
    fats: 4
  },
  {
    id: "olio-oliva",
    name: "Olive oil",
    portion: "1 tablespoon (15ml)",
    calories: 120,
    proteins: 0,
    carbs: 0,
    fats: 14
  },
  {
    id: "spinaci",
    name: "Spinach",
    portion: "100g (raw)",
    calories: 23,
    proteins: 3,
    carbs: 4,
    fats: 0
  },
  {
    id: "patate",
    name: "Potatoes",
    portion: "150g (boiled)",
    calories: 130,
    proteins: 3,
    carbs: 30,
    fats: 0
  },
  {
    id: "riso-integrale",
    name: "Brown rice",
    portion: "80g (dry)",
    calories: 280,
    proteins: 6,
    carbs: 59,
    fats: 2
  },
  {
    id: "mozzarella",
    name: "Mozzarella",
    portion: "100g",
    calories: 280,
    proteins: 22,
    carbs: 2,
    fats: 22
  },
  {
    id: "quinoa",
    name: "Quinoa",
    portion: "80g (dry)",
    calories: 280,
    proteins: 10,
    carbs: 51,
    fats: 4
  },
  {
    id: "burger-vegetale",
    name: "Veggie burger",
    portion: "100g",
    calories: 240,
    proteins: 16,
    carbs: 10,
    fats: 17
  }
];