const factors = [1000, 1000]

function parseAction(actionString) {
    // Normalize the action string - fix common formatting issues
    let normalizedString = actionString.trim();

    // Extract operation type
    const actionTypeMatch = normalizedString.match(/^(\w+)\(/);
    const action_type = actionTypeMatch ? actionTypeMatch[1] : '';

    const action_inputs = {};

    // Handle coordinate points with flexible matching
    // This handles both complete and incomplete point formats
    const pointPatterns = [
        /point='<point>([\d\s]+)<\/point>'/,  // Complete format: point='<point>892 351</point>'
        /point='<point>([\d\s]+)<\/point>/,   // Missing closing quote: point='<point>892 351</point>
        /point='<point>([\d\s]+)/,            // Missing closing tag and quote: point='<point>892 351
    ];

    let pointMatch = null;
    for (const pattern of pointPatterns) {
        pointMatch = normalizedString.match(pattern);
        if (pointMatch) break;
    }

    if (pointMatch) {
        const coords = pointMatch[1].trim().split(/\s+/).map(Number);
        if (coords.length >= 2) {
            const [x, y] = coords;
            action_inputs.start_box = `[${x / factors[0]},${y / factors[1]}]`;
        }
    }

    // Handle start and end coordinates (for drag operations)
    const startPointPatterns = [
        /start_point='<point>([\d\s]+)<\/point>'/,
        /start_point='<point>([\d\s]+)<\/point>/,
        /start_point='<point>([\d\s]+)/,
    ];

    let startPointMatch = null;
    for (const pattern of startPointPatterns) {
        startPointMatch = normalizedString.match(pattern);
        if (startPointMatch) break;
    }

    if (startPointMatch) {
        const coords = startPointMatch[1].trim().split(/\s+/).map(Number);
        if (coords.length >= 2) {
            const [x, y] = coords;
            action_inputs.start_box = `[${x / factors[0]},${y / factors[1]}]`;
        }
    }

    const endPointPatterns = [
        /end_point='<point>([\d\s]+)<\/point>'/,
        /end_point='<point>([\d\s]+)<\/point>/,
        /end_point='<point>([\d\s]+)/,
    ];

    let endPointMatch = null;
    for (const pattern of endPointPatterns) {
        endPointMatch = normalizedString.match(pattern);
        if (endPointMatch) break;
    }

    if (endPointMatch) {
        const coords = endPointMatch[1].trim().split(/\s+/).map(Number);
        if (coords.length >= 2) {
            const [x, y] = coords;
            action_inputs.end_box = `[${x / factors[0]},${y / factors[1]}]`;
        }
    }

    // Handle content parameter (for type and finished operations)
    const contentPatterns = [
        /content='([^']*(?:\\.[^']*)*)'/,  // Complete format with closing quote
        /content='([^']*(?:\\.[^']*)*)/,   // Missing closing quote
    ];

    let contentMatch = null;
    for (const pattern of contentPatterns) {
        contentMatch = normalizedString.match(pattern);
        if (contentMatch) break;
    }

    if (contentMatch) {
        // Process escape characters
        action_inputs.content = contentMatch[1]
            .replace(/\\n/g, '\n')
            .replace(/\\'/g, "'")
            .replace(/\\"/g, '"');
    }

    // Handle keys and hotkeys
    const keyPatterns = [
        /key='([^']*)'/,  // Complete format
        /key='([^']*)/,   // Missing closing quote
    ];

    let keyMatch = null;
    for (const pattern of keyPatterns) {
        keyMatch = normalizedString.match(pattern);
        if (keyMatch) break;
    }

    if (keyMatch) {
        action_inputs.key = keyMatch[1];
    }

    // Handle scroll direction
    const directionPatterns = [
        /direction='([^']*)'/,  // Complete format
        /direction='([^']*)/,   // Missing closing quote
    ];

    let directionMatch = null;
    for (const pattern of directionPatterns) {
        directionMatch = normalizedString.match(pattern);
        if (directionMatch) break;
    }

    if (directionMatch) {
        action_inputs.direction = directionMatch[1];
    }

    return {
        action_type,
        action_inputs,
    };
}

// Test cases
const testcases = [
    "click(point='<point>892 351</point>')",
    "click(point='<point>150 315</point>",
    "click(point='<point>150 315</point>)",
    "drag(start_point='<point>100 200</point>' end_point='<point>300 400</point>')",
    "type(content='Hello World')",
    "key(key='Enter')",
    "scroll(direction='down')",
    "type(content='Test with \\'quotes\\' and \\n newlines')",
    "key(key='Ctrl+C'",
    "scroll(direction='up"
];

console.log('Testing parseAction function:');
console.log('================================');

testcases.forEach((str, index) => {
    console.log(`\nTest case ${index + 1}: ${str}`);
    const parsed = parseAction(str);
    console.log('Result:', parsed);
});
