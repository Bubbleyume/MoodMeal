export const TERMS = [
  ["potassium", "Potassium", "A mineral used by nerves, muscles and the heart. Found in potatoes, beans and bananas. Kidney disease and some medicines can change how much is safe; ask your clinician before increasing it or using potassium salt substitutes.", "https://ods.od.nih.gov/factsheets/Potassium-Consumer/"],
  ["vitamin-c", "Vitamin C", "Helps make collagen and supports normal immune function. It also helps your body absorb iron from plant foods. Peppers, citrus fruit and berries provide vitamin C.", "https://ods.od.nih.gov/factsheets/VitaminC-Consumer/"],
  ["antioxidants", "Antioxidants", "Substances that help protect cells from damage caused by free radicals. Many fruits and vegetables contain them. Antioxidant supplements are not equivalent to eating a varied diet.", "https://medlineplus.gov/antioxidants.html"],
  ["carbohydrates", "Carbohydrates", "Sugars, starches and fiber in food. Your body uses many carbohydrates for energy. Whole grains, beans, vegetables and fruit provide carbohydrates along with other nutrients.", "https://medlineplus.gov/carbohydrates.html"],
  ["iron", "Iron", "A mineral needed to make hemoglobin, which carries oxygen in blood. Beans, meat and fortified foods provide iron. Anemia has different causes; do not start iron supplements without checking the cause with a clinician.", "https://ods.od.nih.gov/factsheets/Iron-Consumer/"],
  ["fiber", "Fiber", "A carbohydrate that is not fully digested. It supports bowel regularity; some types help with cholesterol and blood sugar management. Found in whole grains, beans, vegetables and fruit.", "https://medlineplus.gov/ency/article/002470.htm"],
  ["protein", "Protein", "A nutrient used to build and maintain tissues. Sources include beans, eggs, fish, meat, dairy and tofu. Needs vary; some kidney conditions require an individualized plan.", "https://medlineplus.gov/dietaryproteins.html"],
  ["magnesium", "Magnesium", "A mineral involved in normal muscle, nerve and energy functions. Nuts, seeds, whole grains and leafy vegetables are sources.", "https://ods.od.nih.gov/factsheets/Magnesium-Consumer/"],
  ["omega-3", "Omega-3", "A family of fats involved in normal cell function. Fish provides EPA and DHA; walnuts and some seeds provide ALA. Supplements can interact with medicines.", "https://ods.od.nih.gov/factsheets/Omega3FattyAcids-Consumer/"],
  ["sodium", "Sodium", "A mineral in salt and many packaged foods. The DASH eating pattern emphasizes reducing sodium for blood pressure management. Check labels and follow your personal care plan.", "https://www.nhlbi.nih.gov/health/dash-eating-plan"],
  ["folate", "Folate", "A B vitamin needed to make DNA and new cells. Leafy greens, beans and fortified grains provide folate.", "https://ods.od.nih.gov/factsheets/Folate-Consumer/"],
  ["calcium", "Calcium", "A mineral needed for bones, teeth, muscles and nerves. Dairy, fortified alternatives and some vegetables provide calcium.", "https://ods.od.nih.gov/factsheets/Calcium-Consumer/"],
] .map(([id, name, definition, source]) => ({ id, name, definition, source }));
export function termFor(text: string) {
 const lower = text.toLowerCase();
 return TERMS.find(t => lower.includes(t.name.toLowerCase())) ?? (/carb/i.test(text) ? TERMS.find(t => t.id === "carbohydrates") : undefined);
}
