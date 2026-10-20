export const businessCategories: Record<string, Record<string, string[]>> = {
  'Fashion & accessories': {
    Clothing: [
      'Dresses',
      'Two-piece sets',
      'Shirts & tops',
      'Trousers',
      'Traditional wear',
      'Other clothing',
    ],
    Accessories: ['Bags', 'Jewellery', 'Scarves', 'Belts', 'Hats'],
    Footwear: ['Shoes', 'Sandals', 'Sneakers'],
  },
  Electronics: {
    'Phones & tablets': ['Phones', 'Tablets', 'Cases & screen protectors'],
    Computers: ['Laptops', 'Desktops', 'Computer accessories'],
    'Home electronics': ['Audio', 'Televisions', 'Appliances', 'Cables & chargers'],
  },
  'Food & hospitality': {
    Meals: ['Local dishes', 'Rice dishes', 'Soups', 'Grills', 'Meal packages'],
    'Bakery & treats': ['Cakes', 'Pastries', 'Snacks'],
    Drinks: ['Juices', 'Soft drinks', 'Hot drinks'],
    Hospitality: ['Catering packages', 'Event packages'],
  },
  Retail: {
    Groceries: ['Pantry', 'Fresh produce', 'Household essentials'],
    'Beauty & care': ['Skincare', 'Haircare', 'Makeup', 'Personal care'],
    'Home & living': ['Decor', 'Kitchen', 'Furniture'],
  },
  'Professional services': {
    Consulting: ['Business', 'Finance', 'Career'],
    Creative: ['Design', 'Photography', 'Writing'],
    Services: ['Training', 'Repairs', 'Appointments'],
  },
  Other: {
    Products: ['General', 'Handmade', 'Digital products'],
    Services: ['Appointments', 'Packages'],
  },
};
export function categoriesFor(type: string) {
  return businessCategories[type] ?? businessCategories.Other;
}
