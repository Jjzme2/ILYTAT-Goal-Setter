export interface GoalTemplate {
    text: string;
    category: string;
    icon: string;
}

export interface TemplateCategory {
    name: string;
    icon: string;
    goals: GoalTemplate[];
}

export const GOAL_TEMPLATES: TemplateCategory[] = [
    {
        name: 'Health & Wellness',
        icon: '💪',
        goals: [
            { text: 'Drink 2L of water', category: 'Health', icon: '💧' },
            { text: 'Go for a 30m walk', category: 'Health', icon: '🚶' },
            { text: 'No sugary drinks today', category: 'Health', icon: '🚫' },
            { text: 'Eat 3 servings of fruit/veg', category: 'Health', icon: '🍎' },
            { text: '7 hours of sleep', category: 'Health', icon: '😴' },
            { text: '10 mins stretching', category: 'Health', icon: '🧘' }
        ]
    },
    {
        name: 'Productivity',
        icon: '⚡',
        goals: [
            { text: 'Clear email inbox', category: 'Work', icon: '📧' },
            { text: 'Plan tomorrow\'s tasks', category: 'Work', icon: '📝' },
            { text: '1 hour deep work', category: 'Work', icon: '🧠' },
            { text: 'Organize workspace', category: 'Work', icon: '🧹' },
            { text: 'Review weekly goals', category: 'Work', icon: '📅' }
        ]
    },
    {
        name: 'Mindfulness',
        icon: '🧠',
        goals: [
            { text: 'Meditate for 10 mins', category: 'Personal', icon: '🧘' },
            { text: 'Read 10 pages', category: 'Personal', icon: '📖' },
            { text: 'Write in journal', category: 'Personal', icon: '✍️' },
            { text: 'Call a friend/family member', category: 'Family', icon: '📞' },
            { text: 'No social media for 2h', category: 'Personal', icon: '📵' }
        ]
    },
    {
        name: 'Home',
        icon: '🏠',
        goals: [
            { text: 'Make the bed', category: 'Home', icon: '🛏️' },
            { text: 'Do the dishes', category: 'Home', icon: '🍽️' },
            { text: 'Take out trash', category: 'Home', icon: '🗑️' },
            { text: 'Water plants', category: 'Home', icon: '🪴' }
        ]
    }
];
