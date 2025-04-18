export type FoodItem = {
  id: string;
  name: string;
  portion: string;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
};

// Database di alimenti comuni con valori nutrizionali calcolati per porzione specificata
export const foodItems: FoodItem[] = [
  {
    id: "yogurt-greco",
    name: "Yogurt greco",
    portion: "150g",
    calories: 145,
    proteins: 15,
    carbs: 6,
    fats: 5
  },
  {
    id: "petto-di-pollo",
    name: "Petto di pollo",
    portion: "100g",
    calories: 165,
    proteins: 31,
    carbs: 0,
    fats: 4
  },
  {
    id: "uova",
    name: "Uova",
    portion: "2 uova medie (100g)",
    calories: 155,
    proteins: 13,
    carbs: 1,
    fats: 11
  },
  {
    id: "pasta",
    name: "Pasta di grano duro",
    portion: "80g (secco)",
    calories: 280,
    proteins: 10,
    carbs: 56,
    fats: 1
  },
  {
    id: "riso",
    name: "Riso bianco",
    portion: "80g (secco)",
    calories: 290,
    proteins: 5,
    carbs: 64,
    fats: 1
  },
  {
    id: "pane",
    name: "Pane integrale",
    portion: "50g (1 fetta)",
    calories: 120,
    proteins: 5,
    carbs: 20,
    fats: 2
  },
  {
    id: "salmone",
    name: "Salmone",
    portion: "100g",
    calories: 208,
    proteins: 20,
    carbs: 0,
    fats: 13
  },
  {
    id: "tonno",
    name: "Tonno in scatola al naturale",
    portion: "100g (sgocciolato)",
    calories: 116,
    proteins: 26,
    carbs: 0,
    fats: 1
  },
  {
    id: "avocado",
    name: "Avocado",
    portion: "1 medio (150g)",
    calories: 240,
    proteins: 3,
    carbs: 12,
    fats: 22
  },
  {
    id: "banana",
    name: "Banana",
    portion: "1 media (120g)",
    calories: 105,
    proteins: 1,
    carbs: 27,
    fats: 0
  },
  {
    id: "mela",
    name: "Mela",
    portion: "1 media (150g)",
    calories: 80,
    proteins: 0,
    carbs: 21,
    fats: 0
  },
  {
    id: "mandorle",
    name: "Mandorle",
    portion: "30g",
    calories: 174,
    proteins: 6,
    carbs: 6,
    fats: 15
  },
  {
    id: "latte",
    name: "Latte parzialmente scremato",
    portion: "250ml",
    calories: 115,
    proteins: 8,
    carbs: 12,
    fats: 4
  },
  {
    id: "olio-oliva",
    name: "Olio d'oliva",
    portion: "1 cucchiaio (15ml)",
    calories: 120,
    proteins: 0,
    carbs: 0,
    fats: 14
  },
  {
    id: "spinaci",
    name: "Spinaci",
    portion: "100g (crudi)",
    calories: 23,
    proteins: 3,
    carbs: 4,
    fats: 0
  },
  {
    id: "patate",
    name: "Patate",
    portion: "150g (bollite)",
    calories: 130,
    proteins: 3,
    carbs: 30,
    fats: 0
  },
  {
    id: "riso-integrale",
    name: "Riso integrale",
    portion: "80g (secco)",
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
    portion: "80g (secco)",
    calories: 280,
    proteins: 10,
    carbs: 51,
    fats: 4
  },
  {
    id: "burger-vegetale",
    name: "Burger vegetale",
    portion: "100g",
    calories: 240,
    proteins: 16,
    carbs: 10,
    fats: 17
  }
];