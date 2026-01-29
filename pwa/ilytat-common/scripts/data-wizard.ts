import prompts from 'prompts';
import clipboardy from 'clipboardy';
import { IlytatClient } from '../index';
import { randomUUID } from 'crypto';

// Ensure fetch is available (Node 18+)
if (!globalThis.fetch) {
    console.error('Node.js 18+ required for fetch support.');
    process.exit(1);
}

const client = new IlytatClient({ env: 'production' });

async function main() {
    const { type } = await prompts({
        type: 'select',
        name: 'type',
        message: 'What data would you like to manage?',
        choices: [
            { title: 'Quotes', value: 'quotes' },
            { title: 'Navigation', value: 'navigation' },
        ],
    });

    if (!type) {
        console.log('Cancelled.');
        return;
    }

    if (type === 'quotes') {
        await manageQuotes();
    } else {
        await manageNavigation();
    }
}

async function manageQuotes() {
    console.log('Fetching existing quotes...');
    const currentQuotes = await client.quotes.getAll();
    console.log(`Found ${currentQuotes.length} existing quotes.`);

    const response = await prompts([
        {
            type: 'text',
            name: 'content',
            message: 'Quote Content:',
            validate: (value: string) => value.length < 5 ? 'Quote too short' : true
        },
        {
            type: 'text',
            name: 'author',
            message: 'Author Name:',
            initial: 'Unknown'
        },
        {
            type: 'text',
            name: 'source',
            message: 'Source (Optional):'
        },
        {
            type: 'list',
            name: 'tags',
            message: 'Tags (comma separated):',
            initial: '',
            separator: ','
        }
    ]);

    if (!response.content) return;

    const newQuote = {
        id: randomUUID(),
        content: response.content,
        author: response.author,
        source: response.source || null,
        tags: response.tags || [],
        notes: null
    };

    const updatedQuotes = [...currentQuotes, newQuote];

    // Format for R2 (CommonResponse structure or raw array? Usually raw array for data files, wrapped by API)
    // Assuming we edit the raw JSON file stored in the bucket.
    // If the API returns CommonResponse, the R2 file likely *contains* CommonResponse or just the payload.
    // Let's assume we want to copy the *Payload* array, or if the user maintains the full structure manually.
    // For simplicity, let's copy the Payload Array so user can paste it into the "payload" field of their JSON.
    // OR, better, let's wrap it in a standard structure if we can.
    // Re-reading request: "send the full file... to the clipboard".
    // I will output the Payload. If the user needs to wrap it, I'll log a note.

    const output = JSON.stringify({ payload: updatedQuotes }, null, 2);

    clipboardy.writeSync(output);
    console.log('\n✅ New Quote Added!');
    console.log('📋 Full JSON copied to clipboard!');
    console.log(`Total Quotes: ${updatedQuotes.length}`);
}

async function manageNavigation() {
    console.log('Fetching existing navigation...');
    const navData = await client.navigation.get();

    if (!navData) {
        console.error('Failed to fetch navigation.');
        return;
    }

    const categories = Object.keys(navData);

    const { category } = await prompts({
        type: 'select',
        name: 'category',
        message: 'Select Navigation Category:',
        choices: [
            ...categories.map(c => ({ title: c, value: c })),
            { title: '[New Category]', value: '__NEW__' }
        ]
    });

    let targetCategory = category;
    if (category === '__NEW__') {
        const res = await prompts({
            type: 'text',
            name: 'newCat',
            message: 'New Category Name:'
        });
        targetCategory = res.newCat;
        if (!navData[targetCategory]) {
            navData[targetCategory] = [];
        }
    }

    const item = await prompts([
        {
            type: 'text',
            name: 'label',
            message: 'Label:'
        },
        {
            type: 'text',
            name: 'url',
            message: 'URL:'
        },
        {
            type: 'text',
            name: 'icon',
            message: 'Icon (emoji or class):',
            initial: '🔗'
        },
        {
            type: 'text',
            name: 'description',
            message: 'Description:'
        }
    ]);

    if (!item.label) return;

    const newItem = {
        id: randomUUID(),
        label: item.label,
        url: item.url,
        icon: item.icon,
        description: item.description || ''
    };

    navData[targetCategory].push(newItem);

    const output = JSON.stringify({ payload: navData }, null, 2);
    clipboardy.writeSync(output);

    console.log('\n✅ New Navigation Item Added!');
    console.log(`Added to category: ${targetCategory}`);
    console.log('📋 Full JSON copied to clipboard!');
}

main().catch(console.error);
