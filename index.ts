/**
 * ILYTAT Goal Protocol - CLI Goal Tracker
 * Stack: Node.js, TypeScript, Firebase Admin, @inquirer/prompts
 * Features: Daily, Weekly, Monthly, Quarterly, Yearly goals with progress tracking
 */

import 'dotenv/config'; // Load .env file
import admin from 'firebase-admin';
import { select, input, confirm, editor } from '@inquirer/prompts';
import chalk from 'chalk';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek.js';
import quarterOfYear from 'dayjs/plugin/quarterOfYear.js';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { TIMEFRAMES, TIMEFRAME_KEYS, getTimeframeConfig, APP_CONFIG, type TimeFrame } from './src/config.js';

dayjs.extend(isoWeek);
dayjs.extend(quarterOfYear);

// --- INIT FIREBASE ---
let serviceAccount: admin.ServiceAccount | undefined;

// 1. Try Environment Variables (Prioritized)
if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    };
}
// 2. Fallback: Local JSON File
else {
    const SERVICE_ACCOUNT_PATH = path.join(os.homedir(), '.config/ilytat goal setter/service-account.json');
    if (fs.existsSync(SERVICE_ACCOUNT_PATH)) {
        try {
            serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf-8'));
        } catch (e) {
            console.error(chalk.yellow('⚠ Failed to parse local service account file'));
        }
    } else {
        // Only error if BOTH methods fail
        console.error(chalk.red.bold('✖ FATAL: Firebase Configuration Missing'));
        console.error(chalk.white('Please set the following environment variables in .env:'));
        console.error(chalk.gray('  - FIREBASE_PROJECT_ID'));
        console.error(chalk.gray('  - FIREBASE_CLIENT_EMAIL'));
        console.error(chalk.gray('  - FIREBASE_PRIVATE_KEY'));
        console.error(chalk.white('\nOR place your service account JSON at:'));
        console.error(chalk.gray(`  ${SERVICE_ACCOUNT_PATH}`));
        process.exit(1);
    }
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount!)
});

const db = admin.firestore();

// --- TYPES ---
interface IGoal {
    id: string;
    text: string;
    completed: boolean;
}

interface ILog {
    id: string;
    date: string;
    goals: IGoal[];
    anticipatedObstacle?: string | null;
    reflection?: string | null;
    createdAt: admin.firestore.FieldValue;
}

// Color themes for chalk (derived from config)
const CHALK_THEMES: Record<TimeFrame, typeof chalk.cyan> = {
    daily: chalk.cyan,
    weekly: chalk.magenta,
    monthly: chalk.yellow,
    quarterly: chalk.hex('#FF9800'),
    yearly: chalk.green
};

// --- UTILITIES ---
function getDocId(timeframe: TimeFrame): string {
    const now = dayjs();
    switch (timeframe) {
        case 'daily': return now.format('YYYY-MM-DD');
        case 'weekly': return `${now.isoWeekYear()}-W${String(now.isoWeek()).padStart(2, '0')}`;
        case 'monthly': return now.format('YYYY-MM');
        case 'quarterly': return `${now.year()}-Q${now.quarter()}`;
        case 'yearly': return now.format('YYYY');
    }
}

function getTimeframeLabel(timeframe: TimeFrame): string {
    const config = getTimeframeConfig(timeframe);
    return `${config.icon} ${config.label}`;
}

function printHeader() {
    console.clear();
    console.log(chalk.bgBlue.white.bold(` ★ ${APP_CONFIG.name.toUpperCase()} ★ `));
    console.log(chalk.gray(`${dayjs().format('dddd, MMMM D, YYYY')} • ${dayjs().format('h:mm A')}\n`));
}

function printGoals(goals: IGoal[], timeframe: TimeFrame) {
    const theme = CHALK_THEMES[timeframe];
    const label = getTimeframeLabel(timeframe);

    console.log(theme.bold(`\n${label} Goals`));
    console.log(theme('━'.repeat(42)));

    if (goals.length === 0) {
        console.log(chalk.dim('  No goals set yet'));
    } else {
        goals.forEach((g, i) => {
            const num = chalk.dim(`${i + 1}.`);
            if (g.completed) {
                console.log(`  ${chalk.green('✓')} ${num} ${chalk.strikethrough.gray(g.text)}`);
            } else {
                console.log(`  ${chalk.red('○')} ${num} ${chalk.white(g.text)}`);
            }
        });
    }
    console.log(theme('━'.repeat(42)));
}

function calculateProgress(goals: IGoal[]): { bar: string; text: string; percent: number } {
    const completed = goals.filter(g => g.completed).length;
    const total = goals.length;
    if (total === 0) return { bar: chalk.dim('░'.repeat(10)), text: 'No goals', percent: 0 };

    const percent = Math.round((completed / total) * 100);
    const filled = Math.floor(percent / 10);

    let barColor = chalk.red;
    if (percent >= 75) barColor = chalk.green;
    else if (percent >= 50) barColor = chalk.yellow;
    else if (percent >= 25) barColor = chalk.hex('#FFA500');

    const bar = barColor('█'.repeat(filled)) + chalk.dim('░'.repeat(10 - filled));
    const text = `${completed}/${total} (${percent}%)`;

    return { bar, text, percent };
}

function printProgressSummary(summaries: Array<{ timeframe: TimeFrame; data: ILog | null }>) {
    console.log(chalk.bold.white('\n📊 GOAL OVERVIEW\n'));

    for (const s of summaries) {
        const theme = CHALK_THEMES[s.timeframe];
        const config = getTimeframeConfig(s.timeframe);
        const label = `${config.icon}  ${config.label}`;

        if (s.data && s.data.goals.length > 0) {
            const { bar, text, percent } = calculateProgress(s.data.goals);
            const statusText = percent === 100 ? chalk.green.bold(' ★ Complete!') : '';
            console.log(`  ${theme(label.padEnd(12))} ${bar}  ${chalk.white(text)}${statusText}`);
        } else {
            console.log(`  ${theme(label.padEnd(12))} ${chalk.dim('░'.repeat(10))}  ${chalk.dim('Not set')}`);
        }
    }

    console.log(chalk.dim('\n' + '─'.repeat(46) + '\n'));
}

// --- DATA ACCESS ---
async function getLog(timeframe: TimeFrame): Promise<{ docRef: admin.firestore.DocumentReference; data: ILog | null }> {
    const config = getTimeframeConfig(timeframe);
    const docId = getDocId(timeframe);
    const docRef = db.collection(config.collection).doc(docId);
    const doc = await docRef.get();
    return {
        docRef,
        data: doc.exists ? (doc.data() as ILog) : null
    };
}

async function createLog(timeframe: TimeFrame, goals: IGoal[], obstacle?: string): Promise<void> {
    const config = getTimeframeConfig(timeframe);
    const docId = getDocId(timeframe);
    const docRef = db.collection(config.collection).doc(docId);

    const payload: ILog = {
        id: docId,
        date: new Date().toISOString(),
        goals,
        anticipatedObstacle: obstacle || null,
        reflection: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await docRef.set(payload);
}

// --- PROMPTS ---
async function promptForGoals(timeframe: TimeFrame): Promise<IGoal[]> {
    const goals: IGoal[] = [];
    let goalCount = 1;
    const theme = CHALK_THEMES[timeframe];
    const config = getTimeframeConfig(timeframe);

    console.log(theme(`\n✎ Set your ${config.label} goals`));
    console.log(chalk.dim('  Press Enter with empty input to finish\n'));

    while (true) {
        const isFirst = goalCount === 1;
        const goal = await input({
            message: isFirst
                ? theme(`Goal ${goalCount} (required):`)
                : chalk.dim(`Goal ${goalCount}:`),
            validate: (val) => {
                if (isFirst && val.trim().length < 3) {
                    return 'At least one goal is required (min 3 chars)';
                }
                return true;
            }
        });

        if (goal.trim().length === 0 && goalCount > 1) break;

        if (goal.trim().length > 0) {
            goals.push({ id: String(goalCount), text: goal.trim(), completed: false });
            console.log(chalk.green(`  ✓ Added: "${goal.trim()}"`));
            goalCount++;
        }
    }

    return goals;
}

async function promptForObstacle(): Promise<string | undefined> {
    const wantObstacle = await confirm({
        message: chalk.yellow('Add an anticipated obstacle?') + chalk.dim(' (Stoic prep)'),
        default: false
    });

    if (!wantObstacle) return undefined;

    const obstacle = await input({
        message: chalk.yellow('⚠️  What obstacle do you anticipate?'),
        validate: (val) => val.length > 3 ? true : 'Be specific (min 4 chars).'
    });

    return obstacle;
}

// --- GOAL ACTIONS ---
async function toggleGoal(docRef: admin.firestore.DocumentReference, data: ILog): Promise<void> {
    if (data.goals.length === 0) {
        console.log(chalk.yellow('\n⚠ No goals to toggle'));
        return;
    }

    const goalIndex = await select({
        message: chalk.cyan('Select goal to toggle:'),
        choices: data.goals.map((g, i) => ({
            name: `${g.completed ? chalk.green('✓') : chalk.red('○')} ${g.text}`,
            value: i
        }))
    });

    const goal = data.goals[goalIndex];
    if (!goal) return;

    goal.completed = !goal.completed;
    await docRef.update({ goals: data.goals });

    const status = goal.completed ? chalk.green('complete ✓') : chalk.yellow('incomplete');
    console.log(chalk.green(`\n✓ "${goal.text}" → ${status}`));
    await pause();
}

async function addGoal(docRef: admin.firestore.DocumentReference, data: ILog): Promise<void> {
    const newGoal = await input({
        message: chalk.cyan('New goal:'),
        validate: (val) => val.trim().length > 2 ? true : 'Goal must be at least 3 characters.'
    });

    const newId = String(Math.max(...data.goals.map(g => parseInt(g.id)), 0) + 1);
    data.goals.push({ id: newId, text: newGoal.trim(), completed: false });

    await docRef.update({ goals: data.goals });
    console.log(chalk.green(`\n✓ Added: "${newGoal.trim()}"`));
    await pause();
}

async function editGoal(docRef: admin.firestore.DocumentReference, data: ILog): Promise<void> {
    if (data.goals.length === 0) {
        console.log(chalk.yellow('\n⚠ No goals to edit'));
        return;
    }

    const goalIndex = await select({
        message: chalk.cyan('Select goal to edit:'),
        choices: data.goals.map((g, i) => ({ name: g.text, value: i }))
    });

    const goal = data.goals[goalIndex];
    if (!goal) return;

    const newText = await input({
        message: chalk.cyan('New text:'),
        default: goal.text,
        validate: (val) => val.trim().length > 2 ? true : 'Goal must be at least 3 characters.'
    });

    const oldText = goal.text;
    goal.text = newText.trim();
    await docRef.update({ goals: data.goals });
    console.log(chalk.green(`\n✓ Updated: "${oldText}" → "${newText.trim()}"`));
    await pause();
}

async function removeGoal(docRef: admin.firestore.DocumentReference, data: ILog): Promise<void> {
    if (data.goals.length === 0) {
        console.log(chalk.yellow('\n⚠ No goals to remove'));
        return;
    }

    const goalIndex = await select({
        message: chalk.cyan('Select goal to remove:'),
        choices: data.goals.map((g, i) => ({ name: g.text, value: i }))
    });

    const goal = data.goals[goalIndex];
    if (!goal) return;

    const shouldRemove = await confirm({
        message: chalk.red(`Remove "${goal.text}"?`),
        default: false
    });

    if (shouldRemove) {
        data.goals.splice(goalIndex, 1);
        await docRef.update({ goals: data.goals });
        console.log(chalk.green(`\n✓ Removed: "${goal.text}"`));
    }
    await pause();
}

async function writeReflection(docRef: admin.firestore.DocumentReference, data: ILog): Promise<void> {
    console.log(chalk.magenta('\n💭 End-of-Day Reflection'));
    console.log(chalk.dim('   What did you learn? What could be improved?\n'));

    const reflection = await editor({
        message: 'Write your reflection (opens editor):',
        default: data.reflection || ''
    });

    if (reflection.trim().length > 0) {
        await docRef.update({ reflection: reflection.trim() });
        console.log(chalk.green('\n✓ Reflection saved'));
    }
    await pause();
}

async function setObstacle(docRef: admin.firestore.DocumentReference, data: ILog): Promise<void> {
    const obstacle = await input({
        message: chalk.yellow('⚠️  What obstacle do you anticipate?'),
        default: data.anticipatedObstacle || ''
    });

    await docRef.update({ anticipatedObstacle: obstacle });
    console.log(chalk.green('\n✓ Obstacle updated'));
    await pause();
}

async function pause(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 800));
}

// --- MENUS ---
async function showTimeframeMenu(timeframe: TimeFrame): Promise<boolean> {
    const theme = CHALK_THEMES[timeframe];
    let { docRef, data } = await getLog(timeframe);

    if (!data) {
        printHeader();
        console.log(theme.bold(`\n${getTimeframeLabel(timeframe)} Goals`));
        console.log(chalk.dim('No goals set yet. Let\'s create some!\n'));

        const goals = await promptForGoals(timeframe);

        let obstacle: string | undefined;
        if (timeframe === 'daily') {
            obstacle = await promptForObstacle();
        }

        await createLog(timeframe, goals, obstacle);
        console.log(chalk.green.bold(`\n✓ ${getTimeframeLabel(timeframe)} goals saved!`));
        await pause();

        const freshDoc = await docRef.get();
        data = freshDoc.data() as ILog;
    }

    while (true) {
        printHeader();

        const { bar, text, percent } = calculateProgress(data.goals);
        console.log(theme.bold(`${getTimeframeLabel(timeframe)} Progress`));
        console.log(`  ${bar}  ${chalk.bold(text)}${percent === 100 ? chalk.green(' ★') : ''}\n`);

        printGoals(data.goals, timeframe);

        if (timeframe === 'daily' && data.anticipatedObstacle) {
            console.log(chalk.yellow.bold('\n⚠️  Anticipated Obstacle'));
            console.log(chalk.yellow(`   "${data.anticipatedObstacle}"`));
        }

        if (data.reflection) {
            console.log(chalk.magenta.bold('\n💭 Reflection'));
            console.log(chalk.italic.dim(`   "${data.reflection.slice(0, 100)}${data.reflection.length > 100 ? '...' : ''}"`));
        }

        console.log('');

        // Build menu choices
        const choices: Array<{ name: string; value: string }> = [
            { name: chalk.green('✓') + ' Toggle Completion', value: 'toggle' },
            { name: chalk.blue('+') + ' Add Goal', value: 'add' },
            { name: chalk.yellow('✎') + ' Edit Goal', value: 'edit' },
            { name: chalk.red('✕') + ' Remove Goal', value: 'remove' },
        ];

        if (timeframe === 'daily') {
            choices.push({ name: chalk.yellow('⚠') + ' Set Obstacle', value: 'obstacle' });
            choices.push({ name: chalk.magenta('💭') + ' Write Reflection', value: 'reflect' });
        }

        choices.push({ name: chalk.dim('← Back'), value: 'back' });
        choices.push({ name: chalk.dim('✖ Exit'), value: 'exit' });

        const action = await select({
            message: theme('Choose action:'),
            choices
        });

        switch (action) {
            case 'toggle': await toggleGoal(docRef, data); break;
            case 'add': await addGoal(docRef, data); break;
            case 'edit': await editGoal(docRef, data); break;
            case 'remove': await removeGoal(docRef, data); break;
            case 'obstacle': await setObstacle(docRef, data); break;
            case 'reflect': await writeReflection(docRef, data); break;
            case 'exit':
                console.log(chalk.green.bold('\n★ Stay focused. Execute. ★\n'));
                process.exit(0);
            case 'back': return true;
        }

        const freshDoc = await docRef.get();
        data = freshDoc.data() as ILog;
    }
}

async function showMainMenu(): Promise<void> {
    while (true) {
        printHeader();

        // Fetch all timeframe data
        const results = await Promise.all(TIMEFRAME_KEYS.map(tf => getLog(tf)));

        const summaries: Array<{ timeframe: TimeFrame; data: ILog | null }> =
            TIMEFRAME_KEYS.map((tf, i) => ({ timeframe: tf, data: results[i]!.data }));

        printProgressSummary(summaries);

        // Build menu choices from config
        const timeframeChoices = TIMEFRAMES.map(tf => ({
            name: `${tf.icon}  ${CHALK_THEMES[tf.key](tf.label.padEnd(10))} ${chalk.dim('— ' + tf.description)}`,
            value: tf.key
        }));

        const timeframe = await select<string>({
            message: chalk.bold.white('Select option:'),
            choices: [
                { name: chalk.white.bold('👁️  Quick Preview') + chalk.dim('  — View all goals'), value: 'preview' },
                ...timeframeChoices,
                { name: chalk.dim('✖ Exit'), value: 'exit' }
            ]
        });

        if (timeframe === 'exit') {
            console.log(chalk.green.bold('\n★ Stay focused. Execute. ★\n'));
            process.exit(0);
        }

        if (timeframe === 'preview') {
            await showQuickPreview(summaries);
            continue;
        }

        if (!TIMEFRAME_KEYS.includes(timeframe as TimeFrame)) {
            continue;
        }

        await showTimeframeMenu(timeframe as TimeFrame);
    }
}

// --- QUICK PREVIEW ---
async function showQuickPreview(summaries: Array<{ timeframe: TimeFrame; data: ILog | null }>): Promise<void> {
    printHeader();
    console.log(chalk.bold.white('👁️  QUICK PREVIEW\n'));
    console.log(chalk.dim('Read-only view of all goals\n'));

    for (const s of summaries) {
        const theme = CHALK_THEMES[s.timeframe];
        const label = getTimeframeLabel(s.timeframe);

        if (s.data && s.data.goals.length > 0) {
            const { bar, text, percent } = calculateProgress(s.data.goals);
            console.log(theme.bold(`${label}`));
            console.log(`  Progress: ${bar} ${text}${percent === 100 ? chalk.green(' ★') : ''}`);

            s.data.goals.forEach((g, i) => {
                const status = g.completed ? chalk.green('✓') : chalk.red('○');
                const goalText = g.completed ? chalk.strikethrough.gray(g.text) : chalk.white(g.text);
                console.log(`    ${status} ${chalk.dim(`${i + 1}.`)} ${goalText}`);
            });

            if (s.timeframe === 'daily' && s.data.anticipatedObstacle) {
                console.log(chalk.yellow(`    ⚠ ${s.data.anticipatedObstacle}`));
            }
            console.log('');
        } else {
            console.log(theme.bold(`${label}`));
            console.log(chalk.dim('  No goals set\n'));
        }
    }

    console.log(chalk.dim('─'.repeat(46)));
    await input({ message: chalk.dim('Press Enter to return...') });
}

// --- MAIN ---
async function main() {
    try {
        await showMainMenu();
    } catch (error) {
        if ((error as Error).name === 'ExitPromptError') {
            console.log(chalk.green('\n★ Goodbye! ★\n'));
            process.exit(0);
        }
        console.error(chalk.red.bold('\n✖ Error:'), (error as Error).message);
        process.exit(1);
    }
}

main();