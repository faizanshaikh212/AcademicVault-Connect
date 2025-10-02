/**
 * Suppress specific Node.js deprecation warnings
 * This helps clean up the console output during development
 */

// Suppress specific deprecation warnings
const originalEmitWarning = process.emitWarning;
process.emitWarning = (warning, type, code, ...args) => {
    // Suppress util._extend deprecation warning
    if (code === 'DEP0060') {
        return;
    }

    // Call the original emitWarning for other warnings
    return originalEmitWarning.call(process, warning, type, code, ...args);
};

export default {};