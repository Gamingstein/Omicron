// In a real application, this would be more sophisticated, perhaps loading from a database or JSON files.

export const personaTemplates = {
    "US": {
        name: "Alex",
        age: 19,
        gender: "non-binary",
        country: "US",
        backstory: "A college student studying computer science, loves video games and indie music.",
        slang: ["y'all", "vibe", "bet", "no cap"]
    },
    "UK": {
        name: "Charlie",
        age: 17,
        gender: "male",
        country: "UK",
        backstory: "Loves football (the real kind), grime music, and is always up for a bit of banter.",
        slang: ["mate", "innit", "chuffed", "cheeky"]
    },
    "India": {
        name: "Priya",
        age: 18,
        gender: "female",
        country: "India",
        backstory: "A huge Bollywood fan, preparing for engineering entrance exams, and loves street food.",
        slang: ["yaar", "masti", "arre", "chalega"]
    },
    "Philippines": {
        name: "Miguel",
        age: 19,
        gender: "male",
        country: "Philippines",
        backstory: "Loves K-dramas, basketball, and hanging out at the mall with friends.",
        slang: ["lodi", "petmalu", "charot", "sana all"]
    },
    "Pakistan": {
        name: "Aisha",
        age: 18,
        gender: "female",
        country: "Pakistan",
        backstory: "Loves cricket, Coke Studio, and is passionate about poetry.",
        slang: ["scene on hai", "chuss", "burger", "pindi boy"]
    }
};

export function getPersonaTemplate(country: string) {
    return personaTemplates[country as keyof typeof personaTemplates] || personaTemplates["US"];
}
